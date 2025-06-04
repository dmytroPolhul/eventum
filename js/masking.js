import * as logger from '../index.js';
import fs from 'fs';

const config = {
  prod: {
    output: {
      color: false,
      format: 1,
      target: 2,
      filePath: './test.masking.log',
      masking: {
        exact: ['password', 'token'],
        regex: ['(?i)bearer\\s+[a-z0-9\\._\\-]+'],
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
}

logger.setConfig(config);

logger.info({
  username: 'admin',
  password: 'supersecret',
  token: 'Bearer abc.def.ghi',
  nested: {
    token: 'Bearer xyz.123'
  }
});

setTimeout(() => {
  const output = fs.readFileSync('./test.masking.log', 'utf8');
  console.log('\nMasked Output:\n', output);

  const hasPassword = output.includes('supersecret');
  const hasToken = output.includes('Bearer abc');
  const hasMasked = output.includes(config.prod.output.masking.keyword ?? "[MASKED]");

  if (!hasPassword && !hasToken && hasMasked) {
    console.log('✅ Masking test passed.');
  } else {
    console.error('❌ Masking test failed.');
    if (hasPassword) console.error('→ Password was not masked.');
    if (hasToken) console.error('→ Token was not masked.');
    if (!hasMasked) console.error('→ No masked fields found.');
  }
}, 500);
