use crate::masking::MaskRule;
use crate::types::EnvConfig;
use once_cell::sync::OnceCell;
use std::sync::mpsc::Sender;
use std::sync::{OnceLock, RwLock};

pub static LOGGER_CONFIG: OnceCell<RwLock<EnvConfig>> = OnceCell::new();

pub static SENDER: OnceLock<Sender<String>> = OnceLock::new();

pub static MASKING_RULES: OnceCell<RwLock<MaskRule>> = OnceCell::new();
