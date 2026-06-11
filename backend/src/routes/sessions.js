const express = require('express');
const router = express.Router();
const { run, query, get } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all sessions
router.get('/', async (req, res, next) => {
    try {
        const sessions = await query('SELECT * FROM sessions ORDER BY created_at DESC');
        res.json({ status: 'success', data: sessions });
    } catch (err) { next(err); }
});

// Create new session
router.post('/', async (req, res, next) => {
    try {
        const token = uuidv4();
        const result = await run('INSERT INTO sessions (token) VALUES (?)', [token]);
        res.json({ status: 'success', data: { id: result.lastID, token, is_active: 1 } });
    } catch (err) { next(err); }
});

// Close session
router.patch('/:id/close', async (req, res, next) => {
    try {
        await run('UPDATE sessions SET is_active = 0, closed_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
        res.json({ status: 'success', message: 'Sesi ditutup' });
    } catch (err) { next(err); }
});

// Check session status (public)
router.get('/:token/status', async (req, res, next) => {
    try {
        const session = await get('SELECT id, is_active FROM sessions WHERE token = ?', [req.params.token]);
        if (!session) {
            return res.json({ status: 'success', data: { active: false } });
        }
        res.json({ status: 'success', data: { active: session.is_active === 1, session_id: session.id } });
    } catch (err) { next(err); }
});

// Delete session
router.delete('/:id', async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        // Find all students in this session
        const students = await query('SELECT id FROM students WHERE session_id = ?', [sessionId]);
        if (students.length > 0) {
            const studentIds = students.map(s => s.id);
            const placeholders = studentIds.map(() => '?').join(',');
            // Delete answers for these students
            await run(`DELETE FROM answers WHERE student_id IN (${placeholders})`, studentIds);
            // Delete students
            await run('DELETE FROM students WHERE session_id = ?', [sessionId]);
        }
        // Delete session
        await run('DELETE FROM sessions WHERE id = ?', [sessionId]);
        res.json({ status: 'success', message: 'Sesi berhasil dihapus' });
    } catch (err) { next(err); }
});

module.exports = router;
