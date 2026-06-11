const express = require('express');
const router = express.Router();
const { run, get } = require('../db');

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
