const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM';
const adminPath = path.join(cwd, 'frontend', 'js', 'pages', 'admin.js');

try {
  console.log("1. Mereset admin.js ke versi asli...");
  execSync('git checkout HEAD -- frontend/js/pages/admin.js', { cwd });
  
  let content = fs.readFileSync(adminPath, 'utf-8');
  
  console.log("2. Menghapus baris loadDataMaster ganda...");
  content = content.replace(/loadDataMaster\(\)\s*\{\s*return this\.loadMasterData\s*\?\s*this\.loadMasterData\(\)\s*:\s*Promise\.resolve\(\);\s*\},/, '');
  
  console.log("3. Menyuntikkan metode Data Master Siswa...");
  const newMethods = `  // ─────────────────────────────────────
  // DATA MASTER SISWA
  // ─────────────────────────────────────
  async loadDataMaster() {
    Spinner.show();
    try {
      const res = await API.get('/students/master');
      this.masterSiswaData = (res && res.data) ? res.data : [];
      
      const filterSelect = document.getElementById('master-kelas-filter');
      if (filterSelect) {
        const currentVal = filterSelect.value;
        const kelasSet = new Set();
        this.masterSiswaData.forEach(s => s.kelas && kelasSet.add(s.kelas));
        filterSelect.innerHTML = '<option value="">Semua Kelas</option>';
        Array.from(kelasSet).sort().forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          filterSelect.appendChild(opt);
        });
        filterSelect.value = currentVal || '';
      }
      
      this.renderMasterSiswa();
    } catch(e) {
      console.error(e);
      Toast.error('Gagal memuat data master siswa');
    }
    Spinner.hide();
  },

  renderMasterSiswa() {
    const tbody = document.getElementById('tbody-master-siswa');
    if (!tbody) return;
    
    if (!this.masterSiswaData || this.masterSiswaData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Belum ada data siswa.</td></tr>';
      return;
    }
    
    const filterSelect = document.getElementById('master-kelas-filter');
    const searchInput = document.getElementById('master-search');
    
    const filterVal = filterSelect ? filterSelect.value : '';
    const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filtered = this.masterSiswaData.filter(s => {
      const matchKelas = !filterVal || s.kelas === filterVal;
      const matchSearch = !searchVal || 
                          (s.nama && s.nama.toLowerCase().includes(searchVal)) || 
                          (s.nisn && s.nisn.toLowerCase().includes(searchVal));
      return matchKelas && matchSearch;
    });
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Tidak ada data ditemukan.</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map((s, i) => \`
      <tr class="hover-row">
        <td style="text-align:center;">\${i + 1}</td>
        <td>\${s.nisn || '-'}</td>
        <td style="font-weight:500;">\${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">\${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetPasswordMaster(\${s.id}, '\${s.nisn}')" title="Reset Password ke NISN">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Reset
          </button>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-sm" style="background:var(--danger);color:white;border:none" onclick="AdminApp.deleteMasterSiswa(\${s.id}, '\${s.nama.replace(/'/g, "\\\\'")}')">
            Hapus
          </button>
        </td>
      </tr>
    \`).join('');
  },

  async resetPasswordMaster(id, nisn) {
    if(!confirm('Reset password ke default (NISN: ' + nisn + ')?')) return;
    try {
      const res = await API.post('/students/master/' + id + '/reset-password');
      if (res && res.status === 'success') {
        Toast.success(res.message || 'Password direset');
      }
    } catch(e) {
      Toast.error('Gagal reset password: ' + e.message);
    }
  },

  async deleteMasterSiswa(id, nama) {
    if(!confirm('Hapus permanen data siswa "' + nama + '" beserta nilai & jawabannya?')) return;
    try {
      const res = await API.post('/students/master/' + id + '/delete');
      if (res && res.status === 'success') {
        Toast.success(res.message || 'Siswa dihapus');
        this.loadDataMaster(); // refresh
      }
    } catch(e) {
      Toast.error('Gagal menghapus: ' + e.message);
    }
  },

  showAddSiswaModal() {
    Modal.show('Tambah/Impor Siswa', \`
      <p style="margin-top:0;font-size:13px;color:var(--text-muted)">Fitur ini belum diimplementasi pada demo ini. Anda bisa menggunakan file template Excel untuk mengimpor data secara massal.</p>
      <div style="margin-top:15px;text-align:center">
        <button class="btn btn-outline" disabled>Download Template</button>
        <button class="btn btn-primary" disabled>Upload Data</button>
      </div>
    \`, () => {
      Modal.hide();
    });
  }
};
window.AdminApp = AdminApp;`;

  // Find the closing bracket of the last method before the end of the object
  content = content.replace(/(})(\s*)\n*};\s*window\.AdminApp = AdminApp;/, "$1,$2\n" + newMethods);
  
  fs.writeFileSync(adminPath, content, 'utf-8');
  console.log("4. admin.js sukses diperbaiki!");
} catch (e) {
  console.error("GAGAL: ", e.message);
}
