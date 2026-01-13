import * as logger from '../index.js';
import fs from 'fs';

const jsonFile = './test.output-json.log';
const textFile = './test.output-text.log';

describe('Output Formats', () => {
  afterAll(() => {
    try {
      if (fs.existsSync(jsonFile)) fs.unlinkSync(jsonFile);
      if (fs.existsSync(textFile)) fs.unlinkSync(textFile);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('should output valid JSON format', (done) => {
    const jsonConfig = {
      prod: {
        output: {
          color: false,
          format: 1, // JSON
          target: 2, // File
          filePath: jsonFile
        }
      }
    };

    logger.setConfig(jsonConfig);
    logger.info('JSON format test');
    logger.shutdown();

    setTimeout(() => {
      const jsonOutput = fs.readFileSync(jsonFile, 'utf8');
      const jsonLines = jsonOutput.trim().split('\n');
      
      expect(() => JSON.parse(jsonLines[0])).not.toThrow();
      done();
    }, 500);
  });

  test('should output plain text format', (done) => {
    const textConfig = {
      prod: {
        output: {
          color: false,
          format: 0, // Text
          target: 2, // File
          filePath: textFile
        }
      }
    };

    logger.setConfig(textConfig);
    logger.info('Text format test');
    logger.shutdown();

    setTimeout(() => {
      const textOutput = fs.readFileSync(textFile, 'utf8');
      
      expect(() => JSON.parse(textOutput.trim())).toThrow();
      expect(textOutput).toContain('Text format test');
      done();
    }, 500);
  });
});
