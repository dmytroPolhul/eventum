use napi_derive::napi;

#[napi]
pub fn log(message: String) {
    println!("[LOG] {}", message);
}

#[napi]
pub fn debug(message: String) {
    println!("[DEBUG] {}", message);
}

#[napi]
pub fn warn(message: String) {
    println!("[WARN] {}", message);
}

#[napi]
pub fn error(message: String) {
    println!("[ERROR] {}", message);
}
