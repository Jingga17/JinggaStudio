const fs = require('fs');
const path = require('path');

const jsInjection = `
  // ══════════════════════════════════════════
  // BUKU INDUK SISWA
  // ══════════════════════════════════════════
  bukuIndukData: [],
  
  async renderBukuIndukList() {
    const tbody = document.getElementById('tbody-buku-induk');
    if (!tbody) return;
    
    // Fetch if empty
    if (this.bukuIndukData.length === 0) {
      try {
        const res = await API.get('/admin/siswa');
        if (res && res.data) {
          this.bukuIndukData = res.data;
        }
      } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--danger)">Gagal memuat data</td></tr>';
        return;
      }
    }
    
    // Populate Kelas Filter if empty
    const filterSelect = document.getElementById('buku-induk-kelas-filter');
    if (filterSelect && filterSelect.options.length === 1) {
      const kelasSet = new Set();
      this.bukuIndukData.forEach(s => s.kelas && kelasSet.add(s.kelas));
      Array.from(kelasSet).sort().forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        filterSelect.appendChild(opt);
      });
    }
    
    const filterVal = filterSelect ? filterSelect.value : '';
    const searchVal = document.getElementById('buku-induk-search') ? document.getElementById('buku-induk-search').value.toLowerCase() : '';
    
    const filtered = this.bukuIndukData.filter(s => {
      const matchKelas = !filterVal || s.kelas === filterVal;
      const matchSearch = !searchVal || (s.nama && s.nama.toLowerCase().includes(searchVal)) || (s.nisn && s.nisn.toLowerCase().includes(searchVal));
      return matchKelas && matchSearch;
    });
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Tidak ada data siswa ditemukan.</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map((s, i) => \`
      <tr class="hover-row">
        <td>\${i + 1}</td>
        <td>\${s.nisn || '-'}</td>
        <td style="font-weight:500; color:var(--text-primary);">\${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">\${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-primary btn-sm" style="font-size:12px; padding:4px 10px;" onclick="AdminApp.openBukuIndukDetail(\${s.id}, '\${s.nama.replace(/'/g, "\\\\'")}', '\${s.nisn}', '\${s.kelas}')">
            👁️ Lihat Detail
          </button>
        </td>
      </tr>
    \`).join('');
  },

  async openBukuIndukDetail(id, nama, nisn, kelas) {
    document.getElementById('drawer-student-name').textContent = nama || '-';
    document.getElementById('drawer-student-nisn').textContent = nisn || '-';
    document.getElementById('drawer-student-kelas').textContent = kelas || '-';
    
    document.getElementById('buku-induk-drawer-overlay').classList.add('open');
    document.getElementById('buku-induk-drawer').classList.add('open');
    
    // Switch to first tab initially
    this.switchDrawerTab('biodata');
    
    // Set loading states
    document.getElementById('drawer-biodata-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Biodata...</div>';
    document.getElementById('drawer-akademik-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Riwayat Akademik...</div>';
    document.getElementById('drawer-non-akademik-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Riwayat Non-Akademik...</div>';
    document.getElementById('drawer-dcm-view').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Memuat Hasil Asesmen DCM...</div>';
    
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
      
    } catch (e) {
      console.error(e);
      // Fallback: If the endpoint doesn't exist yet, we just show a mockup or gracefully handle it.
      this.renderDrawerBiodata({ nama, nisn, kelas, message: 'Data lengkap belum tersedia dari server.' });
      document.getElementById('drawer-akademik-view').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Data rapor kosong.</div>';
      document.getElementById('drawer-non-akademik-view').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Data portofolio kosong.</div>';
      document.getElementById('drawer-dcm-view').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Data asesmen belum diisi.</div>';
    }
  },

  closeBukuIndukDetail() {
    document.getElementById('buku-induk-drawer-overlay').classList.remove('open');
    document.getElementById('buku-induk-drawer').classList.remove('open');
  },

  switchDrawerTab(tabId) {
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.drawer-content-pane').forEach(p => p.classList.remove('active'));
    
    // Find tab element based on onclick attribute string
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
    // Simplistic render for now
    container.innerHTML = \`<p style="color:var(--success);">Ditemukan \${raporList.length} entri rapor. (Dalam pengembangan)</p>\`;
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
      <div class="card" style="padding:16px;">
        Status DCM: <strong>\${dcmData.is_valid ? '<span style="color:var(--success);">Valid</span>' : '<span style="color:var(--danger);">Tidak Valid</span>'}</strong>
      </div>
    \`;
  },

`;

const filePath = path.join(__dirname, 'js', 'pages', 'admin.js');
let currentJS = fs.readFileSync(filePath, 'utf-8');

if (!currentJS.includes('openBukuIndukDetail')) {
    currentJS = currentJS.replace(/  \}\r?\n\};\r?\n(\r?\n)?window\.AdminApp = AdminApp;/, '  },\n\n' + jsInjection + '\n};\n\nwindow.AdminApp = AdminApp;');
    fs.writeFileSync(filePath, currentJS, 'utf-8');
    console.log('admin.js updated.');
} else {
    console.log('Already injected.');
}
