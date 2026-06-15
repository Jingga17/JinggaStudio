const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const dbPath = path.join(__dirname, '../db/database.sqlite');
const sqlite3 = require('sqlite3').verbose();
const requireAdmin = require('../middleware/auth');

function getDb() {
  return new sqlite3.Database(dbPath);
}

// GET all sessions
router.get('/', requireAdmin, (req, res) => {
  const db = getDb();
  db.all(`
    SELECT s.*, 
           (SELECT COUNT(*) FROM students st WHERE st.session_id = s.id) as student_count
    FROM sessions s 
    ORDER BY s.created_at DESC
  `, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    res.json(rows);
  });
});

// POST new session
router.post('/', requireAdmin, (req, res) => {
  const { name } = req.body;
  const token = crypto.randomBytes(4).toString('hex'); // 8 char random token
  const db = getDb();
  
  const adminId = req.admin ? req.admin.id : 1;
  db.run(`INSERT INTO sessions (token, name, created_by) VALUES (?, ?, ?)`, 
    [token, name || 'Sesi Baru', adminId], function(err) {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to create session', details: err.message });
    res.json({ id: this.lastID, token, name: name || 'Sesi Baru', is_active: 1 });
  });
});

// PUT update session (name or is_active)
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;
  
  let updates = [];
  let params = [];
  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }
  if (is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(is_active ? 1 : 0);
  }
  
  if (updates.length === 0) return res.json({ success: true });
  
  params.push(id);
  const sql = `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`;
  
  const db = getDb();
  db.run(sql, params, function(err) {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to update session', details: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// DELETE session
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // Delete students (which cascades to answers thanks to ON DELETE CASCADE)
    db.run(`DELETE FROM students WHERE session_id = ?`, [id], (err) => {
      if (err) {
        db.run("ROLLBACK");
        db.close();
        return res.status(500).json({ error: 'Failed to delete associated students' });
      }
      db.run(`DELETE FROM sessions WHERE id = ?`, [id], function(err) {
        if (err) {
          db.run("ROLLBACK");
          db.close();
          return res.status(500).json({ error: 'Failed to delete session' });
        }
        db.run("COMMIT");
        db.close();
        res.json({ success: true, deleted: this.changes });
      });
    });
  });
});

// GET check token (Public)
router.get('/check/:token', (req, res) => {
  const { token } = req.params;
  const db = getDb();
  db.get(`SELECT id, name, is_active FROM sessions WHERE token = ?`, [token], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ valid: false, message: 'Token tidak ditemukan' });
    
    res.json({ 
      valid: true, 
      active: !!row.is_active, 
      session: { id: row.id, name: row.name } 
    });
  });
});

module.exports = router;
