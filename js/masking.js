import * as logger from '../index.js';
import fs from 'fs';

logger.setConfig({
  prod: {
    output: {
      color: false,
      format: 1,
      target: 2,
      filePath: './test.masking.log',
      masking: {
        fields: ['password', 'token'],
        patterns: ['(?i)bearer\\s+[a-z0-9\\._\\-]+']
      }
    },
    fields: {
      time: true,
      pid: true,
      msg: true,
      level: true
    }
  }
});

logger.info({
  username: 'admin',
  password: 'supersecret',
  token: 'Bearer abc.def.ghi',
  nested: {
    token: 'Bearer xyz.123'
  }
});

// Зачекаймо трохи на логування
setTimeout(() => {
  const output = fs.readFileSync('./test.masking.log', 'utf8');
  console.log('\nMasked Output:\n', output);

  const hasPassword = output.includes('supersecret');
  const hasToken = output.includes('Bearer abc');
  const hasMasked = output.includes('***');

  if (!hasPassword && !hasToken && hasMasked) {
    console.log('✅ Masking test passed.');
  } else {
    console.error('❌ Masking test failed.');
    if (hasPassword) console.error('→ Password was not masked.');
    if (hasToken) console.error('→ Token was not masked.');
    if (!hasMasked) console.error('→ No masked fields found.');
  }
}, 500);
