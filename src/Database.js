const {
    ruggy_open,
    ruggy_get_collection,
    ruggy_db_free
} = require('./bindings');
const { toCString, isValidPointer } = require('./utils');
const RuggyCollection = require('./Collection');

/**
 * Ruggy Database - A simple, fast embedded database
 */
class RuggyDatabase {
    /**
     * @private
     * @type {*} Native pointer to the Rust Database
     */
    #dbPtr = null;

    /**
     * @private
     * @type {string} Database path
     */
    #path = null;

    /**
     * @private
     * @type {Map<string, RuggyCollection>} Cache of open collections
     */
    #collectionCache = new Map();

    /**
     * Creates a new database connection
     * @param {string} dbPath - Path to the database directory
     * @throws {Error} If the database cannot be opened
     */
    constructor(dbPath) {
        if (typeof dbPath !== 'string' || !dbPath) {
            throw new Error('Database path must be a non-empty string');
        }

        const buf = toCString(dbPath);
        this.#dbPtr = ruggy_open(buf);

        if (!isValidPointer(this.#dbPtr)) {
            throw new Error(
                `Failed to open database at '${dbPath}'. ` +
                `Possible causes: invalid path, insufficient permissions, or disk full.`
            );
        }

        this.#path = dbPath;
    }

    /**
     * Gets the database path
     * @returns {string}
     */
    get path() {
        return this.#path;
    }

    /**
     * Checks if the database is open
     * @returns {boolean}
     */
    get isOpen() {
        return this.#dbPtr !== null;
    }

    /**
     * Gets a collection (creates if doesn't exist)
     * @param {string} name - Collection name
     * @returns {RuggyCollection}
     * @throws {Error} If database is closed or collection cannot be opened
     */
    collection(name) {
        this.#ensureOpen();

        if (typeof name !== 'string' || !name) {
            throw new Error('Collection name must be a non-empty string');
        }

        // Return cached collection if available
        if (this.#collectionCache.has(name)) {
            const col = this.#collectionCache.get(name);
            if (col.isOpen) {
                return col;
            }
            // Remove stale reference
            this.#collectionCache.delete(name);
        }

        // Get or create collection from Rust
        const buf = toCString(name);
        const colPtr = ruggy_get_collection(this.#dbPtr, buf);

        if (!isValidPointer(colPtr)) {
            throw new Error(`Failed to get collection '${name}'`);
        }

        const collection = new RuggyCollection(colPtr, name);
        this.#collectionCache.set(name, collection);
        return collection;
    }

    /**
     * Alias for collection() for semantic clarity
     * @param {string} name - Collection name
     * @returns {RuggyCollection}
     */
    createCollection(name) {
        return this.collection(name);
    }

    /**
     * Closes all cached collections
     * @private
     */
    #closeAllCollections() {
        for (const col of this.#collectionCache.values()) {
            col.close();
        }
        this.#collectionCache.clear();
    }

    /**
     * Closes the database and frees native resources
     * Also closes all open collections
     * Safe to call multiple times
     */
    close() {
        if (this.#dbPtr) {
            this.#closeAllCollections();
            ruggy_db_free(this.#dbPtr);
            this.#dbPtr = null;
        }
    }

    /**
     * Helper: Automatically manages collection lifecycle
     * @param {string} name - Collection name
     * @param {Function} callback - Async function that receives the collection
     * @returns {Promise<*>} - Result of callback
     * @throws {Error} If database is closed
     */
    async withCollection(name, callback) {
        const col = this.collection(name);
        try {
            return await callback(col);
        } finally {
            col.close();
            this.#collectionCache.delete(name);
        }
    }

    /**
     * Static helper: Automatically manages database lifecycle
     * @param {string} path - Database path
     * @param {Function} callback - Async function that receives the database
     * @returns {Promise<*>} - Result of callback
     */
    static async withDatabase(path, callback) {
        const db = new RuggyDatabase(path);
        try {
            return await callback(db);
        } finally {
            db.close();
        }
    }

    /**
     * Static factory: Creates a database instance using ruggy.yaml configuration
     * Searches for ruggy.yaml from current directory up to root
     * @param {Object} options - Configuration options
     * @param {boolean} options.reload - Force reload configuration (bypass cache)
     * @param {string} options.searchFrom - Directory to start searching from
     * @returns {RuggyDatabase} - Database instance configured from YAML
     * @throws {Error} If database cannot be opened with configured path
     * @example
     * // With ruggy.yaml in project root containing: dataPath: ./my-data
     * const db = RuggyDatabase.fromConfig();
     * const col = db.collection('users');
     */
    static fromConfig(options = {}) {
        const { loadConfig } = require('./config');
        const config = loadConfig(options);
        return new RuggyDatabase(config.dataPath);
    }


    /**
     * @private
     * Ensures the database is open
     * @throws {Error} If database is closed
     */
    #ensureOpen() {
        if (!this.#dbPtr) {
            throw new Error(`Database at '${this.#path}' is closed`);
        }
    }

    /**
     * Symbol.dispose implementation for "using" syntax (Node.js 20+)
     */
    [Symbol.dispose]() {
        this.close();
    }

    /**
     * Symbol.asyncDispose implementation for "await using" syntax
     */
    async [Symbol.asyncDispose]() {
        this.close();
    }
}

module.exports = RuggyDatabase;