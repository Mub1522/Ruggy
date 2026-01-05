/**
 * Ruggy - A simple, fast embedded database for Node.js
 * 
 * @module ruggy
 * @example
 * // Quick usage with auto-cleanup
 * const { RuggyDatabase } = require('ruggy');
 * 
 * await RuggyDatabase.withDatabase('./data', async (db) => {
 *   await db.withCollection('users', col => {
 *     col.insert({ name: 'Alice', age: 30 });
 *     console.log(col.findAll());
 *   });
 * });
 * 
 * @example
 * // Manual connection management
 * const { RuggyDatabase } = require('ruggy');
 * 
 * const db = new RuggyDatabase('./data');
 * const users = db.collection('users');
 * users.insert({ name: 'Bob' });
 * users.close();
 * db.close();
 * 
 * @example
 * // Connection pooling for servers
 * const { RuggyPool } = require('ruggy');
 * 
 * const pool = new RuggyPool('./data');
 * 
 * app.get('/users', async (req, res) => {
 *   await pool.withCollection('users', col => {
 *     res.json(col.findAll());
 *   });
 * });
 * 
 * process.on('SIGTERM', () => pool.close());
 */

const RuggyDatabase = require('./Database');
// const RuggyCollection = require('./Collection');
const RuggyPool = require('./Pool');

// Export classes
module.exports = {
    RuggyDatabase,
    // RuggyCollection,
    RuggyPool,

    // Aliases for convenience
    Ruggy: RuggyDatabase,
    Database: RuggyDatabase,
    // Collection: RuggyCollection,
    Pool: RuggyPool
};

// module.exports.default = RuggyDatabase;