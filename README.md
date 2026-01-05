<div align="center">
  <img src="https://raw.githubusercontent.com/Mub1522/ruggy/main/assets/icon.jpeg" alt="Ruggy Logo" width="200"/>
</div>

<h1 style="text-align: center;">Ruggy</h1>

<p style="text-align: center;">A simple, fast embedded database for Node.js backed by Rust.</p>

## Features

- **Fast** - Native Rust backend with FFI bindings
- **Embedded** - No separate database server required
- **Simple** - Clean, intuitive API
- **Persistent** - Data stored in append-only files
- **Type-Safe** - Full TypeScript support
- **Configurable** - YAML configuration for flexible deployment

## Installation

```bash
npm install ruggy
```

## Quick Start

```javascript
const { RuggyDatabase } = require('ruggy');

// Create/open database
const db = new RuggyDatabase('./data');

// Get a collection
const users = db.collection('users');

// Insert documents
const id = users.insert({ name: 'Alice', email: 'alice@example.com' });

// Find all documents
const allUsers = users.findAll();

// Find by field
const results = users.find('email', 'alice@example.com');

// Close when done
db.close();
```

## Platform Support

| Platform | Status | Pre-built Binaries |
|----------|--------|-------------------|
| **Windows x64** | ✅ Fully Supported | ✅ Included |
| **Linux x64** | Not supported | Not included |
| **macOS (Intel)** | Not supported | Not included |
| **macOS (ARM)** | Not supported | Not included |

> **Note:** Version 0.1.0 includes pre-built binaries for Windows only. Linux and macOS users will need Rust installed to build from source. Multi-platform binaries are planned for v0.2.0.

## Configuration

Create a `ruggy.yaml` file in your project root to configure the database path:

```yaml
dataPath: ./my-database
# or use absolute path
# dataPath: /var/data/ruggy
```

Then use the configuration-based factory:

```javascript
const { RuggyDatabase } = require('ruggy');

// Automatically uses path from ruggy.yaml
const db = RuggyDatabase.fromConfig();
```

If no `ruggy.yaml` is found, Ruggy defaults to `./data`.

## API Reference

### RuggyDatabase

#### Constructor

```javascript
new RuggyDatabase(path: string)
```

Creates a new database at the specified path.

#### Static Methods

**`RuggyDatabase.fromConfig(options?)`**

Creates a database instance using `ruggy.yaml` configuration.

- **options.reload** `boolean` - Force reload configuration (bypass cache)
- **options.searchFrom** `string` - Directory to start searching for `ruggy.yaml`

**`RuggyDatabase.withDatabase(path, callback)`**

Automatically manages database lifecycle.

```javascript
await RuggyDatabase.withDatabase('./data', async (db) => {
  const users = db.collection('users');
  users.insert({ name: 'Bob' });
  // Database automatically closed after callback
});
```

#### Instance Methods

**`collection(name: string): RuggyCollection`**

Gets or creates a collection.

**`withCollection(name, callback): Promise<any>`**

Executes callback with a collection, automatically closing it after.

```javascript
await db.withCollection('users', async (users) => {
  const id = users.insert({ name: 'Charlie' });
  return id;
});
```

**`close(): void`**

Closes the database and releases resources.

**Properties:**
- `path: string` - Database path
- `isOpen: boolean` - Whether database is open

---

### RuggyCollection

#### Instance Methods

**`insert(data: Object): string | null`**

Inserts a document and returns generated ID.

```javascript
const id = collection.insert({ name: 'Alice', age: 30 });
```

**`findAll(): Array<Object>`**

Returns all documents in the collection.

**`find(field: string, value: any): Array<Object>`**

Finds documents where field matches value.

```javascript
const adults = collection.find('age', '30');
```

**`close(): void`**

Closes the collection and releases resources.

**Properties:**
- `name: string` - Collection name
- `isOpen: boolean` - Whether collection is open

---

### RuggyPool

Connection pool for long-running applications.

#### Constructor

```javascript
new RuggyPool(path: string, options?)
```

**Options:**
- `lazyConnect: boolean` - Don't open DB until first use (default: `true`)

#### Static Methods

**`RuggyPool.fromConfig(options?)`**

Creates a pool instance using `ruggy.yaml` configuration.

```javascript
const pool = RuggyPool.fromConfig();
```

#### Instance Methods

**`withDatabase(callback): Promise<any>`**

Executes callback with the pooled database connection.

**`withCollection(name, callback): Promise<any>`**

Executes callback with a collection from the pool.

```javascript
const pool = new RuggyPool('./data');

await pool.withCollection('users', async (users) => {
  users.insert({ name: 'Dave' });
});

await pool.closeGracefully();
```

**`close(): void`**

Immediately closes the pool.

**`closeGracefully(timeoutMs?): Promise<void>`**

Waits for active operations to complete before closing.

**`getStats(): Object`**

Returns pool statistics (connected, activeOperations, totalOperations).

**Properties:**
- `path: string` - Database path
- `isConnected: boolean` - Whether pool has active connection
- `isClosed: boolean` - Whether pool is closed
- `activeOperations: number` - Current active operations
- `totalOperations: number` - Total operations performed

## Examples

### Basic CRUD Operations

```javascript
const { RuggyDatabase } = require('ruggy');
const db = new RuggyDatabase('./data');

const products = db.collection('products');

// Create
const id = products.insert({
  name: 'Laptop',
  price: 999,
  category: 'electronics'
});

// Read
const all = products.findAll();
const electronics = products.find('category', 'electronics');

// Close
db.close();
```

### Using Connection Pool

```javascript
const { RuggyPool } = require('ruggy');
const pool = RuggyPool.fromConfig(); // Uses ruggy.yaml

// Multiple concurrent operations
await Promise.all([
  pool.withCollection('users', async (col) => {
    col.insert({ name: 'User 1' });
  }),
  pool.withCollection('logs', async (col) => {
    col.insert({ event: 'startup' });
  })
]);

await pool.closeGracefully();
```

### Using Modern Syntax (Node.js 20+)

```javascript
{
  using db = new RuggyDatabase('./data');
  const users = db.collection('users');
  users.insert({ name: 'Eve' });
  // Automatically closed when leaving scope
}
```



## Performance

Ruggy is optimized for embedded use cases with thousands of documents. For large-scale applications, consider a full database server.

**Benchmarks** (approximate):
- Insert: ~10,000 ops/sec
- FindAll: ~50,000 ops/sec
- Find by field: ~20,000 ops/sec

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Acknowledgments

Built with:
- [Koffi](https://github.com/Koromix/koffi) - FFI bindings
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parsing
- [Rust](https://www.rust-lang.org/) - Native backend
