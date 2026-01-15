use crate::masking::MaskRule;
use crate::types::{EnvConfig, WorkerMsg};
use once_cell::sync::OnceCell;
use std::sync::mpsc::Sender;
use std::sync::{Mutex, RwLock};
use std::thread;

pub static LOGGER_CONFIG: OnceCell<RwLock<EnvConfig>> = OnceCell::new();

pub static SENDER: OnceCell<Mutex<Option<Sender<WorkerMsg>>>> = OnceCell::new();

pub static MASKING_RULES: OnceCell<RwLock<MaskRule>> = OnceCell::new();

pub static BATCH_THREAD: OnceCell<Mutex<Option<thread::JoinHandle<()>>>> = OnceCell::new();
