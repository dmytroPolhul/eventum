use chrono::Utc;
use napi_derive::napi;
use serde_json::Value;
use std::option::Option;
use std::sync::RwLock;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::config::{BATCH_THREAD, LOGGER_CONFIG, MASKING_RULES, SENDER};
use crate::format::{format_log_json, format_log_text};
use crate::masking::MaskRule;
use crate::types::{
    EnvConfig, FieldsConfig, LogEntry, LogLevel, LoggerConfig, OutputFormat, WorkerMsg,
};
use crate::utils::{init_batching_logger, validate_config};

static WARNED_NO_CONFIG: AtomicBool = AtomicBool::new(false);

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
                let cell = MASKING_RULES.get_or_init(|| RwLock::new(rules.clone()));
                *cell.write().unwrap() = rules;
            }
        }

        let needs_init = if let Some(sender_mutex) = SENDER.get() {
            sender_mutex.lock().unwrap().is_none()
        } else {
            true
        };

        if needs_init {
            init_batching_logger(&env_config);
        }

        Some(env_config)
    } else {
        eprintln!("[Logger] No valid logger config for current NODE_ENV. Logger disabled.");
        None
    }
}

fn log(entry: LogEntry) {
    if LOGGER_CONFIG.get().is_none() {
        if !WARNED_NO_CONFIG.swap(true, Ordering::Relaxed) {
            eprintln!("[Eventum] Logger used before setConfig(). Logs are discarded.");
        }
        return;
    }

    if let Some(sender_mutex) = SENDER.get() {
        if let Some(sender) = sender_mutex.lock().unwrap().as_ref() {
            let _ = sender.send(WorkerMsg::Entry(entry));
            return;
        }
    }

    let Some(config_cell) = LOGGER_CONFIG.get() else {
        return;
    };
    let config = config_cell.read().unwrap();

    match config.output.format {
        OutputFormat::Text => format_log_text(&entry, &config),
        OutputFormat::Json => format_log_json(&entry, &config),
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

#[napi]
pub fn shutdown() {
    if let Some(sender_mutex) = SENDER.get() {
        if let Some(sender) = sender_mutex.lock().unwrap().as_ref() {
            let _ = sender.send(WorkerMsg::Shutdown);
        }
    }

    if let Some(thread_mutex) = BATCH_THREAD.get() {
        if let Some(handle) = thread_mutex.lock().unwrap().take() {
            let _ = handle.join();
        }
    }

    if let Some(sender_mutex) = SENDER.get() {
        *sender_mutex.lock().unwrap() = None;
    }
}
