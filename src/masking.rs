use regex::Regex;

use crate::types::MaskingConfig;

#[derive(Clone, Debug)]
pub struct MaskRule {
    pub exact: Vec<String>,
    pub partial: Vec<String>,
    pub regex: Vec<Regex>,
}

impl From<MaskingConfig> for MaskRule {
    fn from(cfg: MaskingConfig) -> Self {
        let regex_vec = cfg
            .regex
            .unwrap_or_default()
            .into_iter()
            .filter_map(|r| Regex::new(&r).ok())
            .collect();

        MaskRule {
            exact: cfg.exact.unwrap_or_default(),
            partial: cfg.partial.unwrap_or_default(),
            regex: regex_vec,
        }
    }
}

impl MaskRule {
    pub fn new() -> Self {
        MaskRule {
            exact: Vec::new(),
            partial: Vec::new(),
            regex: Vec::new(),
        }
    }

    pub fn mask_value(&self, key: &str, value: &str) -> String {
        if self.exact.iter().any(|k| k == key) {
            return "[MASKED]".to_string();
        }

        if self.partial.iter().any(|k| key.contains(k)) {
            return "[MASKED]".to_string();
        }

        for re in &self.regex {
            if re.is_match(key) {
                return "[MASKED]".to_string();
            }
        }

        value.to_string()
    }

    pub fn mask_map(
        &self,
        map: &serde_json::Map<String, serde_json::Value>,
    ) -> serde_json::Map<String, serde_json::Value> {
        let mut masked = map.clone();

        for (key, value) in map.iter() {
            if let Some(str_value) = value.as_str() {
                let new_val = self.mask_value(key, str_value);
                masked.insert(key.clone(), serde_json::Value::String(new_val));
            }
        }

        masked
    }
}
