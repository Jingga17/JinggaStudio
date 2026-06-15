const express = require('express');
const router = express.Router();
const { run, query, get } = require('../db');
const { calculateStudentScores } = require('../services/scoring');

// Check NISN (GET)
router.get('/check-nisn/:token/:nisn', async (req, res, next) => {
    try {
        const { token, nisn } = req.params;
        const session = await get('SELECT id FROM sessions WHERE token = ?', [token]);
        if (!session) {
            return res.json({ status: 'error', message: 'Token tidak valid' });
        }
        
        const student = await get('SELECT id, is_complete FROM students WHERE nisn = ? AND session_id = ?', [nisn, session.id]);
        if (student) {
            res.json({ status: 'success', data: { exists: true, is_complete: student.is_complete === 1 } });
        } else {
            res.json({ status: 'success', data: { exists: false } });
        }
    } catch (err) { next(err); }
});

// Verify NISN (POST - legacy/compatibility)
router.post('/verify-nisn', async (req, res, next) => {
    try {
        const { nisn } = req.body;
        const student = await get('SELECT id, is_complete FROM students WHERE nisn = ?', [nisn]);
        if (student) {
            return res.json({ status: 'success', data: { exists: true, is_complete: student.is_complete === 1 } });
        }
        res.json({ status: 'success', data: { exists: false } });
    } catch (err) { next(err); }
});

// Register student biodata (POST to /)
router.post('/', async (req, res, next) => {
    try {
        const { nama, jenis_kelamin, kelas, ttl, nisn, token } = req.body;
        
        if (!token) {
            return res.status(400).json({ status: 'error', message: 'Token sesi (Link URL) tidak ditemukan.' });
        }

        const session = await get('SELECT id, is_active FROM sessions WHERE token = ?', [token]);
        if (!session || !session.is_active) {
            return res.status(400).json({ status: 'error', message: 'Link sesi asesmen tidak valid atau sudah ditutup.' });
        }
        const sessionId = session.id;

        const existing = await get('SELECT id, nama, ttl FROM students WHERE nisn = ? AND session_id = ?', [nisn, sessionId]);
        if (existing) {
            // Allow resuming if nama and ttl match
            if (existing.nama.toLowerCase() === nama.toLowerCase() && existing.ttl === ttl) {
                return res.json({ status: 'success', data: { student_id: existing.id, resumed: true } });
            }
            return res.status(400).json({ status: 'error', message: 'NISN sudah terdaftar di sesi ini dengan data yang berbeda' });
        }

        const result = await run(
            'INSERT INTO students (nama, jenis_kelamin, kelas, ttl, nisn, session_id, is_valid) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [nama, jenis_kelamin, kelas, ttl, nisn, sessionId]
        );

        res.json({ status: 'success', data: { student_id: result.lastID } });
    } catch (err) { next(err); }
});

// Finish student session (PATCH to /:id/finish)
router.patch('/:id/finish', async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const { durasi } = req.body;

        // Perform calculation
        const scores = await calculateStudentScores(studentId);

        // Update student in database
        await run(`
            UPDATE students 
            SET is_complete = 1, 
                durasi_pengisian = ?, 
                lie_scale_score = ?, 
                consistency_score = ?, 
                is_valid = ?
            WHERE id = ?
        `, [durasi || 0, scores.lie_score, scores.cc_score, scores.is_valid, studentId]);

        res.json({ status: 'success', message: 'Asesmen selesai dan skor telah dihitung' });
    } catch (err) { next(err); }
});

// Get individual student report data (GET to /:id/report)
router.get('/:id/report', async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);
        if (!student) {
            return res.status(404).json({ status: 'error', message: 'Siswa tidak ditemukan' });
        }

        const scores = await calculateStudentScores(studentId);

        // Fetch all answers with question details
        const answers = await query(`
            SELECT a.question_id, a.jawaban, q.teks_soal, q.bidang, q.sub_bidang, q.arah_jawaban, q.tipe_soal
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.student_id = ?
        `, [studentId]);

        res.json({
            status: 'success',
            data: {
                student: {
                    id: student.id,
                    nama: student.nama,
                    kelas: student.kelas,
                    nisn: student.nisn,
                    jenis_kelamin: student.jenis_kelamin,
                    ttl: student.ttl,
                    durasi: student.durasi_pengisian,
                    ...scores
                },
                answers
            }
        });
    } catch (err) { next(err); }
});

// Reset student session (POST to /:id/reset)
router.post('/:id/reset', async (req, res, next) => {
    try {
        // Delete answers then the student
        await run('DELETE FROM answers WHERE student_id = ?', [req.params.id]);
        await run('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ status: 'success', message: 'Data siswa berhasil direset' });
    } catch (err) { next(err); }
});

module.exports = router;
