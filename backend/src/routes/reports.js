const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { get, query } = require('../db');
const auth = require('../middleware/auth');
const { generateIndividuPDF } = require('../services/pdf-generator');
const { calculateStudentScores } = require('../services/scoring');

function parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
                let line = lines[i];
                if (!line.trim()) continue;
                let row = [];
                let curr = '';
                let inQuotes = false;
                for (let j = 0; j < line.length; j++) {
                        let c = line[j];
                        if (c === '"') inQuotes = !inQuotes;
                        else if (c === ',' && !inQuotes) { row.push(curr.replace(/\r/g, '')); curr = ''; }
                        else curr += c;
                }
                row.push(curr.replace(/\r/g, ''));
                let obj = {};
                headers.forEach((h, idx) => obj[h.replace(/\r/g, '')] = row[idx]);
                result.push(obj);
        }
        return result;
}

function isInRentang(val, rentangStr) {
        if (!rentangStr) return false;
        let s = rentangStr.replace(/%/g, '').trim();
        if (s.includes('-')) {
            let parts = s.split('-');
            let min = parseFloat(parts[0]);
            let max = parseFloat(parts[1]);
            let v = Math.round(val);
            return v >= min && v <= max;
        } else if (s.startsWith('>')) {
            let min = parseFloat(s.substring(1));
            let v = Math.round(val);
            return v > min;
        }
        return false;
}

router.get('/individu/:id', auth, async (req, res, next) => {
    try {
        const studentId = req.params.id;

        // Fetch student row
        const studentRow = await get('SELECT * FROM students WHERE id = ?', [studentId]);
        if (!studentRow) return res.status(404).json({ status: 'error', message: 'Siswa tidak ditemukan' });

        // Calculate scores using existing scoring service
        const scores = await calculateStudentScores(studentId);

        // Fetch answers with question details
        const answers = await query(`
            SELECT a.question_id, a.jawaban, q.teks_soal, q.bidang, q.sub_bidang, q.arah_jawaban, q.tipe_soal
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.student_id = ?
        `, [studentId]);

        // Build bidang summary from scores
        const bidang = [
            { nama: 'Pribadi', score: scores.pribadi_pct },
            { nama: 'Belajar', score: scores.belajar_pct },
            { nama: 'Sosial', score: scores.sosial_pct },
            { nama: 'Karir', score: scores.karir_pct }
        ];

        // Build top sub-bidang prioritas
        const prioritas = Object.entries(scores.subBidangPct || {})
            .map(([name, pct]) => ({ nama: name, skor: pct }))
            .sort((a,b) => b.skor - a.skor)
            .slice(0, 5)
            .map(p => {
                let kategori = 'Ringan';
                if (p.skor >= 70) kategori = 'Sangat Berat';
                else if (p.skor >= 50) kategori = 'Berat';
                else if (p.skor >= 25) kategori = 'Sedang';
                return { nama: p.nama, skor: p.skor, kategori };
            });

        // Load CSV descriptions if available
        const csvBase = process.env.CSV_PATH || path.join(__dirname, '../../../SOAL DAN ANALISIS DCM');
        const csvBidangPath = path.join(csvBase, 'analisis Bidang.csv');
        const csvSubPath = path.join(csvBase, 'analisis sub Bidang.csv');

        let bidangCsv = [];
        let subCsv = [];
        try {
            if (fs.existsSync(csvBidangPath)) {
                bidangCsv = parseCSV(fs.readFileSync(csvBidangPath, 'utf8'));
            }
            if (fs.existsSync(csvSubPath)) {
                subCsv = parseCSV(fs.readFileSync(csvSubPath, 'utf8'));
            }
        } catch (e) {
            console.warn('Failed to read CSV descriptions:', e.message);
        }

        // Helper to get description for bidang/sub
        const getDescBidang = (nama, val) => {
            if (!bidangCsv || bidangCsv.length === 0) return '';
            const rows = bidangCsv.filter(r => r.Kategori === nama || r.Kategori === (nama + ' '));
            for (const r of rows) {
                if (isInRentang(val, r['Rentang / Skala'])) return r['Deskripsi Analisis'];
            }
            return '';
        };
        const getDescSub = (nama, val) => {
            if (!subCsv || subCsv.length === 0) return '';
            const rows = subCsv.filter(r => r['Sub Bidang'] === nama);
            for (const r of rows) {
                if (isInRentang(val, r['Rentang'])) return r['Deskripsi Analisis'];
            }
            return '';
        };

        // Compose analytical paragraphs similar to frontend preview
        const analisis = [];
        bidang.forEach(b => {
            const d = getDescBidang(b.nama, b.score);
            if (d) analisis.push(`Bidang ${b.nama} (${b.score}%): ${d}`);
        });

        // Build data payload for PDF generator
        const data = {
            student: Object.assign({}, studentRow, {
                // normalized keys used by frontend and services
                lie_score: scores.lie_score,
                cc_score: scores.cc_score,
                // legacy DB column names kept for compatibility
                lie_scale_score: scores.lie_score,
                consistency_score: scores.cc_score,
                pribadi_pct: scores.pribadi_pct,
                belajar_pct: scores.belajar_pct,
                sosial_pct: scores.sosial_pct,
                karir_pct: scores.karir_pct,
                subBidangPct: scores.subBidangPct
            }),
            bidang,
            prioritas,
            answers,
            analisis
        };

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_Individu_${studentRow.nama.replace(/\s+/g, '_')}.pdf`);

        // Generate and stream the PDF
        generateIndividuPDF(data, res);

    } catch (err) { next(err); }
});

module.exports = router;
