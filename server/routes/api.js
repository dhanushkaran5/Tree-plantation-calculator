// ============================================================
// Tree Plantation Calculator – API Routes
// ============================================================
// Provides the same endpoints as the Python/Flask backend:
//
//   GET  /api/health           → Health check
//   GET  /api/bootstrap        → Return all stored kv pairs
//   POST /api/store            → Bulk save {key, value} pairs
//   GET  /api/store/:key       → Read a single key
//   PUT  /api/store/:key       → Write a single key
//   DELETE /api/store/:key     → Delete a single key
// ============================================================

'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');

// ── SQLite setup ─────────────────────────────────────────────
let db;
try {
    const Database = require('better-sqlite3');
    const DB_PATH  = path.join(__dirname, '..', 'eco_tree.db');
    db = new Database(DB_PATH);

    // Create table if not exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS kv_store (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s','now'))
        )
    `);
    console.log('✅ SQLite database connected:', DB_PATH);
} catch (err) {
    console.warn('⚠️  better-sqlite3 not available – using in-memory store.');
    console.warn('   Run `npm install` to enable persistent storage.');
    db = null;
}

// ── In-memory fallback ────────────────────────────────────────
const memStore = new Map();

// ── Helper functions ──────────────────────────────────────────
function dbGet(key) {
    if (db) {
        const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get(key);
        return row ? row.value : null;
    }
    return memStore.get(key) ?? null;
}

function dbSet(key, value) {
    if (db) {
        db.prepare(`
            INSERT INTO kv_store (key, value, updated_at)
            VALUES (?, ?, strftime('%s','now'))
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = strftime('%s','now')
        `).run(key, value);
    } else {
        memStore.set(key, value);
    }
}

function dbDelete(key) {
    if (db) {
        db.prepare('DELETE FROM kv_store WHERE key = ?').run(key);
    } else {
        memStore.delete(key);
    }
}

function dbAll() {
    if (db) {
        return db.prepare('SELECT key, value FROM kv_store ORDER BY key').all();
    }
    return Array.from(memStore.entries()).map(([key, value]) => ({ key, value }));
}

// ── Health check ──────────────────────────────────────────────
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        platform: 'Tree Plantation Calculator',
        version: '2.0.0',
        backend: db ? 'sqlite' : 'in-memory',
        timestamp: new Date().toISOString()
    });
});

// ── Bootstrap: return ALL stored keys ────────────────────────
// The frontend calls this once on load to hydrate localStorage
router.get('/bootstrap', (req, res) => {
    try {
        const rows = dbAll();
        const data = {};
        rows.forEach(row => { data[row.key] = row.value; });
        res.json({ status: 'ok', data, count: rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Bulk store: save multiple key-value pairs ─────────────────
// Body: [{ key: "ecotree_foo", value: "..." }, ...]
router.post('/store', (req, res) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        let saved = 0;
        items.forEach(item => {
            if (item.key && item.value !== undefined) {
                dbSet(item.key, typeof item.value === 'string'
                    ? item.value
                    : JSON.stringify(item.value));
                saved++;
            }
        });
        res.json({ status: 'ok', saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Read single key ───────────────────────────────────────────
router.get('/store/:key', (req, res) => {
    try {
        const val = dbGet(req.params.key);
        if (val === null) return res.status(404).json({ error: 'Key not found' });
        res.json({ status: 'ok', key: req.params.key, value: val });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Write single key ──────────────────────────────────────────
router.put('/store/:key', (req, res) => {
    try {
        const value = req.body.value !== undefined ? req.body.value : req.body;
        dbSet(req.params.key, typeof value === 'string' ? value : JSON.stringify(value));
        res.json({ status: 'ok', key: req.params.key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Delete single key ─────────────────────────────────────────
router.delete('/store/:key', (req, res) => {
    try {
        dbDelete(req.params.key);
        res.json({ status: 'ok', key: req.params.key, deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
