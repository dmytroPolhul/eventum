import * as logger from '../index.js';
import fs from 'fs';

const logFile = './test.masking.log';

describe('Sensitive Data Masking', () => {
  beforeAll(() => {
    const config = {
      prod: {
        output: {
          color: false,
          format: 1,
          target: 2,
          filePath: logFile,
          masking: {
            exact: ['password', 'apiKey'],
            partial: ['Email', 'Card'],  // Case-sensitive: matches userEmail, creditCard
            regex: ['(?i)bearer\\s+[a-z0-9\\._\\-]+', 'secret_.*'],
            keyword: '***'
          }
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

  test('should mask exact field names', (done) => {
    logger.info({
      username: 'admin',
      password: 'supersecret123',
      apiKey: 'sk_live_abc123xyz'
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // Exact matches should be completely masked to ***
      expect(output).not.toContain('supersecret123');
      expect(output).not.toContain('sk_live_abc123xyz');
      expect(output).toContain('***');
      expect(output).toContain('admin'); // username should not be masked
      done();
    }, 500);
  });

  test('should mask partial field name matches (case-sensitive)', (done) => {
    logger.info({
      userEmail: 'user@example.com',         // Contains 'Email'
      contactEmail: 'contact@example.com',   // Contains 'Email'
      creditCard: '4532-1234-5678-9010',     // Contains 'Card'
      giftCard: 'GIFT-5678-9012',            // Contains 'Card'
      phoneNumber: '+1234567890'             // Does NOT contain 'Email' or 'Card'
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // Partial matches should be completely masked to ***
      expect(output).not.toContain('user@example.com');
      expect(output).not.toContain('contact@example.com');
      expect(output).not.toContain('4532-1234-5678-9010');
      expect(output).not.toContain('GIFT-5678-9012');
      
      // Non-matching fields should not be masked
      expect(output).toContain('+1234567890');
      done();
    }, 500);
  });

  test('should mask regex pattern matches', (done) => {
    logger.info({
      token: 'Bearer abc.def.ghi',
      secret_key: 'my_secret_value',
      secret_token: 'another_secret',
      publicKey: 'public_value' // should not be masked
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // Regex patterns should be completely masked to ***
      expect(output).not.toContain('Bearer abc');
      expect(output).not.toContain('my_secret_value');
      expect(output).not.toContain('another_secret');
      
      // Non-matching patterns should not be masked
      expect(output).toContain('public_value');
      done();
    }, 500);
  });

  test('should mask nested objects', (done) => {
    logger.info({
      user: {
        username: 'alice',
        password: 'nested_secret',
        settings: {
          userEmail: 'alice@example.com',
          apiKey: 'nested_api_key'
        }
      }
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // Nested values should be completely masked to ***
      expect(output).not.toContain('nested_secret');
      expect(output).not.toContain('alice@example.com');
      expect(output).not.toContain('nested_api_key');
      
      // Non-sensitive nested values should not be masked
      expect(output).toContain('alice');
      done();
    }, 500);
  });

  test('should use custom keyword for masking', (done) => {
    logger.info({
      password: 'test123',
      userEmail: 'test@test.com'
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // Should use the custom keyword '***' and completely replace values
      expect(output).toContain('***');
      expect(output).not.toContain('[MASKED]'); // default keyword should not appear
      done();
    }, 500);
  });

  test('should handle all masking types in single log entry', (done) => {
    logger.info({
      // Exact match - completely masked
      password: 'exact_password',
      apiKey: 'exact_api_key',
      
      // Partial match (case-sensitive) - completely masked
      userEmail: 'partial@example.com',
      creditCard: '1234-5678',
      
      // Regex match - completely masked
      token: 'Bearer token.here',
      secret_data: 'regex_secret',
      
      // Not masked
      username: 'john_doe',
      publicInfo: 'visible_data'
    });

    setTimeout(() => {
      const output = fs.readFileSync(logFile, 'utf8');
      
      // All sensitive data should be completely masked to ***
      expect(output).not.toContain('exact_password');
      expect(output).not.toContain('exact_api_key');
      expect(output).not.toContain('partial@example.com');
      expect(output).not.toContain('1234-5678');
      expect(output).not.toContain('Bearer token');
      expect(output).not.toContain('regex_secret');
      
      // Non-sensitive data should be visible
      expect(output).toContain('john_doe');
      expect(output).toContain('visible_data');
      
      // Masked keyword should appear multiple times (6 masked fields)
      const maskCount = (output.match(/\*\*\*/g) || []).length;
      expect(maskCount).toBeGreaterThanOrEqual(6);
      done();
    }, 500);
  });
});
