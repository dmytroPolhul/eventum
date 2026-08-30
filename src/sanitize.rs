use napi::bindgen_prelude::*;
use napi::sys::{napi_strict_equals, napi_value};
use napi::{Env, JsUnknown, NapiRaw, ValueType};
use serde_json::{Map, Number, Value};

/// Recursion cap. Prevents stack overflow on pathological input that slipped
/// past circular detection (e.g. very deep proxies).
const MAX_DEPTH: u32 = 256;

/// Sanitize an arbitrary JS value into a serde_json::Value.
///
/// Replaces the JS-side `sanitize()` function. Handles:
///   * null / undefined → Null
///   * boolean / string → as-is
///   * number → Number, or "NaN" / "Infinity" / "-Infinity" strings for non-finite
///   * bigint → decimal string
///   * function → "[Function]"
///   * symbol → its `toString()`
///   * Error → { name, message, stack, ...own props }
///   * Array → recursive
///   * Date → ISO string
///   * RegExp → toString
///   * plain Object → recursive over own enumerable string keys
///   * circular ref → "[Circular]"
///
/// This function is called on the JS thread (from inside the napi callback),
/// so all handles remain valid throughout the traversal.
pub fn sanitize(env: &Env, value: JsUnknown) -> Result<Value> {
    let mut seen: Vec<napi_value> = Vec::new();
    sanitize_inner(env, value, &mut seen, 0)
}

fn sanitize_inner(
    env: &Env,
    value: JsUnknown,
    seen: &mut Vec<napi_value>,
    depth: u32,
) -> Result<Value> {
    if depth > MAX_DEPTH {
        return Ok(Value::String("[MaxDepth]".to_string()));
    }

    match value.get_type()? {
        ValueType::Undefined | ValueType::Null => Ok(Value::Null),

        ValueType::Boolean => {
            let b: napi::JsBoolean = unsafe { value.cast() };
            Ok(Value::Bool(b.get_value()?))
        }

        ValueType::Number => {
            let n: napi::JsNumber = unsafe { value.cast() };
            let f = n.get_double()?;
            if f.is_nan() {
                Ok(Value::String("NaN".to_string()))
            } else if f == f64::INFINITY {
                Ok(Value::String("Infinity".to_string()))
            } else if f == f64::NEG_INFINITY {
                Ok(Value::String("-Infinity".to_string()))
            } else if f.fract() == 0.0 && f >= i64::MIN as f64 && f <= i64::MAX as f64 {
                // Preserve integer form: JS `42` → JSON `42`, not `42.0`.
                Ok(Value::Number(Number::from(f as i64)))
            } else {
                match Number::from_f64(f) {
                    Some(num) => Ok(Value::Number(num)),
                    None => Ok(Value::String(f.to_string())),
                }
            }
        }

        ValueType::String => {
            let s: napi::JsString = unsafe { value.cast() };
            Ok(Value::String(s.into_utf8()?.into_owned()?))
        }

        ValueType::BigInt => {
            let bi: napi::JsBigInt = unsafe { value.cast() };
            // Coerce to string via JS: `String(bigint)` gives the decimal form.
            let s = bi.coerce_to_string()?;
            Ok(Value::String(s.into_utf8()?.into_owned()?))
        }

        ValueType::Symbol => {
            // Match JS `sanitize`: `value.toString()` → "Symbol(desc)".
            // Symbol is a function (constructor), so fetch as JsUnknown then cast.
            let global = env.get_global()?;
            let sym_uk: JsUnknown = global.get_named_property("Symbol")?;
            let sym_ctor: napi::JsObject = unsafe { sym_uk.cast() };
            let proto: napi::JsObject = sym_ctor.get_named_property("prototype")?;
            let to_string: napi::JsFunction = proto.get_named_property("toString")?;
            let obj = value.coerce_to_object()?;
            let raw = to_string.call_without_args(Some(&obj))?;
            let s: napi::JsString = unsafe { raw.cast() };
            Ok(Value::String(s.into_utf8()?.into_owned()?))
        }

        ValueType::Function => Ok(Value::String("[Function]".to_string())),

        ValueType::External | ValueType::Unknown => Ok(Value::String("[Object]".to_string())),

        ValueType::Object => sanitize_object(env, value, seen, depth),
    }
}

fn sanitize_object(
    env: &Env,
    value: JsUnknown,
    seen: &mut Vec<napi_value>,
    depth: u32,
) -> Result<Value> {
    let obj: napi::JsObject = unsafe { value.cast() };
    let obj_raw = unsafe { obj.raw() };
    let env_raw = env.raw();

    // Circular detection: strict-equality against every ancestor handle.
    for &prior in seen.iter() {
        let mut equal = false;
        let status = unsafe { napi_strict_equals(env_raw, prior, obj_raw, &mut equal) };
        if status == napi::sys::Status::napi_ok && equal {
            return Ok(Value::String("[Circular]".to_string()));
        }
    }

    // Array
    if obj.is_array()? {
        seen.push(obj_raw);
        let len = obj.get_array_length()?;
        let mut arr = Vec::with_capacity(len as usize);
        for i in 0..len {
            let item: JsUnknown = obj.get_element(i)?;
            arr.push(sanitize_inner(env, item, seen, depth + 1)?);
        }
        seen.pop();
        return Ok(Value::Array(arr));
    }

    // Error — is_error() checks with `napi_is_error`.
    if obj.is_error()? {
        seen.push(obj_raw);
        let mut map = Map::new();

        // Standard error fields — read as JS values when present.
        for &field in &["name", "message", "stack"] {
            if obj.has_named_property(field)? {
                let v: JsUnknown = obj.get_named_property(field)?;
                map.insert(field.to_string(), sanitize_inner(env, v, seen, depth + 1)?);
            }
        }

        // Own enumerable properties beyond name/message/stack (e.g. `code`, `details`).
        let names = obj.get_property_names()?;
        let names_len = names.get_array_length()?;
        for i in 0..names_len {
            let key_val: JsUnknown = names.get_element(i)?;
            let key_str: napi::JsString = unsafe { key_val.cast() };
            let key = key_str.into_utf8()?.into_owned()?;
            if key == "name" || key == "message" || key == "stack" {
                continue;
            }
            let v: JsUnknown = obj.get_property(&key_str)?;
            map.insert(key, sanitize_inner(env, v, seen, depth + 1)?);
        }
        seen.pop();
        return Ok(Value::Object(map));
    }

    // Date, RegExp — identify via Object.prototype.toString.call(x) tag,
    // matching the JS sanitize() behavior.
    let tag = object_tag(env, &obj)?;
    if tag == "[object Date]" {
        // toISOString()
        let f: napi::JsFunction = obj.get_named_property("toISOString")?;
        let raw = f.call_without_args(Some(&obj))?;
        let s: napi::JsString = unsafe { raw.cast() };
        return Ok(Value::String(s.into_utf8()?.into_owned()?));
    }
    if tag == "[object RegExp]" {
        let f: napi::JsFunction = obj.get_named_property("toString")?;
        let raw = f.call_without_args(Some(&obj))?;
        let s: napi::JsString = unsafe { raw.cast() };
        return Ok(Value::String(s.into_utf8()?.into_owned()?));
    }

    // Plain object — walk own enumerable string keys.
    if tag == "[object Object]" {
        seen.push(obj_raw);
        let mut map = Map::new();
        let names = obj.get_property_names()?;
        let names_len = names.get_array_length()?;
        for i in 0..names_len {
            let key_val: JsUnknown = names.get_element(i)?;
            let key_str: napi::JsString = unsafe { key_val.cast() };
            let key = key_str.into_utf8()?.into_owned()?;
            let v: JsUnknown = obj.get_property(&key_str)?;
            map.insert(key, sanitize_inner(env, v, seen, depth + 1)?);
        }
        seen.pop();
        return Ok(Value::Object(map));
    }

    // Fallback: coerce to string, matching `try { return String(value) }` in JS.
    match obj.coerce_to_string() {
        Ok(s) => Ok(Value::String(s.into_utf8()?.into_owned()?)),
        Err(_) => Ok(Value::String("[Object]".to_string())),
    }
}

/// Get `Object.prototype.toString.call(obj)` — the canonical tag string
/// for the object's built-in type (e.g. "[object Date]").
fn object_tag(env: &Env, obj: &napi::JsObject) -> Result<String> {
    // Object is a function (constructor); fetch as JsUnknown, cast to JsObject
    // so `.get_named_property("prototype")` succeeds.
    let global = env.get_global()?;
    let object_ctor_uk: JsUnknown = global.get_named_property("Object")?;
    let object_ctor: napi::JsObject = unsafe { object_ctor_uk.cast() };
    let proto: napi::JsObject = object_ctor.get_named_property("prototype")?;
    let to_string: napi::JsFunction = proto.get_named_property("toString")?;
    let raw = to_string.call_without_args(Some(obj))?;
    let s: napi::JsString = unsafe { raw.cast() };
    Ok(s.into_utf8()?.into_owned()?)
}
