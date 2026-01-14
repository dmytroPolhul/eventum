import * as logger from "../index.js";
import fs from "fs";

const LOG_COUNT = 1_000_000;
const FILE_PATH = "./benchmark.log";

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

function cleanupFile() {
  if (fs.existsSync(FILE_PATH)) {
    fs.unlinkSync(FILE_PATH);
  }
}

function setLogger(targetId, formatId) {
  logger.setConfig({
    prod: {
      output: {
        color: false,
        format: formatId,
        target: targetId,
        filePath: FILE_PATH,
        batchEnabled: false,
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
  if (targetId === 2) {
    cleanupFile();
  }

  setLogger(targetId, formatId);

  const startUsage = process.cpuUsage();
  const startMemory = process.memoryUsage().rss;
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < LOG_COUNT; i++) {
    logger.info({ id: i, user: "test", action: "benchmark" });
  }

  const endTime = process.hrtime.bigint();
  const endUsage = process.cpuUsage(startUsage);
  const endMemory = process.memoryUsage().rss;

  const elapsedMs = Number(endTime - startTime) / 1_000_000;
  const cpuTimeMs = (endUsage.user + endUsage.system) / 1000;
  const cpuPercent = (cpuTimeMs / elapsedMs) * 100;
  const memoryMB = (endMemory - startMemory) / 1024 / 1024;
  const logsPerSecond = Math.floor((LOG_COUNT / elapsedMs) * 1000);

  const result = {
    Format: formatName,
    Target: targetName,
    "CPU ms": cpuTimeMs.toFixed(2),
    "Elapsed ms": Math.floor(elapsedMs),
    "CPU %": cpuPercent.toFixed(2) + "%",
    "Memory MB": memoryMB.toFixed(2),
    "Logs/sec": logsPerSecond.toLocaleString(),
  };

  if (targetId === 2 && fs.existsSync(FILE_PATH)) {
    const fileSizeMB = fs.statSync(FILE_PATH).size / 1024 / 1024;
    result["File MB"] = fileSizeMB.toFixed(2);
    cleanupFile();
  }

  return result;
}

const results = [];

console.log("Running benchmarks...\n");

for (const { name: formatName, id: formatId } of FORMATS) {
  for (const { name: targetName, id: targetId } of TARGETS) {
    const result = runBenchmark(targetName, targetId, formatName, formatId);
    results.push(result);
    logger.shutdown();
  }
}

console.log("\nBenchmark Results:");
console.table(results);
