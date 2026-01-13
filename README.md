# Eventum

> ⚠️ Eventum is currently in **alpha**.  
> APIs may change, and platform support is still evolving.  
> Prebuilt binaries are currently limited.  
> If you encounter build issues, please open an issue.


**High-performance, low-overhead logger for Node.js apps powered by Rust.**

`Eventum` comes from the Latin *eventus* — “that which has happened”.
In distributed systems, logs are not messages — they are recorded events with consequences.
Eventum is a high-performance logger built to capture those events with minimal overhead.

---

## Why Eventum?

- **Minimal overhead** — Rust handles all heavy lifting with almost no impact on the event loop.
- **Threaded batching** — efficient log batching in background threads.
- **Compact** — no outdated JS dependencies.
- **Text and JSON output formats**.
- **Smart batching** — log millions of messages with ease.
- **Colorized output** (great for CLI debugging).
- **Log rotation**: daily, by size, with backups.
- **Sensitive data masking** — protect passwords, tokens, and PII.
- **NODE_ENV aware** — separate config for dev and prod.

---

## Installation

```bash
npm install eventum
# or
yarn add eventum
```

> Under the hood: compiled Rust binary with no runtime dependencies.

---

## Example Usage

```ts
import * as logger from 'eventum';

logger.setConfig({
  prod: {
    output: {
      color: true,
      format: 0, // OutputFormat.Text
      target: 1, // OutputTarget.Stderr
      filePath: './test.log'
    },
    fields: {
      time: true,
      pid: true,
      msg: true,
      level: true
    }
  }
});

logger.debug({ id: '123', msg: 'Started' });
logger.warn('This is a warning');
```

---

## Benchmark (1 million logs)
> Benchmarks were executed locally on a development machine.
> Results may vary depending on hardware and environment.


| Format | Target  | CPU ms   | Elapsed ms | CPU %   | Memory MB | Logs/sec  |
|--------|---------|----------|------------|---------|-----------|-----------|
| Text   | Stdout  | 3842.29  | 3871       | 99.26%  | 43.20     | 516,662   |
| Text   | Stderr  | 4314.89  | 4330       | 99.65%  | 0.02      | 461,893   |
| Text   | File    | 64694.64 | 64788      | 99.86%  | 0.31      | 30,869    |
| Text   | Null    | 1488.89  | 1489       | 99.99%  | -0.02     | 1,343,183 |
| JSON   | Stdout  | 2656.76  | 2660       | 99.88%  | 0.02      | 751,879   |
| JSON   | Stderr  | 3702.20  | 3709       | 99.82%  | 0.00      | 539,228   |
| JSON   | File    | 62866.59 | 62946      | 99.87%  | -0.02     | 31,773    |
| JSON   | Null    | 1108.02  | 1109       | 99.91%  | -0.03     | 1,803,426 |

> ⚠️ Note: Even with file writing, the logger maintains extremely low overhead.

---

## Sensitive Data Masking

Protect sensitive information in your logs with built-in masking:

```ts
import * as logger from 'eventum';

logger.setConfig({
  prod: {
    output: {
      format: 0, // OutputFormat.Text
      target: 1, // OutputTarget.Stderr
      filePath: './app.log',
      masking: {
        keyword: '***',                              // Replacement text
        exact: ['password', 'token', 'apiKey'],      // Mask these field names
        partial: ['email', 'creditCard'],            // Matches substrings in field names
        regex: ['(?i)bearer\\s+[a-z0-9\\._\\-]+']   // Regex patterns
      }
    }
  }
});

// Sensitive data will be automatically masked
logger.info({
  username: 'alice',
  password: 'secret123',           // Will be masked
  token: 'Bearer abc.def.ghi',     // Will be masked
  email: 'alice@example.com'       // Will be partially masked
});

// Output: { username: 'alice', password: '***', token: '***', email: '***' }
```

### Masking Options

- **`exact`** — masks values of fields with an exact name match  
  (e.g. `password`, `token`)
- **`partial`** — masks values of fields whose names *contain* any of the given substrings  
  (e.g. `user_email`, `billingEmail`, `creditCardNumber`)
- **`regex`** — masks values matched by custom regex patterns
- **`keyword`** — replacement string (default: `[MASKED]`)

---

<details>
<summary>Types & Enums</summary>

### `LoggerConfig`
```ts
interface LoggerConfig {
  dev?: EnvConfig;
  prod?: EnvConfig;
}
```

### `EnvConfig`
```ts
interface EnvConfig {
  output: OutputConfig;
  fields?: FieldsConfig;
}
```

### `OutputConfig`
- `color: boolean`
- `format: OutputFormat` (Text = 0, Json = 1)
- `target: OutputTarget` (Stdout = 0, Stderr = 1, File = 2, Null = 3)
- `filePath?: string`
- `maxFileSize?: number`
- `maxBackups?: number`
- `rotateDaily?: boolean`
- `batchEnabled?: boolean`
- `batchSize?: number`
- `batchIntervalMs?: number`
- `masking?: MaskingConfig`

### `MaskingConfig`
- `keyword?: string` - Replacement text (default: `[MASKED]`)
- `exact?: string[]` - Field names to mask completely
- `partial?: string[]` - Field names to mask partially
- `regex?: string[]` - Regex patterns to match and mask

### `LogLevel`
- `Trace = 0`, `Debug = 1`, `Info = 2`, `Warn = 3`, `Error = 4`, `Fatal = 5`

</details>

---

## Built With

```toml
[dependencies]
napi = { version = "2", features = ["napi6", "serde-json"] }
napi-derive = "2"
once_cell = "1.18"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
colored = "3.0.0"
chrono = { version = "0.4", features = ["serde"] }
```

---

## License

MIT

---

## Roadmap

- [ ] Async file writing support
- [ ] External transport targets (sockets, Kafka, etc.)
- [ ] WebAssembly support
- [ ] File compression on rotation

---

## Reliability Notes

Eventum does not guarantee delivery of in-memory batched logs on process crash.
Call `shutdown()` on graceful exit to flush buffered logs (may block briefly).

---

**Made with 🦀 Rust & ❤️ for performance-first JS developers.**