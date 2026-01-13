import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.flush.log';

describe('Flush and Shutdown', () => {
  beforeAll(() => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile,
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

  test('should flush all logs on shutdown', (done) => {
    const logCount = 100;

    for (let i = 0; i < logCount; i++) {
      logger.info(`Log entry number ${i}`);
    }

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);

      expect(lines.length).toBeGreaterThanOrEqual(logCount);
      done();
    }, 500);
  });
});
