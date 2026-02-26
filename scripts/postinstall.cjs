const { platform } = require('os')
const { execSync } = require('child_process')

if (platform() === 'win32') {
    console.log('[eventum] Building native module from source for Windows...')
    execSync('npx --yes @napi-rs/cli build --release', { stdio: 'inherit' })
}
