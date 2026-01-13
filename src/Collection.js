const {
    ruggy_insert,
    ruggy_find_all,
    ruggy_find,
    ruggy_find_op,
    ruggy_update_field,
    ruggy_delete,
    ruggy_col_free,
    ruggy_str_free
} = require('./bindings');
const { readCString, toCString, isValidPointer } = require('./utils');

/**
 * Represents a collection in the Ruggy database
 */
class RuggyCollection {
    /**
     * @private
     * @type {*} Native pointer to the Rust Collection
     */
    #colPtr = null;

    /**
     * @private
     * @type {string} Collection name
     */
    #name = null;

    /**
     * @private
     * @param {*} colPtr - Native pointer from Rust
     * @param {string} name - Collection name
     */
    constructor(colPtr, name) {
        if (!isValidPointer(colPtr)) {
            throw new Error(`Invalid collection pointer for '${name}'`);
        }
        this.#colPtr = colPtr;
        this.#name = name;
    }

    /**
     * Gets the collection name
     * @returns {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * Checks if the collection is open
     * @returns {boolean}
     */
    get isOpen() {
        return this.#colPtr !== null;
    }

    /**
     * Inserts a document into the collection
     * @param {Object} data - Document to insert
     * @returns {string|null} - Generated document ID or null on error
     * @throws {Error} If collection is closed or data is invalid
     */
    insert(data) {
        this.#ensureOpen();

        if (typeof data !== 'object' || data === null) {
            throw new Error('Data must be a non-null object');
        }

        const json = JSON.stringify(data);
        const buf = toCString(json);

        const resPtr = ruggy_insert(this.#colPtr, buf);

        if (!isValidPointer(resPtr)) {
            return null;
        }

        const id = readCString(resPtr);
        ruggy_str_free(resPtr);
        return id;
    }

    /**
     * Finds all documents in the collection
     * @returns {Array<Object>} - Array of documents
     * @throws {Error} If collection is closed
     */
    findAll() {
        this.#ensureOpen();

        const resPtr = ruggy_find_all(this.#colPtr);
        if (!isValidPointer(resPtr)) {
            return [];
        }

        const json = readCString(resPtr);
        ruggy_str_free(resPtr);

        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to parse JSON from Rust:', error);
            return [];
        }
    }

    /**
     * Finds documents matching a field-value pair
     * @param {string} field - Field name to search
     * @param {*} value - Value to match (converted to string)
     * @returns {Array<Object>} - Array of matching documents
     * @throws {Error} If collection is closed
     */
    find(field, value) {
        this.#ensureOpen();

        if (typeof field !== 'string' || !field) {
            throw new Error('Field must be a non-empty string');
        }

        const fieldBuf = toCString(field);
        const valueBuf = toCString(String(value));

        const resPtr = ruggy_find(this.#colPtr, fieldBuf, valueBuf);
        if (!isValidPointer(resPtr)) {
            return [];
        }

        const json = readCString(resPtr);
        ruggy_str_free(resPtr);

        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to parse JSON from Rust:', error);
            return [];
        }
    }

    /**
     * Finds documents using a specific operator
     * @param {string} field - Field name to search
     * @param {*} value - Value to match (converted to string)
     * @param {string} operator - Operator to use (e.g., '=', 'like', 'starts_with', 'ends_with')
     * @returns {Array<Object>} - Array of matching documents
     * @throws {Error} If collection is closed
     */
    findWithOperator(field, value, operator) {
        this.#ensureOpen();

        if (typeof field !== 'string' || !field) {
            throw new Error('Field must be a non-empty string');
        }

        if (typeof operator !== 'string' || !operator) {
            throw new Error('Operator must be a non-empty string');
        }

        const fieldBuf = toCString(field);
        const valueBuf = toCString(String(value));
        const opBuf = toCString(operator);

        const resPtr = ruggy_find_op(this.#colPtr, fieldBuf, valueBuf, opBuf);
        if (!isValidPointer(resPtr)) {
            return [];
        }

        const json = readCString(resPtr);
        ruggy_str_free(resPtr);

        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to parse JSON from Rust:', error);
            return [];
        }
    }

    /**
     * Updates a specific field of a document found by its _id
     * @param {string} id - The _id of the document to update
     * @param {string} field - The field name to update
     * @param {*} value - The new value for the field (will be JSON stringified)
     * @returns {boolean} - True if updated, false if not found or error
     * @throws {Error} If collection is closed or parameters are invalid
     */
    updateField(id, field, value) {
        this.#ensureOpen();

        if (typeof id !== 'string' || !id) {
            throw new Error('ID must be a non-empty string');
        }

        if (typeof field !== 'string' || !field) {
            throw new Error('Field must be a non-empty string');
        }

        const idBuf = toCString(id);
        const fieldBuf = toCString(field);
        const valueJson = JSON.stringify(value);
        const valBuf = toCString(valueJson);

        const result = ruggy_update_field(this.#colPtr, idBuf, fieldBuf, valBuf);
        return result === 1;
    }

    /**
     * Deletes a document by its _id
     * @param {string} id - The _id of the document to delete
     * @returns {boolean} - True if deleted, false if not found or error
     * @throws {Error} If collection is closed or ID is invalid
     */
    delete(id) {
        this.#ensureOpen();

        if (typeof id !== 'string' || !id) {
            throw new Error('ID must be a non-empty string');
        }

        const idBuf = toCString(id);
        const result = ruggy_delete(this.#colPtr, idBuf);
        return result === 1;
    }

    /**
     * Closes the collection and frees native resources
     * Safe to call multiple times
     */
    close() {
        if (this.#colPtr) {
            ruggy_col_free(this.#colPtr);
            this.#colPtr = null;
        }
    }

    /**
     * @private
     * Ensures the collection is open
     * @throws {Error} If collection is closed
     */
    #ensureOpen() {
        if (!this.#colPtr) {
            throw new Error(`Collection '${this.#name}' is closed`);
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

module.exports = RuggyCollection;