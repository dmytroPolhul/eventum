use serde_json::Value;

pub fn text_from_message(val: &Value) -> String {
    match val {
        Value::String(s) => s.clone(),
        other => serde_json::to_string_pretty(other).unwrap_or_else(|_| "<Invalid JSON>".into()),
    }
}
