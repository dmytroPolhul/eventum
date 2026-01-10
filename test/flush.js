import * as logger from '../index.js';
import fs from 'fs';

const config = {
  prod: {
    output: {
      color: false,
      format: 1,
      target: 2,
      filePath: './test.flush.log',
      batchSize: 20,
      batchIntervalMs: 200
    },
    fields: {
      time: true,
      pid: false,
      msg: true,
      level: true
    }
  }
};

try {
  const ok = logger.setConfig(config);
  if (!ok) {
    throw new Error('Logger rejected config');
  }
} catch (err) {
  console.error('[Test] Failed to init logger:', err);
}

const logCount = 100;

for (let i = 0; i < logCount; i++) {
  logger.info(`Log entry number ${i}`);
}

logger.shutdown();

setTimeout(() => {
  try {
    const output = fs.readFileSync('./test.flush.log', 'utf8');
    const lines = output.trim().split('\n').filter(Boolean);

    console.log(`\n[Flush Test] Total log lines: ${lines.length}`);

    if (lines.length >= logCount) {
      console.log('Flush/shutdown test passed.');
    } else {
      console.error('Flush/shutdown test failed. Not all logs were flushed.');
    }
  } catch (err) {
    console.error('[Flush Test] Failed to read log file:', err);
  }
}, 500);
