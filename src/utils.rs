use chrono::Utc;
use serde_json::{Map, Value};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use crate::config::{BATCH_THREAD, LOGGER_CONFIG, MASKING_RULES, SENDER};
use crate::format::{format_log_json, format_log_text};
use crate::types::{EnvConfig, LogEntry, OutputFormat, OutputTarget, WorkerMsg};

pub fn extract_scope_and_value(val: &Value) -> (Option<String>, Value) {
    match val {
        Value::Object(map) => {
            let mut map: Map<String, Value> = map.clone();

            let scope = map
                .remove("scope")
                .and_then(|v| v.as_str().map(|s| s.to_string()));

            (scope, Value::Object(map))
        }
        _ => (None, val.clone()),
    }
}

pub fn extract_scope_and_text(val: &Value) -> (Option<String>, String) {
    let (scope, msg_without_scope) = extract_scope_and_value(val);

    let text = match &msg_without_scope {
        Value::String(s) => s.clone(),

        Value::Object(map) => {
            if map.len() == 1 && map.contains_key("message") {
                map.get("message")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        serde_json::to_string_pretty(&msg_without_scope)
                            .unwrap_or_else(|_| "<Invalid JSON>".into())
                    })
            } else {
                serde_json::to_string_pretty(&msg_without_scope)
                    .unwrap_or_else(|_| "<Invalid JSON>".into())
            }
        }

        other => serde_json::to_string_pretty(other).unwrap_or_else(|_| "<Invalid JSON>".into()),
    };

    (scope, text)
}

pub fn init_batching_logger(config: &EnvConfig) {
    if !config.output.batch_enabled.unwrap_or(false) {
        return;
    }

    let sender_mutex = SENDER.get_or_init(|| Mutex::new(None));
    
    if sender_mutex.lock().expect("Sender mutex poisoned").is_some() {
        return;
    }

    let (tx, rx) = mpsc::channel::<WorkerMsg>();
    
    let flush_interval_ms = config.output.batch_interval_ms.unwrap_or(100);
    let flush_interval_ms = flush_interval_ms.max(1) as u64;

    let batch_size = config.output.batch_size.unwrap_or(50);
    let batch_size = batch_size.max(1) as usize;

    let handle = thread::spawn(move || {
        let mut buffer: Vec<LogEntry> = Vec::with_capacity(batch_size);
        let mut last_flush = Instant::now();

        loop {
            let elapsed = last_flush.elapsed();
            let timeout = Duration::from_millis(flush_interval_ms).saturating_sub(elapsed);

            match rx.recv_timeout(timeout) {
                Ok(WorkerMsg::Entry(entry)) => {
                    buffer.push(entry);

                    if buffer.len() >= batch_size {
                        flush(&mut buffer);
                        last_flush = Instant::now();
                        continue;
                    }

                    while buffer.len() < batch_size {
                        match rx.try_recv() {
                            Ok(WorkerMsg::Entry(entry2)) => buffer.push(entry2),
                            Ok(WorkerMsg::Shutdown) => {
                                flush(&mut buffer);
                                return;
                            }
                            Err(_) => break,
                        }
                    }

                    if buffer.len() >= batch_size {
                        flush(&mut buffer);
                        last_flush = Instant::now();
                    }
                }

                Ok(WorkerMsg::Shutdown) => {
                    if !buffer.is_empty() {
                        flush(&mut buffer);
                    }
                    break;
                }

                Err(mpsc::RecvTimeoutError::Timeout) => {
                    if !buffer.is_empty() {
                        flush(&mut buffer);
                    }
                    last_flush = Instant::now();
                }

                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    if !buffer.is_empty() {
                        flush(&mut buffer);
                    }
                    break;
                }
            }
        }
    });

    *sender_mutex.lock().expect("Sender mutex poisoned") = Some(tx);
    
    let thread_mutex = BATCH_THREAD.get_or_init(|| Mutex::new(None));
    *thread_mutex.lock().expect("Batch thread mutex poisoned") = Some(handle);
}

fn flush(buf: &mut Vec<LogEntry>) {
    if buf.is_empty() {
        return;
    }

    let Some(cfg_cell) = LOGGER_CONFIG.get() else {
        buf.clear();
        return;
    };

    let cfg: EnvConfig = cfg_cell.read().expect("Logger config lock poisoned").clone();

    for entry in buf.drain(..) {
        match cfg.output.format {
            OutputFormat::Text => format_log_text(&entry, &cfg),
            OutputFormat::Json => format_log_json(&entry, &cfg),
        }
    }
}

pub fn cleanup_old_daily_logs(base_path: &str, max_backups: u8) {
    let base = Path::new(base_path);
    let parent = base.parent().unwrap_or_else(|| Path::new("."));
    let stem = base.file_stem().and_then(|s| s.to_str()).unwrap_or("log");
    let ext = base.extension().and_then(|s| s.to_str()).unwrap_or("log");

    let pattern_prefix = format!("{}_", stem);
    let pattern_suffix = format!(".{}", ext);

    let mut files: Vec<PathBuf> = match fs::read_dir(parent) {
        Ok(entries) => entries
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let path = entry.path();
                let fname = path.file_name()?.to_str()?;

                if fname.starts_with(&pattern_prefix) && fname.ends_with(&pattern_suffix) {
                    Some(path)
                } else {
                    None
                }
            })
            .collect(),
        Err(_) => return,
    };

    files.sort();

    while files.len() > max_backups as usize {
        let old_path = files.remove(0);
        let _ = fs::remove_file(old_path);
    }
}

pub fn should_rotate(path: &str, config: &EnvConfig) -> bool {
    let max_size = config.output.max_file_size.unwrap_or(10 * 1024 * 1024); // 10 MB

    if let Ok(metadata) = std::fs::metadata(path) {
        if max_size >= 0 {
            return metadata.len() >= max_size as u64;
        }
    }

    false
}

pub fn mask_message_if_needed(msg: &Value) -> Value {
    if let Some(masking_cell) = MASKING_RULES.get() {
        let rule = masking_cell.read().expect("Masking rules lock poisoned");
        rule.mask(msg)
    } else {
        msg.clone()
    }
}

pub fn validate_config(env_config: &EnvConfig) -> Result<(), String> {
    let output = &env_config.output;

    if matches!(output.target, OutputTarget::File)
        && (output.file_path.is_none() || output.file_path.as_ref().unwrap().is_empty())
    {
        return Err("LoggerConfig.output.filePath must be set when using File target.".to_string());
    }

    Ok(())
}

pub fn write_output(config: &EnvConfig, message: &str) {
    match config.output.target {
        OutputTarget::Stdout => println!("{}", message),
        OutputTarget::Stderr => eprintln!("{}", message),
        OutputTarget::File => {
            file_output(config, message);
        }
        OutputTarget::Null => { /* do nothing */ }
    }
}

fn file_output(config: &EnvConfig, message: &str) {
    if let Some(base_path) = &config.output.file_path {
        let path = if config.output.rotate_daily.unwrap_or(false) {
            cleanup_old_daily_logs(base_path, config.output.max_backups.unwrap_or(7));

            let date_str = Utc::now().format("%Y-%m-%d").to_string();
            let extension = std::path::Path::new(base_path)
                .extension()
                .and_then(|ext| ext.to_str())
                .unwrap_or("log");

            let stem = std::path::Path::new(base_path)
                .file_stem()
                .and_then(|stem| stem.to_str())
                .unwrap_or("log");

            format!("{}_{}.{}", stem, date_str, extension)
        } else {
            base_path.clone()
        };

        let rotate = should_rotate(&path, &config);
        if rotate && !config.output.rotate_daily.unwrap_or(false) {
            rotate_logs(&path, &config);
        }

        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
        {
            if let Err(err) = writeln!(file, "{}", message) {
                eprintln!(
                    "[Logger] Failed to write to file {}: {}. Fallback to stderr.",
                    path, err
                );
                eprintln!("{}", message);
            }
        } else {
            eprintln!(
                "[Logger] Failed to open log file: {}. Fallback to stderr.",
                path
            );
            eprintln!("{}", message);
        }
    } else {
        eprintln!("[Logger] No file path provided for log output.");
    }
}

fn rotate_logs(path: &str, config: &EnvConfig) {
    let max_backups = config.output.max_backups.unwrap_or(3);

    for i in (1..=max_backups).rev() {
        let src = format!("{}.{}", path, i - 1);
        let dst = format!("{}.{}", path, i);

        let src_actual = if i == 1 { path.to_string() } else { src };

        if std::path::Path::new(&src_actual).exists() {
            let _ = std::fs::rename(src_actual, dst);
        }
    }
}
