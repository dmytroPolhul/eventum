import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.object-logging.log';

describe('Object Logging', () => {
  beforeAll(() => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile
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

  test('should log objects with various data types', (done) => {
    logger.info({ message: 'Simple object', value: 42 });
    logger.info({ 
      nested: { 
        deep: { 
          value: 'nested value',
          array: [1, 2, 3]
        }
      }
    });
    logger.info({ 
      string: 'text',
      number: 123,
      boolean: true,
      null: null,
      array: ['a', 'b', 'c']
    });

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(3);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
        const parsed = JSON.parse(line);
        expect(parsed.msg).toBeDefined();
      });

      const fullOutput = lines.join('\n');
      expect(fullOutput).toContain('"value":42');
      expect(fullOutput).toContain('"nested":{');
      expect(fullOutput).toContain('"array":[1,2,3]');
      expect(fullOutput).toContain('"boolean":true');
      
      done();
    }, 500);
  });
});
