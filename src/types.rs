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

#[napi(object)]
pub struct LogEntry {
    pub level: LogLevel,
    pub message: String,
}
