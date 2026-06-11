const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/shuffled', async (req, res, next) => {
    try {
        const questions = await query('SELECT * FROM questions');
        const formatted = questions.map(q => ({
            id: q.id,
            teks: q.teks_soal,
            bidang: q.bidang,
            sub_bidang: q.sub_bidang,
            tipe: q.tipe_soal,
            arah: q.arah_jawaban,
            pair: q.consistency_pair_id
        }));
        res.json({ status: 'success', data: formatted });
    } catch (err) { next(err); }
});

module.exports = router;
