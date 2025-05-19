use chrono::Utc;
use colored::Colorize;
use napi_derive::napi;
use serde_json::Value;
use std::io::Write;
use std::option::Option;
use std::sync::RwLock;

use crate::config::LOGGER_CONFIG;
use crate::types::{
    EnvConfig, FieldsConfig, LogEntry, LogLevel, LoggerConfig, OutputFormat, OutputTarget,
    SerializableLogEntry,
};
use crate::utils::text_from_message;

#[napi]
pub fn set_config(config: LoggerConfig) -> Option<EnvConfig> {
    let selected_config = match std::env::var("NODE_ENV").as_deref() {
        Ok("production") => config.prod.clone(),
        _ => config.dev.clone().or(config.prod.clone()),
    };

    if let Some(mut env_config) = selected_config {
        if env_config.fields.is_none() {
            env_config.fields = Some(FieldsConfig::default());
        }

        let cell = LOGGER_CONFIG.get_or_init(|| RwLock::new(env_config.clone()));
        let mut current = cell.write().unwrap();
        *current = env_config.clone();

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
        let text = text_from_message(&entry.msg);
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

    write_output(
        &config.output.target,
        &config.output.file_path,
        &final_output,
    );
}

fn format_log_json(entry: &LogEntry, config: &EnvConfig) {
    let fields = config.fields.clone().unwrap_or_default();

    let filtered_entry = SerializableLogEntry {
        level: fields.level.unwrap_or(false).then_some(entry.level.clone()),
        msg: fields.msg.unwrap_or(false).then_some(entry.msg.clone()),
        time: fields.time.unwrap_or(false).then_some(entry.time),
        pid: fields.pid.unwrap_or(false).then_some(entry.pid),
    };

    if let Ok(json) = serde_json::to_string(&filtered_entry) {
        write_output(&config.output.target, &config.output.file_path, &json);
    }
}

fn write_output(target: &OutputTarget, file_path: &Option<String>, message: &str) {
    match target {
        OutputTarget::Stdout => println!("{}", message),
        OutputTarget::Stderr => eprintln!("{}", message),
        OutputTarget::File => {
            if let Some(path) = file_path {
                if let Ok(mut file) = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(path)
                {
                    let _ = writeln!(file, "{}", message);
                } else {
                    eprintln!("[Logger] Failed to write to log file: {}", path);
                }
            } else {
                eprintln!("[Logger] No file path provided for log output.");
            }
        }
        OutputTarget::Null => { /* do nothing */ }
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
