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
  const buildCommand = process.platform === 'win32' ? 'npm.cmd run build' : 'npm run build';
  throw new Error(
    `Failed to load native module at ${nativePath}\n.
    Make sure you have built it first using: \`${buildCommand}\`\n.
    Original error: ${err.message}`
  );
}

export const {
  log,
  info,
  debug,
  warn,
  error,
  trace,
  fatal,
  LogLevel,
  shutdown,
  setConfig,
} = native;

export default native;