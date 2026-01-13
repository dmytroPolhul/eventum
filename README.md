# Eventum

**High-performance, low-overhead logger for Node.js apps powered by Rust.**

`Eventum` comes from Latin eventus — that which has happened.
In distributed systems, logs are not messages — they are recorded events with consequences.
Eventum is a high-performance logger built to capture those events with minimal overhead.

---

## 🚀 Why Eventum?

- ✨ **Minimal overhead** — Rust handles all heavy lifting with almost no impact on the event loop.
- 🧵 **Threaded batching** — efficient log batching in background threads.
- 📦 **Compact** — no outdated JS dependencies.
- 📄 **Text and JSON output support**.
- 🧠 **Smart batching** — log millions of messages with ease.
- 🌈 **Colorized output** (great for CLI debugging).
- 🔁 **Log rotation**: daily, by size, with backups.
- 🧪 **NODE_ENV aware** — separate config for dev and prod.

---

## 📦 Installation

```bash
npm install eventum
# or
yarn add eventum
```

> Under the hood: compiled Rust binary with no runtime dependencies.

---

## 🛠️ Example Usage

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

## 🧪 Benchmark (1 million logs)

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

## 📘 API

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

### `LogLevel`
- `Trace = 0`, `Debug = 1`, `Info = 2`, `Warn = 3`, `Error = 4`, `Fatal = 5`

</details>

---

## 🛠 Built With

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

## 🛡 License

MIT

---

## 🧩 Roadmap

- [ ] Async file writing support
- [ ] External transport targets (sockets, Kafka, etc.)
- [ ] WebAssembly support
- [ ] File compression on rotation

---

**Made with 🦀 Rust & ❤️ for performance-first JS developers.**