use crate::types::EnvConfig;
use once_cell::sync::OnceCell;
use std::sync::RwLock;

pub static LOGGER_CONFIG: OnceCell<RwLock<EnvConfig>> = OnceCell::new();
