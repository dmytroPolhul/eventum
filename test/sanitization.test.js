import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.sanitization.log';

describe('Input Sanitization', () => {
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

  test('should handle circular references without crashing', (done) => {
    const circular = { name: 'circular' };
    circular.self = circular;
    circular.nested = { parent: circular };

    expect(() => {
      logger.info(circular);
      logger.warn({ message: 'test', data: circular });
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      expect(fs.existsSync(logFile)).toBe(true);
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBeGreaterThanOrEqual(2);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
        const parsed = JSON.parse(line);
        expect(parsed.msg).toBeDefined();
      });

      // Circular references should be replaced with "[Circular]"
      expect(output).toContain('[Circular]');
      
      done();
    }, 500);
  });

  test('should handle NaN values', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    expect(() => {
      logger.info(NaN);
      logger.info({ value: NaN, name: 'test' });
      logger.info([NaN, 1, 2]);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(3);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });

      // NaN should be converted to "NaN" string
      expect(output).toContain('"NaN"');
      
      done();
    }, 500);
  });

  test('should handle Infinity and -Infinity', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    expect(() => {
      logger.info(Infinity);
      logger.info(-Infinity);
      logger.info({ positive: Infinity, negative: -Infinity });
      logger.info([Infinity, -Infinity, 42]);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(4);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });

      expect(output).toContain('"Infinity"');
      expect(output).toContain('"-Infinity"');
      
      done();
    }, 500);
  });

  test('should handle BigInt values', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    expect(() => {
      logger.info(BigInt(123456789012345678901234567890n));
      logger.info({ bigValue: 9007199254740991n });
      logger.info([1n, 2n, 3n]);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(3);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });

      // BigInt should be converted to string
      expect(output).toContain('123456789012345678901234567890');
      expect(output).toContain('9007199254740991');
      
      done();
    }, 500);
  });

  test('should handle Error objects', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    const error = new Error('Test error');
    const typeError = new TypeError('Type error message');
    const customError = new Error('Custom');
    customError.code = 'CUSTOM_ERR';
    customError.details = { foo: 'bar' };

    expect(() => {
      logger.error(error);
      logger.error(typeError);
      logger.error({ error: customError, context: 'test' });
    }).not.toThrow();

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

      // Error should include name, message, stack
      expect(output).toContain('"name":"Error"');
      expect(output).toContain('"message":"Test error"');
      expect(output).toContain('"stack"');
      expect(output).toContain('"name":"TypeError"');
      expect(output).toContain('"code":"CUSTOM_ERR"');
      
      done();
    }, 500);
  });

  test('should handle complex nested structures with multiple edge cases', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    const circular = { id: 1 };
    circular.ref = circular;

    const complex = {
      string: 'normal',
      number: 42,
      nan: NaN,
      infinity: Infinity,
      negInfinity: -Infinity,
      bigint: 123n,
      error: new Error('nested error'),
      circular: circular,
      array: [NaN, Infinity, 456n, circular],
      nested: {
        deep: {
          value: NaN,
          bigValue: 789n
        }
      },
      func: () => {},
      sym: Symbol('test'),
      date: new Date('2024-01-01'),
      regex: /test/gi
    };

    expect(() => {
      logger.info(complex);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(1);
      
      const parsed = JSON.parse(lines[0]);
      expect(parsed.msg).toBeDefined();
      
      // Verify all edge cases are handled
      expect(output).toContain('"nan":"NaN"');
      expect(output).toContain('"infinity":"Infinity"');
      expect(output).toContain('"negInfinity":"-Infinity"');
      expect(output).toContain('"bigint":"123"');
      expect(output).toContain('[Circular]');
      expect(output).toContain('"func":"[Function]"');
      expect(output).toContain('Symbol(test)');
      expect(output).toContain('2024-01-01');
      expect(output).toContain('/test/gi');
      
      done();
    }, 500);
  });

  test('should handle primitives without modification', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    expect(() => {
      logger.info('simple string');
      logger.info(123);
      logger.info(true);
      logger.info(false);
      logger.info(null);
      logger.info(undefined);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      // Should have 6 lines (undefined might be included or not depending on serialization)
      expect(lines.length).toBeGreaterThanOrEqual(5);
      
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
      
      done();
    }, 500);
  });

  test('should never crash the process with any combination of bad inputs', (done) => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }

    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile
        }
      }
    };
    logger.setConfig(config);

    // Create the most pathological case possible
    const evil = { a: NaN };
    evil.b = evil;
    evil.c = [evil, NaN, Infinity, -Infinity, 123n];
    evil.d = new Error('evil error');
    evil.d.circular = evil;

    expect(() => {
      logger.trace(evil);
      logger.debug(evil);
      logger.info(evil);
      logger.warn(evil);
      logger.error(evil);
      logger.fatal(evil);
    }).not.toThrow();

    logger.shutdown();

    setTimeout(() => {
      expect(fs.existsSync(logFile)).toBe(true);
      const output = fs.readFileSync(logFile, 'utf8');
      const lines = output.trim().split('\n').filter(Boolean);
      
      expect(lines.length).toBe(6);
      
      // All lines should be valid JSON
      lines.forEach((line) => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
      
      done();
    }, 500);
  });
});
