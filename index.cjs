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

module.exports = native;
