use napi_derive::napi;
use std::sync::RwLock;
use colored::Colorize;

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
            if config.color_output {
                match entry.level {
                    LogLevel::Trace => println!("[{:?}] {}", entry.level, entry.message.yellow()),
                    LogLevel::Debug => println!("[{:?}] {}", entry.level, entry.message.purple()),
                    LogLevel::Info => println!("[{:?}] {}", entry.level, entry.message.green()),
                    LogLevel::Warn => println!("[{:?}] {}", entry.level, entry.message.bold().green()),
                    LogLevel::Error => println!("[{:?}] {}", entry.level, entry.message.red()),
                    LogLevel::Fatal => println!("[{:?}] {}", entry.level, entry.message.bold().red())
                }
            } else {
                println!("[{:?}] {}", entry.level, entry.message);
            }
        }
        OutputFormat::Json => {
            unimplemented!()
        }
    }
}

#[napi]
pub fn trace(message: String) {
    log(LogEntry {
        level: LogLevel::Trace,
        message,
    });
}

#[napi]
pub fn info(message: String) {
    log(LogEntry {
        level: LogLevel::Info,
        message,
    });
}

#[napi]
pub fn debug(message: String) {
    log(LogEntry {
        level: LogLevel::Debug,
        message,
    });
}

#[napi]
pub fn warn(message: String) {
    log(LogEntry {
        level: LogLevel::Warn,
        message,
    });
}

#[napi]
pub fn error(message: String) {
    log(LogEntry {
        level: LogLevel::Error,
        message,
    });
}

#[napi]
pub fn fatal(message: String) {
    log(LogEntry {
        level: LogLevel::Fatal,
        message,
    });
}
