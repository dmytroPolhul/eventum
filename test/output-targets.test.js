import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.output-targets.log';

describe('Output Targets', () => {
  afterAll(() => {
    try {
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('should write to file target', (done) => {
    const fileConfig = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile
        }
      }
    };

    logger.setConfig(fileConfig);
    logger.info('File target test');
    logger.shutdown();

    setTimeout(() => {
      expect(fs.existsSync(logFile)).toBe(true);
      const fileOutput = fs.readFileSync(logFile, 'utf8');
      expect(fileOutput).toContain('File target test');
      done();
    }, 500);
  });

  test('should handle null target', () => {
    const nullConfig = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 3 // Null
        }
      }
    };

    expect(() => {
      logger.setConfig(nullConfig);
      logger.info('Null target test');
      logger.shutdown();
    }).not.toThrow();
  });

  test('should handle stdout target', () => {
    const stdoutConfig = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 0 // Stdout
        }
      }
    };

    expect(() => {
      logger.setConfig(stdoutConfig);
      logger.info('Stdout target test');
      logger.shutdown();
    }).not.toThrow();
  });
});
