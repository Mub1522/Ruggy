const koffi = require('koffi');
const path = require('path');

// Load DLL
const dllPath = path.join(__dirname, '..', 'lib', 'ruggy.dll');
const lib = koffi.load(dllPath);

// Database operations
const ruggy_open = lib.func('ruggy_open', 'void *', ['string']);
const ruggy_db_free = lib.func('ruggy_db_free', 'void', ['void *']);

// Collection operations
const ruggy_get_collection = lib.func('ruggy_get_collection', 'void *', ['void *', 'string']);
const ruggy_col_free = lib.func('ruggy_col_free', 'void', ['void *']);

// Data operations
const ruggy_insert = lib.func('ruggy_insert', 'void *', ['void *', 'string']);
const ruggy_find_all = lib.func('ruggy_find_all', 'void *', ['void *']);
const ruggy_find = lib.func('ruggy_find', 'void *', ['void *', 'string', 'string']);
const ruggy_find_op = lib.func('ruggy_find_op', 'void *', ['void *', 'string', 'string', 'string']);
const ruggy_update_field = lib.func('ruggy_update_field', 'int', ['void *', 'string', 'string', 'string']);
const ruggy_delete = lib.func('ruggy_delete', 'int', ['void *', 'string']);

// Memory management
const ruggy_str_free = lib.func('ruggy_str_free', 'void', ['void *']);

module.exports = {
    koffi,
    ruggy_open,
    ruggy_db_free,
    ruggy_get_collection,
    ruggy_col_free,
    ruggy_insert,
    ruggy_find_all,
    ruggy_find,
    ruggy_find_op,
    ruggy_update_field,
    ruggy_delete,
    ruggy_str_free
};