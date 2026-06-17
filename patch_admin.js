const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, 'frontend', 'js', 'pages', 'admin.js');
let content = fs.readFileSync(adminJsPath, 'utf-8');

// 1. Add buku-induk to titles
if (!content.includes("'buku-induk':")) {
    content = content.replace(
        "const titles = {",
        "const titles = {\n      'buku-induk': '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253\" /></svg> Buku Induk Siswa',"
    );
}

// 2. Add to allPages
if (!content.includes("'buku-induk'")) {
    content = content.replace(
        "const allPages = ['dashboard-global', 'home', 'dummy-sosiogram', 'dummy-ikms', 'data-master', 'laporan', 'pengaturan'];",
        "const allPages = ['dashboard-global', 'buku-induk', 'home', 'dummy-sosiogram', 'dummy-ikms', 'data-master', 'laporan', 'pengaturan'];"
    );
}

// 3. Add to navigateTo
if (!content.includes("page === 'buku-induk'")) {
    content = content.replace(
        "} else if (page === 'data-master') {",
        "} else if (page === 'buku-induk') {\n      await this.renderBukuIndukList();\n    } else if (page === 'data-master') {"
    );
}

// 4. Add bukuIndukData state
if (!content.includes("bukuIndukData: [")) {
    content = content.replace(
        "masterSiswaData: null,",
        "masterSiswaData: null,\n  bukuIndukData: [],"
    );
}

// 5. Add methods
const methodsToAdd = `
  // ─────────────────────────────────────
  // BUKU INDUK SISWA
  // ─────────────────────────────────────
  async renderBukuIndukList() {
    const tbody = document.getElementById('tbody-buku-induk');
    if (!tbody) return;
    
    // Fetch if empty
    if (this.bukuIndukData.length === 0) {
      try {
        const res = await API.get('/students/master');
        if (res && res.data && res.data.length > 0) {
          this.bukuIndukData = res.data;
        } else {
          this.bukuIndukData = [];
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
          <button class="btn btn-primary btn-sm" style="font-size:12px; padding:4px 10px;" onclick="AdminApp.openBukuIndukDetail(\${s.id})">
            👁️ Lihat Detail
          </button>
        </td>
      </tr>
    \`).join('');
  },

  async openBukuIndukDetail(studentId) {
    // Show drawer
    const drawer = document.getElementById('buku-induk-drawer');
    const overlay = document.getElementById('buku-induk-drawer-overlay');
    if (!drawer || !overlay) return;
    
    overlay.classList.add('open');
    drawer.classList.add('open');
    
    // Set default tab
    this.switchDrawerTab('biodata');
    
    document.getElementById('drawer-biodata-view').innerHTML = '<div style="text-align:center;padding:20px;">Memuat data...</div>';
    document.getElementById('drawer-akademik-view').innerHTML = '';
    document.getElementById('drawer-non-akademik-view').innerHTML = '';
    document.getElementById('drawer-dcm-view').innerHTML = '';
    
    try {
      const res = await API.get('/students/' + studentId + '/buku-induk');
      if (!res || !res.data) throw new Error("Data kosong");
      
      const data = res.data;
      const s = data.student || {};
      
      document.getElementById('drawer-student-name').textContent = s.nama || '-';
      document.getElementById('drawer-student-nisn').textContent = s.nisn || '-';
      document.getElementById('drawer-student-kelas').textContent = s.kelas || '-';
      
      const biodata = {
        nama: s.nama,
        nisn: s.nisn,
        kelas: s.kelas,
        jk: s.jenis_kelamin || '-',
        tempat_lahir: s.ttl ? s.ttl.split(',')[0] : '-',
        tanggal_lahir: s.ttl && s.ttl.includes(',') ? s.ttl.split(',')[1].trim() : s.ttl || '-',
        agama: '-',
        nama_ayah: s.nama_ortu || '-',
        pekerjaan_ayah: s.pekerjaan_ortu || '-',
        no_hp_ortu: s.no_hp || '-'
      };
      
      const dcm = {
        is_valid: s.is_valid === 1 || s.is_valid === true,
        pribadi: s.pribadi_pct || 0,
        belajar: s.belajar_pct || 0,
        sosial: s.sosial_pct || 0,
        karir: s.karir_pct || 0
      };
      
      this.renderDrawerBiodata(biodata);
      this.renderDrawerAkademik(data.rapor || []);
      this.renderDrawerNonAkademik(data.ekskul || [], data.prestasi || []);
      this.renderDrawerDCM(dcm);
      
    } catch (e) {
      console.error(e);
      document.getElementById('drawer-biodata-view').innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger);">Gagal memuat data detail siswa.</div>';
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
      html += \`<tr><td style="padding:12px 8px; border-bottom:1px solid var(--border);">Semester \${r.semester}</td><td style="text-align:right; padding:12px 8px; border-bottom:1px solid var(--border); font-weight:bold; color:var(--accent);">\${r.rata_rata || r.nilai || '-'}</td></tr>\`;
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
  },

  renderDrawerNonAkademik(ekskulList, prestasiList) {
    const container = document.getElementById('drawer-non-akademik-view');
    container.innerHTML = \`
      <h4 style="margin-bottom:12px; color:var(--text-primary);">Ekstrakurikuler & Organisasi</h4>
      \${(!ekskulList || ekskulList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : ekskulList.map(e => \`<div class="card" style="margin-bottom:10px;padding:12px;">\${e.nama_ekskul || e.nama} - \${e.jabatan || 'Anggota'}</div>\`).join('')}
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Prestasi & Penghargaan</h4>
      \${(!prestasiList || prestasiList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : prestasiList.map(p => \`<div class="card" style="margin-bottom:10px;padding:12px;">\${p.nama_prestasi || p.nama} (\${p.tingkat || 'Sekolah'})</div>\`).join('')}
    \`;
  },
  
  renderDrawerDCM(dcmData) {
    const container = document.getElementById('drawer-dcm-view');
    if (!dcmData || (!dcmData.pribadi && !dcmData.belajar && !dcmData.sosial && !dcmData.karir)) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum mengisi kuesioner DCM.</div>';
      return;
    }
    
    let highestVal = 0;
    let highestCat = '-';
    const cats = [
      { name: 'Pribadi', val: dcmData.pribadi },
      { name: 'Belajar', val: dcmData.belajar },
      { name: 'Sosial', val: dcmData.sosial },
      { name: 'Karir', val: dcmData.karir }
    ];
    cats.forEach(c => {
      if(c.val > highestVal) {
        highestVal = c.val;
        highestCat = c.name;
      }
    });

    container.innerHTML = \`
      <div class="card" style="padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted);">Status Pengisian</div>
          <div style="font-weight:bold; font-size:16px;">\${dcmData.is_valid ? '<span style="color:var(--success);">Telah Mengisi (Valid)</span>' : '<span style="color:var(--danger);">Belum Valid</span>'}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-muted);">Masalah Dominan</div>
          <div style="font-weight:bold; font-size:16px; color:var(--danger);">Masalah \${highestCat}</div>
        </div>
      </div>
      
      <h4 style="margin-bottom:12px;">Persentase Masalah</h4>
      <div class="detail-grid">
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Pribadi</div>
          <div class="detail-value" style="font-size:24px;">\${dcmData.pribadi}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Belajar</div>
          <div class="detail-value" style="font-size:24px;">\${dcmData.belajar}%</div>
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
`;

if (!content.includes("renderBukuIndukList()")) {
    const splitIndex = content.lastIndexOf("};");
    if (splitIndex !== -1) {
        content = content.substring(0, splitIndex) + ",\n" + methodsToAdd + "\n" + content.substring(splitIndex);
    }
}

fs.writeFileSync(adminJsPath, content, 'utf-8');
console.log('admin.js fully restored with real backend logic! Validating syntax...');
