import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.fields-config.log';

describe('Fields Configuration', () => {
  beforeAll(() => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile
        },
        fields: {
          time: false,
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

  test('should respect field configuration', (done) => {
    logger.info('Testing field configuration');
    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const parsed = JSON.parse(output.trim());
      
      expect(parsed.time).toBeUndefined();
      expect(parsed.pid).toBeUndefined();
      expect(parsed.msg).toBeDefined();
      expect(parsed.level).toBeDefined();
      done();
    }, 500);
  });
});
