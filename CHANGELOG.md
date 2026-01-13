# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.0] - 2026-01-13

### Added
- Initial alpha release of eventum logger
- Core logging functions: `trace()`, `debug()`, `info()`, `warn()`, `error()`, `fatal()`
- Multiple output targets: stdout, stderr, file, null
- Output formats: Text and JSON with colorization support
- Log batching with configurable size and interval for high-throughput scenarios
- Log rotation by file size and daily schedule with backup retention
- **Sensitive data masking** - protect secrets, tokens, and PII:
  - Exact field name matching (e.g., `password`, `token`)
  - Partial field value masking
  - Regex-based pattern matching (e.g., `Bearer [token]`)
- Environment-aware configuration (dev/prod) via `NODE_ENV`
- Configurable log fields (time, pid, msg, level)
- Graceful shutdown with `shutdown()` to flush pending logs
- Rust-powered native performance with minimal event loop impact

### Performance
- Benchmarked at **1.8M+ logs/sec** (JSON to Null target)
- **751K logs/sec** (JSON to Stdout)
- **516K logs/sec** (Text to Stdout)
- Minimal memory overhead (~0.02 MB for most operations)
- Near-zero CPU blocking on Node.js event loop

### Known Limitations
- Alpha release for testing and feedback
- Single platform binaries (requires local build for other platforms)
- Async file writing not yet implemented (file I/O happens synchronously)
- External transport targets (HTTP, Kafka, sockets) planned for future releases
- No log compression on rotation yet

### Documentation
- Comprehensive README with usage examples and benchmarks
- TypeScript definitions included
- Security policy and code of conduct
- Issue templates for bugs and feature requests

[Unreleased]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.0...HEAD
[0.1.0-alpha.0]: https://github.com/dmytroPolhul/eventum/releases/tag/v0.1.0-alpha.0
