import * as logger from "./index.js";

logger.setConfig({
  prod: {
    output: {
      color: true,
      format: 0,
    },
    fields: {
      time: true,
      //pid: true,
      msg: true,
      level: true
    }
  }
});

const startUsage = process.cpuUsage();
const startMemory = process.memoryUsage();
const startTime = Date.now();

for (let i = 0; i <= 1000000; i++) {
  logger.debug({id: `${i}`, name: 'John'});
  logger.warn(`Node.js logs via Rust ${i}`);
}

const endUsage = process.cpuUsage(startUsage);
const endMemory = process.memoryUsage();
const endTime = Date.now();

const cpuTimeMs = (endUsage.user + endUsage.system) / 1000;
const elapsedTime = endTime - startTime;

const memoryMB = (endMemory.rss - startMemory.rss) / 1024 / 1024;

console.log(`CPU time used: ${cpuTimeMs.toFixed(2)} ms`);
console.log(`Elapsed time: ${elapsedTime} ms`);
console.log(`Estimated CPU %: ${(cpuTimeMs / elapsedTime * 100).toFixed(2)}%`);
console.log(`Memory used: ${memoryMB.toFixed(2)} MB`);