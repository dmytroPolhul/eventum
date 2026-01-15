import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.batching-lifecycle.log';

describe('Batching Lifecycle', () => {
  afterEach(() => {
    try {
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('should restart batching after shutdown', (done) => {
    // Phase 1: Enable batching and log
    const config1 = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: logFile,
          batchEnabled: true,
          batchSize: 10,
          batchIntervalMs: 100
        }
      }
    };

    let ok = logger.setConfig(config1);
    expect(ok).toBeTruthy();

    // Log some messages
    for (let i = 0; i < 5; i++) {
      logger.info(`Phase 1 - Message ${i}`);
    }

    // Shutdown
    logger.shutdown();

    setTimeout(() => {
      // Verify first batch was written
      expect(fs.existsSync(logFile)).toBe(true);
      const output1 = fs.readFileSync(logFile, 'utf8');
      const lines1 = output1.trim().split('\n').filter(Boolean);
      expect(lines1.length).toBe(5);

      // Phase 2: Re-enable batching
      const config2 = {
        prod: {
          output: {
            color: false,
            format: 1,
            target: 2,
            filePath: logFile,
            batchEnabled: true,
            batchSize: 10,
            batchIntervalMs: 100
          }
        }
      };

      ok = logger.setConfig(config2);
      expect(ok).toBeTruthy();

      // Log more messages after restart
      for (let i = 0; i < 5; i++) {
        logger.info(`Phase 2 - Message ${i}`);
      }

      // Shutdown again
      logger.shutdown();

      setTimeout(() => {
        // Verify all messages were written
        const output2 = fs.readFileSync(logFile, 'utf8');
        const lines2 = output2.trim().split('\n').filter(Boolean);
        
        expect(lines2.length).toBe(10);
        
        // Verify both phases are present
        const fullOutput = lines2.join('\n');
        expect(fullOutput).toContain('Phase 1 - Message');
        expect(fullOutput).toContain('Phase 2 - Message');

        done();
      }, 500);
    }, 500);
  });

  test('shutdown should be idempotent', (done) => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile,
          batchEnabled: true,
          batchSize: 10,
          batchIntervalMs: 100
        }
      }
    };

    logger.setConfig(config);
    logger.info('Test message');

    expect(() => {
      logger.shutdown();
      logger.shutdown();
      logger.shutdown();
    }).not.toThrow();

    setTimeout(() => {
      expect(fs.existsSync(logFile)).toBe(true);
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      expect(lines.length).toBe(1);
      done();
    }, 500);
  });

  test('should handle multiple restart cycles', (done) => {
    const cycles = 3;
    let currentCycle = 0;

    const runCycle = () => {
      if (currentCycle >= cycles) {
        const output = fs.readFileSync(logFile, 'utf8');
        const lines = output.trim().split('\n').filter(Boolean);
        
        expect(lines.length).toBe(cycles * 5);
        
        for (let i = 0; i < cycles; i++) {
          expect(output).toContain(`Cycle ${i}`);
        }
        
        done();
        return;
      }

      const config = {
        prod: {
          output: {
            color: false,
            format: 1,
            target: 2,
            filePath: logFile,
            batchEnabled: true,
            batchSize: 10,
            batchIntervalMs: 50
          }
        }
      };

      logger.setConfig(config);

      for (let i = 0; i < 5; i++) {
        logger.info(`Cycle ${currentCycle} - Message ${i}`);
      }

      logger.shutdown();

      currentCycle++;
      
      setTimeout(runCycle, 300);
    };

    runCycle();
  }, 10000);

  test('should work without batching after batched shutdown', (done) => {
    // Phase 1: Use batching
    const batchConfig = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile,
          batchEnabled: true,
          batchSize: 5,
          batchIntervalMs: 100
        }
      }
    };

    logger.setConfig(batchConfig);
    logger.info('Batched message 1');
    logger.info('Batched message 2');
    logger.shutdown();

    setTimeout(() => {
      // Phase 2: Use non-batching mode
      const noBatchConfig = {
        prod: {
          output: {
            color: false,
            format: 1,
            target: 2,
            filePath: logFile,
            batchEnabled: false
          }
        }
      };

      logger.setConfig(noBatchConfig);
      logger.info('Non-batched message 1');
      logger.info('Non-batched message 2');
      logger.shutdown();

      setTimeout(() => {
        const output = fs.readFileSync(logFile, 'utf8');
        const lines = output.trim().split('\n').filter(Boolean);
        
        expect(lines.length).toBe(4);
        expect(output).toContain('Batched message');
        expect(output).toContain('Non-batched message');
        
        done();
      }, 300);
    }, 300);
  });

  test('should switch from non-batching to batching mode', (done) => {
    // Phase 1: Non-batching
    const noBatchConfig = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile,
          batchEnabled: false
        }
      }
    };

    logger.setConfig(noBatchConfig);
    logger.info('Direct message 1');
    logger.info('Direct message 2');
    logger.shutdown();

    setTimeout(() => {
      // Phase 2: Enable batching
      const batchConfig = {
        prod: {
          output: {
            color: false,
            format: 1,
            target: 2,
            filePath: logFile,
            batchEnabled: true,
            batchSize: 5,
            batchIntervalMs: 100
          }
        }
      };

      logger.setConfig(batchConfig);
      logger.info('Batched message 1');
      logger.info('Batched message 2');
      logger.shutdown();

      setTimeout(() => {
        const output = fs.readFileSync(logFile, 'utf8');
        const lines = output.trim().split('\n').filter(Boolean);
        
        expect(lines.length).toBe(4);
        expect(output).toContain('Direct message');
        expect(output).toContain('Batched message');
        
        done();
      }, 300);
    }, 300);
  });
});
