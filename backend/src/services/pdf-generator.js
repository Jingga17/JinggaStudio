const PDFDocument = require('pdfkit');

function safe(val, fallback = '') { return (val === undefined || val === null) ? fallback : val; }

function generateIndividuPDF(data, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Watermark
    doc.save();
    doc.fillColor('#e0e0e0').fontSize(60)
       .opacity(0.15)
       .text('DOKUMEN RAHASIA', 80, 420, { angle: -45 });
    doc.opacity(1).fillColor('black');

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN ANALISIS INDIVIDU — DCM 220', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(safe(data.title || 'Psikometri Problem Checklist'), { align: 'center' });
    doc.moveDown();

    // A. Identitas
    doc.fontSize(11).font('Helvetica-Bold').text('A. IDENTITAS SISWA');
    doc.fontSize(10).font('Helvetica');
    const s = data.student || {};
    doc.text(`Nama Lengkap   : ${safe(s.nama)}`);
    doc.text(`NISN           : ${safe(s.nisn)}`);
    doc.text(`Kelas          : ${safe(s.kelas)}`);
    doc.text(`Jenis Kelamin  : ${safe(s.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan'}`);
    doc.moveDown();

    // B. Validitas
    doc.fontSize(11).font('Helvetica-Bold').text('B. VALIDITAS PENGISIAN');
    doc.fontSize(10).font('Helvetica');
    const lie = safe(s.lie_scale_score, s.lie_score);
    const cc = safe(s.consistency_score, s.cc_score);
    doc.text(`Lie Scale (Kebohongan): ${lie} / 22`);
    doc.text(`Consistency (Inkonsistensi): ${cc} pasang`);
    doc.moveDown();

    // C. Persentase per bidang
    doc.fontSize(11).font('Helvetica-Bold').text('C. PROFIL MASALAH PER BIDANG');
    doc.moveDown(0.5);
    (data.bidang || []).forEach(b => {
        doc.fontSize(10).font('Helvetica').text(`- ${b.nama}: ${safe(b.score)}%`);
    });
    doc.moveDown();

    // Deskripsi bidang
    if (data.analisis && data.analisis.length) {
        doc.fontSize(11).font('Helvetica-Bold').text('D. ANALISIS PER BIDANG');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        data.analisis.forEach(a => {
            doc.text(a, { align: 'justify' });
            doc.moveDown(0.5);
        });
        doc.moveDown();
    }

    // E. Profil 5 Sub Bidang Prioritas
    if (data.prioritas && data.prioritas.length) {
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('E. PROFIL 5 SUB BIDANG PRIORITAS', { align: 'center' });
        doc.moveDown();
        data.prioritas.forEach(p => {
            doc.fontSize(10).font('Helvetica-Bold').text(`${p.nama} — ${p.skor}% (${p.kategori})`);
            const desc = (data.subDescriptions && data.subDescriptions[p.nama]) || '';
            if (desc) {
                doc.font('Helvetica').fontSize(9).text(desc, { align: 'justify' });
            }
            doc.moveDown(0.6);
        });
    }

    // F. Tabel Jawaban Krisis (ambil jawaban yang bermasalah pada sub prioritas)
    if (data.answers && data.prioritas) {
        const topNames = data.prioritas.map(p => p.nama);
        const problems = (data.answers || []).filter(a => topNames.includes(a.sub_bidang) && (
            (a.arah_jawaban === 'Negative' && (a.jawaban||'').toLowerCase() === 'ya') ||
            (a.arah_jawaban === 'Positive' && (a.jawaban||'').toLowerCase() === 'tidak')
        ));

        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('F. TABEL JAWABAN KRISIS (5 SUB BIDANG PRIORITAS)', { align: 'center' });
        doc.moveDown();
        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('No', 50, doc.y, { continued: true });
        doc.text('Sub Bidang', 90, doc.y, { continued: true });
        doc.text('Pernyataan', 200, doc.y, { continued: true });
        doc.text('Jawaban', 420, doc.y, { continued: true });
        doc.text('Indikasi', 480, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9);
        let idx = 1;
        if (problems.length === 0) {
            doc.text('Tidak ditemukan jawaban krisis pada 5 sub bidang prioritas ini.', { align: 'center' });
        } else {
            problems.forEach(p => {
                doc.text(String(idx), 50, doc.y, { continued: true });
                doc.text(p.sub_bidang, 90, doc.y, { continued: true });
                const teks = (p.teks_soal || p.teks) .substring(0, 200);
                doc.text(teks, 200, doc.y, { width: 200, continued: true });
                const disp = ((p.jawaban||'').toLowerCase() === 'ya') ? 'Ya' : 'Tidak';
                doc.text(disp, 420, doc.y, { continued: true });
                const indik = (p.arah_jawaban === 'Negative') ? '🔴 Ya (Skor 1)' : '🔴 Tidak (Skor 1)';
                doc.text(indik, 480, doc.y);
                doc.moveDown(0.4);
                idx++;
            });
        }
    }

    // G. Rekomendasi sederhana
    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('G. REKOMENDASI', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.list([
        'Layanan Konseling Individual (Prioritas Segera): Sesi konseling terfokus pada regulasi emosi dan bidang prioritas tertinggi siswa.',
        'Pelatihan Keterampilan Belajar/Karir: Disesuaikan dengan tingkat keparahan masalah siswa demi meminimalkan hambatan.',
        'Koordinasi Lintas Fungsi: Menghubungi wali kelas dan orang tua siswa jika diperlukan intervensi bersama.'
    ]);

    // Footer signature
    doc.moveDown(3);
    doc.text('Mengetahui,', { align: 'right' });
    doc.moveDown(2);
    doc.text('(____________________)', { align: 'right' });

    doc.end();
}

module.exports = { generateIndividuPDF };
