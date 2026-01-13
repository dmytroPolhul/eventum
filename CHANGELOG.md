# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.0] - 2026-01-13

### Added
- Initial alpha release of the **eventum** logger
- Core logging methods: `trace()`, `debug()`, `info()`, `warn()`, `error()`, `fatal()`
- Multiple output targets: stdout, stderr, file, null
- Text and JSON output formats with optional colorization
- Log batching with configurable batch size and flush interval for high-throughput workloads
- Log rotation by file size and daily schedule with configurable backup retention
- Sensitive data masking:
  - Field name-based masking (e.g. `password`, `token`)
  - Partial value masking
  - Regex-based masking patterns (e.g. `Bearer <token>`)
- Environment-aware configuration via `NODE_ENV`
- Configurable log fields (timestamp, pid, level, message)
- Graceful shutdown via `shutdown()` to flush buffered logs
- Native Rust implementation powered by `napi-rs` for minimal event loop impact

### Performance
- Benchmarked up to **~1.8M logs/sec** (JSON → null target, local benchmarks)
- ~751K logs/sec (JSON → stdout)
- ~516K logs/sec (Text → stdout)
- Minimal memory overhead (~0.02 MB for typical workloads)
- Near-zero blocking of the Node.js event loop

### Known Limitations
- Alpha release intended for testing and early feedback
- Public API may change between alpha releases
- No prebuilt binaries yet (native module is built locally during install)
- File output uses synchronous I/O
- External transports (HTTP, Kafka, sockets) not yet implemented
- Log compression on rotation is not supported yet

### Documentation
- README with usage examples and benchmark results
- TypeScript type definitions included
- Security policy and code of conduct
- GitHub issue templates for bug reports and feature requests

[Unreleased]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.0...HEAD
[0.1.0-alpha.0]: https://github.com/dmytroPolhul/eventum/releases/tag/v0.1.0-alpha.0
