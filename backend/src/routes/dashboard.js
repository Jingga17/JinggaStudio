const express = require('express');
const router = express.Router();
const { query, get } = require('../db');
const { calculateStudentScores } = require('../services/scoring');

// Helper for session filtering
const getSessionFilter = (session_id, prefix = 'AND') => session_id ? ` ${prefix} session_id = ?` : '';

// GET Summary stats
router.get('/summary', async (req, res, next) => {
    try {
        const totalResponden = await get(`SELECT COUNT(*) as count FROM students`);
        const totalSelesai = await get(`SELECT COUNT(*) as count FROM students WHERE is_complete = 1`);
        const totalKelas = await get(`SELECT COUNT(DISTINCT kelas) as count FROM students WHERE kelas IS NOT NULL AND kelas != ""`);
        
        let persentase = 0;
        if (totalResponden.count > 0) {
            persentase = Math.round((totalSelesai.count / totalResponden.count) * 100);
        }

        res.json({
            status: 'success',
            data: {
                total_responden: totalResponden.count,
                total_kelas: totalKelas.count || 0,
                persentase_pengisian: persentase
            }
        });
    } catch (err) { next(err); }
});

// GET Chart data (bidang and subBidang averages)
router.get('/chart', async (req, res, next) => {
    try {
        const { kelas, nisn } = req.query;
        let sql = 'SELECT id FROM students WHERE is_complete = 1 AND is_valid = 1';
        const params = [];
        if (kelas) {
            sql += ' AND kelas = ?';
            params.push(kelas);
        }
        if (nisn) {
            sql += ' AND nisn = ?';
            params.push(nisn);
        }
        const students = await query(sql, params);
        
        if (students.length === 0) {
            return res.json({
                status: 'success',
                data: {
                    bidang: { Pribadi: 0, Belajar: 0, Sosial: 0, Karir: 0 },
                    subBidang: {}
                }
            });
        }

        let pSum = 0, bSum = 0, sSum = 0, kSum = 0;
        const subSums = {};
        const subCounts = {};

        for (const s of students) {
            const scores = await calculateStudentScores(s.id);
            pSum += scores.pribadi_pct;
            bSum += scores.belajar_pct;
            sSum += scores.sosial_pct;
            kSum += scores.karir_pct;

            Object.entries(scores.subBidangPct).forEach(([sb, pct]) => {
                subSums[sb] = (subSums[sb] || 0) + pct;
                subCounts[sb] = (subCounts[sb] || 0) + 1;
            });
        }

        const len = students.length;
        const subBidang = {};
        Object.keys(subSums).forEach(sb => {
            subBidang[sb] = Math.round(subSums[sb] / (subCounts[sb] || 1));
        });

        res.json({
            status: 'success',
            data: {
                bidang: {
                    Pribadi: Math.round(pSum / len),
                    Belajar: Math.round(bSum / len),
                    Sosial: Math.round(sSum / len),
                    Karir: Math.round(kSum / len)
                },
                subBidang
            }
        });
    } catch (err) { next(err); }
});

// GET Table data (rekap data siswa)
router.get('/table', async (req, res, next) => {
    try {
        const { kelas, nisn } = req.query;
        let sql = 'SELECT * FROM students WHERE is_complete = 1';
        const params = [];
        if (kelas) {
            sql += ' AND kelas = ?';
            params.push(kelas);
        }
        if (nisn) {
            sql += ' AND nisn = ?';
            params.push(nisn);
        }
        sql += ' ORDER BY created_at DESC';
        const students = await query(sql, params);
        
        const mapped = [];
        for (const s of students) {
            const scores = await calculateStudentScores(s.id);
            mapped.push({
                id: s.id,
                nama: s.nama,
                kelas: s.kelas,
                nisn: s.nisn,
                jenis_kelamin: s.jenis_kelamin,
                status: scores.status,
                is_valid: scores.is_valid === 1,
                lie_score: scores.lie_score,
                cc_score: scores.cc_score,
                pribadi_pct: scores.pribadi_pct,
                belajar_pct: scores.belajar_pct,
                sosial_pct: scores.sosial_pct,
                karir_pct: scores.karir_pct
            });
        }
        res.json({ status: 'success', data: mapped });
    } catch (err) { next(err); }
});

// GET Descriptions based on averages
router.get('/deskripsi', async (req, res, next) => {
    try {
        const { kelas, nisn } = req.query;
        let sql = 'SELECT id FROM students WHERE is_complete = 1 AND is_valid = 1';
        const params = [];
        if (kelas) {
            sql += ' AND kelas = ?';
            params.push(kelas);
        }
        if (nisn) {
            sql += ' AND nisn = ?';
            params.push(nisn);
        }
        const students = await query(sql, params);
        
        if (students.length === 0) {
            return res.json({
                status: 'success',
                data: {
                    Pribadi: 'Belum ada data yang cukup untuk dianalisis.',
                    Belajar: 'Belum ada data yang cukup untuk dianalisis.',
                    Sosial: 'Belum ada data yang cukup untuk dianalisis.',
                    Karir: 'Belum ada data yang cukup untuk dianalisis.'
                }
            });
        }

        let pSum = 0, bSum = 0, sSum = 0, kSum = 0;
        for (const s of students) {
            const scores = await calculateStudentScores(s.id);
            pSum += scores.pribadi_pct;
            bSum += scores.belajar_pct;
            sSum += scores.sosial_pct;
            kSum += scores.karir_pct;
        }

        const len = students.length;
        const avg = {
            Pribadi: Math.round(pSum / len),
            Belajar: Math.round(bSum / len),
            Sosial: Math.round(sSum / len),
            Karir: Math.round(kSum / len)
        };

        const getDesc = (val, bidang) => {
            if (val === 0) return 'Belum ada data yang cukup untuk dianalisis.';
            if (val >= 61) return `(${val}%) Tingkat masalah ${bidang} tergolong TINGGI. Intervensi intensif dan penanganan segera sangat direkomendasikan.`;
            if (val >= 31) return `(${val}%) Tingkat masalah ${bidang} tergolong SEDANG. Perlu pendampingan preventif dan monitoring berkala.`;
            return `(${val}%) Tingkat masalah ${bidang} tergolong RENDAH. Terpantau cukup adaptif dan tidak memerlukan intervensi khusus saat ini.`;
        };

        res.json({
            status: 'success',
            data: {
                Pribadi: getDesc(avg.Pribadi, 'Pribadi'),
                Belajar: getDesc(avg.Belajar, 'Belajar'),
                Sosial: getDesc(avg.Sosial, 'Sosial'),
                Karir: getDesc(avg.Karir, 'Karir')
            }
        });
    } catch (err) { next(err); }
});

// GET distinct registered classes
router.get('/kelas', async (req, res, next) => {
    try {
        let sql = 'SELECT DISTINCT kelas FROM students WHERE kelas IS NOT NULL AND kelas != ""';
        const params = [];
        const result = await query(sql, params);
        const kelas = result.map(r => r.kelas);
        res.json({ status: 'success', data: kelas });
    } catch (err) { next(err); }
});

// GET class report aggregated details
router.get('/class-report/:kelas', async (req, res, next) => {
    try {
        const kelas = req.params.kelas;
        let sql = 'SELECT * FROM students WHERE kelas = ? AND is_complete = 1';
        const params = [kelas];
        
        // Fetch all complete students in the class
        const students = await query(sql, params);
        const validStudents = students.filter(s => s.is_valid === 1);
        
        if (students.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Tidak ada data untuk kelas ini' });
        }

        // Calculate aggregated scores
        let pSum = 0, bSum = 0, sSum = 0, kSum = 0;
        let lieSum = 0, ccSum = 0;
        
        const subSums = {};
        const subCounts = {};
        const questionProblemsCount = {};

        for (const s of validStudents) {
            const scores = await calculateStudentScores(s.id);
            pSum += scores.pribadi_pct;
            bSum += scores.belajar_pct;
            sSum += scores.sosial_pct;
            kSum += scores.karir_pct;
            lieSum += scores.lie_score;
            ccSum += scores.cc_score;

            Object.entries(scores.subBidangPct).forEach(([sb, pct]) => {
                subSums[sb] = (subSums[sb] || 0) + pct;
                subCounts[sb] = (subCounts[sb] || 0) + 1;
            });
        }

        // Load all questions to map directions
        const questions = await query('SELECT * FROM questions WHERE tipe_soal = "Core"');
        const questionsMap = {};
        questions.forEach(q => questionsMap[q.id] = q);

        // Fetch all answers for valid students in this class
        let sqlAns = `
            SELECT a.question_id, a.jawaban
            FROM answers a
            JOIN students s ON a.student_id = s.id
            WHERE s.kelas = ? AND s.is_complete = 1 AND s.is_valid = 1
        `;
        const allValidAnswers = await query(sqlAns, [kelas]);

        allValidAnswers.forEach(a => {
            const q = questionsMap[a.question_id];
            if (q) {
                const ans = a.jawaban.toLowerCase();
                const isProblem = (q.arah_jawaban === 'Negative' && ans === 'ya') || 
                                  (q.arah_jawaban === 'Positive' && ans === 'tidak');
                if (isProblem) {
                    questionProblemsCount[a.question_id] = (questionProblemsCount[a.question_id] || 0) + 1;
                }
            }
        });

        // Format subBidang pct averages
        const subBidang = {};
        Object.keys(subSums).forEach(sb => {
            subBidang[sb] = Math.round(subSums[sb] / (subCounts[sb] || 1));
        });

        const vLen = validStudents.length || 1;

        res.json({
            status: 'success',
            data: {
                kelas,
                total_responden: students.length,
                total_valid: validStudents.length,
                lie_score_avg: Number((lieSum / vLen).toFixed(1)),
                cc_score_avg: Number((ccSum / vLen).toFixed(1)),
                bidang: {
                    Pribadi: Math.round(pSum / vLen),
                    Belajar: Math.round(bSum / vLen),
                    Sosial: Math.round(sSum / vLen),
                    Karir: Math.round(kSum / vLen)
                },
                subBidang,
                questionProblemsCount,
                students: students.map(s => ({
                    id: s.id,
                    nama: s.nama,
                    is_valid: s.is_valid === 1
                }))
            }
        });
    } catch (err) { next(err); }
});

module.exports = router;
