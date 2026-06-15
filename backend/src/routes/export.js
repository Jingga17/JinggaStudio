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
const ExcelJS = require('exceljs');

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
        let sql = 'SELECT * FROM students WHERE kelas = ?';
        const params = [kelas];
		const students = await query(sql, params);
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

// Export all students as a single Excel file (Multi-sheet)
router.get('/excel', auth, async (req, res, next) => {
	try {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Counselor Connect';
		workbook.created = new Date();

		const sheet1 = workbook.addWorksheet('Rekap Nilai');
		const sheet2 = workbook.addWorksheet('Detail Jawaban');

		// Sheet 1 Headers
		sheet1.columns = [
			{ header: 'ID', key: 'id', width: 10 },
			{ header: 'NISN', key: 'nisn', width: 15 },
			{ header: 'Nama Lengkap', key: 'nama', width: 30 },
			{ header: 'Kelas', key: 'kelas', width: 15 },
			{ header: 'L/P', key: 'jenis_kelamin', width: 10 },
			{ header: 'Status Validitas', key: 'status', width: 20 },
			{ header: 'Lie Score', key: 'lie_score', width: 15 },
			{ header: 'CC Score', key: 'cc_score', width: 15 },
			{ header: '% Pribadi', key: 'pribadi_pct', width: 15 },
			{ header: '% Belajar', key: 'belajar_pct', width: 15 },
			{ header: '% Sosial', key: 'sosial_pct', width: 15 },
			{ header: '% Karir', key: 'karir_pct', width: 15 }
		];

		// Sheet 2 Headers (Base + 220 Questions)
		const sheet2Cols = [
			{ header: 'NISN', key: 'nisn', width: 15 },
			{ header: 'Nama Lengkap', key: 'nama', width: 30 },
			{ header: 'Kelas', key: 'kelas', width: 15 },
		];
		for (let i = 1; i <= 220; i++) {
			sheet2Cols.push({ header: `Q${i}`, key: `q${i}`, width: 5 });
		}
		sheet2.columns = sheet2Cols;

		// Style headers
		[sheet1, sheet2].forEach(sheet => {
			sheet.getRow(1).font = { bold: true };
			sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
		});

		// Fetch all students
        let sql = 'SELECT * FROM students ORDER BY kelas, nama';
        const params = [];
		const students = await query(sql, params);
		
		// Fetch all answers mapped by student_id
		const allAnswers = await query('SELECT * FROM answers');
		const answerMap = {};
		for (const a of allAnswers) {
			if (!answerMap[a.student_id]) answerMap[a.student_id] = {};
			answerMap[a.student_id][a.question_id] = a.jawaban === 'Ya' ? 1 : (a.jawaban === 'Tidak' ? 0 : null);
		}

		for (const s of students) {
			const scores = await calculateStudentScores(s.id);
			
			// Add to Sheet 1
			sheet1.addRow({
				id: s.id,
				nisn: s.nisn,
				nama: s.nama,
				kelas: s.kelas,
				jenis_kelamin: s.jenis_kelamin,
				status: scores.status,
				lie_score: scores.lie_score,
				cc_score: scores.cc_score,
				pribadi_pct: scores.pribadi_pct,
				belajar_pct: scores.belajar_pct,
				sosial_pct: scores.sosial_pct,
				karir_pct: scores.karir_pct
			});

			// Add to Sheet 2
			const sheet2Row = {
				nisn: s.nisn,
				nama: s.nama,
				kelas: s.kelas
			};
			const studentAnswers = answerMap[s.id] || {};
			for (let i = 1; i <= 220; i++) {
				const ans = studentAnswers[i];
				sheet2Row[`q${i}`] = ans === 1 ? 'Ya' : (ans === 0 ? 'Tidak' : '');
			}
			sheet2.addRow(sheet2Row);
		}

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename=DCM_Export_All_${new Date().getTime()}.xlsx`);
		
		await workbook.xlsx.write(res);
		res.end();
	} catch (e) { next(e); }
});

// ZIP endpoint: generate PDFs per student in class and stream as a ZIP file
router.get('/zip/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
        let sql = 'SELECT id, nama, kelas FROM students WHERE kelas = ? AND is_complete = 1 AND is_valid = 1';
        const params = [kelas];
		const students = await query(sql, params);

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
                const safeClassName = s.kelas.replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
                const safeStudentName = s.nama.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                archive.append(Buffer.from(pdfBuffer), { name: `LAI_${safeClassName}_${safeStudentName}.pdf` });
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
        let sql = 'SELECT id, nama, kelas FROM students WHERE is_complete = 1 AND is_valid = 1';
        const params = [];
		const students = await query(sql, params);

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
                const safeClassName = s.kelas.replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
                const safeStudentName = s.nama.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                archive.append(Buffer.from(pdfBuffer), { name: `LAI_${safeClassName}_${safeStudentName}.pdf` });
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
        let sql = 'SELECT DISTINCT kelas FROM students WHERE is_complete = 1 AND is_valid = 1';
        const params = [];
		const classes = await query(sql, params);

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
                archive.append(Buffer.from(pdfBuffer), { name: `${safeClassName}_LAK.pdf` });
			} catch (e) {
				console.error('Failed to generate PDF for class', row.kelas, e && e.message);
			}
		}

        await archive.finalize();
	} catch (e) { next(e); }
});

module.exports = router;
