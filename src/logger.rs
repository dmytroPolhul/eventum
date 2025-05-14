use napi_derive::napi;

use crate::types::{LogEntry, LogLevel};

#[napi]
pub fn log(entry: LogEntry) {
    println!("[{:?}] {}", entry.level, entry.message);
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
