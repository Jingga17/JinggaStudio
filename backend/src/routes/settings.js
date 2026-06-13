const express = require('express');
const router = express.Router();
const { run, get } = require('../db');
const auth = require('../middleware/auth');

// GET assessment status (Public)
router.get('/assessment-status', async (req, res, next) => {
    try {
        const row = await get('SELECT is_assessment_open FROM schools WHERE id = 1');
        res.json({ status: 'success', data: { active: row ? row.is_assessment_open === 1 : false } });
    } catch (err) { next(err); }
});

// POST assessment status (Auth required)
router.post('/assessment-status', auth, async (req, res, next) => {
    try {
        const { active } = req.body;
        const val = active ? 1 : 0;
        const existing = await get('SELECT id FROM schools WHERE id = 1');
        if (existing) {
            await run('UPDATE schools SET is_assessment_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [val]);
        } else {
            await run('INSERT INTO schools (id, is_assessment_open) VALUES (1, ?)', [val]);
        }
        res.json({ status: 'success', message: active ? 'Asesmen dibuka' : 'Asesmen ditutup' });
    } catch (err) { next(err); }
});


// GET settings
router.get('/', async (req, res, next) => {
    try {
        const settings = await get('SELECT * FROM schools WHERE id = 1');
        if (!settings) {
            return res.json({ status: 'success', data: null });
        }
        res.json({ status: 'success', data: settings });
    } catch (err) { next(err); }
});

// POST settings (save)
router.post('/', async (req, res, next) => {
    try {
        const {
            nama_sekolah, alamat, nama_konselor, logo_sekolah,
            logo_bk, cap_konselor, ttd_konselor, tahun_ajaran,
            kota, nip
        } = req.body;

        const existing = await get('SELECT id FROM schools WHERE id = 1');
        if (existing) {
            await run(`
                UPDATE schools 
                SET nama_sekolah = ?, alamat = ?, nama_konselor = ?, 
                    logo_sekolah = ?, logo_bk = ?, cap_konselor = ?, 
                    ttd_konselor = ?, tahun_ajaran = ?, kota = ?, nip = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `, [nama_sekolah, alamat, nama_konselor, logo_sekolah, logo_bk, cap_konselor, ttd_konselor, tahun_ajaran, kota, nip]);
        } else {
            await run(`
                INSERT INTO schools (id, nama_sekolah, alamat, nama_konselor, logo_sekolah, logo_bk, cap_konselor, ttd_konselor, tahun_ajaran, kota, nip)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [nama_sekolah, alamat, nama_konselor, logo_sekolah, logo_bk, cap_konselor, ttd_konselor, tahun_ajaran, kota, nip]);
        }
        res.json({ status: 'success', message: 'Pengaturan disimpan' });
    } catch (err) { next(err); }
});

module.exports = router;
