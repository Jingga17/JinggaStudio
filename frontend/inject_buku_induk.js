const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'admin.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Insert Sidebar item
const navItemHTML = `
      <div class="nav-item" data-page="buku-induk">
        <span class="nav-icon" style="display:flex; align-items:center; justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </span>
        <span>Buku Induk Siswa</span>
      </div>
`;

if (!html.includes('data-page="buku-induk"')) {
    html = html.replace(
        '<div class="nav-item" data-page="laporan">',
        navItemHTML + '\n      <div class="nav-item" data-page="laporan">'
    );
}

// 2. Insert Page section
const pageHTML = `
      <!-- ═══════════════════════════════════
           PAGE: BUKU INDUK SISWA
      ═══════════════════════════════════ -->
      <div id="page-buku-induk" class="page" style="display:none">
        <div class="card">
          <div class="section-title" style="margin-bottom:16px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Buku Induk Siswa
          </div>
          <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Cari dan klik tombol detail pada siswa untuk melihat portofolio lengkap mereka (Biodata, Rapor, Ekskul, Prestasi).</p>

          <!-- Filter & Search -->
          <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
            <select id="buku-induk-kelas-filter" class="form-control" style="width:180px;" onchange="AdminApp.renderBukuIndukList()">
              <option value="">Semua Kelas</option>
            </select>
            <input id="buku-induk-search" type="text" class="form-control search-input" placeholder="Cari Nama atau NISN..." oninput="AdminApp.renderBukuIndukList()" style="flex:1; min-width:200px;">
          </div>

          <!-- Tabel Buku Induk -->
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:50px;">No</th>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th style="text-align:center;">Aksi</th>
                </tr>
              </thead>
              <tbody id="tbody-buku-induk">
                <tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Memuat data...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Slide-over Drawer untuk Detail Buku Induk -->
      <div id="buku-induk-drawer-overlay" class="drawer-overlay" onclick="AdminApp.closeBukuIndukDetail()"></div>
      <div id="buku-induk-drawer" class="drawer">
        <div class="drawer-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="drawer-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h3 id="drawer-student-name" style="margin:0; font-size:18px; color:var(--text-primary);">Nama Siswa</h3>
              <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
                NISN: <span id="drawer-student-nisn" style="font-family:monospace;font-weight:600;">-</span> • 
                Kelas: <span id="drawer-student-kelas" style="font-weight:600;color:var(--accent);">-</span>
              </div>
            </div>
          </div>
          <button class="btn btn-ghost" onclick="AdminApp.closeBukuIndukDetail()" style="padding:6px; font-size:18px;">✖</button>
        </div>
        
        <div class="drawer-tabs">
          <div class="drawer-tab active" onclick="AdminApp.switchDrawerTab('biodata')">Biodata</div>
          <div class="drawer-tab" onclick="AdminApp.switchDrawerTab('akademik')">Akademik</div>
          <div class="drawer-tab" onclick="AdminApp.switchDrawerTab('non-akademik')">Non-Akademik</div>
          <div class="drawer-tab" onclick="AdminApp.switchDrawerTab('dcm')">Hasil DCM</div>
        </div>

        <div class="drawer-body">
          <div id="drawer-content-biodata" class="drawer-content-pane active">
            <div id="drawer-biodata-view">Memuat biodata...</div>
          </div>
          <div id="drawer-content-akademik" class="drawer-content-pane">
            <div id="drawer-akademik-view">Memuat nilai rapor...</div>
          </div>
          <div id="drawer-content-non-akademik" class="drawer-content-pane">
            <div id="drawer-non-akademik-view">Memuat portofolio...</div>
          </div>
          <div id="drawer-content-dcm" class="drawer-content-pane">
            <div id="drawer-dcm-view">Memuat asesmen...</div>
          </div>
        </div>
      </div>
`;

if (!html.includes('id="page-buku-induk"')) {
    html = html.replace(
        '<!-- ═══════════════════════════════════\r\n           PAGE: CETAK LAPORAN',
        pageHTML + '\n\n      <!-- ═══════════════════════════════════\r\n           PAGE: CETAK LAPORAN'
    );
}

fs.writeFileSync(filePath, html, 'utf-8');
console.log('admin.html updated successfully.');
