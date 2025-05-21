import * as logger from "../index.js";
import fs from "fs";

const LOG_COUNT = 1_000_000;
const FILE_PATH = "./benchmark.log";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const TARGETS = [
  { name: "Stdout", id: 0 },
  { name: "Stderr", id: 1 },
  { name: "File", id: 2 },
  { name: "Null", id: 3 },
];

const FORMATS = [
  { name: "Text", id: 0 },
  { name: "JSON", id: 1 },
];

function setLogger(targetId, formatId) {
  logger.setConfig({
    prod: {
      output: {
        color: false,
        format: formatId,
        target: targetId,
        filePath: FILE_PATH,
        maxFileSize: MAX_FILE_SIZE,
        maxBackups: 10,
        rotateDaily: true
      },
      fields: {
        time: true,
        pid: true,
        msg: true,
        level: true,
      },
    },
  });
}

function runBenchmark(targetName, targetId, formatName, formatId) {
  if (targetId === 2 && fs.existsSync(FILE_PATH)) {
    fs.unlinkSync(FILE_PATH);
  }

  setLogger(targetId, formatId);

  const startUsage = process.cpuUsage();
  const startMemory = process.memoryUsage();
  const startTime = Date.now();

  for (let i = 0; i < LOG_COUNT; i++) {
    logger.debug({ id: i, name: "John" });
    logger.warn(`Benchmarking target ${targetName} ${i}`);
  }

  const endUsage = process.cpuUsage(startUsage);
  const endMemory = process.memoryUsage();
  const endTime = Date.now();

  const cpuTimeMs = (endUsage.user + endUsage.system) / 1000;
  const elapsedTime = endTime - startTime;
  const memoryMB = (endMemory.rss - startMemory.rss) / 1024 / 1024;
  const logsPerSecond = Math.floor((LOG_COUNT * 2) / (elapsedTime / 1000));

  const result = {
    Format: formatName,
    Target: targetName,
    "CPU ms": cpuTimeMs.toFixed(2),
    "Elapsed ms": elapsedTime,
    "CPU %": (cpuTimeMs / elapsedTime * 100).toFixed(2),
    "Memory MB": memoryMB.toFixed(2),
    "Logs/sec": logsPerSecond,
  };

  if (targetId === 2 && fs.existsSync(FILE_PATH)) {
    const fileSize = fs.statSync(FILE_PATH).size / 1024 / 1024;
    result["File Size MB"] = fileSize.toFixed(2);
  }

  return result;
}

(async () => {
  const results = [];

  for (const { name: formatName, id: formatId } of FORMATS) {
    for (const { name: targetName, id: targetId } of TARGETS) {
      console.log(`\n🏁 Benchmarking: [${formatName}] → ${targetName}`);
      const result = runBenchmark(targetName, targetId, formatName, formatId);
      results.push(result);
    }
  }

  console.log("\n📊 Benchmark Summary:");
  console.table(results);
})();
