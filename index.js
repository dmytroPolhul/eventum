import { platform, arch } from 'os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

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

export const {
  trace,
  info,
  debug,
  warn,
  error,
  fatal,
  shutdown,
  setConfig,
  LogLevel,
  OutputFormat,
  OutputTarget,
} = native;

export default native;
