const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'pages', 'admin.js');
let currentJS = fs.readFileSync(filePath, 'utf-8');

// Fix API endpoint for fetching student list
currentJS = currentJS.replace(
  "const res = await API.get('/admin/siswa');",
  "const res = await API.get('/students/master');"
);

// Replace the try/catch in openBukuIndukDetail with Dummy Data
const dummyDataReplacement = `
    try {
      // DUMMY DATA INJECTION FOR DEMONSTRATION
      // Simulating network delay
      await new Promise(r => setTimeout(r, 500));
      
      const dummyBiodata = {
        nama: nama,
        nisn: nisn,
        kelas: kelas,
        jk: 'Laki-laki',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '15 Agustus 2005',
        agama: 'Islam',
        nama_ayah: 'Budi Santoso',
        pekerjaan_ayah: 'Wiraswasta',
        no_hp_ortu: '081234567890'
      };
      
      const dummyRapor = [
        { semester: 1, rata_rata: 85.5 },
        { semester: 2, rata_rata: 86.2 },
        { semester: 3, rata_rata: 88.0 },
        { semester: 4, rata_rata: 87.5 }
      ];
      
      const dummyEkskul = [
        { nama_ekskul: 'Pramuka', jabatan: 'Pradana' },
        { nama_ekskul: 'Karya Ilmiah Remaja (KIR)', jabatan: 'Anggota Aktif' }
      ];
      
      const dummyPrestasi = [
        { nama_prestasi: 'Juara 1 Lomba Pidato', tingkat: 'Tingkat Kabupaten' },
        { nama_prestasi: 'Finalis Olimpiade Sains', tingkat: 'Tingkat Provinsi' }
      ];
      
      const dummyDCM = {
        is_valid: true,
        pribadi: 25,
        belajar: 40,
        sosial: 15,
        karir: 20
      };
      
      this.renderDrawerBiodata(dummyBiodata);
      this.renderDrawerAkademik(dummyRapor);
      this.renderDrawerNonAkademik(dummyEkskul, dummyPrestasi);
      this.renderDrawerDCM(dummyDCM);
      
    } catch (e) {
`;

// Find the start of the try block in openBukuIndukDetail
const searchString = `
    try {
      // API call to fetch full profile. Adjust endpoint to match backend design.
      // If backend doesn't have a combined endpoint, we'd fetch them sequentially or parallel.
      // For now, let's fetch biodata specifically if available. If not, we simulate loading for demonstration.
      
      const res = await API.get(\`/admin/siswa/\${id}/detail\`); 
      const data = res.data || {};
      
      this.renderDrawerBiodata(data.biodata || { nama, nisn, kelas });
      this.renderDrawerAkademik(data.rapor || []);
      this.renderDrawerNonAkademik(data.ekskul || [], data.prestasi || []);
      this.renderDrawerDCM(data.dcm || null);
      
    } catch (e) {`;

if (currentJS.includes(searchString.trim())) {
  currentJS = currentJS.replace(searchString.trim(), dummyDataReplacement.trim());
} else {
  // Try a more flexible replacement if formatting differs
  console.log("Could not find exact string for try/catch replacement. Using regex.");
  currentJS = currentJS.replace(/try\s*\{\s*\/\/\s*API call to fetch full profile[\s\S]*?\} catch \(e\) \{/, dummyDataReplacement.trim());
}

// Enhance Akademik render to look like a table
const newRenderAkademik = `
  renderDrawerAkademik(raporList) {
    const container = document.getElementById('drawer-akademik-view');
    if (!raporList || raporList.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada data rapor yang diinput.</div>';
      return;
    }
    
    let html = '<table class="table" style="width:100%; border-collapse:collapse; margin-top:10px;">';
    html += '<thead><tr><th style="text-align:left; padding:8px; border-bottom:2px solid var(--border);">Semester</th><th style="text-align:right; padding:8px; border-bottom:2px solid var(--border);">Nilai Rata-Rata</th></tr></thead><tbody>';
    raporList.forEach(r => {
      html += \`<tr><td style="padding:12px 8px; border-bottom:1px solid var(--border);">Semester \${r.semester}</td><td style="text-align:right; padding:12px 8px; border-bottom:1px solid var(--border); font-weight:bold; color:var(--accent);">\${r.rata_rata}</td></tr>\`;
    });
    html += '</tbody></table>';
    
    // Fake Trend chart description
    html += '<div class="card" style="margin-top:24px; padding:16px; background:var(--accent-glow);"><h4 style="margin:0 0 8px 0; color:var(--accent);">Tren Nilai: Meningkat 📈</h4><p style="margin:0; font-size:13px; color:var(--text-muted);">Nilai rata-rata siswa menunjukkan peningkatan yang stabil selama 4 semester terakhir.</p></div>';
    
    container.innerHTML = html;
  },
`;

currentJS = currentJS.replace(/  renderDrawerAkademik\s*\([\s\S]*?renderDrawerNonAkademik/m, newRenderAkademik.trim() + '\n\n  renderDrawerNonAkademik');

// Enhance DCM render
const newRenderDCM = `
  renderDrawerDCM(dcmData) {
    const container = document.getElementById('drawer-dcm-view');
    if (!dcmData) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum mengisi kuesioner DCM.</div>';
      return;
    }
    container.innerHTML = \`
      <div class="card" style="padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted);">Status Pengisian</div>
          <div style="font-weight:bold; font-size:16px;">\${dcmData.is_valid ? '<span style="color:var(--success);">Telah Mengisi (Valid)</span>' : '<span style="color:var(--danger);">Belum Valid</span>'}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-muted);">Masalah Dominan</div>
          <div style="font-weight:bold; font-size:16px; color:var(--danger);">Masalah Belajar</div>
        </div>
      </div>
      
      <h4 style="margin-bottom:12px;">Persentase Masalah</h4>
      <div class="detail-grid">
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Pribadi</div>
          <div class="detail-value" style="font-size:24px;">\${dcmData.pribadi}%</div>
        </div>
        <div class="detail-item" style="text-align:center; border-color:var(--danger); background:rgba(239, 68, 68, 0.05);">
          <div class="detail-label" style="color:var(--danger);">Belajar</div>
          <div class="detail-value" style="font-size:24px; color:var(--danger);">\${dcmData.belajar}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Sosial</div>
          <div class="detail-value" style="font-size:24px;">\${dcmData.sosial}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Karir</div>
          <div class="detail-value" style="font-size:24px;">\${dcmData.karir}%</div>
        </div>
      </div>
    \`;
  },
`;

currentJS = currentJS.replace(/  renderDrawerDCM\s*\([\s\S]*?}\s*,\s*$/m, newRenderDCM.trim() + '\n\n');

fs.writeFileSync(filePath, currentJS, 'utf-8');
console.log('admin.js updated with dummy data.');
