const { platform, arch } = require('os')
const { join } = require('path')
const { readFileSync } = require('fs')

function isMusl() {
  if (process.report?.getReport) {
    const report = process.report.getReport()
    return !report.header?.glibcVersionRuntime
  }

  try {
    const ldd = readFileSync('/usr/bin/ldd', 'utf8')
    return ldd.includes('musl')
  } catch {
    return false
  }
}

function getPlatformPackage() {
  const plat = platform()
  const cpu = arch()

  if (plat === 'linux') {
    const libc = isMusl() ? 'musl' : 'gnu'
    return `eventum-${plat}-${cpu}-${libc}`
  }

  return `eventum-${plat}-${cpu}`
}

let native
try {
  native = require(getPlatformPackage())
} catch (e) {
  try {
    native = require(join(__dirname, 'eventum.node'))
  } catch (err) {
    throw new Error(`Failed to load native binding: ${err.message}`)
  }
}

module.exports = {
  trace: native.trace,
  info: native.info,
  debug: native.debug,
  warn: native.warn,
  error: native.error,
  fatal: native.fatal,
  shutdown: native.shutdown,
  setConfig: native.setConfig,
  LogLevel: native.LogLevel,
  OutputFormat: native.OutputFormat,
  OutputTarget: native.OutputTarget,
};
