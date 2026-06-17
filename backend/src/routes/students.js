const express = require('express');
const router = express.Router();
const { run, query, get } = require('../db');
const { calculateStudentScores } = require('../services/scoring');
const authMiddleware = require('../middleware/auth');

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

// Update Student Profile (PUT /profile) - Authenticated
router.put('/profile', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Hanya siswa yang dapat mengubah profil' });
        }
        const studentId = req.user.id;
        const { nama, jenis_kelamin, kelas, ttl, alamat, nama_ortu, pekerjaan_ortu, hobi, cita_cita, no_hp, data_pribadi } = req.body;
        
        await run(`
            UPDATE students 
            SET nama = COALESCE(?, nama), 
                jenis_kelamin = COALESCE(?, jenis_kelamin), 
                kelas = COALESCE(?, kelas), 
                ttl = COALESCE(?, ttl), 
                alamat = COALESCE(?, alamat), 
                nama_ortu = COALESCE(?, nama_ortu), 
                pekerjaan_ortu = COALESCE(?, pekerjaan_ortu), 
                hobi = COALESCE(?, hobi), 
                cita_cita = COALESCE(?, cita_cita), 
                no_hp = COALESCE(?, no_hp),
                data_pribadi = COALESCE(?, data_pribadi)
            WHERE id = ?
        `, [
            nama, jenis_kelamin, kelas, ttl, alamat, 
            nama_ortu, pekerjaan_ortu, hobi, cita_cita, no_hp, typeof data_pribadi === 'object' ? JSON.stringify(data_pribadi) : data_pribadi,
            studentId
        ]);

        res.json({ status: 'success', message: 'Profil berhasil diperbarui' });
    } catch (err) { next(err); }
});

// Start Assessment (POST /start-assessment) - Authenticated as student
router.post('/start-assessment', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Hanya siswa yang dapat memulai asesmen' });
        }

        const masterId = req.user.id;
        const nisn = req.user.nisn;
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ status: 'error', message: 'Session ID diperlukan' });
        }

        // Check if session exists and is active
        const session = await get('SELECT id, is_active FROM sessions WHERE id = ?', [session_id]);
        if (!session || !session.is_active) {
            return res.status(400).json({ status: 'error', message: 'Sesi asesmen tidak valid atau sudah ditutup.' });
        }

        // Check if attempt already exists
        const existing = await get('SELECT id FROM students WHERE nisn = ? AND session_id = ?', [nisn, session_id]);
        if (existing) {
            return res.json({ status: 'success', data: { student_id: existing.id, resumed: true } });
        }

        // Fetch master profile to copy data
        const masterProfile = await get('SELECT * FROM students WHERE id = ?', [masterId]);
        if (!masterProfile) {
            return res.status(404).json({ status: 'error', message: 'Profil master tidak ditemukan' });
        }

        // Create new attempt record
        const result = await run(
            `INSERT INTO students 
             (nama, jenis_kelamin, kelas, ttl, nisn, alamat, nama_ortu, pekerjaan_ortu, hobi, cita_cita, no_hp, session_id, is_valid) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                masterProfile.nama, masterProfile.jenis_kelamin, masterProfile.kelas, masterProfile.ttl,
                masterProfile.nisn, masterProfile.alamat, masterProfile.nama_ortu, masterProfile.pekerjaan_ortu,
                masterProfile.hobi, masterProfile.cita_cita, masterProfile.no_hp, session_id
            ]
        );

        res.json({ status: 'success', data: { student_id: result.lastID, resumed: false } });
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

// ==========================================
// DATA MASTER SISWA (Admin Only)
// ==========================================

// Get all master students
router.get('/master', authMiddleware, async (req, res, next) => {
    try {
        // Must be admin
        if (!req.admin) return res.status(403).json({ status: 'error', message: 'Akses ditolak. Khusus Admin.' });
        
        const students = await query('SELECT * FROM students ORDER BY kelas, nama');
        res.json({ status: 'success', data: students });
    } catch (err) { next(err); }
});

// Import students
router.post('/import', authMiddleware, async (req, res, next) => {
    try {
        if (!req.admin) return res.status(403).json({ status: 'error', message: 'Akses ditolak. Khusus Admin.' });
        
        const { students } = req.body;
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Data siswa kosong atau format tidak sesuai' });
        }

        const bcrypt = require('bcryptjs');
        let imported = 0;

        for (const s of students) {
            if (!s.nama || !s.nisn) continue;
            
            // Check if exists
            const exists = await get('SELECT id FROM students WHERE nisn = ?', [s.nisn]);
            if (!exists) {
                const defaultPass = await bcrypt.hash(s.nisn, 10);
                await run(
                    'INSERT INTO students (nama, kelas, nisn, password_hash, is_valid) VALUES (?, ?, ?, ?, 1)',
                    [s.nama, s.kelas || '', s.nisn, defaultPass]
                );
                imported++;
            } else {
                // Optionally update existing student here if needed
                // For now, skip if NISN exists
            }
        }

        res.json({ status: 'success', data: { imported }, message: `${imported} data berhasil diimpor` });
    } catch (err) { next(err); }
});

// Delete master student
router.post('/master/:id/delete', authMiddleware, async (req, res, next) => {
    try {
        if (!req.admin) return res.status(403).json({ status: 'error', message: 'Akses ditolak. Khusus Admin.' });
        
        await run('DELETE FROM answers WHERE student_id = ?', [req.params.id]);
        await run('DELETE FROM students WHERE id = ?', [req.params.id]);
        
        res.json({ status: 'success', message: 'Siswa berhasil dihapus dari sistem' });
    } catch (err) { next(err); }
});

// Reset password to NISN
router.post('/master/:id/reset-password', authMiddleware, async (req, res, next) => {
    try {
        if (!req.admin) return res.status(403).json({ status: 'error', message: 'Akses ditolak. Khusus Admin.' });
        
        const student = await get('SELECT id, nisn FROM students WHERE id = ?', [req.params.id]);
        if (!student) return res.status(404).json({ status: 'error', message: 'Siswa tidak ditemukan' });

        const bcrypt = require('bcryptjs');
        const defaultPass = await bcrypt.hash(student.nisn, 10);
        
        await run('UPDATE students SET password_hash = ? WHERE id = ?', [defaultPass, req.params.id]);
        
        res.json({ status: 'success', message: 'Password berhasil direset (kembali menggunakan NISN)' });
    } catch (err) { next(err); }
});

// Update Nilai Akademik (PUT /akademik) - Authenticated
router.put('/akademik', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Hanya siswa yang dapat mengubah nilai akademik' });
        }
        const studentId = req.user.id;
        const { nilai_akademik } = req.body;
        
        await run(`
            UPDATE students 
            SET nilai_akademik = ?
            WHERE id = ?
        `, [
            typeof nilai_akademik === 'object' ? JSON.stringify(nilai_akademik) : nilai_akademik,
            studentId
        ]);

        res.json({ status: 'success', message: 'Nilai Akademik berhasil diperbarui' });
    } catch (err) { next(err); }
});

// Get complete Buku Induk data (Admin Only)
router.get('/:id/buku-induk', authMiddleware, async (req, res, next) => {
    try {
        if (!req.admin) return res.status(403).json({ status: 'error', message: 'Akses ditolak' });
        
        const studentId = req.params.id;
        const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);
        if (!student) return res.status(404).json({ status: 'error', message: 'Siswa tidak ditemukan' });

        // Parse data_pribadi JSON
        let dataPribadi = {};
        if (student.data_pribadi) {
            try {
                dataPribadi = typeof student.data_pribadi === 'string' 
                    ? JSON.parse(student.data_pribadi) 
                    : student.data_pribadi;
            } catch(e) { dataPribadi = {}; }
        }

        // Parse nilai_akademik JSON
        let nilaiAkademik = {};
        if (student.nilai_akademik) {
            try {
                nilaiAkademik = typeof student.nilai_akademik === 'string'
                    ? JSON.parse(student.nilai_akademik)
                    : student.nilai_akademik;
            } catch(e) { nilaiAkademik = {}; }
        }

        // Calculate scores
        let scores = {};
        try {
            scores = await calculateStudentScores(studentId);
        } catch(e) { scores = {}; }

        // Get rapor
        let rapor = [];
        try {
            rapor = await query('SELECT * FROM rapor WHERE student_id = ? ORDER BY semester', [studentId]);
        } catch(e) { rapor = []; }

        // Get prestasi
        let prestasi = [];
        try {
            prestasi = await query('SELECT * FROM prestasi WHERE student_id = ?', [studentId]);
        } catch(e) { prestasi = []; }

        // Get ekskul (might not exist)
        let ekskul = [];
        try {
            ekskul = await query('SELECT * FROM ekskul WHERE student_id = ?', [studentId]);
        } catch(e) { ekskul = []; }

        // Build complete student object with data_pribadi merged
        const studentComplete = {
            ...student,
            ...dataPribadi,  // Merge all data_pribadi fields into root level
            data_pribadi: dataPribadi,  // Also keep nested for explicit access
            nilai_akademik: nilaiAkademik,
            ...scores
        };

        res.json({
            status: 'success',
            data: {
                student: studentComplete,
                rapor,
                prestasi,
                ekskul
            }
        });
    } catch (err) { next(err); }
});

module.exports = router;

