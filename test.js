import * as logger from "./index.js";

logger.setConfig({
  colorOutput: true,
  outputFormat: 0,
});

logger.error("Node.js logs via Rust");
