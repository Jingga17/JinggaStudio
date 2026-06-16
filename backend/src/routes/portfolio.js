/**
 * Resilien — Portfolio Routes
 * GET/POST/PUT/DELETE untuk Rapor dan Prestasi siswa
 */

const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const { requireStudent } = require('../middleware/auth');

// ─────────────────────────────────────────────
// Helper: ambil student_id dari token siswa
// ─────────────────────────────────────────────

// ════════════════════════════════
//  RAPOR
// ════════════════════════════════

// GET semua rapor milik siswa
router.get('/rapor', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const rows = await query(
            `SELECT * FROM rapor WHERE student_id = ? ORDER BY semester ASC, mata_pelajaran ASC`,
            [studentId]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) { next(err); }
});

// POST tambah nilai rapor
router.post('/rapor', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { semester, mata_pelajaran, nilai } = req.body;

        if (!semester || !mata_pelajaran || nilai === undefined || nilai === null) {
            return res.status(400).json({ status: 'error', message: 'Semester, mata pelajaran, dan nilai wajib diisi' });
        }
        if (isNaN(Number(nilai)) || Number(nilai) < 0 || Number(nilai) > 100) {
            return res.status(400).json({ status: 'error', message: 'Nilai harus antara 0-100' });
        }

        // Cek duplikat
        const existing = await get(
            `SELECT id FROM rapor WHERE student_id = ? AND semester = ? AND mata_pelajaran = ?`,
            [studentId, semester, mata_pelajaran]
        );
        if (existing) {
            // Update jika sudah ada
            await run(
                `UPDATE rapor SET nilai = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [Number(nilai), existing.id]
            );
            const updated = await get(`SELECT * FROM rapor WHERE id = ?`, [existing.id]);
            return res.json({ status: 'success', message: 'Nilai berhasil diperbarui', data: updated });
        }

        const result = await run(
            `INSERT INTO rapor (student_id, semester, mata_pelajaran, nilai) VALUES (?, ?, ?, ?)`,
            [studentId, semester, mata_pelajaran, Number(nilai)]
        );
        const newRow = await get(`SELECT * FROM rapor WHERE id = ?`, [result.lastID]);
        res.status(201).json({ status: 'success', message: 'Nilai berhasil ditambahkan', data: newRow });
    } catch (err) { next(err); }
});

// PUT update nilai rapor
router.put('/rapor/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { nilai } = req.body;

        if (isNaN(Number(nilai)) || Number(nilai) < 0 || Number(nilai) > 100) {
            return res.status(400).json({ status: 'error', message: 'Nilai harus antara 0-100' });
        }

        const row = await get(`SELECT id FROM rapor WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(`UPDATE rapor SET nilai = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [Number(nilai), id]);
        const updated = await get(`SELECT * FROM rapor WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Nilai diperbarui', data: updated });
    } catch (err) { next(err); }
});

// DELETE nilai rapor
router.delete('/rapor/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const row = await get(`SELECT id FROM rapor WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(`DELETE FROM rapor WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Data berhasil dihapus' });
    } catch (err) { next(err); }
});

// ════════════════════════════════
//  PRESTASI
// ════════════════════════════════

// GET semua prestasi milik siswa
router.get('/prestasi', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const rows = await query(
            `SELECT * FROM prestasi WHERE student_id = ? ORDER BY tahun DESC, created_at DESC`,
            [studentId]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) { next(err); }
});

// POST tambah prestasi
router.post('/prestasi', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { nama_prestasi, tingkat, posisi, tahun, penyelenggara, keterangan } = req.body;

        if (!nama_prestasi || !tingkat) {
            return res.status(400).json({ status: 'error', message: 'Nama prestasi dan tingkat wajib diisi' });
        }

        const result = await run(
            `INSERT INTO prestasi (student_id, nama_prestasi, tingkat, posisi, tahun, penyelenggara, keterangan)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, nama_prestasi, tingkat, posisi || null, tahun || null, penyelenggara || null, keterangan || null]
        );
        const newRow = await get(`SELECT * FROM prestasi WHERE id = ?`, [result.lastID]);
        res.status(201).json({ status: 'success', message: 'Prestasi berhasil ditambahkan', data: newRow });
    } catch (err) { next(err); }
});

// PUT update prestasi
router.put('/prestasi/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { nama_prestasi, tingkat, posisi, tahun, penyelenggara, keterangan } = req.body;

        const row = await get(`SELECT id FROM prestasi WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(
            `UPDATE prestasi SET nama_prestasi=?, tingkat=?, posisi=?, tahun=?, penyelenggara=?, keterangan=? WHERE id=?`,
            [nama_prestasi, tingkat, posisi || null, tahun || null, penyelenggara || null, keterangan || null, id]
        );
        const updated = await get(`SELECT * FROM prestasi WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Prestasi diperbarui', data: updated });
    } catch (err) { next(err); }
});

// DELETE prestasi
router.delete('/prestasi/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const row = await get(`SELECT id FROM prestasi WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(`DELETE FROM prestasi WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Data berhasil dihapus' });
    } catch (err) { next(err); }
});

// ════════════════════════════════
//  EKSKUL / ORGANISASI
// ════════════════════════════════

// GET semua ekskul milik siswa
router.get('/ekskul', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const rows = await query(
            `SELECT * FROM ekskul WHERE student_id = ? ORDER BY tahun DESC, created_at DESC`,
            [studentId]
        );
        res.json({ status: 'success', data: rows });
    } catch (err) { next(err); }
});

// POST tambah ekskul
router.post('/ekskul', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { nama_kegiatan, jenis, posisi, tahun, keterangan } = req.body;

        if (!nama_kegiatan || !jenis) {
            return res.status(400).json({ status: 'error', message: 'Nama kegiatan dan jenis wajib diisi' });
        }

        const result = await run(
            `INSERT INTO ekskul (student_id, nama_kegiatan, jenis, posisi, tahun, keterangan)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, nama_kegiatan, jenis, posisi || null, tahun || null, keterangan || null]
        );
        const newRow = await get(`SELECT * FROM ekskul WHERE id = ?`, [result.lastID]);
        res.status(201).json({ status: 'success', message: 'Data berhasil ditambahkan', data: newRow });
    } catch (err) { next(err); }
});

// PUT update ekskul
router.put('/ekskul/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { nama_kegiatan, jenis, posisi, tahun, keterangan } = req.body;

        const row = await get(`SELECT id FROM ekskul WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(
            `UPDATE ekskul SET nama_kegiatan=?, jenis=?, posisi=?, tahun=?, keterangan=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [nama_kegiatan, jenis, posisi || null, tahun || null, keterangan || null, id]
        );
        const updated = await get(`SELECT * FROM ekskul WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Data diperbarui', data: updated });
    } catch (err) { next(err); }
});

// DELETE ekskul
router.delete('/ekskul/:id', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const row = await get(`SELECT id FROM ekskul WHERE id = ? AND student_id = ?`, [id, studentId]);
        if (!row) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });

        await run(`DELETE FROM ekskul WHERE id = ?`, [id]);
        res.json({ status: 'success', message: 'Data berhasil dihapus' });
    } catch (err) { next(err); }
});

module.exports = router;
