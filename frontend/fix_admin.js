const fs = require('fs');
const path = require('path');

const jsCode = `
  async openBukuIndukDetail(id, nama, nisn, kelas) {
    document.getElementById('drawer-student-name').textContent = nama || '-';
    document.getElementById('drawer-student-nisn').textContent = nisn || '-';
    document.getElementById('drawer-student-kelas').textContent = kelas || '-';
    
    document.getElementById('buku-induk-drawer-overlay').classList.add('open');
    document.getElementById('buku-induk-drawer').classList.add('open');
    
    this.switchDrawerTab('biodata');
    
    document.getElementById('drawer-biodata-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Biodata...</div>';
    document.getElementById('drawer-akademik-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Riwayat Akademik...</div>';
    document.getElementById('drawer-non-akademik-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Riwayat Non-Akademik...</div>';
    document.getElementById('drawer-dcm-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Hasil Asesmen DCM...</div>';
    
    try {
      await new Promise(r => setTimeout(r, 600)); // Simulate network load
      
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
      console.error(e);
      document.getElementById('drawer-biodata-view').innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">Gagal memuat data.</div>';
    }
  },

  closeBukuIndukDetail() {
    document.getElementById('buku-induk-drawer-overlay').classList.remove('open');
    document.getElementById('buku-induk-drawer').classList.remove('open');
  },

  switchDrawerTab(tabId) {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.drawer-content-pane').forEach(p => p.classList.remove('active'));
    
    const targetTab = Array.from(document.querySelectorAll('.drawer-tab')).find(el => el.getAttribute('onclick').includes(tabId));
    if (targetTab) targetTab.classList.add('active');
    
    const targetPane = document.getElementById(\`drawer-content-\${tabId}\`);
    if (targetPane) targetPane.classList.add('active');
  },

  renderDrawerBiodata(data) {
    const container = document.getElementById('drawer-biodata-view');
    container.innerHTML = \`
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Lengkap</div>
          <div class="detail-value">\${data.nama || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">NISN</div>
          <div class="detail-value">\${data.nisn || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Kelas</div>
          <div class="detail-value">\${data.kelas || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Jenis Kelamin</div>
          <div class="detail-value">\${data.jk || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Tempat, Tanggal Lahir</div>
          <div class="detail-value">\${data.tempat_lahir || '-'}, \${data.tanggal_lahir || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Agama</div>
          <div class="detail-value">\${data.agama || '-'}</div>
        </div>
      </div>
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Data Orang Tua / Wali</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Ayah</div>
          <div class="detail-value">\${data.nama_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pekerjaan Ayah</div>
          <div class="detail-value">\${data.pekerjaan_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">No. HP Orang Tua</div>
          <div class="detail-value" style="display:flex; align-items:center; gap:8px;">
            \${data.no_hp_ortu || '-'}
          </div>
        </div>
      </div>
    \`;
  },
  
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
    
    html += '<div class="card" style="margin-top:24px; padding:16px; background:var(--accent-glow);"><h4 style="margin:0 0 8px 0; color:var(--accent);">Tren Nilai: Meningkat 📈</h4><p style="margin:0; font-size:13px; color:var(--text-muted);">Nilai rata-rata siswa menunjukkan peningkatan yang stabil selama 4 semester terakhir.</p></div>';
    
    container.innerHTML = html;
  },

  renderDrawerNonAkademik(ekskulList, prestasiList) {
    const container = document.getElementById('drawer-non-akademik-view');
    container.innerHTML = \`
      <h4 style="margin-bottom:12px; color:var(--text-primary);">Ekstrakurikuler & Organisasi</h4>
      \${(!ekskulList || ekskulList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : ekskulList.map(e => \`<div class="card" style="margin-bottom:10px;padding:12px;">\${e.nama_ekskul} - \${e.jabatan}</div>\`).join('')}
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Prestasi & Penghargaan</h4>
      \${(!prestasiList || prestasiList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : prestasiList.map(p => \`<div class="card" style="margin-bottom:10px;padding:12px;">\${p.nama_prestasi} (\${p.tingkat})</div>\`).join('')}
    \`;
  },
  
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
  }
};

window.AdminApp = AdminApp;
`;

const filePath = path.join(__dirname, 'js', 'pages', 'admin.js');
let currentJS = fs.readFileSync(filePath, 'utf-8');

// Find the start of openBukuIndukDetail and replace to the end
const splitIndex = currentJS.indexOf('async openBukuIndukDetail(id, nama, nisn, kelas) {');

if (splitIndex !== -1) {
  currentJS = currentJS.substring(0, splitIndex) + jsCode;
  fs.writeFileSync(filePath, currentJS, 'utf-8');
  console.log('admin.js completely fixed and dummy data injected.');
} else {
  console.log('Failed to find openBukuIndukDetail.');
}
