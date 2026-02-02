# Contributing to Eventum


Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

## Rules

There are a few basic ground-rules for contributors:

1. **No `--force` pushes** on `main` or modifying the Git history in any way after a PR has been merged.
2. **Non-main branches** ought to be used for ongoing work.
3. **Non-trivial changes** ought to be subject to a **pull-request** to solicit feedback from other contributors.
4. Contributors should attempt to adhere to the prevailing code-style.
5. Run `cargo fmt` and `cargo clippy` before committing Rust code.
6. Add tests for new features.

## Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/eventum.git
cd eventum

# Install and build
npm install
npm run build

# Run tests
npm test
```

## Development

- **Rust code**: `src/` directory
- **Build**: `cargo build --release` or `npm run build`
- **Format**: `cargo fmt`
- **Lint**: `cargo clippy`
- **Tests**: Add tests in `test/` directory

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug.yaml) and include:
- eventum version
- Node.js version
- Operating system
- Steps to reproduce

## Security Issues

**Do not create public issues for security vulnerabilities.** Report privately via Discord: https://discord.gg/XW7whPJr

See [Security Policy](.github/SECURITY.md) for details.

## Releases

Declaring formal releases remains the prerogative of the project maintainer.

## Changes to this arrangement

This is an experiment and feedback is welcome! This document may also be subject to pull-requests or changes by contributors where you believe you have something valuable to add or change.
