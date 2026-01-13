import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.log-levels.log';

describe('Log Levels', () => {
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

  test('should log all levels correctly', (done) => {
    logger.trace('This is a trace message');
    logger.debug('This is a debug message');
    logger.info('This is an info message');
    logger.warn('This is a warning message');
    logger.error('This is an error message');
    logger.fatal('This is a fatal message');

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      const foundLevels = levels.filter(level => 
        output.toLowerCase().includes(`"level":"${level}"`) || 
        output.includes(`"level":"${level.charAt(0).toUpperCase() + level.slice(1)}"`)
      );
      
      expect(lines.length).toBe(6);
      expect(foundLevels.length).toBe(6);
      done();
    }, 500);
  });
});
