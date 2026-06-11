/**
 * DCM 220 — Admin App
 * Login, Home (Dashboard), Cetak Laporan, Pengaturan
 */

const AdminApp = {
  currentPage: 'home',
  filterKelas: '',
  filterNisn: '',
  tableData: [],
  chartDataCache: null,
  yearlyNotifShown: false,

  // ─────────────────────────────────────
  // INIT
  // ─────────────────────────────────────
  async init() {
    // Cek auth
    const token = Storage.getAdminToken();
    if (!token) { this.showLogin(); return; }

    this.setupSidebar();
    this.showAdminShell();
    await this.navigateTo('home');
    this.checkYearlyNotif();
  },

  // ─────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────
  showLogin() {
    _('admin-login').style.display   = 'flex';
    _('admin-shell').style.display  = 'none';
    _('login-form').onsubmit = async (e) => {
      e.preventDefault();
      await this.doLogin();
    };
    _('login-pass-toggle').onclick = () => {
      const inp = _('login-pass');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      _('login-pass-toggle').textContent = inp.type === 'password' ? '👁' : '🙈';
    };
  },

  async doLogin() {
    const username = _('login-user').value.trim();
    const password = _('login-pass').value;
    if (!username || !password) { Toast.error('Isi username dan password'); return; }

    _('login-btn').disabled = true;
    _('login-btn').innerHTML = '<div class="spinner spinner-sm"></div> Masuk...';
    _('login-error').style.display = 'none';

    try {
      const res = await API.login(username, password);
      Storage.saveAdminToken(res.token);
      Storage.saveAdminUser(res.user);
      _('login-btn').disabled = false;
      _('login-btn').innerHTML = 'Masuk';
      this.setupSidebar();
      this.showAdminShell();
      await this.navigateTo('home');
      this.checkYearlyNotif();
      Toast.success(`Selamat datang, ${res.user.nama}!`);
    } catch(e) {
      _('login-btn').disabled = false;
      _('login-btn').innerHTML = 'Masuk';
      _('login-error').textContent = e.message;
      _('login-error').style.display = 'block';
    }
  },

  async doLogout() {
    const ok = await Modal.confirm({ title:'Keluar?', body:'Anda akan keluar dari sistem admin.', confirmText:'Keluar', cancelText:'Batal' });
    if (!ok) return;
    await API.logout();
    Storage.clearAdminToken();
    _('admin-shell').style.display  = 'none';
    _('admin-login').style.display  = 'flex';
    Toast.info('Berhasil keluar');
  },

  showAdminShell() {
    _('admin-login').style.display  = 'none';
    _('admin-shell').style.display  = 'flex';
    const user = Storage.getAdminUser();
    if (user) {
      _('admin-name').textContent  = user.nama;
      _('avatar-initials').textContent = user.nama?.charAt(0).toUpperCase() || 'A';
    }
  },

  // ─────────────────────────────────────
  // SIDEBAR & NAVIGATION
  // ─────────────────────────────────────
  setupSidebar() {
    if (this.sidebarSetup) return;
    this.sidebarSetup = true;

    _('hamburger')?.addEventListener('click', () => this.toggleSidebar());
    _('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());
    _('logout-btn')?.addEventListener('click', () => this.doLogout());

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.closeSidebar();
        this.navigateTo(page);
      });
    });
  },
  toggleSidebar() {
    _('sidebar').classList.toggle('open');
    _('sidebar-overlay').style.display = _('sidebar').classList.contains('open') ? 'block' : 'none';
  },
  closeSidebar() {
    _('sidebar').classList.remove('open');
    _('sidebar-overlay').style.display = 'none';
  },

  async navigateTo(page) {
    this.currentPage = page;
    // Update nav
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    // Update topbar title
    const titles = { home:'🏠 Dashboard', laporan:'🖨️ Cetak Laporan', pengaturan:'⚙️ Pengaturan' };
    _('topbar-title').textContent = titles[page] || 'Dashboard';

    // Show/hide content
    ['home','laporan','pengaturan'].forEach(p => {
      const el = _(`page-${p}`);
      if (el) el.style.display = p === page ? 'block' : 'none';
    });

    // Load content
    if (page === 'home')        await this.loadHome();
    if (page === 'laporan')     await this.loadLaporan();
    if (page === 'pengaturan')  await this.loadPengaturan();
  },

  // ─────────────────────────────────────
  // HOME PAGE
  // ─────────────────────────────────────
  async loadHome() {
    Spinner.show();
    try {
      const [summary, sessions, kelas] = await Promise.all([
        API.getSummary(),
        API.getSessions(),
        API.getKelas(),
      ]);
      this.renderSummaryCards(summary);
      this.renderSessions(sessions);
      this.populateFilterDropdowns(kelas);
      await this.loadChartAndTable();
    } catch(e) {
      Toast.error('Gagal memuat data: ' + e.message);
    }
    Spinner.hide();
  },

  renderSummaryCards(summary) {
    _('stat-responden').textContent = summary.total_responden ?? 0;
    _('stat-kelas').textContent     = summary.total_kelas ?? 0;
    _('stat-pct').textContent       = (summary.persentase_pengisian ?? 0) + '%';
  },

  renderSessions(sessions) {
    const container = _('sessions-list');
    if (!container) return;
    if (!sessions?.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0">Belum ada sesi yang dibuat.</p>';
      return;
    }
    container.innerHTML = sessions.map(s => `
      <div class="link-item fade-in" id="session-${s.id}">
        <div style="flex:1;min-width:0">
          <div class="link-url">${s.url || `${window.location.origin}/index.html?token=${s.token}`}</div>
          <div class="link-meta">
            <span class="badge ${s.is_active ? 'badge-aktif' : 'badge-ditutup'}">${s.is_active ? '● Aktif' : '✕ Ditutup'}</span>
            ${formatDate(s.created_at)}
          </div>
        </div>
        <div class="link-actions">
          ${s.is_active ? `
            <button class="btn btn-outline btn-sm" title="Salin link" onclick="copyToClipboard('${s.url || window.location.origin+'/index.html?token='+s.token}')">📋</button>
            <button class="btn btn-danger btn-sm" title="Stop Sharing" onclick="AdminApp.stopSharing(${s.id})">🔒 Stop</button>
          ` : `<span style="font-size:12px;color:var(--text-muted)">${formatDate(s.closed_at)}</span>`}
          <button class="btn btn-outline btn-sm" title="Hapus Sesi" style="margin-left:8px;color:var(--text-sangat-berat);border-color:var(--border-sangat-berat)" onclick="AdminApp.hapusSesi(${s.id})">🗑️ Hapus</button>
        </div>
      </div>
    `).join('');
  },

  async buatSesi() {
    Spinner.show();
    try {
      const sesi = await API.buatSesi();
      await this.loadHome();
      Toast.success('Sesi baru berhasil dibuat!');
    } catch(e) {
      Spinner.hide();
      Toast.error(e.message);
    }
  },

  async stopSharing(id) {
    const ok = await Modal.confirm({
      title: '🔒 Tutup Sesi?',
      body: 'Link ini tidak akan bisa diakses lagi oleh siswa. Yakin?',
      confirmText: 'Tutup', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.tutupSesi(id);
      await this.loadHome();
      Toast.success('Sesi berhasil ditutup');
    } catch(e) {
      Spinner.hide();
      Toast.error(e.message);
    }
  },

  async hapusSesi(id) {
    const ok = await Modal.confirm({
      title: '🗑️ Hapus Sesi?',
      body: '<p>Apakah Anda yakin ingin menghapus sesi ini?</p><p style="margin-top:8px;color:var(--text-sangat-berat);font-size:12px">⚠️ Peringatan: Seluruh data siswa dan jawaban yang terekam pada sesi ini akan terhapus secara permanen!</p>',
      confirmText: 'Hapus', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.hapusSesi(id);
      await this.loadHome();
      Toast.success('Sesi berhasil dihapus');
    } catch(e) {
      Spinner.hide();
      Toast.error(e.message);
    }
  },

  populateFilterDropdowns(kelas) {
    const kelasOpts = ['<option value="">— Semua Kelas —</option>', ...kelas.map(k => `<option>${k}</option>`)].join('');
    const kelasDropdowns = document.querySelectorAll('.filter-kelas');
    kelasDropdowns.forEach(el => { el.innerHTML = kelasOpts; el.value = this.filterKelas; });
  },

  async filterByKelas() {
    this.filterKelas = _('filter-kelas-home')?.value || '';
    this.filterNisn  = '';

    // Populate individu dropdown
    if (this.filterKelas) {
      const students = await API.getStudentsByKelas(this.filterKelas);
      const siswaDrop = _('filter-siswa-home');
      if (siswaDrop) {
        siswaDrop.innerHTML = ['<option value="">— Semua Siswa —</option>',
          ...students.map(s => `<option value="${s.nisn}">${s.nama}</option>`)].join('');
        siswaDrop.value = '';
      }
    }
    await this.loadChartAndTable();
  },

  async filterBySiswa() {
    this.filterNisn = _('filter-siswa-home')?.value || '';
    await this.loadChartAndTable();
  },

  async resetFilter() {
    this.filterKelas = '';
    this.filterNisn  = '';
    const k = _('filter-kelas-home'); if (k) k.value = '';
    const s = _('filter-siswa-home'); if (s) s.innerHTML = '<option value="">— Pilih kelas dulu —</option>';
    await this.loadChartAndTable();
  },

  async loadChartAndTable() {
    Spinner.show();
    try {
      const [chartData, tableData, deskripsi] = await Promise.all([
        API.getChartData(this.filterKelas, this.filterNisn),
        API.getTableData(this.filterKelas, this.filterNisn),
        API.getDeskripsi(this.filterKelas, this.filterNisn),
      ]);
      this.tableData = tableData;
      this.chartDataCache = chartData;
      this.renderCharts(chartData);
      this.renderTable(tableData);
      this.renderDeskripsi(deskripsi);
    } catch(e) {
      Toast.error('Gagal memuat data: ' + e.message);
    }
    Spinner.hide();
  },

  renderCharts(data) {
    const draw = () => {
      const donutCanvas = _('chart-donut');
      if (donutCanvas && donutCanvas.parentElement && donutCanvas.parentElement.clientWidth === 0) {
        // Wait another 100ms if container is not yet laid out
        setTimeout(draw, 100);
        return;
      }

      // Donut
      Charts.resizeCanvas('chart-donut', 220);
      Charts.drawDonut('chart-donut', data.bidang || {});

      // Bar chart — set height based on jumlah sub bidang
      const barCanvas = _('chart-bar');
      if (barCanvas) {
        const container = barCanvas.parentElement;
        barCanvas.width  = container.clientWidth || 400;
        barCanvas.height = Object.keys(data.subBidang || {}).length * 28 + 34;
        Charts.drawBar('chart-bar', data.subBidang || {}, SUB_BIDANG_META);
      }

      // Legend donut
      const legendEl = _('donut-legend');
      if (legendEl) {
        legendEl.innerHTML = Object.entries(data.bidang || {}).map(([b,pct]) => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${Charts.BIDANG_COLORS[b]}"></div>
            <span>${b}</span>
            <strong style="color:${Charts.BIDANG_COLORS[b]}">${pct}%</strong>
          </div>`).join('');
      }
    };
    setTimeout(draw, 50);
  },

  renderTable(data) {
    const tbody = _('rekap-tbody');
    if (!tbody) return;
    if (!data?.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Tidak ada data</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map((s, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong style="color:var(--text-primary)">${s.nama}</strong></td>
        <td>${s.kelas}</td>
        <td><span style="font-family:monospace;font-size:12px">${s.nisn}</span></td>
        <td>${badgeStatus(s.status)}</td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <span class="chip chip-pribadi">P: ${s.pribadi_pct??0}%</span>
            <span class="chip chip-belajar">B: ${s.belajar_pct??0}%</span>
            <span class="chip chip-sosial">S: ${s.sosial_pct??0}%</span>
            <span class="chip chip-karir">K: ${s.karir_pct??0}%</span>
          </div>
        </td>
        <td>${badgeKategori(Math.max(s.pribadi_pct??0, s.belajar_pct??0, s.sosial_pct??0, s.karir_pct??0))}</td>
        <td>
          ${s.status === 'Tidak Valid' ? `
            <button class="btn btn-outline btn-sm" onclick="AdminApp.resetSesi(${s.id}, '${s.nama}')" title="Reset sesi">🔄 Reset</button>
          ` : ''}
        </td>
      </tr>`).join('');

    // Search binding
    _('tabel-search')?.addEventListener('input', (e) => this.searchTable(e.target.value));
  },

  searchTable(q) {
    const lower = q.toLowerCase();
    const filtered = this.tableData.filter(s =>
      s.nama.toLowerCase().includes(lower) ||
      s.kelas.toLowerCase().includes(lower) ||
      s.nisn.includes(lower)
    );
    this.renderTable(filtered);
  },

  renderDeskripsi(deskripsi) {
    const el = _('deskripsi-grid');
    if (!el || !deskripsi) return;
    const bidangList = ['Pribadi','Belajar','Sosial','Karir'];
    el.innerHTML = bidangList.map(b => `
      <div class="deskripsi-card deskripsi-card-${b.toLowerCase()}">
        <div class="deskripsi-bidang ${b.toLowerCase()}">● ${b}</div>
        <p class="deskripsi-text">${deskripsi[b] || 'Data belum tersedia'}</p>
      </div>`).join('');
  },

  async resetSesi(studentId, nama) {
    const ok = await Modal.confirm({
      title:'🔄 Reset Sesi Siswa?',
      body:`<p>Semua jawaban <strong>${nama}</strong> akan dihapus dan siswa dapat mengisi ulang kuesioner.</p>
            <p style="margin-top:8px;color:var(--sedang)">⚠️ Aksi ini tidak dapat dibatalkan.</p>`,
      confirmText:'Reset', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.resetSesi(studentId);
      await this.loadChartAndTable();
      Toast.success(`Sesi ${nama} berhasil direset`);
    } catch(e) { Spinner.hide(); Toast.error(e.message); }
  },

  // ─────────────────────────────────────
  // CETAK LAPORAN
  // ─────────────────────────────────────
  lapSubMenu: 'kelas',

  async loadLaporan() {
    const kelas = await API.getKelas();
    // Populate dropdowns laporan
    const opts = ['<option value="">— Pilih Kelas —</option>', ...kelas.map(k=>`<option>${k}</option>`)].join('');
    _('lap-kelas-select')?.insertAdjacentHTML && (_('lap-kelas-select').innerHTML = opts);
    _('lap-ind-kelas-select') && (_('lap-ind-kelas-select').innerHTML = opts);
    this.switchLapSubMenu('kelas');
  },

  switchLapSubMenu(sub) {
    this.lapSubMenu = sub;
    ['kelas','individu'].forEach(s => {
      _(`lap-sub-${s}`)?.classList.toggle('active', s === sub);
      _(`lap-content-${s}`)?.style && (_(`lap-content-${s}`).style.display = s === sub ? 'block' : 'none');
    });
  },

  async pilihKelasLaporan() {
    const kelas = _('lap-kelas-select')?.value;
    _('lap-kelas-dl-wrap').style.display = kelas ? 'flex' : 'none';
  },

  async pilihKelasIndividu() {
    const kelas = _('lap-ind-kelas-select')?.value;
    if (!kelas) { _('lap-ind-table-wrap').style.display = 'none'; return; }
    Spinner.show();
    try {
      const students = await API.getStudentsByKelas(kelas);
      this.renderLaporanIndividuTable(students, kelas);
      _('lap-ind-table-wrap').style.display = 'block';
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  renderLaporanIndividuTable(students, kelas) {
    const tbody = _('lap-ind-tbody');
    if (!tbody) return;
    if (!students?.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Tidak ada siswa di kelas ini</td></tr>`;
      return;
    }
    tbody.innerHTML = students.map((s, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong style="color:var(--text-primary)">${s.nama}</strong></td>
        <td>${s.jenis_kelamin === 'L' ? '🧑 Laki-laki' : '👩 Perempuan'}</td>
        <td>${badgeStatus(s.status)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.downloadIndividu(${s.id},'${s.nama}')">
            ⬇️ Download PDF
          </button>
        </td>
      </tr>`).join('');
  },

  async downloadIndividu(id, nama) {
    Spinner.show();
    try { await API.downloadLaporanIndividu(id, nama); }
    catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },
  async downloadKelas() {
    const k = _('lap-kelas-select')?.value;
    if (!k) return;
    Spinner.show();
    try { await API.downloadLaporanKelas(k); }
    catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },
  async downloadBulkKelas() {
    Spinner.show();
    try { await API.downloadBulkKelas(); }
    catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },
  async downloadBulkIndividu() {
    const kelas = _('lap-ind-kelas-select')?.value;
    if (!kelas) { Toast.warning('Pilih kelas terlebih dahulu'); return; }
    await this._bulkZipIndividu(kelas);
  },

  async downloadBulkKelas() {
    await this._bulkZipSemua();
  },

  // ── Generate ZIP berisi file CSV/TXT jawaban per siswa ──
  async _bulkZipIndividu(kelasFilter) {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      Toast.error('Library JSZip/FileSaver belum termuat. Pastikan koneksi internet aktif.');
      return;
    }
    Spinner.show();
    try {
      const settings    = await API.getSettings();
      const namaSekolah = settings.nama_sekolah || 'DCM';
      const tahunAjaran = settings.tahun_ajaran || new Date().getFullYear();
      const students    = await API.getTableData(kelasFilter);
      const valid       = students.filter(s => s.status !== 'Tidak Valid');

      if (valid.length === 0) {
        Toast.warning('Tidak ada siswa valid di kelas ini.');
        Spinner.hide(); return;
      }

      const zip = new JSZip();
      const folder = zip.folder(kelasFilter.replace(/\s+/g,'_'));
      const today  = new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});

      valid.forEach(s => {
        const content = this._generateTxtSiswa(s, namaSekolah, tahunAjaran, today);
        const filename = `${s.kelas.replace(/\s+/g,'_')}_${s.nama.replace(/\s+/g,'_')}.txt`;
        folder.file(filename, content);
      });

      // Tambah summary kelas
      const avg = (key) => Math.round(valid.reduce((sum, s) => sum + (s[key]??0), 0) / valid.length);
      const summary = [
        `REKAP KELAS: ${kelasFilter}`,
        `Sekolah: ${namaSekolah} | Tahun Ajaran: ${tahunAjaran}`,
        `Dicetak: ${today}`,
        `Total Siswa Valid: ${valid.length} dari ${students.length}`,
        ``,
        `Rata-rata Bidang:`,
        `  Pribadi : ${avg('pribadi_pct')}%`,
        `  Belajar : ${avg('belajar_pct')}%`,
        `  Sosial  : ${avg('sosial_pct')}%`,
        `  Karir   : ${avg('karir_pct')}%`,
      ].join('\n');
      folder.file('_SUMMARY_KELAS.txt', summary);

      const fileName = `Bulk_${kelasFilter.replace(/\s+/g,'_')}_${tahunAjaran.replace('/','_')}.zip`;
      const blob = await zip.generateAsync({ type: 'blob', compression:'DEFLATE' }, (meta) => {
        // bisa tambah progress jika diperlukan
      });
      saveAs(blob, fileName);
      Toast.success(`ZIP ${fileName} berhasil diunduh! (${valid.length} file)`);
    } catch(e) {
      Toast.error('Gagal membuat ZIP: ' + e.message);
      console.error(e);
    }
    Spinner.hide();
  },

  async _bulkZipSemua() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      Toast.error('Library JSZip/FileSaver belum termuat. Pastikan koneksi internet aktif.');
      return;
    }
    Spinner.show();
    try {
      const settings    = await API.getSettings();
      const namaSekolah = settings.nama_sekolah || 'DCM';
      const tahunAjaran = settings.tahun_ajaran || new Date().getFullYear();
      const allStudents = await API.getTableData();
      const valid       = allStudents.filter(s => s.status !== 'Tidak Valid');
      const today  = new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});

      if (valid.length === 0) {
        Toast.warning('Tidak ada data siswa valid.');
        Spinner.hide(); return;
      }

      const zip = new JSZip();

      // Kelompokkan per kelas
      const byKelas = {};
      valid.forEach(s => { if (!byKelas[s.kelas]) byKelas[s.kelas] = []; byKelas[s.kelas].push(s); });

      Object.entries(byKelas).forEach(([kelas, siswa]) => {
        const folder = zip.folder(kelas.replace(/\s+/g,'_'));
        siswa.forEach(s => {
          const content = this._generateTxtSiswa(s, namaSekolah, tahunAjaran, today);
          const filename = `${s.nama.replace(/\s+/g,'_')}.txt`;
          folder.file(filename, content);
        });

        const avg = (key) => Math.round(siswa.reduce((sum, s) => sum + (s[key]??0), 0) / siswa.length);
        const summary = [
          `REKAP KELAS: ${kelas}`,
          `Sekolah: ${namaSekolah} | Tahun Ajaran: ${tahunAjaran}`,
          `Dicetak: ${today}`,
          `Total Siswa Valid: ${siswa.length}`,
          ``,
          `Rata-rata Bidang:`,
          `  Pribadi : ${avg('pribadi_pct')}%`,
          `  Belajar : ${avg('belajar_pct')}%`,
          `  Sosial  : ${avg('sosial_pct')}%`,
          `  Karir   : ${avg('karir_pct')}%`,
        ].join('\n');
        folder.file('_SUMMARY.txt', summary);
      });

      const fileName = `Bulk_Semua_Kelas_${tahunAjaran.replace('/','_')}.zip`;
      const blob = await zip.generateAsync({ type: 'blob', compression:'DEFLATE' });
      saveAs(blob, fileName);
      Toast.success(`ZIP ${fileName} berhasil diunduh! (${valid.length} siswa, ${Object.keys(byKelas).length} kelas)`);
    } catch(e) {
      Toast.error('Gagal membuat ZIP: ' + e.message);
      console.error(e);
    }
    Spinner.hide();
  },

  _generateTxtSiswa(s, namaSekolah, tahunAjaran, today) {
    const maxBidang = ['Pribadi','Belajar','Sosial','Karir'][Object.values([s.pribadi_pct,s.belajar_pct,s.sosial_pct,s.karir_pct]).indexOf(Math.max(s.pribadi_pct,s.belajar_pct,s.sosial_pct,s.karir_pct))];
    return [
      '=' .repeat(50),
      `REKAP JAWABAN DCM 220`,
      `Sekolah    : ${namaSekolah}`,
      `Tahun Ajaran: ${tahunAjaran}`,
      `Dicetak    : ${today}`,
      '='.repeat(50),
      `Nama         : ${s.nama}`,
      `Kelas        : ${s.kelas}`,
      `NISN         : ${s.nisn}`,
      `Jenis Kelamin: ${s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}`,
      `Status       : ${s.status}`,
      '-'.repeat(50),
      `HASIL ANALISIS BIDANG:`,
      `  Pribadi  : ${s.pribadi_pct ?? 0}%`,
      `  Belajar  : ${s.belajar_pct ?? 0}%`,
      `  Sosial   : ${s.sosial_pct ?? 0}%`,
      `  Karir    : ${s.karir_pct ?? 0}%`,
      `-`.repeat(50),
      `Bidang Prioritas: ${maxBidang}`,
      '='.repeat(50),
      `CATATAN: Dokumen ini bersifat RAHASIA.`,
      `Hanya untuk keperluan bimbingan dan konseling.`,
    ].join('\n');
  },


  // ─────────────────────────────────────
  // PENGATURAN
  // ─────────────────────────────────────
  async loadPengaturan() {
    Spinner.show();
    try {
      const settings = await API.getSettings();
      _('set-nama-sekolah').value    = settings.nama_sekolah || '';
      _('set-alamat').value          = settings.alamat || '';
      _('set-kota').value            = settings.kota || '';
      _('set-nama-konselor').value   = settings.nama_konselor || '';
      _('set-nip').value             = settings.nip || '';
      _('set-tahun-ajaran').value    = settings.tahun_ajaran || '';
      // Preview images if saved
      ['logo-sekolah','logo-bk','cap-konselor','ttd-konselor'].forEach(key => {
        const settingKey = key.replace(/-/g, '_'); // ganti SEMUA dash menjadi underscore
        const src = settings[settingKey];
        if (src && src.startsWith('data:image')) this.showUploadPreview(key, src);
      });
      // Load daftar kelas manual
      await this.loadKelasOptions();
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  async loadKelasOptions() {
    const classes = await API.getKelasOptions();
    this.renderKelasOptions(classes);
  },

  renderKelasOptions(classes) {
    const container = _('kelas-list-container');
    if (!container) return;
    if (classes.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;font-style:italic">Belum ada kelas yang ditambahkan.</div>';
      return;
    }
    container.innerHTML = classes.map(c => `
      <div style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;border-radius:16px;padding:4px 12px;font-size:13px;display:flex;align-items:center;gap:6px;font-weight:600;">
        <span>${c}</span>
        <button type="button" onclick="AdminApp.hapusKelas('${c}')" style="background:none;border:none;cursor:pointer;color:#ef4444;font-weight:bold;font-size:16px;padding:0 2px;">×</button>
      </div>
    `).join('');
  },

  async tambahKelas() {
    const input = _('new-kelas-input');
    const nama = input?.value.trim();
    if (!nama) return;
    Spinner.show();
    try {
      await API.addKelasOption(nama);
      await this.loadKelasOptions();
      input.value = '';
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  async hapusKelas(nama) {
    const ok = await Modal.confirm({
      title:'🗑️ Hapus Kelas?',
      body:`Yakin ingin menghapus kelas <b>${nama}</b> dari daftar pilihan siswa?`,
      confirmText:'Hapus', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.deleteKelasOption(nama);
      await this.loadKelasOptions();
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  async hapusSemuaKelas() {
    const ok = await Modal.confirm({
      title:'🗑️ Hapus Semua Kelas?',
      body:`Yakin ingin menghapus <b>semua</b> daftar kelas manual?<br><br><span style="color:#ef4444;">Peringatan: Data yang sudah dihapus tidak dapat dikembalikan.</span>`,
      confirmText:'Hapus Semua', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      Storage.set('kelas_options', []);
      await this.loadKelasOptions();
      Toast.success('Semua kelas berhasil dihapus');
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  showUploadPreview(key, src) {
    const preview = document.querySelector(`#upload-${key} .upload-preview`);
    const icon    = document.querySelector(`#upload-${key} .upload-icon`);
    if (preview) { preview.src = src; preview.classList.add('show'); }
    if (icon)    icon.style.display = 'none';
  },

  initUploadBoxes() {
    document.querySelectorAll('.upload-box input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { Toast.error('File harus berupa gambar'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const key = input.closest('.upload-box').id.replace('upload-','');
          this.showUploadPreview(key, ev.target.result);
          const namEl = input.closest('.upload-box').querySelector('.upload-name');
          if (namEl) namEl.textContent = file.name;
        };
        reader.readAsDataURL(file);
      });
    });
  },

  async savePengaturan() {
    const getImageBase64 = (id) => {
      const img = document.querySelector(`#upload-${id} .upload-preview`);
      return (img && img.src && img.src.startsWith('data:image')) ? img.src : null;
    };

    const data = {
      nama_sekolah:  _('set-nama-sekolah')?.value.trim(),
      alamat:        _('set-alamat')?.value.trim(),
      kota:          _('set-kota')?.value.trim(),
      nama_konselor: _('set-nama-konselor')?.value.trim(),
      nip:           _('set-nip')?.value.trim(),
      tahun_ajaran:  _('set-tahun-ajaran')?.value.trim(),
      logo_sekolah:  getImageBase64('logo-sekolah'),
      logo_bk:       getImageBase64('logo-bk'),
      cap_konselor:  getImageBase64('cap-konselor'),
      ttd_konselor:  getImageBase64('ttd-konselor'),
    };
    if (!data.nama_sekolah) { Toast.error('Nama sekolah tidak boleh kosong'); return; }

    Spinner.show();
    try {
      await API.saveSettings(data);
      Toast.success('Pengaturan berhasil disimpan!');
    } catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },

  async exportExcel() {
    if (typeof XLSX === 'undefined') {
      Toast.error('Library XLSX belum termuat. Pastikan koneksi internet aktif.');
      return;
    }
    Spinner.show();
    try {
      const settings = await API.getSettings();
      const namaSekolah = settings.nama_sekolah || 'DCM';
      const tahunAjaran = settings.tahun_ajaran || new Date().getFullYear();
      const konselor    = settings.nama_konselor || '-';

      // Ambil semua data siswa
      const allStudents = await API.getTableData();
      const today = new Date().toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});

      // ── SHEET 1: Rekap Semua Siswa ──
      const sheet1Data = [
        [`REKAP DATA DCM — ${namaSekolah.toUpperCase()}`],
        [`Tahun Ajaran: ${tahunAjaran} | Konselor: ${konselor} | Dicetak: ${today}`],
        [],
        ['No','Nama','Kelas','NISN','Jenis Kelamin','Status','Pribadi (%)','Belajar (%)','Sosial (%)','Karir (%)','Kategori Tertinggi'],
        ...allStudents.map((s,i) => [
          i+1, s.nama, s.kelas, s.nisn,
          s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
          s.status,
          s.pribadi_pct ?? 0,
          s.belajar_pct ?? 0,
          s.sosial_pct ?? 0,
          s.karir_pct ?? 0,
          ['Pribadi','Belajar','Sosial','Karir'][Object.values({P:s.pribadi_pct,B:s.belajar_pct,S:s.sosial_pct,K:s.karir_pct}).indexOf(Math.max(s.pribadi_pct,s.belajar_pct,s.sosial_pct,s.karir_pct))]
        ])
      ];

      // ── SHEET 2: Rekap Per Kelas ──
      const byKelas = {};
      allStudents.forEach(s => { if (!byKelas[s.kelas]) byKelas[s.kelas] = []; byKelas[s.kelas].push(s); });
      const sheet2Data = [
        ['Kelas','Jml Siswa','Jml Valid','Rata-rata Pribadi (%)','Rata-rata Belajar (%)','Rata-rata Sosial (%)','Rata-rata Karir (%)'],
      ];
      Object.entries(byKelas).forEach(([kelas, siswa]) => {
        const valid = siswa.filter(s => s.status !== 'Tidak Valid');
        const avg = (key) => valid.length ? Math.round(valid.reduce((sum,s) => sum + (s[key]??0), 0) / valid.length) : 0;
        sheet2Data.push([kelas, siswa.length, valid.length, avg('pribadi_pct'), avg('belajar_pct'), avg('sosial_pct'), avg('karir_pct')]);
      });

      // ── SHEET 3: Siswa Tidak Valid ──
      const invalid = allStudents.filter(s => s.status === 'Tidak Valid');
      const sheet3Data = [
        ['No','Nama','Kelas','NISN','Keterangan'],
        ...invalid.map((s,i) => [i+1, s.nama, s.kelas, s.nisn, 'Jawaban tidak valid (lie scale / consistency check)'])
      ];
      if (invalid.length === 0) sheet3Data.push(['—','Tidak ada siswa dengan status tidak valid','','','']);

      // ── BUAT WORKBOOK ──
      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
      ws1['!cols'] = [{wch:5},{wch:30},{wch:15},{wch:15},{wch:15},{wch:20},{wch:14},{wch:14},{wch:14},{wch:14},{wch:20}];
      ws1['!merges'] = [{s:{r:0,c:0},e:{r:0,c:10}},{s:{r:1,c:0},e:{r:1,c:10}}];
      XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Semua Siswa');

      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
      ws2['!cols'] = [{wch:18},{wch:12},{wch:12},{wch:22},{wch:22},{wch:22},{wch:22}];
      XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Per Kelas');

      const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
      ws3['!cols'] = [{wch:5},{wch:30},{wch:15},{wch:15},{wch:50}];
      XLSX.utils.book_append_sheet(wb, ws3, 'Siswa Tidak Valid');

      const fileName = `DCM_${namaSekolah.replace(/\s+/g,'_')}_${tahunAjaran.replace('/','_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      Toast.success(`File ${fileName} berhasil diunduh!`);
    } catch(e) {
      Toast.error('Gagal export Excel: ' + e.message);
      console.error(e);
    }
    Spinner.hide();
  },

  // ─────────────────────────────────────
  // NOTIFIKASI TAHUNAN
  // ─────────────────────────────────────
  checkYearlyNotif() {
    const lastCheck = Storage.get('yearly_notif_shown');
    const currentYear = new Date().getFullYear();
    if (!lastCheck || lastCheck < currentYear) {
      _('yearly-notif').style.display = 'flex';
      Storage.set('yearly_notif_shown', currentYear);
    }
  },
  dismissYearlyNotif() {
    _('yearly-notif').style.display = 'none';
  },
};
