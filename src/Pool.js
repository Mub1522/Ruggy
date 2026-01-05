const RuggyDatabase = require('./Database');

/**
 * Connection pool for Ruggy database
 * Reuses a single database connection across multiple operations
 * Ideal for long-running applications (servers, background jobs)
 */
class RuggyPool {
    /**
     * @private
     * @type {RuggyDatabase|null} Pooled database instance
     */
    #db = null;

    /**
     * @private
     * @type {string} Database path
     */
    #path = null;

    /**
     * @private
     * @type {boolean} Whether the pool is closed
     */
    #closed = false;

    /**
     * @private
     * @type {number} Number of active operations
     */
    #activeOperations = 0;

    /**
     * @private
     * @type {number} Total operations performed
     */
    #totalOperations = 0;

    /**
     * Creates a new connection pool
     * @param {string} path - Database path
     * @param {Object} options - Pool options
     * @param {boolean} options.lazyConnect - If true, don't open DB until first use (default: true)
     */
    constructor(path, options = {}) {
        if (typeof path !== 'string' || !path) {
            throw new Error('Database path must be a non-empty string');
        }

        this.#path = path;

        // Eager connection if requested
        if (options.lazyConnect === false) {
            this.#ensureConnection();
        }
    }

    /**
     * Static factory: Creates a pool instance using ruggy.yaml configuration
     * Searches for ruggy.yaml from current directory up to root
     * @param {Object} options - Combined configuration and pool options
     * @param {boolean} options.reload - Force reload configuration (bypass cache)
     * @param {string} options.searchFrom - Directory to start searching from
     * @param {boolean} options.lazyConnect - If true, don't open DB until first use (default: true)
     * @returns {RuggyPool} - Pool instance configured from YAML
     * @throws {Error} If database cannot be opened with configured path
     * @example
     * // With ruggy.yaml in project root containing: dataPath: ./my-data
     * const pool = RuggyPool.fromConfig();
     * await pool.withCollection('users', async (col) => { ... });
     */
    static fromConfig(options = {}) {
        const { loadConfig } = require('./config');
        const { reload, searchFrom, ...poolOptions } = options;
        const config = loadConfig({ reload, searchFrom });
        return new RuggyPool(config.dataPath, poolOptions);
    }


    /**
     * Gets the database path
     * @returns {string}
     */
    get path() {
        return this.#path;
    }

    /**
     * Checks if the pool is closed
     * @returns {boolean}
     */
    get isClosed() {
        return this.#closed;
    }

    /**
     * Checks if there's an active connection
     * @returns {boolean}
     */
    get isConnected() {
        return this.#db !== null && this.#db.isOpen;
    }

    /**
     * Gets the number of active operations
     * @returns {number}
     */
    get activeOperations() {
        return this.#activeOperations;
    }

    /**
     * Gets the total number of operations performed
     * @returns {number}
     */
    get totalOperations() {
        return this.#totalOperations;
    }

    /**
     * Gets pool statistics
     * @returns {Object}
     */
    getStats() {
        return {
            path: this.#path,
            connected: this.isConnected,
            closed: this.#closed,
            activeOperations: this.#activeOperations,
            totalOperations: this.#totalOperations
        };
    }

    /**
     * @private
     * Ensures a connection exists, creating one if needed
     * @throws {Error} If pool is closed
     */
    #ensureConnection() {
        if (this.#closed) {
            throw new Error('Pool is closed');
        }

        if (!this.#db || !this.#db.isOpen) {
            this.#db = new RuggyDatabase(this.#path);
        }
    }

    /**
     * Executes a callback with a database connection
     * The connection is reused across calls (not closed after each operation)
     * @param {Function} callback - Async function that receives the database
     * @returns {Promise<*>} - Result of callback
     * @throws {Error} If pool is closed or callback fails
     */
    async withDatabase(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.#ensureConnection();
        this.#activeOperations++;
        this.#totalOperations++;

        try {
            return await callback(this.#db);
        } catch (error) {
            // Log error but don't close connection (it might be a user error)
            throw error;
        } finally {
            this.#activeOperations--;
        }
    }

    /**
     * Alias for withDatabase for convenience
     * @param {Function} callback - Async function that receives the database
     * @returns {Promise<*>}
     */
    async withDB(callback) {
        return this.withDatabase(callback);
    }

    /**
     * Helper: Executes a callback with a collection from the pooled database
     * @param {string} collectionName - Collection name
     * @param {Function} callback - Async function that receives the collection
     * @returns {Promise<*>} - Result of callback
     */
    async withCollection(collectionName, callback) {
        return this.withDatabase(async (db) => {
            return db.withCollection(collectionName, callback);
        });
    }

    /**
     * Closes the pooled connection and releases resources
     * All active operations should complete before calling this
     * Safe to call multiple times
     */
    close() {
        if (this.#closed) {
            return;
        }

        this.#closed = true;

        if (this.#db) {
            this.#db.close();
            this.#db = null;
        }
    }

    /**
     * Waits for all active operations to complete, then closes the pool
     * @param {number} timeoutMs - Maximum time to wait in milliseconds (default: 5000)
     * @returns {Promise<void>}
     * @throws {Error} If timeout is reached
     */
    async closeGracefully(timeoutMs = 5000) {
        const startTime = Date.now();

        while (this.#activeOperations > 0) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(
                    `Graceful shutdown timeout: ${this.#activeOperations} operations still active`
                );
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.close();
    }

    /**
     * Symbol.dispose implementation for "using" syntax (Node.js 20+)
     */
    [Symbol.dispose]() {
        this.close();
    }

    /**
     * Symbol.asyncDispose implementation for "await using" syntax
     * Uses graceful shutdown
     */
    async [Symbol.asyncDispose]() {
        await this.closeGracefully();
    }
}

module.exports = RuggyPool;