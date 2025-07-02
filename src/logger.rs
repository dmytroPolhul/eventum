use chrono::Utc;
use colored::Colorize;
use napi_derive::napi;
use serde_json::Value;
use std::io::Write;
use std::option::Option;
use std::sync::RwLock;

use crate::config::{LOGGER_CONFIG, MASKING_RULES};
use crate::types::{
    EnvConfig, FieldsConfig, LogEntry, LogLevel, LoggerConfig, OutputFormat, OutputTarget,
    SerializableLogEntry,
};
use crate::utils::{
    cleanup_old_daily_logs, init_batching_logger, should_rotate, text_from_message, mask_message_if_needed, validate_config
};
use crate::masking::MaskRule;

#[napi]
pub fn set_config(config: LoggerConfig) -> Option<EnvConfig> {
    let selected_config = match std::env::var("NODE_ENV").as_deref() {
        Ok("production") => config.prod.clone(),
        _ => config.dev.clone().or(config.prod.clone()),
    };

    if let Some(mut env_config) = selected_config {
        if let Err(e) = validate_config(&env_config) {
                eprintln!("[Logger] Invalid config: {}", e);
                return None;
            }
            
        if env_config.fields.is_none() {
            env_config.fields = Some(FieldsConfig::default());
        }

        let cell = LOGGER_CONFIG.get_or_init(|| RwLock::new(env_config.clone()));
        let mut current = cell.write().unwrap();
        *current = env_config.clone();

        if env_config.output.masking.is_some() {
            if let Some(masking_cfg) = &env_config.output.masking {
                let rules = MaskRule::from(masking_cfg.clone());
                MASKING_RULES.get_or_init(|| RwLock::new(rules));
            }
        }

        init_batching_logger(&env_config);
        Some(env_config)
    } else {
        eprintln!("[Logger] No valid logger config for current NODE_ENV. Logger disabled.");
        None
    }
}

#[napi]
fn log(entry: LogEntry) {
    let Some(config_cell) = LOGGER_CONFIG.get() else {
        return;
    };
    let config = config_cell.read().unwrap();

    match config.output.format {
        OutputFormat::Text => {
            format_log_text(&entry, &config);
        }
        OutputFormat::Json => {
            format_log_json(&entry, &config);
        }
    }
}

fn format_log_text(entry: &LogEntry, config: &EnvConfig) {
    let fields = config.fields.clone().unwrap_or_default();
    
    let masked_msg = mask_message_if_needed(&entry.msg);

    let mut output = String::new();

    if fields.level.unwrap_or(false) {
        output.push_str(&format!("[{:?}]", entry.level));
    }

    if fields.pid.unwrap_or(false) {
        output.push_str(&format!(" [PID:{}]", entry.pid));
    }

    if fields.time.unwrap_or(false) {
        output.push_str(&format!(" [{}]", entry.time));
    }

    if fields.msg.unwrap_or(true) {
        let text = text_from_message(&masked_msg);
        output.push_str(&format!(" {}", text));
    }

    let final_output = if config.output.color {
        match entry.level {
            LogLevel::Trace => output.yellow().to_string(),
            LogLevel::Debug => output.purple().to_string(),
            LogLevel::Info => output.white().to_string(),
            LogLevel::Warn => output.green().to_string(),
            LogLevel::Error => output.red().to_string(),
            LogLevel::Fatal => output.bold().red().to_string(),
        }
    } else {
        output
    };

    write_output(&config, &final_output);
}

fn format_log_json(entry: &LogEntry, config: &EnvConfig) {
    let fields = config.fields.clone().unwrap_or_default();
    
    let masked_msg = mask_message_if_needed(&entry.msg);

    let filtered_entry = SerializableLogEntry {
        level: fields.level.unwrap_or(false).then_some(entry.level.clone()),
        msg: fields.msg.unwrap_or(false).then_some(masked_msg),
        time: fields.time.unwrap_or(false).then_some(entry.time),
        pid: fields.pid.unwrap_or(false).then_some(entry.pid),
    };

    if let Ok(json) = serde_json::to_string(&filtered_entry) {
        write_output(&config, &json);
    }
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
                eprintln!("[Logger] Failed to write to file {}: {}. Fallback to stderr.", path, err);
                eprintln!("{}", message);
            }
        } else {
            eprintln!("[Logger] Failed to open log file: {}. Fallback to stderr.", path);
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

#[napi]
pub fn trace(message: Value) {
    log(LogEntry {
        level: LogLevel::Trace,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}

#[napi]
pub fn info(message: Value) {
    log(LogEntry {
        level: LogLevel::Info,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}

#[napi]
pub fn debug(message: Value) {
    log(LogEntry {
        level: LogLevel::Debug,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}

#[napi]
pub fn warn(message: Value) {
    log(LogEntry {
        level: LogLevel::Warn,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}

#[napi]
pub fn error(message: Value) {
    log(LogEntry {
        level: LogLevel::Error,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}

#[napi]
pub fn fatal(message: Value) {
    log(LogEntry {
        level: LogLevel::Fatal,
        time: Utc::now().timestamp_millis(),
        pid: std::process::id(),
        msg: message,
    });
}
