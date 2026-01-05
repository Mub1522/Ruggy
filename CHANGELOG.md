# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-04

### Added
- Initial release of Ruggy embedded database
- Basic CRUD operations (insert, findAll, find)
- Connection pooling with `RuggyPool`
- YAML configuration support via `ruggy.yaml`
- Configuration loader with automatic file discovery
- `Database.fromConfig()` and `Pool.fromConfig()` factory methods
- Full TypeScript type definitions
- Comprehensive README with examples
- Support for Node.js 14+
- Windows x64 pre-built binaries

### Features
- Native Rust backend with FFI bindings
- Embedded database (no external server required)
- Simple and intuitive API
- Persistent storage with append-only files
- Flexible YAML configuration
- TypeScript support with complete definitions

### Platform Support
- Windows x64 - Pre-built binaries included
- Linux - Not supported at this time
- macOS - Not supported at this time

### Known Limitations
- Single-platform binary distribution (Windows only)
- No query operators (only exact match)
- No indexes (linear scan)
- No transactions
- No schema validation

### Dependencies
- koffi ^2.8.0 - FFI bindings
- js-yaml ^4.1.0 - YAML configuration parsing

---

## [Unreleased]

### Planned for 0.2.0
- Linux and macOS pre-built binaries
- Configurable limits (maxCollectionSize, maxDocumentSize)
- Logging configuration
- Performance tuning options

### Future Enhancements
- Backup automation
- Compression support
- Query operators (range, comparison)
- Basic indexing
- Encryption at rest

---

[0.1.0]: https://github.com/yourusername/ruggy/releases/tag/v0.1.0
