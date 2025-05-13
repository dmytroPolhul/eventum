use napi_derive::napi;

#[napi]
pub fn log(message: String) {
    println!("[LOG] {}", message);
}
