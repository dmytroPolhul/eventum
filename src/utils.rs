use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use crate::config::SENDER;
use crate::logger::write_output;
use crate::types::EnvConfig;

pub fn text_from_message(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        other => serde_json::to_string_pretty(other).unwrap_or_else(|_| "<Invalid JSON>".into()),
    }
}

pub fn init_batching_logger(config: &EnvConfig) {
    let (tx, rx) = mpsc::channel::<String>();
    SENDER.set(tx).ok();

    let flush_interval = config.output.batch_interval_ms.unwrap_or(100).max(0) as u64;
    let batch_size = config.output.batch_size.unwrap_or(50).max(1) as usize;

    let config_cloned = config.clone();

    thread::spawn(move || {
        let mut buffer = Vec::new();

        loop {
            match rx.recv_timeout(Duration::from_millis(flush_interval)) {
                Ok(msg) => {
                    buffer.push(msg);

                    while buffer.len() < batch_size {
                        if let Ok(msg) = rx.try_recv() {
                            buffer.push(msg);
                        } else {
                            break;
                        }
                    }
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {}
                Err(_) => break,
            }

            if !buffer.is_empty() {
                let output = buffer.join("\n");
                write_output(&config_cloned, &output);
                buffer.clear();
            }
        }
    });
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
