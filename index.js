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
  throw new Error(
    `Failed to load native module at ${nativePath}. 
Make sure you have built it first using: \`npm run build\`.
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
  getConfig,
} = native;

export default native;
