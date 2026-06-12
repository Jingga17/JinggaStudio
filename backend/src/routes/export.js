const express = require('express');
const router = express.Router();
const { query, get } = require('../db');
const { calculateStudentScores } = require('../services/scoring');
const auth = require('../middleware/auth');
const archiver = require('archiver');
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const { generateIndividuPDF } = require('../services/pdf-generator');

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
		// First, generate class-level PDF summary and save to a temp file
		try {
			const tmpClassPath = path.join(__dirname, '../../uploads', `tmp_class_${kelas.replace(/\s+/g,'_')}.pdf`);
			await new Promise((resolve, reject) => {
				const PDFDocument = require('pdfkit');
				const classDoc = new PDFDocument({ margin: 40, size: 'A4' });
				const out = fs.createWriteStream(tmpClassPath);
				classDoc.pipe(out);

				classDoc.fontSize(16).font('Helvetica-Bold').text('LAPORAN KELAS', { align: 'center' });
				classDoc.moveDown(0.5);
				classDoc.fontSize(12).font('Helvetica').text(`Kelas: ${kelas}`);
				classDoc.moveDown(0.5);

				classDoc.fontSize(10).font('Helvetica-Bold');
				classDoc.text('No', 50, classDoc.y, { continued: true });
				classDoc.text('Nama', 90, classDoc.y, { continued: true });
				classDoc.text('NISN', 250, classDoc.y, { continued: true });
				classDoc.text('Lie', 350, classDoc.y, { continued: true });
				classDoc.text('CC', 400, classDoc.y, { continued: true });
				classDoc.text('Status', 440, classDoc.y);
				classDoc.moveDown(0.5);
				classDoc.font('Helvetica').fontSize(10);

				(async () => {
					let idx = 1;
					for (const s of students) {
						const scores = await calculateStudentScores(s.id);
						classDoc.text(String(idx), 50, classDoc.y, { continued: true });
						classDoc.text(s.nama, 90, classDoc.y, { continued: true });
						classDoc.text(s.nisn || '-', 250, classDoc.y, { continued: true });
						classDoc.text(String(scores.lie_score || 0), 350, classDoc.y, { continued: true });
						classDoc.text(String(scores.cc_score || 0), 400, classDoc.y, { continued: true });
						classDoc.text(scores.status || '-', 440, classDoc.y);
						classDoc.moveDown(0.4);
						idx++;
					}
					classDoc.end();
				})();

				out.on('finish', resolve);
				out.on('error', reject);
			});
			// Do not attempt to add to an archive here (archive isn't defined in this route)
			// The temp file is left in uploads; cleanup is handled elsewhere if needed
		} catch (e) {
			console.warn('Gagal membuat PDF kelas:', e && e.message);
		}

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

// ZIP endpoint: generate PDFs per student in class and stream as ZIP
router.get('/zip/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
		const students = await query('SELECT * FROM students WHERE kelas = ? AND is_complete = 1 AND is_valid = 1', [kelas]);

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename=${kelas.replace(/\s+/g,'_')}_laporan.zip`);

		const settings = await get('SELECT * FROM schools WHERE id = 1') || {};

		// Load CSV descriptions outside loop
		const csvBase = process.env.CSV_PATH || path.join(__dirname, '../../../../SOAL DAN ANALISIS DCM');
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

		const archive = archiver('zip', { zlib: { level: 9 } });
		archive.pipe(res);
		const tmpFiles = [];

		for (const s of students) {
			const scores = await calculateStudentScores(s.id);
			const bidang = [
				{ nama: 'Pribadi', score: scores.pribadi_pct },
				{ nama: 'Belajar', score: scores.belajar_pct },
				{ nama: 'Sosial', score: scores.sosial_pct },
				{ nama: 'Karir', score: scores.karir_pct }
			];
			const prioritas = Object.entries(scores.subBidangPct || {})
				.map(([name, pct]) => ({ nama: name, skor: pct }))
				.sort((a,b)=>b.skor-a.skor).slice(0,5).map(p=> {
					let kategori = 'Ringan';
					if (p.skor >= 70) kategori = 'Sangat Berat';
					else if (p.skor >= 50) kategori = 'Berat';
					else if (p.skor >= 25) kategori = 'Sedang';
					return { nama: p.nama, skor: p.skor, kategori };
				});

			const answers = await query(`SELECT a.question_id, a.jawaban, q.teks_soal, q.bidang, q.sub_bidang, q.arah_jawaban, q.tipe_soal FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.student_id = ?`, [s.id]);

			// Compose analytical paragraphs
			const analisis = [];
			bidang.forEach(b => {
				const d = getDescBidang(b.nama, b.score);
				if (d) analisis.push(`Bidang ${b.nama} (${b.score}%): ${d}`);
			});

			const subDescriptions = {};
			prioritas.forEach(p => {
				subDescriptions[p.nama] = getDescSub(p.nama, p.skor);
			});

			const data = {
				student: Object.assign({}, s, {
					lie_score: scores.lie_score,
					cc_score: scores.cc_score,
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
				analisis,
				subDescriptions,
				settings
			};

			// create a temp file for this student's PDF and add file to archive
			try {
				const tmpPath = path.join(__dirname, '../../uploads', `tmp_${s.id}.pdf`);
				await new Promise((resolve, reject) => {
					const out = fs.createWriteStream(tmpPath);
					try {
						generateIndividuPDF(data, out);
					} catch (e) {
						return reject(e);
					}
					out.on('finish', resolve);
					out.on('error', reject);
				});
				const filename = `${s.nama.replace(/\s+/g,'_')}_${s.id}.pdf`;
				archive.file(tmpPath, { name: filename });
				tmpFiles.push(tmpPath);
			} catch (e) {
				console.error('Failed to generate PDF for student', s.id, e && e.message);
			}
		}

		res.on('finish', () => {
			for (const f of tmpFiles) {
				try { fs.unlinkSync(f); } catch (e) {}
			}
		});

		await archive.finalize();
	} catch (e) { next(e); }
});

// ZIP endpoint: generate PDFs for all valid students across all classes and stream as ZIP
router.get('/zip/all', auth, async (req, res, next) => {
	try {
		const students = await query('SELECT * FROM students WHERE is_complete = 1 AND is_valid = 1');

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename=Bulk_Semua_Laporan.zip`);

		const settings = await get('SELECT * FROM schools WHERE id = 1') || {};

		// Load CSV descriptions outside loop
		const csvBase = process.env.CSV_PATH || path.join(__dirname, '../../../../SOAL DAN ANALISIS DCM');
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

		const archive = archiver('zip', { zlib: { level: 9 } });
		archive.pipe(res);
		const tmpFiles = [];

		for (const s of students) {
			const scores = await calculateStudentScores(s.id);
			const bidang = [
				{ nama: 'Pribadi', score: scores.pribadi_pct },
				{ nama: 'Belajar', score: scores.belajar_pct },
				{ nama: 'Sosial', score: scores.sosial_pct },
				{ nama: 'Karir', score: scores.karir_pct }
			];
			const prioritas = Object.entries(scores.subBidangPct || {})
				.map(([name, pct]) => ({ nama: name, skor: pct }))
				.sort((a,b)=>b.skor-a.skor).slice(0,5).map(p=> {
					let kategori = 'Ringan';
					if (p.skor >= 70) kategori = 'Sangat Berat';
					else if (p.skor >= 50) kategori = 'Berat';
					else if (p.skor >= 25) kategori = 'Sedang';
					return { nama: p.nama, skor: p.skor, kategori };
				});

			const answers = await query(`SELECT a.question_id, a.jawaban, q.teks_soal, q.bidang, q.sub_bidang, q.arah_jawaban, q.tipe_soal FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.student_id = ?`, [s.id]);

			// Compose analytical paragraphs
			const analisis = [];
			bidang.forEach(b => {
				const d = getDescBidang(b.nama, b.score);
				if (d) analisis.push(`Bidang ${b.nama} (${b.score}%): ${d}`);
			});

			const subDescriptions = {};
			prioritas.forEach(p => {
				subDescriptions[p.nama] = getDescSub(p.nama, p.skor);
			});

			const data = {
				student: Object.assign({}, s, {
					lie_score: scores.lie_score,
					cc_score: scores.cc_score,
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
				analisis,
				subDescriptions,
				settings
			};

			// create a temp file for this student's PDF and add file to archive
			try {
				const tmpPath = path.join(__dirname, '../../uploads', `tmp_${s.id}.pdf`);
				await new Promise((resolve, reject) => {
					const out = fs.createWriteStream(tmpPath);
					try {
						generateIndividuPDF(data, out);
					} catch (e) {
						return reject(e);
					}
					out.on('finish', resolve);
					out.on('error', reject);
				});
				const folderName = s.kelas ? s.kelas.replace(/\s+/g,'_') : 'Lainnya';
				const filename = `${folderName}/${s.nama.replace(/\s+/g,'_')}_${s.id}.pdf`;
				archive.file(tmpPath, { name: filename });
				tmpFiles.push(tmpPath);
			} catch (e) {
				console.error('Failed to generate PDF for student', s.id, e && e.message);
			}
		}

		res.on('finish', () => {
			for (const f of tmpFiles) {
				try { fs.unlinkSync(f); } catch (e) {}
			}
		});

		await archive.finalize();
	} catch (e) { next(e); }
});

module.exports = router;
