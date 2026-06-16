const fs = require('fs');

const mapelE = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Matematika', 'Bahasa Inggris', 'Pend. Jasmani, Olahraga, dan Kesehatan',
  'Seni Budaya', 'Ilmu Pengetahuan Alam (IPA)', 'Ilmu Pengetahuan Sosial (IPS)',
  'Informatika'
];

const mapelFWajib = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Matematika', 'Bahasa Inggris', 'Pend. Jasmani, Olahraga, dan Kesehatan',
  'Seni Budaya', 'Prakarya dan Kewirausahaan (PKWU)', 'Sejarah'
];

const mapelFPilihan = [
  'Fisika', 'Kimia', 'Biologi', 'Matematika Tingkat Lanjut', 'Sosiologi', 'Ekonomi',
  'Geografi', 'Sejarah Tingkat Lanjut', 'Bahasa Indonesia Tingkat Lanjut',
  'Bahasa Inggris Tingkat Lanjut', 'Bahasa & Sastra Prancis', 'Informatika Tingkat Lanjut'
];

let html = `
        <!-- ── PAGE: AKADEMIK ── -->
        <div id="student-page-akademik" style="display:none">
          <div style="margin-bottom:20px;">
            <h2 style="margin:0 0 4px 0;font-size:20px;font-weight:800;color:var(--text-primary);">Nilai Akademik (Kurikulum Merdeka)</h2>
            <p style="margin:0;font-size:13px;color:var(--text-muted);">Masukkan nilai rapor dari Semester 1 hingga Semester 6.</p>
          </div>
          
          <form id="student-akademik-form" onsubmit="event.preventDefault(); StudentApp.saveAkademik();">
            
            <!-- FASE E (Kelas 10) -->
            <div style="margin-bottom:24px;">
              <h3 style="font-size:16px; font-weight:700; color:var(--accent); margin-bottom:12px; border-bottom:2px solid var(--border); padding-bottom:8px;">FASE E (KELAS 10)</h3>
`;

for (let sem = 1; sem <= 2; sem++) {
  html += `
              <details class="profile-accordion card" ${sem===1?'open':''}>
                <summary>Semester ${sem}</summary>
                <div class="accordion-content">
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
`;
  mapelE.forEach((m, i) => {
    html += `
                    <div class="form-group">
                      <label class="form-label">${i+1}. ${m}</label>
                      <input type="number" step="0.01" class="form-control" name="akademik_s${sem}_${i}" placeholder="0 - 100">
                    </div>
`;
  });
  html += `
                  </div>
                </div>
              </details>
`;
}

html += `
            </div>

            <!-- FASE F (Kelas 11 & 12) -->
            <div style="margin-bottom:24px;">
              <h3 style="font-size:16px; font-weight:700; color:var(--accent); margin-bottom:12px; border-bottom:2px solid var(--border); padding-bottom:8px;">FASE F (KELAS 11 & 12)</h3>
              
              <div class="card" style="margin-bottom:16px; background:var(--bg-secondary);">
                <h4 style="margin:0 0 12px 0; font-size:14px;">Pilih 4 Mata Pelajaran Pilihan:</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
`;
for (let p = 1; p <= 4; p++) {
  html += `
                  <div class="form-group">
                    <label class="form-label">Pilihan ${p}</label>
                    <select class="form-control" id="akademik_pil_${p}" onchange="StudentApp.updateMapelPilihan()">
                      <option value="">— Pilih Mapel —</option>
                      ${mapelFPilihan.map(m => '<option value="' + m + '">' + m + '</option>').join('')}
                    </select>
                  </div>
`;
}
html += `
                </div>
              </div>
`;

for (let sem = 3; sem <= 6; sem++) {
  html += `
              <details class="profile-accordion card">
                <summary>Semester ${sem}</summary>
                <div class="accordion-content">
                  <div style="font-weight:600; margin-bottom:12px; color:var(--text-secondary);">Mata Pelajaran Wajib</div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
`;
  mapelFWajib.forEach((m, i) => {
    html += `
                    <div class="form-group">
                      <label class="form-label">${i+1}. ${m}</label>
                      <input type="number" step="0.01" class="form-control" name="akademik_s${sem}_w${i}" placeholder="0 - 100">
                    </div>
`;
  });
  html += `
                  </div>
                  <div style="font-weight:600; margin-bottom:12px; color:var(--text-secondary);">Mata Pelajaran Pilihan</div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
`;
  for (let p = 1; p <= 4; p++) {
    html += `
                    <div class="form-group">
                      <label class="form-label label-pil-${p}">Pilihan ${p}</label>
                      <input type="number" step="0.01" class="form-control" name="akademik_s${sem}_p${p}" placeholder="0 - 100">
                    </div>
`;
  }
  html += `
                  </div>
                </div>
              </details>
`;
}

html += `
            </div>
            
            <div class="card" style="margin-top:20px;">
              <div style="display:flex;gap:10px;align-items:center;justify-content:flex-end;">
                <span id="akademik-save-status" style="font-size:13px;color:var(--belajar);font-weight:600;margin-right:10px;"></span>
                <button type="submit" class="btn btn-primary" style="padding:10px 24px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-3px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Simpan Nilai Akademik
                </button>
              </div>
            </div>

          </form>
        </div>
`;

fs.writeFileSync('C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\akademik_snippet.html', html);
console.log('Snippet generated.');
