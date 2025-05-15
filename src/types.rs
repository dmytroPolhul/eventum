use napi_derive::napi;

#[napi]
#[derive(Debug, PartialEq, PartialOrd, Eq, Ord)]
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
pub struct LogEntry {
    pub level: LogLevel,
    pub message: String,
}

#[napi(object)]
#[derive(Clone)]
pub struct LoggerConfig {
    pub color_output: bool,
    pub output_format: OutputFormat,
}
