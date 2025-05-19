import * as logger from "./index.js";
import fs from "fs";

const LOG_COUNT = 1_000_000;
const FILE_PATH = './benchmark.log';

const TARGETS = [
  { name: 'Stdout', id: 0 },
  { name: 'Stderr', id: 1 },
  { name: 'File', id: 2 },
  { name: 'Null', id: 3 }
];

function setLogger(targetId) {
  logger.setConfig({
    prod: {
      output: {
        color: false,
        format: 1,
        target: targetId,
        filePath: FILE_PATH
      },
      fields: {
        time: true,
        pid: true,
        msg: true,
        level: true
      }
    }
  });
}

function runBenchmark(targetName, targetId) {
  if (targetId === 2 && fs.existsSync(FILE_PATH)) {
    fs.unlinkSync(FILE_PATH);
  }

  setLogger(targetId);

  const startUsage = process.cpuUsage();
  const startMemory = process.memoryUsage();
  const startTime = Date.now();

  for (let i = 0; i < LOG_COUNT; i++) {
    logger.debug({ id: i, name: 'John' });
    logger.warn(`Benchmarking target ${targetName} ${i}`);
  }

  const endUsage = process.cpuUsage(startUsage);
  const endMemory = process.memoryUsage();
  const endTime = Date.now();

  const cpuTimeMs = (endUsage.user + endUsage.system) / 1000;
  const elapsedTime = endTime - startTime;
  const memoryMB = (endMemory.rss - startMemory.rss) / 1024 / 1024;

  return {
    Target: targetName,
    "CPU ms": cpuTimeMs.toFixed(2),
    "Elapsed ms": elapsedTime,
    "CPU %": (cpuTimeMs / elapsedTime * 100).toFixed(2),
    "Memory MB": memoryMB.toFixed(2)
  };
}

(async () => {
  const results = [];

  for (const { name, id } of TARGETS) {
    console.log(`\n🏁 Benchmarking: ${name}`);
    const result = runBenchmark(name, id);
    results.push(result);
  }

  console.log("\n📊 Benchmark Summary:");
  console.table(results);
})();
