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
pub enum OutputTarget {
    Stdout,
    Stderr,
    File,
    Null,
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
    pub msg: Value,
    pub time: i64,
    pub pid: u32,
}

#[napi(object)]
#[derive(Clone)]
pub struct OutputConfig {
    pub color: bool,
    pub format: OutputFormat,
    pub target: OutputTarget,
    pub file_path: Option<String>,
    pub max_file_size: Option<i64>,
    pub max_backups: Option<u8>,
    pub rotate_daily: Option<bool>,
}

#[napi(object)]
#[derive(Clone)]
pub struct FieldsConfig {
    pub pid: Option<bool>,
    pub time: Option<bool>,
    pub msg: Option<bool>,
    pub level: Option<bool>,
}

impl Default for FieldsConfig {
    fn default() -> Self {
        FieldsConfig {
            pid: Some(false),
            time: Some(true),
            msg: Some(true),
            level: Some(true),
        }
    }
}

#[napi(object)]
#[derive(Clone)]
pub struct EnvConfig {
    pub transport: Option<String>,
    pub output: OutputConfig,
    pub fields: Option<FieldsConfig>,
}

#[napi(object)]
#[derive(Clone)]
pub struct LoggerConfig {
    pub dev: Option<EnvConfig>,
    pub prod: Option<EnvConfig>,
}

#[derive(Serialize)]
pub struct SerializableLogEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<LogLevel>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub msg: Option<Value>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub time: Option<i64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pid: Option<u32>,
}
