const express = require('express');
const router = express.Router();
const { query, get } = require('../db');
const { calculateStudentScores } = require('../services/scoring');
const auth = require('../middleware/auth');
const archiver = require('archiver');
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const { generatePDFBuffer } = require('../services/pdf-generator');

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

// Export CSV for a class: students + summary scores
router.get('/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
		const students = await query('SELECT * FROM students WHERE kelas = ?', [kelas]);
		const rows = [];
		for (const s of students) {
			const scores = await calculateStudentScores(s.id);
			rows.push({
				id: s.id,
				nama: s.nama,
				nisn: s.nisn,
				kelas: s.kelas,
				jenis_kelamin: s.jenis_kelamin,
				lie_score: scores.lie_score,
				cc_score: scores.cc_score,
				status: scores.status,
				pribadi_pct: scores.pribadi_pct,
				belajar_pct: scores.belajar_pct,
				sosial_pct: scores.sosial_pct,
				karir_pct: scores.karir_pct,
				subBidangPct: JSON.stringify(scores.subBidangPct || {})
			});
		}

		// Build CSV
		const headers = ['id','nama','nisn','kelas','jenis_kelamin','lie_score','cc_score','status','pribadi_pct','belajar_pct','sosial_pct','karir_pct','subBidangPct'];
		const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
			let v = r[h];
			if (v === null || v === undefined) return '';
			return String(v).replace(/"/g, '""');
		}).join(','))).join('\n');

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename=export_${kelas.replace(/\s+/g,'_')}.csv`);
		res.send(csv);
	} catch (e) { next(e); }
});

// Export all students as a single CSV (named excel for frontend compatibility)
router.get('/excel', auth, async (req, res, next) => {
	try {
		const students = await query('SELECT * FROM students');
		const rows = [];
		for (const s of students) {
			const scores = await calculateStudentScores(s.id);
			rows.push({
				id: s.id,
				nama: s.nama,
				nisn: s.nisn,
				kelas: s.kelas,
				jenis_kelamin: s.jenis_kelamin,
				lie_score: scores.lie_score,
				cc_score: scores.cc_score,
				status: scores.status,
				pribadi_pct: scores.pribadi_pct,
				belajar_pct: scores.belajar_pct,
				sosial_pct: scores.sosial_pct,
				karir_pct: scores.karir_pct,
				subBidangPct: JSON.stringify(scores.subBidangPct || {})
			});
		}
		const headers = ['id','nama','nisn','kelas','jenis_kelamin','lie_score','cc_score','status','pribadi_pct','belajar_pct','sosial_pct','karir_pct','subBidangPct'];
		const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
			let v = r[h];
			if (v === null || v === undefined) return '';
			return String(v).replace(/"/g, '""');
		}).join(','))).join('\n');

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename=Counselor_Connect_Export_All.csv`);
		res.send(csv);
	} catch (e) { next(e); }
});

// ZIP endpoint: generate PDFs per student in class and stream as a ZIP file
router.get('/zip/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
		const students = await query('SELECT id, nama, kelas FROM students WHERE kelas = ? AND is_complete = 1 AND is_valid = 1', [kelas]);

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="Bulk_LAI_${kelas.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}.zip"`);

        const archive = archiver('zip', {
            zlib: { level: 5 } // Sets the compression level.
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(res);

		for (const s of students) {
			try {
				const pdfBuffer = await generatePDFBuffer(s.id, 'individu');
                const safeClassName = s.kelas.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                const safeStudentName = s.nama.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                archive.append(pdfBuffer, { name: `LAI_${safeClassName}_${safeStudentName}.pdf` });
			} catch (e) {
				console.error('Failed to generate PDF for student', s.id, e && e.message);
			}
		}

        await archive.finalize();
	} catch (e) { next(e); }
});

// ZIP endpoint: generate PDFs for all valid students across all classes and stream as a ZIP file
router.get('/zip/all', auth, async (req, res, next) => {
	try {
		const students = await query('SELECT id, nama, kelas FROM students WHERE is_complete = 1 AND is_valid = 1');

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="Bulk_Semua_LAI.zip"`);

        const archive = archiver('zip', {
            zlib: { level: 5 }
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(res);

		for (const s of students) {
			try {
				const pdfBuffer = await generatePDFBuffer(s.id, 'individu');
                const safeClassName = s.kelas.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                const safeStudentName = s.nama.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                archive.append(pdfBuffer, { name: `LAI_${safeClassName}_${safeStudentName}.pdf` });
			} catch (e) {
				console.error('Failed to generate PDF for student', s.id, e && e.message);
			}
		}

        await archive.finalize();
	} catch (e) { next(e); }
});

// ZIP endpoint: generate PDFs for all classes and stream as a ZIP file
router.get('/zip/kelas/all', auth, async (req, res, next) => {
	try {
		// Get distinct classes that have valid students
		const classes = await query('SELECT DISTINCT kelas FROM students WHERE is_complete = 1 AND is_valid = 1');

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="Bulk_Semua_LAK.zip"`);

        const archive = archiver('zip', {
            zlib: { level: 5 }
        });

        archive.on('error', function(err) {
            throw err;
        });

        archive.pipe(res);

		for (const row of classes) {
			try {
				const pdfBuffer = await generatePDFBuffer(row.kelas, 'kelas');
                const safeClassName = row.kelas.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                archive.append(pdfBuffer, { name: `${safeClassName}_LAK.pdf` });
			} catch (e) {
				console.error('Failed to generate PDF for class', row.kelas, e && e.message);
			}
		}

        await archive.finalize();
	} catch (e) { next(e); }
});

module.exports = router;
