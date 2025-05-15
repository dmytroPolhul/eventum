use once_cell::sync::OnceCell;
use std::sync::RwLock;

use crate::types::LoggerConfig;

pub static LOGGER_CONFIG: OnceCell<RwLock<LoggerConfig>> = OnceCell::new();
