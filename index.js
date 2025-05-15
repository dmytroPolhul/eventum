import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const native = require("./index.node");

export const {
  log,
  info,
  debug,
  warn,
  error,
  trace,
  fatal,
  LogLevel,
  setConfig,
  getConfig,
} = native;
