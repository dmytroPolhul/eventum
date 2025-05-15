use napi_derive::napi;
use std::sync::RwLock;
use colored::Colorize;
use serde_json::Value;

use crate::config::LOGGER_CONFIG;
use crate::types::{LogEntry, LogLevel, LoggerConfig, OutputFormat};

#[napi]
pub fn set_config(config: LoggerConfig) {
    let cell = LOGGER_CONFIG.get_or_init(|| RwLock::new(config.clone()));
    let mut current = cell.write().unwrap();
    *current = config;
}

#[napi]
pub fn get_config() -> LoggerConfig {
    let cell = LOGGER_CONFIG.get_or_init(|| {
        RwLock::new(LoggerConfig {
            color_output: false,
            output_format: OutputFormat::Text,
        })
    });

    let current = cell.read().unwrap();
    current.clone()
}

#[napi]
pub fn log(entry: LogEntry) {
    let config_cell = LOGGER_CONFIG.get().expect("Logger not configured");
    let config = config_cell.read().unwrap();

    match config.output_format {
        OutputFormat::Text => {
            let text = match &entry.message {
                            Value::String(s) => s.clone(),
                            other => serde_json::to_string_pretty(other).unwrap_or_else(|_| "<Invalid JSON>".into()),
                        };
            
            if config.color_output {
                match entry.level {
                    LogLevel::Trace => println!("[{:?}] {}", entry.level, text.yellow()),
                    LogLevel::Debug => println!("[{:?}] {}", entry.level, text.purple()),
                    LogLevel::Info => println!("[{:?}] {}", entry.level, text.white()),
                    LogLevel::Warn => println!("[{:?}] {}", entry.level, text.green()),
                    LogLevel::Error => println!("[{:?}] {}", entry.level, text.red()),
                    LogLevel::Fatal => println!("[{:?}] {}", entry.level, text.bold().red())
                }
            } else {
                println!("[{:?}] {}", entry.level, entry.message);
            }
        }
        OutputFormat::Json => {
            let json = serde_json::to_string(&entry).unwrap();
            println!("{}", json);
        }
    }
}

#[napi]
pub fn trace(message: Value) {
    log(LogEntry {
        level: LogLevel::Trace,
        message,
    });
}

#[napi]
pub fn info(message: Value) {
    log(LogEntry {
        level: LogLevel::Info,
        message,
    });
}

#[napi]
pub fn debug(message: Value) {
    log(LogEntry {
        level: LogLevel::Debug,
        message,
    });
}

#[napi]
pub fn warn(message: Value) {
    log(LogEntry {
        level: LogLevel::Warn,
        message,
    });
}

#[napi]
pub fn error(message: Value) {
    log(LogEntry {
        level: LogLevel::Error,
        message,
    });
}

#[napi]
pub fn fatal(message: Value) {
    log(LogEntry {
        level: LogLevel::Fatal,
        message,
    });
}
