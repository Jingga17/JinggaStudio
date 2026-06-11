const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { calculateStudentScores } = require('../services/scoring');
const auth = require('../middleware/auth');
const archiver = require('archiver');
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const { generateIndividuPDF } = require('../services/pdf-generator');

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
		res.setHeader('Content-Disposition', `attachment; filename=DCM_Export_All.csv`);
		res.send(csv);
	} catch (e) { next(e); }
});

module.exports = router;

// ZIP endpoint: generate PDFs per student in class and stream as ZIP
router.get('/zip/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
		const students = await query('SELECT * FROM students WHERE kelas = ?', [kelas]);

		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename=${kelas.replace(/\s+/g,'_')}_laporan.zip`);

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
				.sort((a,b)=>b.skor-a.skor).slice(0,5).map(p=>({ nama:p.nama, skor:p.skor }));

			const answers = await query(`SELECT a.question_id, a.jawaban, q.teks_soal, q.bidang, q.sub_bidang, q.arah_jawaban, q.tipe_soal FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.student_id = ?`, [s.id]);

			const data = {
				student: Object.assign({}, s, { lie_score: scores.lie_score, cc_score: scores.cc_score }),
				bidang,
				prioritas,
				answers,
				analisis: []
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

		archive.on('close', () => {
			for (const f of tmpFiles) {
				try { fs.unlinkSync(f); } catch (e) {}
			}
		});

		await archive.finalize();
	} catch (e) { next(e); }
});
