const { RuggyDatabase, RuggyPool } = require('../src');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const TEST_DB_PATH = path.join(__dirname, 'test_data');

// console.log(TEST_DB_PATH);

const TEST_COLLECTION = 'users_test';

// Ensure clean state
if (fs.existsSync(TEST_DB_PATH)) {
    // rm -rf equivalent
    fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DB_PATH);

async function runTests() {
    console.log('[Test] Starting Ruggy Test Suite...');
    const start = Date.now();

    try {
        await testBasicOperations();
        await testPoolOperations();

        const duration = Date.now() - start;
        console.log(`[Test] All tests passed successfully in ${duration}ms.`);
    } catch (err) {
        console.error('[Test] FAILED');
        console.error(err);
        process.exit(1);
    }
}

async function testBasicOperations() {
    console.log('[Test] Running Basic Operations...');

    await RuggyDatabase.withDatabase(TEST_DB_PATH, async (db) => {
        assert(db.isOpen, 'Database should be open');

        await db.withCollection(TEST_COLLECTION, async (col) => {
            assert(col.isOpen, 'Collection should be open');
            assert.strictEqual(col.name, TEST_COLLECTION, 'Collection name mismatch');

            // Insert
            const user1 = { name: 'John Doe', email: 'john@example.com', age: 30 };
            const id1 = col.insert(user1);
            assert(id1, 'Insert returned null ID');
            assert.strictEqual(typeof id1, 'string', 'ID should be a string');

            const user2 = { name: 'Jane Doe', email: 'jane@example.com', age: 25 };
            const id2 = col.insert(user2);
            assert(id2, 'Insert returned null ID');

            // Find All
            const all = col.findAll();
            assert(Array.isArray(all), 'findAll should return an array');
            assert.strictEqual(all.length, 2, 'Should have 2 documents');

            // Verify content
            const foundJohn = all.find(u => u.name === 'John Doe');
            assert(foundJohn, 'Should find inserted document');
            assert.strictEqual(foundJohn.age, 30, 'Data integrity check failed');

            // Find by field
            const results = col.find('email', 'jane@example.com');
            assert.strictEqual(results.length, 1, 'Should find exactly 1 match');
            assert.strictEqual(results[0].name, 'Jane Doe', 'Match should be correct user');

            // Find by non-existent
            const empty = col.find('email', 'notfound@example.com');
            assert.strictEqual(empty.length, 0, 'Should return empty array for no matches');
        });
    });
}

async function testPoolOperations() {
    console.log('[Test] Running Pool Operations...');

    const pool = new RuggyPool(TEST_DB_PATH);

    try {
        await pool.withCollection(TEST_COLLECTION, async (col) => {
            const all = col.findAll();
            assert(all.length >= 2, 'Pool should access existing data');
        });

        // Test concurrent access simulation
        const tasks = [];
        for (let i = 0; i < 5; i++) {
            tasks.push(pool.withCollection(TEST_COLLECTION, async (col) => {
                col.insert({ name: `Concurrent User ${i}`, worker: true });
            }));
        }

        await Promise.all(tasks);

        const stats = pool.getStats();
        assert.strictEqual(stats.activeOperations, 0, 'All operations should decrease active count');
        assert(stats.totalOperations >= 6, 'Total operations count mismatch');

    } finally {
        await pool.closeGracefully();
    }
}

runTests();
