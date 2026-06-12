const PDFDocument = require('pdfkit');

function safe(val, fallback = '') { 
    return (val === undefined || val === null || val === '') ? fallback : val; 
}

function drawBase64Image(doc, base64Str, x, y, options) {
    if (!base64Str || !base64Str.startsWith('data:image')) return false;
    try {
        const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');
        doc.image(buffer, x, y, options);
        return true;
    } catch (e) {
        console.warn("Failed to render base64 image in PDF:", e.message);
        return false;
    }
}

function drawWatermark(doc) {
    doc.save();
    doc.opacity(0.04);
    doc.fontSize(44).font('Helvetica-Bold').fillColor('#64748b');
    doc.translate(297, 420);
    doc.rotate(-40);
    doc.text('DOKUMEN RAHASIA', -250, -20, { width: 500, align: 'center' });
    doc.restore();
}

function generateIndividuPDF(data, res) {
    // Enable page buffering to support page count in the running footer at the end
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    doc.pipe(res);

    // Automatically draw watermark on all dynamically added pages
    doc.on('pageAdded', () => {
        drawWatermark(doc);
    });
    
    // Draw watermark on the first page
    drawWatermark(doc);

    // Theme Colors
    const primaryColor = '#1e3a8a'; // Deep Navy
    const textDark = '#1e293b';     // Slate 800
    const textMuted = '#64748b';    // Slate 500
    const borderColor = '#cbd5e1';  // Slate 300
    const bgLight = '#f8fafc';      // Slate 50

    // Reset default margin
    doc.x = 40;

    // ─────────────────────────────────────────────────────────────────
    // HEADER (Kop Surat)
    // ─────────────────────────────────────────────────────────────────
    // Colored top accent bar
    doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
    
    // Draw logos if present
    const hasLogoSekolah = !!(data.settings?.logo_sekolah && data.settings.logo_sekolah.startsWith('data:image'));
    const hasLogoBk = !!(data.settings?.logo_bk && data.settings.logo_bk.startsWith('data:image'));
    
    if (hasLogoSekolah) {
        drawBase64Image(doc, data.settings.logo_sekolah, 40, 55, { width: 50, height: 50 });
    }
    if (hasLogoBk) {
        drawBase64Image(doc, data.settings.logo_bk, 505, 55, { width: 50, height: 50 });
    }
    
    const textLeft = hasLogoSekolah ? 100 : 40;
    const textRight = hasLogoBk ? 495 : 555;
    const textWidth = textRight - textLeft;
    
    const schoolName = safe(data.settings?.nama_sekolah, 'NAMA SEKOLAH').toUpperCase();
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor)
       .text(schoolName, textLeft, 55, { align: 'center', width: textWidth });
       
    const address = safe(data.settings?.alamat, 'Alamat Sekolah');
    doc.fontSize(8.5).font('Helvetica').fillColor(textDark)
       .text(address, textLeft, doc.y + 4, { align: 'center', width: textWidth });
       
    const kopBottom = Math.max(105, doc.y) + 8;
    doc.moveTo(40, kopBottom).lineTo(555, kopBottom).lineWidth(1.5).strokeColor(primaryColor).stroke();
    doc.moveTo(40, kopBottom + 3).lineTo(555, kopBottom + 3).lineWidth(0.5).strokeColor(primaryColor).stroke();
    
    doc.y = kopBottom + 12;
    doc.x = 40;

    doc.fontSize(13).font('Helvetica-Bold').fillColor(primaryColor).text('LAPORAN HASIL ASESMEN PSIKOMETRI', { align: 'center', width: 515 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text('DAFTAR CEK MASALAH (DCM) SISWA', { align: 'center', width: 515 });
    doc.moveDown(1.2);

    // ─────────────────────────────────────────────────────────────────
    // A. IDENTITAS SISWA (Bordered Card Block)
    // ─────────────────────────────────────────────────────────────────
    const s = data.student || {};
    const identitasY = doc.y;
    
    doc.save();
    doc.roundedRect(40, identitasY, 515, 76, 5)
       .fillColor(bgLight)
       .strokeColor(borderColor)
       .lineWidth(0.8)
       .fillAndStroke();
    doc.restore();
    
    // Header tag
    doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('A. IDENTITAS SISWA', 52, identitasY + 12);
    
    // Column 1 (Left)
    doc.fontSize(9).font('Helvetica').fillColor(textMuted).text('Nama Lengkap', 52, identitasY + 30);
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${safe(s.nama, '-')}`, 145, identitasY + 30);
    
    doc.fillColor(textMuted).font('Helvetica').text('NISN', 52, identitasY + 48);
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${safe(s.nisn, '-')}`, 145, identitasY + 48);
    
    // Column 2 (Right)
    doc.fillColor(textMuted).font('Helvetica').text('Kelas', 315, identitasY + 30);
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${safe(s.kelas, '-')}`, 395, identitasY + 30);
    
    doc.fillColor(textMuted).font('Helvetica').text('Jenis Kelamin', 315, identitasY + 48);
    const jkText = safe(s.jenis_kelamin) === 'L' ? 'Laki-laki' : 'Perempuan';
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${jkText}`, 395, identitasY + 48);
    
    // Reset cursor X and Y
    doc.x = 40;
    doc.y = identitasY + 90;

    // ─────────────────────────────────────────────────────────────────
    // B. VALIDITAS PENGISIAN
    // ─────────────────────────────────────────────────────────────────
    const valY = doc.y;
    const lie = safe(s.lie_scale_score, s.lie_score);
    const cc = safe(s.consistency_score, s.cc_score);
    const statusText = safe(s.status, 'Valid');
    
    let statusColor = '#10b981'; // Green (Valid)
    if (statusText === 'Tidak Valid') statusColor = '#ef4444'; // Red
    else if (statusText.includes('Syarat')) statusColor = '#f59e0b'; // Orange

    doc.save();
    doc.roundedRect(40, valY, 515, 68, 5)
       .fillColor(bgLight)
       .strokeColor(borderColor)
       .lineWidth(0.8)
       .fillAndStroke();
    doc.restore();
       
    doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('B. VALIDITAS PENGISIAN', 52, valY + 12);
    
    // Details
    doc.fontSize(9).font('Helvetica').fillColor(textMuted).text('Lie Scale (Kebohongan)', 52, valY + 30);
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${lie} / 22  (Batas toleransi: 7)`, 175, valY + 30);
    
    doc.fillColor(textMuted).font('Helvetica').text('Consistency (Konsistensi)', 52, valY + 46);
    doc.fillColor(textDark).font('Helvetica-Bold').text(`:  ${cc} pasang  (Batas toleransi: 4)`, 175, valY + 46);
    
    doc.fillColor(textMuted).font('Helvetica').text('Status Validitas', 315, valY + 30);
    doc.fillColor(statusColor).font('Helvetica-Bold').text(`:  ${statusText.toUpperCase()}`, 395, valY + 30);
    
    // Reset cursor X and Y
    doc.x = 40;
    doc.y = valY + 82;

    // ─────────────────────────────────────────────────────────────────
    // C. PROFIL PERSENTASE MASALAH PER BIDANG (Visual Progress Bars)
    // ─────────────────────────────────────────────────────────────────
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('C. PROFIL PERSENTASE MASALAH PER BIDANG');
    doc.moveDown(0.6);
    
    const bidangColors = {
        'Pribadi': '#3b82f6', // Light Blue
        'Belajar': '#10b981', // Emerald Green
        'Sosial': '#f59e0b',  // Amber Orange
        'Karir': '#8b5cf6'    // Violet Purple
    };

    (data.bidang || []).forEach(b => {
        const scoreVal = b.score || 0;
        const bY = doc.y;
        const barColor = bidangColors[b.nama] || '#3b82f6';
        
        // Label & Score text
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(textDark).text(b.nama.toUpperCase(), 40, bY);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(barColor).text(`${scoreVal}%`, 40, bY, { align: 'right', width: 515 });
        
        // Draw progress bar background (light gray)
        doc.roundedRect(40, bY + 12, 515, 9, 2.5).fillColor('#e2e8f0').fill();
        
        // Draw progress bar fill
        if (scoreVal > 0) {
            const fillWidth = Math.min((scoreVal / 100) * 515, 515);
            doc.roundedRect(40, bY + 12, fillWidth, 9, 2.5).fillColor(barColor).fill();
        }
        
        doc.x = 40;
        doc.y = bY + 28;
    });
    
    doc.x = 40;
    doc.moveDown(0.8);

    // ─────────────────────────────────────────────────────────────────
    // D. ANALISIS DESKRIPSI PER BIDANG (Narrative Texts)
    // ─────────────────────────────────────────────────────────────────
    if (data.analisis && data.analisis.length) {
        doc.x = 40;
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('D. ANALISIS DESKRIPSI PER BIDANG');
        doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).lineWidth(0.5).strokeColor(borderColor).stroke();
        doc.moveDown(0.7);
        
        data.analisis.forEach(a => {
            const splitIdx = a.indexOf('):');
            if (splitIdx !== -1) {
                const label = a.substring(0, splitIdx + 2);
                const desc = a.substring(splitIdx + 2).trim();
                
                let lblColor = '#3b82f6';
                if (label.includes('Pribadi')) lblColor = bidangColors.Pribadi;
                else if (label.includes('Belajar')) lblColor = bidangColors.Belajar;
                else if (label.includes('Sosial')) lblColor = bidangColors.Sosial;
                else if (label.includes('Karir')) lblColor = bidangColors.Karir;
                
                doc.x = 40;
                doc.fontSize(8.5).font('Helvetica-Bold').fillColor(lblColor).text(label);
                doc.font('Helvetica').fillColor(textDark).text(desc, { align: 'justify', lineGap: 2.5 });
            } else {
                doc.x = 40;
                doc.fontSize(8.5).font('Helvetica').fillColor(textDark).text(a, { align: 'justify', lineGap: 2.5 });
            }
            doc.moveDown(0.5);
        });
        doc.x = 40;
        doc.moveDown(0.5);
    }

    // ─────────────────────────────────────────────────────────────────
    // E. PROFIL 5 SUB BIDANG PRIORITAS (Severity Indicators)
    // ─────────────────────────────────────────────────────────────────
    if (data.prioritas && data.prioritas.length) {
        doc.addPage();
        
        // Brand Line Top
        doc.x = 40;
        doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
        doc.moveDown(1.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('E. PROFIL 5 SUB BIDANG PRIORITAS UTAMA', { align: 'center' });
        doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).lineWidth(0.8).strokeColor(borderColor).stroke();
        doc.moveDown(1.5);
        
        data.prioritas.forEach(p => {
            let pY = doc.y;
            
            // Severity Color Indicator (Left border card style)
            let levelColor = '#10b981'; // Ringan (Green)
            if (p.kategori === 'Sangat Berat') levelColor = '#ef4444'; // Red
            else if (p.kategori === 'Berat') levelColor = '#f97316';      // Orange
            else if (p.kategori === 'Sedang') levelColor = '#eab308';     // Yellow
            
            // Fetch description text
            const desc = safe((data.subDescriptions && data.subDescriptions[p.nama]), '');
            
            // Measure actual text height dynamically to prevent overlaps
            doc.font('Helvetica').fontSize(8.5);
            const textHeight = desc ? doc.heightOfString(desc, { width: 491, lineGap: 2.5 }) : 0;
            const cardHeight = Math.max(textHeight + 36, 48);
            
            // Check page overflow and push to next page if it doesn't fit
            if (pY + cardHeight > 760) {
                doc.addPage();
                doc.x = 40;
                doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
                doc.moveDown(2);
                pY = doc.y;
            }
            
            // Draw background card
            doc.save();
            doc.roundedRect(40, pY, 515, cardHeight, 4)
               .fillColor(bgLight)
               .strokeColor(borderColor)
               .lineWidth(0.5)
               .fillAndStroke();
            doc.restore();
            
            // Draw left border bar (severity color)
            doc.save();
            doc.rect(40, pY, 3, cardHeight).fillColor(levelColor).fill();
            doc.restore();
            
            // Title and score header inside prioritas card
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textDark).text(p.nama, 52, pY + 10);
            doc.fontSize(9).font('Helvetica-Bold').fillColor(levelColor).text(`${p.skor}% (${p.kategori.toUpperCase()})`, 52, pY + 10, { align: 'right', width: 491 });
            
            // Description paragraph
            if (desc) {
                doc.font('Helvetica').fontSize(8.5).fillColor(textDark).text(desc, 52, pY + 26, { align: 'justify', width: 491, lineGap: 2.5 });
            } else {
                doc.font('Helvetica').fontSize(8.5).fillColor(textMuted).text('(Deskripsi narasi analisis tidak tersedia untuk tingkat masalah ini)', 52, pY + 26, { width: 491 });
            }
            
            doc.x = 40;
            doc.y = pY + cardHeight + 12; // 12pt space after card
        });
        doc.x = 40;
    }

    // ─────────────────────────────────────────────────────────────────
    // F. DAFTAR PERNYATAAN KRISIS (Jawaban Bermasalah)
    // ─────────────────────────────────────────────────────────────────
    if (data.answers && data.prioritas) {
        const topNames = data.prioritas.map(p => p.nama);
        const problems = (data.answers || []).filter(a => topNames.includes(a.sub_bidang) && (
            (a.arah_jawaban === 'Negative' && (a.jawaban||'').toLowerCase() === 'ya') ||
            (a.arah_jawaban === 'Positive' && (a.jawaban||'').toLowerCase() === 'tidak')
        ));
        
        doc.addPage();
        doc.x = 40;
        doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
        doc.moveDown(1.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('F. DAFTAR PERNYATAAN KRISIS (JAWABAN BERMASALAH)', { align: 'center' });
        doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).lineWidth(0.8).strokeColor(borderColor).stroke();
        doc.moveDown(1.5);
        
        if (problems.length === 0) {
            doc.fontSize(9.5).font('Helvetica').fillColor(textMuted).text('Tidak ditemukan adanya jawaban krisis pada 5 sub bidang prioritas ini.', { align: 'center' });
        } else {
            // Draw Table Header Background
            let tY = doc.y;
            doc.rect(40, tY, 515, 18).fillColor('#f1f5f9').fill();
            
            // Header Text
            doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark);
            doc.text('NO', 45, tY + 5);
            doc.text('SUB BIDANG', 70, tY + 5);
            doc.text('BUTIR PERNYATAAN / MASALAH YANG DIALAMI SISWA', 180, tY + 5);
            doc.text('JAWABAN', 490, tY + 5);
            
            doc.moveTo(40, tY + 18).lineTo(555, tY + 18).lineWidth(1).strokeColor(borderColor).stroke();
            tY += 18;
            
            let idx = 1;
            problems.forEach(p => {
                doc.font('Helvetica').fontSize(8);
                const teks = safe(p.teks_soal || p.teks, '').trim();
                const statementWidth = 295;
                const textHeight = doc.heightOfString(teks, { width: statementWidth });
                const rowHeight = Math.max(textHeight + 10, 22);
                
                // Page Overflow Auto-break
                if (tY + rowHeight > 750) {
                    doc.addPage();
                    doc.x = 40;
                    doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
                    doc.moveDown(2);
                    tY = doc.y;
                    
                    // Redraw Table Headers on new page
                    doc.rect(40, tY, 515, 18).fillColor('#f1f5f9').fill();
                    doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark);
                    doc.text('NO', 45, tY + 5);
                    doc.text('SUB BIDANG', 70, tY + 5);
                    doc.text('BUTIR PERNYATAAN / MASALAH YANG DIALAMI SISWA', 180, tY + 5);
                    doc.text('JAWABAN', 490, tY + 5);
                    doc.moveTo(40, tY + 18).lineTo(555, tY + 18).lineWidth(1).strokeColor(borderColor).stroke();
                    tY += 18;
                }
                
                // Alternate row backgrounds
                if (idx % 2 === 0) {
                    doc.rect(40, tY, 515, rowHeight).fillColor(bgLight).fill();
                }
                
                doc.fontSize(7.5).font('Helvetica').fillColor(textDark);
                doc.text(String(idx), 45, tY + 6);
                doc.text(p.sub_bidang, 70, tY + 6, { width: 100 });
                doc.text(teks, 180, tY + 6, { width: statementWidth, align: 'justify' });
                
                const dispJawab = ((p.jawaban||'').toLowerCase() === 'ya') ? 'Ya' : 'Tidak';
                doc.font('Helvetica-Bold').fillColor('#ef4444').text(dispJawab, 490, tY + 6);
                
                // Bottom row border
                doc.moveTo(40, tY + rowHeight).lineTo(555, tY + rowHeight).lineWidth(0.4).strokeColor(borderColor).stroke();
                
                doc.x = 40; // Reset X cursor for the row
                tY += rowHeight;
                idx++;
            });
            doc.x = 40;
            doc.y = tY + 12;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // G. REKOMENDASI & SIGNATURE
    // ─────────────────────────────────────────────────────────────────
    // Prevent isolated footer signature page (add page if space is low)
    if (doc.y > 560) {
        doc.addPage();
        doc.fillColor(primaryColor).rect(40, 40, 515, 8).fill();
        doc.moveDown(2);
    }
    
    doc.x = 40;
    const recY = doc.y;
    doc.save();
    doc.roundedRect(40, recY, 515, 92, 5)
       .fillColor(bgLight)
       .strokeColor(borderColor)
       .lineWidth(0.8)
       .fillAndStroke();
    doc.restore();
       
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('G. REKOMENDASI INTERVENSI BIMBINGAN KONSELING', 52, recY + 12);
    
    doc.fontSize(8.5).font('Helvetica').fillColor(textDark);
    doc.text('1. Layanan Konseling Individual (Prioritas Utama): Sesi khusus terarah membahas bidang prioritas krisis terberat.', 52, recY + 30, { width: 490 });
    doc.text('2. Layanan Bimbingan Kelompok: Pendampingan bertema regulasi emosi, manajemen waktu belajar, dan kesiapan karir.', 52, recY + 48, { width: 490 });
    doc.text('3. Koordinasi dengan Wali Kelas & Orang Tua: Kolaborasi suportif memonitor aktivitas keseharian siswa di sekolah dan rumah.', 52, recY + 66, { width: 490 });
    
    doc.x = 40;
    doc.y = recY + 106;
    
    // Signature block
    const sigY = doc.y;
    doc.fontSize(9).font('Helvetica').fillColor(textDark);
    
    const kotaText = safe(data.settings?.kota, 'Kota Contoh');
    const formattedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    doc.text(`${kotaText}, ${formattedDate}`, 380, sigY, { align: 'center', width: 175 });
    doc.text('Guru Bimbingan dan Konseling,', 380, sigY + 14, { align: 'center', width: 175 });
    
    // Draw cap (stamp) image securely if provided (drawn under the signature line with semi-opacity)
    if (data.settings?.cap_konselor && data.settings.cap_konselor.startsWith('data:image')) {
        try {
            const capImg = data.settings.cap_konselor;
            const capBuffer = Buffer.from(capImg.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            doc.save();
            doc.opacity(0.6); // semi-transparent stamp
            doc.image(capBuffer, 350, sigY + 20, { width: 68, height: 68 });
            doc.restore();
        } catch(e) {
            console.warn("Failed to render cap image in PDF:", e.message);
        }
    }

    // Draw signature image securely if provided
    if (data.settings?.ttd_konselor && data.settings.ttd_konselor.startsWith('data:image')) {
        try {
            const imgData = data.settings.ttd_konselor;
            const buffer = Buffer.from(imgData.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            doc.image(buffer, 430, sigY + 28, { width: 75, height: 42 });
        } catch(e) {
            console.warn("Failed to render signature image in PDF:", e.message);
        }
    }
    
    doc.font('Helvetica-Bold').text(safe(data.settings?.nama_konselor, '__________________________'), 380, sigY + 76, { align: 'center', width: 175 });
    if (data.settings?.nip) {
        doc.font('Helvetica').fontSize(8).fillColor(textMuted).text(`NIP. ${data.settings.nip}`, 380, sigY + 88, { align: 'center', width: 175 });
    }

    // ─────────────────────────────────────────────────────────────────
    // RUNNING HEADERS, FOOTERS & PAGE NUMBERS (Post-Process)
    // ─────────────────────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Save original bottom margin and set to 0 to prevent automatic page breaks during footer rendering
        const oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        
        // Draw running footer line
        doc.moveTo(40, 780).lineTo(555, 780).lineWidth(0.5).strokeColor(borderColor).stroke();
        
        // Draw running footer page number
        doc.fontSize(7.5).font('Helvetica').fillColor(textMuted);
        doc.text(`Halaman ${i + 1} dari ${range.count}`, 40, 785, { align: 'right', width: 515 });
        
        // Restore original bottom margin
        doc.page.margins.bottom = oldBottomMargin;
        
        // Draw running header (Page 2 onwards)
        if (i > 0) {
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryColor);
            doc.text('LAPORAN HASIL ASESMEN PSIKOMETRI - DAFTAR CEK MASALAH (DCM)', 40, 20, { align: 'left', width: 515 });
            doc.moveTo(40, 30).lineTo(555, 30).lineWidth(0.5).strokeColor(borderColor).stroke();
        }
    }

    doc.end();
}

module.exports = { generateIndividuPDF };
