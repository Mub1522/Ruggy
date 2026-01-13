# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-12

### Added
- Advanced search with query operators (`LIKE`, `starts_with`, `ends_with`, `contains`)
- `RuggyCollection.findWithOperator()` method for advanced queries
- `RuggyCollection.updateField(id, field, value)` method for editing specific document fields
- `RuggyCollection.delete(id)` method for removing documents by ID
- Updated TypeScript definitions for all new methods

### Changed
- **Refactored Rust backend architecture** (`db`, `collection`, `ffi` modules) for better maintainability.
- Improved `persist()` logic to handle file truncation reliably on Windows.
- Switched FFI return types to `i32` for better cross-platform consistency.

### Fixed
- Fixed "Access Denied" errors when updating/deleting files on Windows.
- Fixed inconsistent boolean return values across the FFI boundary.

### Platform Support
- Windows x64 - Pre-built binaries included
- Linux - Not supported at this time
- macOS - Not supported at this time

### Known Limitations
- Single-platform binary distribution (Windows only)
- No indexes (linear scan)
- No transactions
- No schema validation

---

## [0.1.0] - 2026-01-04

### Added
- Initial release of Ruggy embedded database
- Basic CRUD operations (insert, findAll, find)
- Connection pooling with `RuggyPool`
- YAML configuration support via `ruggy.yaml`
- Configuration loader with automatic file discovery
- `Database.fromConfig()` and `Pool.fromConfig()` factory methods
- Full TypeScript type definitions
- Support for Node.js 14+
- Windows x64 pre-built binaries

### Features
- Native Rust backend with FFI bindings
- Embedded database (no external server required)
- Persistent storage with append-only files
- Flexible YAML configuration

---

## [Unreleased]

### Planned
- Linux and macOS pre-built binaries
- Configurable limits (maxCollectionSize, maxDocumentSize)
- Logging configuration
- Performance tuning options

### Future Enhancements
- Basic indexing (B-Tree/Hash)
- Write-Ahead Logging (WAL) for faster updates
- $AND / $OR logical operators
- Compression support
- Encryption at rest

---

[0.2.0]: https://github.com/Mub1522/ruggy/releases/tag/v0.2.0
[0.1.0]: https://github.com/Mub1522/ruggy/releases/tag/v0.1.0
