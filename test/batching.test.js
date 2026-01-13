import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.batching.log';

describe('Batching', () => {
  beforeAll(() => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile,
          batchEnabled: true,
          batchSize: 50,
          batchIntervalMs: 100
        }
      }
    };

    const ok = logger.setConfig(config);
    if (!ok) {
      throw new Error('Logger rejected config');
    }
  });

  afterAll(() => {
    try {
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('should handle high-throughput batching', (done) => {
    const logCount = 200;
    const startTime = Date.now();

    for (let i = 0; i < logCount; i++) {
      logger.info(`Batch log entry ${i}`);
    }

    const generationTime = Date.now() - startTime;

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(logCount);
      expect(generationTime).toBeLessThan(1000);
      done();
    }, 1000);
  });
});
