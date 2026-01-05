// Type definitions for Ruggy
// Project: Ruggy
// Definitions by: Andres Diaz

/// <reference types="node" />

/**
 * Configuration options for loading ruggy.yaml
 */
export interface ConfigOptions {
    /** Force reload configuration (bypass cache) */
    reload?: boolean;
    /** Directory to start searching for ruggy.yaml */
    searchFrom?: string;
}

/**
 * Pool creation options
 */
export interface PoolOptions {
    /** If true, don't open DB until first use (default: true) */
    lazyConnect?: boolean;
}

/**
 * Combined configuration and pool options
 */
export interface PoolConfigOptions extends ConfigOptions, PoolOptions { }

/**
 * Pool statistics
 */
export interface PoolStats {
    /** Database path */
    path: string;
    /** Whether pool has active connection */
    connected: boolean;
    /** Whether pool is closed */
    closed: boolean;
    /** Current active operations */
    activeOperations: number;
    /** Total operations performed */
    totalOperations: number;
}

/**
 * Ruggy Collection - Represents a collection in the database
 */
export class RuggyCollection {
    /**
     * Collection name
     */
    readonly name: string;

    /**
     * Whether the collection is open
     */
    readonly isOpen: boolean;

    /**
     * Inserts a document into the collection
     * @param data - Document to insert
     * @returns Generated document ID or null on error
     */
    insert(data: Record<string, any>): string | null;

    /**
     * Finds all documents in the collection
     * @returns Array of documents
     */
    findAll(): Array<Record<string, any>>;

    /**
     * Finds documents matching a field-value pair
     * @param field - Field name to search
     * @param value - Value to match
     * @returns Array of matching documents
     */
    find(field: string, value: any): Array<Record<string, any>>;

    /**
     * Closes the collection and frees native resources
     */
    close(): void;

    /**
     * Symbol.dispose implementation for "using" syntax (Node.js 20+)
     */
    [Symbol.dispose](): void;

    /**
     * Symbol.asyncDispose implementation for "await using" syntax
     */
    [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Ruggy Database - A simple, fast embedded database
 */
export class RuggyDatabase {
    /**
     * Creates a new database connection
     * @param dbPath - Path to the database directory
     */
    constructor(dbPath: string);

    /**
     * Database path
     */
    readonly path: string;

    /**
     * Whether the database is open
     */
    readonly isOpen: boolean;

    /**
     * Gets a collection (creates if doesn't exist)
     * @param name - Collection name
     * @returns Collection instance
     */
    collection(name: string): RuggyCollection;

    /**
     * Alias for collection() for semantic clarity
     * @param name - Collection name
     * @returns Collection instance
     */
    createCollection(name: string): RuggyCollection;

    /**
     * Helper: Automatically manages collection lifecycle
     * @param name - Collection name
     * @param callback - Async function that receives the collection
     * @returns Result of callback
     */
    withCollection<T>(name: string, callback: (collection: RuggyCollection) => Promise<T>): Promise<T>;

    /**
     * Closes the database and frees native resources
     */
    close(): void;

    /**
     * Static helper: Automatically manages database lifecycle
     * @param path - Database path
     * @param callback - Async function that receives the database
     * @returns Result of callback
     */
    static withDatabase<T>(path: string, callback: (db: RuggyDatabase) => Promise<T>): Promise<T>;

    /**
     * Static factory: Creates a database instance using ruggy.yaml configuration
     * @param options - Configuration options
     * @returns Database instance configured from YAML
     */
    static fromConfig(options?: ConfigOptions): RuggyDatabase;

    /**
     * Symbol.dispose implementation for "using" syntax (Node.js 20+)
     */
    [Symbol.dispose](): void;

    /**
     * Symbol.asyncDispose implementation for "await using" syntax
     */
    [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Ruggy Pool - Connection pool for long-running applications
 */
export class RuggyPool {
    /**
     * Creates a new connection pool
     * @param path - Database path
     * @param options - Pool options
     */
    constructor(path: string, options?: PoolOptions);

    /**
     * Database path
     */
    readonly path: string;

    /**
     * Whether the pool is closed
     */
    readonly isClosed: boolean;

    /**
     * Whether there's an active connection
     */
    readonly isConnected: boolean;

    /**
     * Number of active operations
     */
    readonly activeOperations: number;

    /**
     * Total number of operations performed
     */
    readonly totalOperations: number;

    /**
     * Gets pool statistics
     * @returns Pool statistics object
     */
    getStats(): PoolStats;

    /**
     * Executes a callback with a database connection
     * @param callback - Async function that receives the database
     * @returns Result of callback
     */
    withDatabase<T>(callback: (db: RuggyDatabase) => Promise<T>): Promise<T>;

    /**
     * Alias for withDatabase
     * @param callback - Async function that receives the database
     * @returns Result of callback
     */
    withDB<T>(callback: (db: RuggyDatabase) => Promise<T>): Promise<T>;

    /**
     * Helper: Executes a callback with a collection from the pooled database
     * @param collectionName - Collection name
     * @param callback - Async function that receives the collection
     * @returns Result of callback
     */
    withCollection<T>(collectionName: string, callback: (collection: RuggyCollection) => Promise<T>): Promise<T>;

    /**
     * Closes the pooled connection and releases resources
     */
    close(): void;

    /**
     * Waits for all active operations to complete, then closes the pool
     * @param timeoutMs - Maximum time to wait in milliseconds (default: 5000)
     */
    closeGracefully(timeoutMs?: number): Promise<void>;

    /**
     * Static factory: Creates a pool instance using ruggy.yaml configuration
     * @param options - Combined configuration and pool options
     * @returns Pool instance configured from YAML
     */
    static fromConfig(options?: PoolConfigOptions): RuggyPool;

    /**
     * Symbol.dispose implementation for "using" syntax (Node.js 20+)
     */
    [Symbol.dispose](): void;

    /**
     * Symbol.asyncDispose implementation for "await using" syntax
     */
    [Symbol.asyncDispose](): Promise<void>;
}

/**
 * Configuration loader
 */
export interface Config {
    /** Database data path */
    dataPath: string;
}

/**
 * Loads Ruggy configuration from ruggy.yaml or returns defaults
 * @param options - Configuration options
 * @returns Configuration object
 */
export function loadConfig(options?: ConfigOptions): Config;

/**
 * Clears the cached configuration
 */
export function clearCache(): void;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config;

export { RuggyDatabase, RuggyCollection, RuggyPool };
