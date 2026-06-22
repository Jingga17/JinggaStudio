const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/js/pages/admin.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/renderPemetaanSiswa\(\) \{[\s\S]*?const filteredStudents = selectedClass \n\s+\? this\.bukuIndukData\.filter\(s => s\.kelas === selectedClass\)\n\s+: this\.bukuIndukData;/,
`async renderPemetaanSiswa() {
    if (!this.activePemetaanTab) this.activePemetaanTab = 'demografi';
    const tabId = this.activePemetaanTab;
    const filterEl = _('filter-pemetaan-kelas');

    if (!this.bukuIndukData || this.bukuIndukData.length === 0) {
      try {
        const res = await API.get('/students/master');
        if (res && res.data) {
          this.bukuIndukData = res.data;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const selectedClass = filterEl ? filterEl.value : '';
    const filteredStudents = selectedClass 
      ? this.bukuIndukData.filter(s => s.kelas === selectedClass)
      : this.bukuIndukData;`);

fs.writeFileSync(file, content);
console.log('Fixed admin.js');
