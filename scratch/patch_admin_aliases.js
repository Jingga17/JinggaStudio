const fs = require('fs');
const path = require('path');

const adminPath = path.join('C:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/js/pages/admin.js');
let content = fs.readFileSync(adminPath, 'utf-8');

const ALIASES = `
  // ─────────────────────────────────────
  // ALIAS METHODS (navigateTo compatibility)
  // ─────────────────────────────────────
  async loadGlobalDashboard() { await this.loadHome(); },
  async loadDashboardData()   { await this.loadHome(); },
  async loadMasterSiswa()     { await this.loadDataMaster(); },
  async loadSettings()        { await this.loadPengaturan(); },
  populateLaporanSesi()       { this.loadLaporan(); },
  checkYearlyNotif() {
    const today = new Date();
    if (!this.yearlyNotifShown && today.getMonth() === 5 && today.getDate() >= 1) {
      this.yearlyNotifShown = true;
      Toast.info('Reminder: Pastikan data siswa sudah diperbarui untuk tahun ajaran baru.');
    }
  },
  loadDataMaster()            { return this.loadMasterData ? this.loadMasterData() : Promise.resolve(); },

`;

// Inject before loadHome
const MARKER = 'async loadHome()';
const idx = content.indexOf(MARKER);
if (idx === -1) {
  console.error('Marker not found: ' + MARKER);
  process.exit(1);
}

// Check if aliases already exist
if (content.includes('ALIAS METHODS')) {
  console.log('Aliases already exist, skipping.');
  process.exit(0);
}

content = content.slice(0, idx) + ALIASES.trimStart() + content.slice(idx);
fs.writeFileSync(adminPath, content, 'utf-8');
console.log('Aliases injected successfully!');
