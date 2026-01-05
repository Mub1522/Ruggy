const { koffi } = require('./bindings');

/**
 * Reads a null-terminated C string from a memory pointer
 * Optimized to read in chunks instead of byte-by-byte
 * @param {*} ptr - Memory pointer from Koffi
 * @returns {string|null} - UTF-8 decoded string or null
 */
function readCString(ptr) {
    if (!ptr || koffi.address(ptr) === 0n) return null;

    const CHUNK_SIZE = 256;
    const MAX_SIZE = 1024 * 1024; // 1MB safety limit
    const chunks = [];
    let offset = 0;

    while (offset < MAX_SIZE) {
        const buffer = koffi.decode(ptr, offset, koffi.types.uint8, CHUNK_SIZE);

        // Find null terminator
        let nullIndex = -1;
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === 0) {
                nullIndex = i;
                break;
            }
        }

        if (nullIndex !== -1) {
            // Found null terminator
            chunks.push(buffer.slice(0, nullIndex));
            break;
        }

        chunks.push(buffer);
        offset += CHUNK_SIZE;
    }

    // Concatenate all chunks and decode UTF-8
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const fullBuffer = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of chunks) {
        fullBuffer.set(chunk, pos);
        pos += chunk.length;
    }

    return Buffer.from(fullBuffer).toString('utf8');
}

/**
 * Converts a JavaScript string to a null-terminated UTF-8 buffer
 * @param {string} str - String to convert
 * @returns {Buffer} - Buffer with null terminator
 */
function toCString(str) {
    return Buffer.from(str + '\0', 'utf8');
}

/**
 * Validates if a pointer is valid (not null)
 * @param {*} ptr - Pointer to validate
 * @returns {boolean}
 */
function isValidPointer(ptr) {
    return ptr && koffi.address(ptr) !== 0n;
}

module.exports = {
    readCString,
    toCString,
    isValidPointer
};