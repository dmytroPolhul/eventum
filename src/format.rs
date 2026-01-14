use crate::types::{EnvConfig, LogEntry};
use crate::types::{LogLevel, SerializableLogEntry};
use crate::utils::{
    extract_scope_and_text, extract_scope_and_value, mask_message_if_needed, write_output,
};
use colored::Colorize;

pub fn format_log_text(entry: &LogEntry, config: &EnvConfig) {
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
        let (scope, text) = extract_scope_and_text(&masked_msg);
        if let Some(scope) = scope {
            output.push_str(&format!(" [{}]", scope));
        }

        if !text.is_empty() {
            output.push_str(&format!(" {}", text));
        }
    }

    let color = config.output.color.unwrap_or(false);

    let final_output = if color {
        match entry.level {
            LogLevel::Trace => output.bright_black().to_string(),
            LogLevel::Debug => output.cyan().to_string(),
            LogLevel::Info => output.green().to_string(),
            LogLevel::Warn => output.yellow().to_string(),
            LogLevel::Error => output.red().to_string(),
            LogLevel::Fatal => output.bold().red().to_string(),
        }
    } else {
        output
    };

    write_output(&config, &final_output);
}

pub fn format_log_json(entry: &LogEntry, config: &EnvConfig) {
    let fields = config.fields.clone().unwrap_or_default();
    let masked_msg = mask_message_if_needed(&entry.msg);

    let (scope, msg_without_scope) = extract_scope_and_value(&masked_msg);

    let filtered_entry = SerializableLogEntry {
        level: fields.level.unwrap_or(false).then_some(entry.level.clone()),
        msg: fields.msg.unwrap_or(true).then_some(msg_without_scope),
        time: fields.time.unwrap_or(false).then_some(entry.time),
        pid: fields.pid.unwrap_or(false).then_some(entry.pid),
        scope,
    };

    if let Ok(json) = serde_json::to_string(&filtered_entry) {
        write_output(config, &json);
    }
}
