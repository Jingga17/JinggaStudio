const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { calculateStudentScores } = require('../services/scoring');
const auth = require('../middleware/auth');
const archiver = require('archiver');
const stream = require('stream');
const { generateIndividuPDF } = require('../services/pdf-generator');

// Export CSV for a class: students + summary scores
router.get('/class/:kelas', auth, async (req, res, next) => {
	try {
		const kelas = req.params.kelas;
		const students = await query('SELECT * FROM students WHERE kelas = ?', [kelas]);
		const rows = [];
		// First, generate class-level PDF summary and add to archive
		try {
			const PDFDocument = require('pdfkit');
			const classDoc = new PDFDocument({ margin: 40, size: 'A4' });
			const classChunks = [];
			classDoc.on('data', c => classChunks.push(c));
			const classPdfPromise = new Promise((resolve, reject) => {
				classDoc.on('end', () => resolve(Buffer.concat(classChunks)));
				classDoc.on('error', reject);
			});

			// Build class PDF: header + table of students
			classDoc.fontSize(16).font('Helvetica-Bold').text('LAPORAN KELAS', { align: 'center' });
			classDoc.moveDown(0.5);
			classDoc.fontSize(12).font('Helvetica').text(`Kelas: ${kelas}`);
			classDoc.moveDown(0.5);

			// Table header
			classDoc.fontSize(10).font('Helvetica-Bold');
			classDoc.text('No', 50, classDoc.y, { continued: true });
			classDoc.text('Nama', 90, classDoc.y, { continued: true });
			classDoc.text('NISN', 250, classDoc.y, { continued: true });
			classDoc.text('Lie', 350, classDoc.y, { continued: true });
			classDoc.text('CC', 400, classDoc.y, { continued: true });
			classDoc.text('Status', 440, classDoc.y);
			classDoc.moveDown(0.5);
			classDoc.font('Helvetica').fontSize(10);

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
			const classPdfBuffer = await classPdfPromise;
			archive.append(classPdfBuffer, { name: `Laporan_Kelas_${kelas.replace(/\s+/g,'_')}.pdf` });
		} catch (e) {
			console.warn('Gagal membuat PDF kelas:', e.message);
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

			// generate PDF into buffer by piping into PassThrough and collecting
			const pass = new stream.PassThrough();
			const chunks = [];
			pass.on('data', c => chunks.push(c));
			const pdfPromise = new Promise((resolve, reject) => {
				pass.on('end', () => resolve(Buffer.concat(chunks)));
				pass.on('error', reject);
			});

			// generateIndividuPDF will pipe to the provided stream and end it when done
			generateIndividuPDF(data, pass);
			let pdfBuffer = await pdfPromise;

			// Quick validation: check PDF signature
			const sig = pdfBuffer && pdfBuffer.slice(0,4).toString();
			if (sig !== '%PDF') {
				console.warn(`Generated buffer for student ${s.id} does not start with %PDF (found: ${sig}). Creating fallback PDF.`);
				// create a simple fallback PDF buffer
				try {
					const PDFDocument = require('pdfkit');
					const tmpChunks = [];
					const tmpDoc = new PDFDocument({ margin: 40, size: 'A4' });
					tmpDoc.on('data', c => tmpChunks.push(c));
					const tmpPromise = new Promise((resolve, reject) => {
						tmpDoc.on('end', () => resolve(Buffer.concat(tmpChunks)));
						tmpDoc.on('error', reject);
					});
					tmpDoc.fontSize(14).text(`Laporan (fallback) - ${s.nama}`);
					tmpDoc.moveDown();
					tmpDoc.fontSize(10).text('PDF generator fallback content.');
					tmpDoc.end();
					pdfBuffer = await tmpPromise;
				} catch (e) {
					console.error('Failed to create fallback PDF for', s.id, e.message);
				}
			}

			const filename = `${s.nama.replace(/\s+/g,'_')}_${s.id}.pdf`;
			archive.append(pdfBuffer, { name: filename });
		}

		await archive.finalize();
	} catch (e) { next(e); }
});
