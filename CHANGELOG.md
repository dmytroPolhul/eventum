# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.7] - 2026-02-26

### Fixed
- Fixed `ERR_MODULE_NOT_FOUND` when importing the library by adding the missing `"main": "eventum.node"` property to the dynamically generated `package.json` for platform-specific packages.
- Security: Bumped `rollup` dependency to fix a high-severity path traversal vulnerability via `npm audit fix`.

## [0.1.0-alpha.6] - 2026-02-26

### Added
- Automated fallback to source build for Windows (`win32`) via `postinstall` script
- Added `Cargo.toml`, `Cargo.lock`, `build.rs`, and `src/` to published npm files to support building from source

### Changed
- Documentation: Updated README to clarify Windows installation limitations and roadmap

## [0.1.0-alpha.3] - 2026-02-09

### Fixed
- Platform packages metadata and documentation
  - Added README and license to platform-specific packages
  - Improved npm packaging to avoid empty carrier packages
- Release pipeline reliability for multi-platform binaries

## [0.1.0-alpha.2] - 2026-02-09

### Added
- Multi-platform binary distribution - No longer requires Rust toolchain for installation
  - Separate platform-specific packages for 8 platforms
  - Automatic platform detection and binary loading
  - Users only download binaries for their platform
- Platform package support:
  - `eventum-darwin-x64` (macOS Intel)
  - `eventum-darwin-arm64` (macOS Apple Silicon)
  - `eventum-win32-x64` (Windows x64)
  - `eventum-win32-arm64` (Windows ARM)
  - `eventum-linux-x64-gnu` (Linux x64 with glibc - Ubuntu, Debian, etc.)
  - `eventum-linux-arm64-gnu` (Linux ARM with glibc)
  - `eventum-linux-x64-musl` (Linux x64 with musl - Alpine, etc.)
  - `eventum-linux-arm64-musl` (Linux ARM with musl)
- Platform detection tests to verify correct binary selection
- Improved musl vs glibc detection on Linux systems

### Changed
- Binary loading now tries platform-specific package first, falls back to local build for development
- Removed bundled binaries from main package (now distributed via platform packages)
- Updated release workflow to build and publish platform-specific packages

### Fixed
- Platform detection for Alpine Linux (musl) vs standard Linux (glibc)

### Performance
- Faster npm install times due to smaller package sizes


## [0.1.0-alpha.1] - 2026-02-07

### Added
- Automated CI prebuilds for macOS (x64/arm64), Windows (x64/arm64), and Linux (glibc/musl)
- Trusted Publishing via GitHub Actions (OIDC) for secure npm releases
- Cross-platform native binaries distribution for faster installs (no local Rust toolchain required)
- Initial release workflow with reproducible builds

### Changed
- Release process standardized: versioning via PRs to `main` + tag-based publishing
- CI pipeline split into test, coverage, and prebuild stages
- Build tooling hardened for musl (Alpine) targets using Zig

### Fixed
- CI stability issues across multi-arch targets
- Inconsistent build outputs between platforms
- Minor packaging issues in npm artifacts layout

### Documentation
- Release process documented (versioning, tagging, CI/CD)
- Clarified installation behavior with prebuilt binaries vs local builds

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

[Unreleased]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.7...HEAD
[0.1.0-alpha.7]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.6...v0.1.0-alpha.7
[0.1.0-alpha.6]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.3]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/dmytroPolhul/eventum/compare/v0.1.0-alpha.0...v0.1.0-alpha.1
[0.1.0-alpha.0]: https://github.com/dmytroPolhul/eventum/releases/tag/v0.1.0-alpha.0
