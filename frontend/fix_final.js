const fs = require('fs');
let content = fs.readFileSync('frontend/js/pages/admin.js', 'utf8');

// 1. Fix switchPemetaanTab
content = content.replace(
  "btn.style.borderColor = 'var(--border)';",
  "btn.style.border = '1px solid var(--border)';"
).replace(
  "btn.style.borderColor = '';",
  "btn.style.border = '';"
);

// 2. Fix renderMasterSiswa null checks
content = content.replace(
  /const matchKelas = !kelasFilter \|\| s\.kelas === kelasFilter;[\s\S]*?s\.nisn\.includes\(searchFilter\);\s*return matchKelas && matchSearch;/g,
  `const matchKelas = !kelasFilter || s.kelas === kelasFilter;
      const nama = s.nama || '';
      const nisn = s.nisn ? String(s.nisn) : '';
      const matchSearch = !searchFilter || 
                          nama.toLowerCase().includes(searchFilter) || 
                          nisn.toLowerCase().includes(searchFilter);
      return matchKelas && matchSearch;`
);

// 3. Add exportBukuIndukExcel and exportRaporExcel at the end, before the last }
const adminAppClosingIdx = content.lastIndexOf('}');
if (adminAppClosingIdx !== -1) {
  const exportsLogic = `
  ,exportBukuIndukExcel() {
    const filterClass = document.getElementById('buku-induk-kelas-filter') ? document.getElementById('buku-induk-kelas-filter').value : '';
    const searchQuery = document.getElementById('buku-induk-search') ? document.getElementById('buku-induk-search').value.toLowerCase() : '';
    
    let filteredStudents = this.bukuIndukData || [];
    
    if (filterClass) {
      filteredStudents = filteredStudents.filter(s => s.kelas === filterClass);
    }
    if (searchQuery) {
      filteredStudents = filteredStudents.filter(s => 
        (s.nama && s.nama.toLowerCase().includes(searchQuery)) || 
        (s.nisn && String(s.nisn).toLowerCase().includes(searchQuery))
      );
    }

    if (!filteredStudents || filteredStudents.length === 0) return Toast.error('Tidak ada data untuk diexport');

    let rootKeys = new Set();
    let dpKeys = new Set();
    let naKeys = new Set();

    filteredStudents.forEach(s => {
      Object.keys(s).forEach(k => {
        if (!['id', 'password_hash', 'data_pribadi', 'nilai_akademik', 'is_valid', 'is_complete'].includes(k)) {
          rootKeys.add(k);
        }
      });
      try {
        if (s.data_pribadi) {
          const p = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi;
          Object.keys(p).forEach(k => dpKeys.add(k));
        }
      } catch(e) {}
      try {
        if (s.nilai_akademik) {
          const n = typeof s.nilai_akademik === 'string' ? JSON.parse(s.nilai_akademik) : s.nilai_akademik;
          Object.keys(n).forEach(k => naKeys.add(k));
        }
      } catch(e) {}
    });

    const rootArray = Array.from(rootKeys);
    const dpArray = Array.from(dpKeys);
    const naArray = Array.from(naKeys);

    let csvRows = [];
    let headers = [];
    
    rootArray.forEach(k => headers.push(k.toUpperCase()));
    dpArray.forEach(k => headers.push(k.replace(/_/g, ' ').toUpperCase()));
    naArray.forEach(k => headers.push('NILAI ' + k.replace(/_/g, ' ').toUpperCase()));
    
    csvRows.push(headers.map(h => '"' + h + '"').join(','));

    filteredStudents.forEach(s => {
      const row = [];
      let p = {};
      try { if (s.data_pribadi) p = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi; } catch (e) {}
      let n = {};
      try { if (s.nilai_akademik) n = typeof s.nilai_akademik === 'string' ? JSON.parse(s.nilai_akademik) : s.nilai_akademik; } catch (e) {}

      rootArray.forEach(k => {
        let val = s[k] || '';
        val = String(val).replace(/"/g, '""');
        row.push('"' + val + '"');
      });
      dpArray.forEach(k => {
        let val = p[k] || '';
        if (Array.isArray(val)) val = val.join('; ');
        val = String(val).replace(/"/g, '""');
        row.push('"' + val + '"');
      });
      naArray.forEach(k => {
        let val = n[k] || '';
        val = String(val).replace(/"/g, '""');
        row.push('"' + val + '"');
      });

      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8,\\uFEFF" + csvRows.join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Buku_Induk_Siswa' + (filterClass ? '_Kelas_' + filterClass : '') + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportRaporExcel() {
    const token = localStorage.getItem('token');
    const kelas = document.getElementById('buku-induk-kelas-filter') ? document.getElementById('buku-induk-kelas-filter').value : '';
    let url = API_BASE + '/export/rapor?token=' + token;
    if (kelas) url += '&kelas=' + encodeURIComponent(kelas);
    window.location.href = url;
  }
`;
  content = content.substring(0, adminAppClosingIdx) + exportsLogic + content.substring(adminAppClosingIdx);
}

fs.writeFileSync('frontend/js/pages/admin.js', content, 'utf8');
console.log('admin.js fixed completely.');
