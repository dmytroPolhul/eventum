use napi_derive::napi;
use serde::Serialize;
use serde_json::Value;

#[napi]
#[derive(Debug, PartialEq, PartialOrd, Eq, Ord, Serialize)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
    Fatal,
}

#[napi]
#[derive(Debug, PartialEq, PartialOrd, Eq, Ord)]
pub enum OutputFormat {
    Text,
    Json,
}

#[napi(object)]
#[derive(Serialize)]
pub struct LogEntry {
    pub level: LogLevel,
    pub message: Value,
}

#[napi(object)]
#[derive(Clone)]
pub struct LoggerConfig {
    pub color_output: bool,
    pub output_format: OutputFormat,
}
