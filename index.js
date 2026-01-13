import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const nativePath = join(__dirname, "index.node");

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

export const {
  debug,
  info,
  warn,
  error,
  trace,
  fatal,
  LogLevel,
  OutputFormat,
  OutputTarget,
  shutdown,
  setConfig,
} = native;

export default native;