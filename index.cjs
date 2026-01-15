const path = require("node:path");

const nativePath = path.join(__dirname, "index.node");

let native;
try {
  native = require(nativePath);
} catch (err) {
  const buildCommand = process.platform === "win32" ? "npm.cmd run build" : "npm run build";
  const message = err && err.message ? err.message : String(err);

  throw new Error(
    [
      `Failed to load native module at: ${nativePath}`,
      `Build it first using: \`${buildCommand}\``,
      `Original error: ${message}`,
    ].join("\n")
  );
}

/**
 * Sanitizes JS values before passing to native code to prevent crashes.
 * Handles: circular refs, NaN, Infinity, BigInt, Error objects.
 * Fast-path for primitives (no copies).
 */
function sanitize(value, seen = new WeakSet()) {
  const type = typeof value;
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return null;
  }
  if (type === "string" || type === "boolean") {
    return value;
  }
  if (type === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (value === Infinity) return "Infinity";
    if (value === -Infinity) return "-Infinity";
    return value;
  }
  if (type === "bigint") {
    return value.toString();
  }
  if (type === "function") {
    return "[Function]";
  }
  if (type === "symbol") {
    return value.toString();
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (value instanceof Error) {
    const errorObj = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errorObj[key] = sanitize(value[key], seen);
      }
    }
    return errorObj;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, seen));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  if (Object.prototype.toString.call(value) === "[object Object]") {
    const sanitized = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitize(value[key], seen);
      }
    }
    return sanitized;
  }

  try {
    return String(value);
  } catch {
    return "[Object]";
  }
}

module.exports = {
  trace: (message) => native.trace(sanitize(message)),
  info: (message) => native.info(sanitize(message)),
  debug: (message) => native.debug(sanitize(message)),
  warn: (message) => native.warn(sanitize(message)),
  error: (message) => native.error(sanitize(message)),
  fatal: (message) => native.fatal(sanitize(message)),
  shutdown: native.shutdown,
  setConfig: native.setConfig,
  LogLevel: native.LogLevel,
  OutputFormat: native.OutputFormat,
  OutputTarget: native.OutputTarget,
};
