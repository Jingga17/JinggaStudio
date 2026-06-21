/**
 * Resilien — Admin App
 * Login, Home (Dashboard), Cetak Laporan, Pengaturan
 * CACHE BUSTED: 2026-06-18
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
    this.initTheme();

    // Bind login form handler ONCE on page load (prevents double-submit bug)
    const loginForm = _('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.doLogin();
      });
    }
    const passToggle = _('login-pass-toggle');
    if (passToggle) {
      passToggle.addEventListener('click', () => {
        const inp = _('login-pass');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        passToggle.innerHTML = inp.type === 'password' 
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
      });
    }

    // Cek auth
    const token = Storage.getAdminToken();
    if (!token) { this.showLogin(); return; }

    this.setupSidebar();
    await this.showAdminShell();
    await this.navigateTo('dashboard-global');
    this.checkYearlyNotif();
  },

  // ─────────────────────────────────────
  // THEME MANAGEMENT
  // ─────────────────────────────────────
  initTheme() {
    let savedTheme = 'system';
    try { savedTheme = localStorage.getItem('dcm_theme') || 'system'; } catch(e) {}
    this.applyTheme(savedTheme);

    // Listen to system theme changes if using system mode
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        let t = 'system';
        try { t = localStorage.getItem('dcm_theme') || 'system'; } catch(e) {}
        if (t === 'system') this.applyTheme('system');
      });
    } catch(e) {}
  },

  toggleTheme() {
    let currentTheme = 'system';
    try { currentTheme = localStorage.getItem('dcm_theme') || 'system'; } catch(e) {}
    if (currentTheme === 'system') {
      currentTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('dcm_theme', newTheme); } catch(e) {}
    this.applyTheme(newTheme);
  },

  applyTheme(theme) {
    let isDark = false;
    if (theme === 'system' || !theme) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
    } else if (theme === 'dark') {
      isDark = true;
    }
    
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.getElementById('theme-icon-sun')?.setAttribute('style', 'display:block;');
      document.getElementById('theme-icon-moon')?.setAttribute('style', 'display:none;');
    } else {
      document.body.classList.remove('dark-theme');
      document.getElementById('theme-icon-sun')?.setAttribute('style', 'display:none;');
      document.getElementById('theme-icon-moon')?.setAttribute('style', 'display:block;');
    }
  },

  // ─────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────
  showLogin() {
    _('admin-login').style.display   = 'flex';
    _('admin-shell').style.display  = 'none';
    // Clear fields when showing login
    const userField = _('login-user');
    const passField = _('login-pass');
    if (userField) userField.value = '';
    if (passField) passField.value = '';
    _('login-error').style.display = 'none';
    if (userField) userField.focus();
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
      await this.showAdminShell();
      await this.navigateTo('dashboard-global');
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
    this.showLogin();
    Toast.info('Berhasil keluar');
  },

  async showAdminShell() {
    _('admin-login').style.display  = 'none';
    _('admin-shell').style.display  = 'flex';
    const user = Storage.getAdminUser();
    if (user) {
      _('admin-name').textContent  = user.nama;
      // Removed avatar-initials overwrite to keep the SVG icon
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

  toggleNavGroup(titleEl) {
    const groupEl = titleEl.closest('.nav-group');
    if (groupEl) {
      groupEl.classList.toggle('expanded');
    }
  },

  async navigateTo(page) {
    this.currentPage = page;
    // Update nav
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
      // Jika aktif, pastikan parent nav-group terbuka
      if (el.dataset.page === page) {
        const parentGroup = el.closest('.nav-group');
        if (parentGroup) parentGroup.classList.add('expanded');
      }
    });
    // Update topbar title
    const titles = { 
      'dashboard-global': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> Dashboard Utama',
      'home': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg> Dashboard Problem Checklist', 
      'dummy-sosiogram': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg> Dashboard Sosiogram',
      'dummy-ikms': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg> Dashboard IKMS',
      'buku-induk': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> Buku Induk Siswa',
      'pemetaan': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg> Peta Demografi Siswa',
      'data-master': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Data Master Siswa',
      'laporan': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> Pusat Cetak Laporan', 
      'pengaturan': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-4px;"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> Pengaturan Global' 
    };
    _('topbar-title').innerHTML = titles[page] || titles['dashboard-global'];

    // Show/hide content
    const allPages = ['dashboard-global', 'home', 'dummy-sosiogram', 'dummy-ikms', 'data-master', 'laporan', 'pengaturan', 'buku-induk', 'pemetaan'];
    allPages.forEach(p => {
      const el = _(`page-${p}`);
      if (el) el.style.display = p === page ? 'block' : 'none';
    });

    // Fetch data khusus page tertentu
    if (page === 'dashboard-global') {
      await this.loadGlobalDashboard();
    } else if (page === 'home') {
      await this.loadDashboardData();
    } else if (page === 'laporan') {
      this.populateLaporanSesi();
    } else if (page === 'buku-induk') {
      await this.renderBukuIndukList();
    } else if (page === 'data-master') {
      await this.loadMasterSiswa();
    } else if (page === 'pengaturan') {
      await this.loadSettings();
    } else if (page === 'pemetaan') {
      await this.renderPemetaanSiswa();
    }
  },

  // ─────────────────────────────────────
  // HOME PAGE
  // ─────────────────────────────────────
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

  async loadHome() {
    Spinner.show();
    try {
      const [summary, kelas] = await Promise.all([
        API.getSummary(),
        API.getKelas(),
      ]);
      this.renderSummaryCards(summary);
      this.populateFilterDropdowns(kelas);
      await this.loadSessions();
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

  async loadSessions() {
    try {
      const sessions = await API.getSessions();
      const tbody = _('tbody-sessions');
      if (!tbody) return;
      if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Belum ada sesi yang dibuat.</td></tr>';
        return;
      }
      
      tbody.innerHTML = sessions.map(s => {
        const link = `${window.location.origin}/index.html?token=${s.token}`;
        return `
          <tr>
            <td style="font-weight:bold">${s.name}</td>
            <td>
              <a href="${link}" target="_blank" style="color:var(--primary)">${s.token}</a>
              <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${link}')" title="Salin link">📋</button>
            </td>
            <td style="text-align:center">${s.student_count || 0}</td>
            <td style="text-align:center">
              <label class="toggle-switch">
                <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="AdminApp.toggleSession(${s.id}, this.checked)">
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td style="text-align:center">
              <button class="btn btn-outline btn-sm" onclick="AdminApp.showEditSessionModal(${s.id}, '${s.name}')">✏️ Edit</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger)" onclick="AdminApp.deleteSession(${s.id})">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
      Toast.error('Gagal memuat sesi kuesioner: ' + e.message);
    }
  },

  async toggleSession(id, isActive) {
    try {
      await API.updateSession(id, { is_active: isActive });
      Toast.success(`Status sesi berhasil diperbarui`);
    } catch (e) {
      Toast.error(e.message);
      await this.loadSessions(); // reload to revert toggle
    }
  },

  async deleteSession(id) {
    const ok = await Modal.confirm({
      title: 'Hapus Sesi?',
      body: 'Peringatan: Semua data kuesioner siswa untuk sesi ini juga akan ikut terhapus permanen!',
      confirmText: 'Hapus Sesi',
      danger: true
    });
    if (!ok) return;
    
    Spinner.show();
    try {
      await API.deleteSession(id);
      Toast.success('Sesi berhasil dihapus');
      await this.loadHome(); // reload summary & sessions
    } catch(e) {
      Spinner.hide();
      Toast.error(e.message);
    }
  },

  showCreateSessionModal() {
    _('session-id').value = '';
    _('session-name').value = '';
    _('modal-session-title').textContent = 'Buat Sesi Baru';
    const modal = _('modal-session');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
  },

  showEditSessionModal(id, currentName) {
    _('session-id').value = id;
    _('session-name').value = currentName;
    _('modal-session-title').textContent = 'Edit Nama Sesi';
    const modal = _('modal-session');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
  },

  closeSessionModal() {
    const modal = _('modal-session');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
  },

  async submitSession(e) {
    e.preventDefault();
    const id = _('session-id').value;
    const name = _('session-name').value.trim();
    if (!name) return Toast.error('Nama sesi wajib diisi');

    const btn = _('btn-submit-session');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div>';

    try {
      if (id) {
        await API.updateSession(id, { name });
        Toast.success('Nama sesi diperbarui');
      } else {
        await API.createSession(name);
        Toast.success('Sesi baru dibuat');
      }
      this.closeSessionModal();
      await this.loadHome();
    } catch(err) {
      Toast.error(err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Simpan';
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
      this.renderPriorityTable(tableData);
      this.renderTidakValidTable(tableData);
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

  renderPriorityTable(data) {
    const tbody = _('tbody-prioritas');
    if (!tbody) return;

    const priorityStudents = (data || []).map(s => {
      const maxPct = Math.max(s.pribadi_pct || 0, s.belajar_pct || 0, s.sosial_pct || 0, s.karir_pct || 0);
      return { ...s, maxPct };
    }).filter(s => s.maxPct >= 50 && (s.status || '').toLowerCase() === 'valid')
      .sort((a, b) => b.maxPct - a.maxPct);

    if (!priorityStudents.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:15px;">🎉 Bagus! Saat ini tidak ada siswa yang terindikasi butuh penanganan segera.</td></tr>`;
      return;
    }

    tbody.innerHTML = priorityStudents.map((s, i) => {
      const isSangatBerat = s.maxPct >= 70;
      const color = isSangatBerat ? 'var(--sangat-berat-text)' : 'var(--berat-text)';
      const bg = isSangatBerat ? 'var(--sangat-berat-soft)' : 'var(--berat-soft)';
      const labelText = isSangatBerat ? 'SANGAT BERAT' : 'BERAT';
      const actionLabel = isSangatBerat ? '🚨 Intervensi Segera' : '⚠️ Konseling Preventif';

      return `
      <tr style="background-color: ${bg};">
        <td style="text-align:center; color:${color}; font-weight:bold;">${i+1}</td>
        <td><strong style="color:${color}">${s.nama}</strong><br><span style="font-size:11px; opacity:0.8;">NISN: ${s.nisn}</span></td>
        <td>${s.kelas}</td>
        <td style="text-align:center;">
          <span style="font-weight:bold; color:${color}">${s.maxPct.toFixed(1)}%</span><br>
          <span style="font-size:11px; font-weight:600;">(${labelText})</span>
        </td>
        <td style="text-align:center;">
          <span style="display:inline-block; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid ${color}; color:${color};">${actionLabel}</span>
        </td>
      </tr>
    `}).join('');
  },

  renderTidakValidTable(data) {
    const tbody = _('tbody-tidak-valid');
    if (!tbody) return;

    const invalidStudents = (data || []).filter(s => (s.status || '').toLowerCase() === 'tidak valid');

    if (!invalidStudents.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:15px;">✅ Tidak ada siswa dengan status Tidak Valid saat ini.</td></tr>`;
      return;
    }

    tbody.innerHTML = invalidStudents.map((s, i) => `
      <tr style="background-color: var(--sangat-berat-soft);">
        <td style="text-align:center; color:var(--sangat-berat-text); font-weight:bold;">${i+1}</td>
        <td><strong style="color:var(--sangat-berat-text)">${s.nama}</strong><br><span style="font-size:11px; opacity:0.8; color:var(--sangat-berat-text);">Alasan: ${s.is_valid === false ? 'Bohong / Inkonsisten' : 'Tidak Valid'}</span></td>
        <td style="color:var(--sangat-berat-text);">${s.kelas}</td>
        <td style="font-family:monospace;font-size:12px;color:var(--sangat-berat-text);">${s.nisn}</td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetSesi(${s.id}, '${s.nama.replace(/'/g, "\\'")}')" title="Reset Sesi Siswa" style="border-color:var(--sangat-berat-text); color:var(--sangat-berat-text);">🔄 Reset</button>
        </td>
      </tr>
    `).join('');
  },

  searchTable(q) {
    const lower = q.toLowerCase();
    const filterStatus = document.getElementById('tabel-filter-status')?.value || 'Semua';
    const filtered = this.tableData.filter(s => {
      const matchQuery = s.nama.toLowerCase().includes(lower) ||
                         s.kelas.toLowerCase().includes(lower) ||
                         s.nisn.includes(lower);
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
      return matchQuery && matchStatus;
    });
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
    tbody.innerHTML = students.map((s, i) => {
      const maxPct = Math.max(s.pribadi_pct || 0, s.belajar_pct || 0, s.sosial_pct || 0, s.karir_pct || 0);
      let konselingBadge = '';
      const studentSangatBerat = maxPct >= 70 && s.status === 'Valid';
      const studentBerat = maxPct >= 50 && s.status === 'Valid';
      if (studentSangatBerat) {
        konselingBadge = `<span style="margin-left:8px; font-size:10px; background:var(--sangat-berat-soft); color:var(--sangat-berat-text); padding:2px 6px; border-radius:4px; border:1px solid var(--sangat-berat-text); font-weight:bold;">🚨 Butuh Konseling Segera</span>`;
      } else if (studentBerat) {
        konselingBadge = `<span style="margin-left:8px; font-size:10px; background:var(--berat-soft); color:var(--berat-text); padding:2px 6px; border-radius:4px; border:1px solid var(--berat-text); font-weight:bold;">⚠️ Butuh Konseling</span>`;
      }
      return `
      <tr>
        <td>${i+1}</td>
        <td><strong style="color:var(--text-primary)">${s.nama}</strong>${konselingBadge}</td>
        <td>${s.jenis_kelamin === 'L' ? '🧑 Laki-laki' : '👩 Perempuan'}</td>
        <td>${badgeStatus(s.status)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="AdminApp.downloadIndividu(${s.id},'${s.nama.replace(/'/g, "\\'")}')">
            ⬇️ Download PDF
          </button>
        </td>
      </tr>`;
    }).join('');
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
    Spinner.show();
    try { await API.downloadBulkIndividu(kelas); }
    catch(e) { Toast.error(e.message); }
    Spinner.hide();
  },
  async downloadBulkSemuaIndividu() {
    Spinner.show();
    try { await API.downloadBulkSemuaIndividu(); }
    catch(e) { Toast.error(e.message); }
    Spinner.hide();
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
        
        if (!file.type.startsWith('image/')) { 
          Toast.error('File harus berupa gambar'); 
          input.value = '';
          return; 
        }

        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        if (file.size > 5 * 1024 * 1024) {
          Toast.error(`Ukuran file maksimal 5 MB. File Anda: ${sizeMB} MB`);
          input.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const key = input.closest('.upload-box').id.replace('upload-','');
          this.showUploadPreview(key, ev.target.result);
          const namEl = input.closest('.upload-box').querySelector('.upload-name');
          if (namEl) namEl.textContent = `${file.name} (${sizeMB} MB)`;
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



  exportExcel() {
    const token = Storage.getAdminToken();
    if (!token) {
      Toast.error('Akses ditolak. Silakan login kembali.');
      return;
    }
    const url = `${API_BASE}/export/excel?token=${token}`;
    window.open(url, '_blank');
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

  // ─────────────────────────────────────
  // DATA MASTER SISWA
  // ─────────────────────────────────────
  async loadMasterSiswa() {
    this.showSpinner();
    try {
      const res = await API.get('/students/master');
      this.masterSiswaData = res.data || [];
      this.populateMasterKelasFilter();
      this.renderMasterSiswa();
    } catch (e) {
      Toast.error('Gagal memuat Data Master Siswa: ' + e.message);
    } finally {
      this.hideSpinner();
    }
  },

  populateMasterKelasFilter() {
    const select = _('master-kelas-filter');
    if (!select || !this.masterSiswaData) return;
    const kelasSet = new Set(this.masterSiswaData.map(s => s.kelas));
    const kelases = Array.from(kelasSet).sort();
    
    let html = '<option value="">Semua Kelas</option>';
    kelases.forEach(k => {
      html += `<option value="${k}">${k}</option>`;
    });
    select.innerHTML = html;
  },

  renderMasterSiswa() {
    const tbody = _('tbody-master-siswa');
    if (!tbody || !this.masterSiswaData) return;

    const kelasFilter = _('master-kelas-filter').value;
    const searchFilter = (_('master-search').value || '').toLowerCase();

    const filtered = this.masterSiswaData.filter(s => {
      const matchKelas = !kelasFilter || s.kelas === kelasFilter;
      const matchSearch = !searchFilter || 
                          s.nama.toLowerCase().includes(searchFilter) || 
                          s.nisn.includes(searchFilter);
      return matchKelas && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:15px;">Data tidak ditemukan.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((s, i) => `
      <tr>
        <td style="text-align:center;">${i+1}</td>
        <td style="font-family:monospace;font-size:12px;color:var(--primary);">${s.nisn}</td>
        <td><strong>${s.nama}</strong></td>
        <td>${s.kelas}</td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetPasswordSiswa(${s.id}, '${s.nama.replace(/'/g, "\\'")}')" style="font-size:11px; padding:3px 8px;">🔑 Reset Sandi</button>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.deleteMasterSiswa(${s.id}, '${s.nama.replace(/'/g, "\\'")}')" style="font-size:11px; padding:3px 8px; color:var(--sangat-berat-text); border-color:var(--sangat-berat-text);">🗑️ Hapus</button>
        </td>
      </tr>
    `).join('');
  },

  downloadTemplateExcel() {
    // Basic Excel generator using SheetJS which is loaded globally as XLSX
    if (typeof XLSX === 'undefined') {
      Toast.error('Library Excel belum termuat.');
      return;
    }
    const ws_data = [
      ['nama', 'kelas', 'nisn'],
      ['Budi Santoso', 'X IPA 1', '1234567890'],
      ['Andi Irawan', 'X IPA 1', '0987654321']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Auto size cols
    ws['!cols'] = [{wch: 30}, {wch: 15}, {wch: 20}];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FormatSiswa");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
  },

  async handleImportExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (typeof XLSX === 'undefined') {
      Toast.error('Library Excel belum termuat.');
      event.target.value = '';
      return;
    }

    this.showSpinner();
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRaw = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const payload = jsonRaw.map(row => {
        // Cari header yg sesuai ignoring case
        const getVal = (possibleKeys) => {
          for (let k of Object.keys(row)) {
            if (possibleKeys.includes(k.toLowerCase().trim())) {
              return String(row[k]).trim();
            }
          }
          return '';
        };
        return {
          nama: getVal(['nama', 'name', 'nama lengkap']),
          kelas: getVal(['kelas', 'class']),
          nisn: getVal(['nisn', 'nis', 'no induk'])
        };
      }).filter(r => r.nama && r.nisn);

      if (payload.length === 0) {
        throw new Error("Tidak ada data valid yang ditemukan. Pastikan ada kolom nama, kelas, dan nisn.");
      }

      const res = await API.post('/students/import', { students: payload });
      Toast.success(`Berhasil mengimpor ${res.data.imported} data siswa!`);
      this.loadMasterSiswa();
    } catch(e) {
      Toast.error('Gagal mengimpor Excel: ' + e.message);
    } finally {
      this.hideSpinner();
      event.target.value = ''; // reset file input
    }
  },

  showAddSiswaModal() {
    UI.showModal('Tambah Siswa Manual', `
      <div class="form-group">
        <label class="form-label">Nama Lengkap</label>
        <input type="text" id="add-nama" class="form-control" placeholder="Cth: Siti Aminah">
      </div>
      <div class="form-group">
        <label class="form-label">Kelas</label>
        <input type="text" id="add-kelas" class="form-control" placeholder="Cth: XI IPS 2">
      </div>
      <div class="form-group">
        <label class="form-label">NISN (Untuk Login)</label>
        <input type="text" id="add-nisn" class="form-control" placeholder="Cth: 0012345678">
      </div>
      <div style="font-size:12px; color:var(--text-secondary); margin-top:10px;">
        *Password otomatis akan disamakan dengan NISN.
      </div>
    `, async () => {
      const nama = _('add-nama').value.trim();
      const kelas = _('add-kelas').value.trim();
      const nisn = _('add-nisn').value.trim();
      if(!nama || !kelas || !nisn) {
        Toast.error('Semua kolom wajib diisi!');
        return false;
      }
      try {
        await API.post('/students/import', { students: [{ nama, kelas, nisn }] });
        Toast.success('Siswa berhasil ditambahkan');
        this.loadMasterSiswa();
        return true;
      } catch (e) {
        Toast.error(e.message);
        return false;
      }
    });
  },

  deleteMasterSiswa(id, nama) {
    UI.showModal('Konfirmasi Hapus', `Yakin ingin menghapus seluruh data siswa <b>${nama}</b> secara permanen? Data asesmen siswa ini juga akan hilang jika sudah pernah mengerjakan.`, async () => {
      try {
        await API.post('/students/master/' + id + '/delete');
        Toast.success('Siswa berhasil dihapus');
        this.loadMasterSiswa();
        return true;
      } catch (e) {
        Toast.error(e.message);
        return false;
      }
    });
  },

  resetPasswordSiswa(id, nama) {
    UI.showModal('Reset Password', `Yakin ingin mereset password <b>${nama}</b> menjadi sama dengan NISN-nya?`, async () => {
      try {
        await API.post('/students/master/' + id + '/reset-password');
        Toast.success('Password berhasil direset');
        return true;
      } catch (e) {
        Toast.error(e.message);
        return false;
      }
    });
  },


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
        const res = await API.get('/students/master');
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
    
    tbody.innerHTML = filtered.map((s, i) => `
      <tr class="hover-row">
        <td>${i + 1}</td>
        <td>${s.nisn || '-'}</td>
        <td style="font-weight:500; color:var(--text-primary);">${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-primary btn-sm" style="font-size:12px; padding:4px 10px;" onclick="AdminApp.openBukuIndukDetail(${s.id}, '${s.nama.replace(/'/g, "\\'")}', '${s.nisn}', '${s.kelas}')">
            👁️ Lihat Detail
          </button>
        </td>
      </tr>
    `).join('');
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
      // DUMMY DATA INJECTION FOR DEMONSTRATION
      // Simulating network delay
      await new Promise(r => setTimeout(r, 500));
      
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
    
    const targetPane = document.getElementById(`drawer-content-${tabId}`);
    if (targetPane) targetPane.classList.add('active');
  },

  renderDrawerBiodata(data) {
    const container = document.getElementById('drawer-biodata-view');
    container.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Lengkap</div>
          <div class="detail-value">${data.nama || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">NISN</div>
          <div class="detail-value">${data.nisn || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Kelas</div>
          <div class="detail-value">${data.kelas || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Jenis Kelamin</div>
          <div class="detail-value">${data.jk || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Tempat, Tanggal Lahir</div>
          <div class="detail-value">${data.tempat_lahir || '-'}, ${data.tanggal_lahir || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Agama</div>
          <div class="detail-value">${data.agama || '-'}</div>
        </div>
      </div>
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Data Orang Tua / Wali</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Ayah</div>
          <div class="detail-value">${data.nama_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pekerjaan Ayah</div>
          <div class="detail-value">${data.pekerjaan_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">No. HP Orang Tua</div>
          <div class="detail-value" style="display:flex; align-items:center; gap:8px;">
            ${data.no_hp_ortu || '-'}
          </div>
        </div>
      </div>
    `;
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
      html += `<tr><td style="padding:12px 8px; border-bottom:1px solid var(--border);">Semester ${r.semester}</td><td style="text-align:right; padding:12px 8px; border-bottom:1px solid var(--border); font-weight:bold; color:var(--accent);">${r.rata_rata}</td></tr>`;
    });
    html += '</tbody></table>';
    
    // Fake Trend chart description
    html += '<div class="card" style="margin-top:24px; padding:16px; background:var(--accent-glow);"><h4 style="margin:0 0 8px 0; color:var(--accent);">Tren Nilai: Meningkat 📈</h4><p style="margin:0; font-size:13px; color:var(--text-muted);">Nilai rata-rata siswa menunjukkan peningkatan yang stabil selama 4 semester terakhir.</p></div>';
    
    container.innerHTML = html;
  },

  renderDrawerNonAkademik(ekskulList, prestasiList) {
    const container = document.getElementById('drawer-non-akademik-view');
    container.innerHTML = `
      <h4 style="margin-bottom:12px; color:var(--text-primary);">Ekstrakurikuler & Organisasi</h4>
      ${(!ekskulList || ekskulList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : ekskulList.map(e => `<div class="card" style="margin-bottom:10px;padding:12px;">${e.nama_ekskul} - ${e.jabatan}</div>`).join('')}
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Prestasi & Penghargaan</h4>
      ${(!prestasiList || prestasiList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : prestasiList.map(p => `<div class="card" style="margin-bottom:10px;padding:12px;">${p.nama_prestasi} (${p.tingkat})</div>`).join('')}
    `;
  },
  
renderDrawerDCM(dcmData) {
    const container = document.getElementById('drawer-dcm-view');
    if (!dcmData) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum mengisi kuesioner DCM.</div>';
      return;
    }
    container.innerHTML = `
      <div class="card" style="padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted);">Status Pengisian</div>
          <div style="font-weight:bold; font-size:16px;">${dcmData.is_valid ? '<span style="color:var(--success);">Telah Mengisi (Valid)</span>' : '<span style="color:var(--danger);">Belum Valid</span>'}</div>
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
          <div class="detail-value" style="font-size:24px;">${dcmData.pribadi}%</div>
        </div>
        <div class="detail-item" style="text-align:center; border-color:var(--danger); background:rgba(239, 68, 68, 0.05);">
          <div class="detail-label" style="color:var(--danger);">Belajar</div>
          <div class="detail-value" style="font-size:24px; color:var(--danger);">${dcmData.belajar}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Sosial</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.sosial}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Karir</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.karir}%</div>
        </div>
      </div>
    `;
  },



  switchPemetaanTab(tabId) {
    const btnIds = ['tab-btn-demografi', 'tab-btn-keluarga', 'tab-btn-akademik', 'tab-btn-kesehatan', 'tab-btn-sosial'];
    btnIds.forEach(id => {
      const btn = _(id);
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.style.background = 'var(--bg-surface)';
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-primary)';
        if (id === `tab-btn-${tabId}`) {
          btn.classList.add('btn-primary');
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }
    });
    this.activePemetaanTab = tabId;
    this.renderPemetaanSiswa();
  },

  autoAggregate(students, key, overrides = null) {
    const counts = {};
    students.forEach(s => {
      let p = {};
      try { if (s.data_pribadi) p = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi; } catch (e) {}
      
      let val = p[key] || '';
      if (typeof val === 'string') val = val.trim();
      
      if (overrides) {
        let overriden = false;
        for (const [newKey, conditions] of Object.entries(overrides)) {
          if (conditions.some(cond => val.toLowerCase().includes(cond.toLowerCase()))) {
            val = newKey;
            overriden = true;
            break;
          }
        }
        if (!overriden && !val) val = 'Tidak Mengisi';
      } else {
        if (!val || val === '— Pilih —') val = 'Tidak Mengisi';
      }
      
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  },

  renderPemetaanSiswa() {
    if (!this.activePemetaanTab) this.activePemetaanTab = 'demografi';
    const tabId = this.activePemetaanTab;
    const filterEl = _('filter-pemetaan-kelas');

    const selectedClass = filterEl ? filterEl.value : '';
    const filteredStudents = selectedClass 
      ? this.bukuIndukData.filter(s => s.kelas === selectedClass)
      : this.bukuIndukData;

    if (_('pemetaan-total')) _('pemetaan-total').innerText = filteredStudents.length;

    // Dummy logic for cards
    if (_('pemetaan-broken')) _('pemetaan-broken').innerText = '0';
    if (_('pemetaan-yatim')) _('pemetaan-yatim').innerText = '0';
    if (_('pemetaan-khusus')) _('pemetaan-khusus').innerText = '26'; // placeholder
    
    // Clear old charts
    if(this.pemetaanCharts) {
        this.pemetaanCharts.forEach(c => c.destroy());
    }
    this.pemetaanCharts = [];
    
    const container = _('pemetaan-charts-container');
    if(!container) return;
    
    let configs = [];
    
    if (tabId === 'demografi') {
        const agamaCounts = this.autoAggregate(filteredStudents, 'agama');
        configs.push({ title: 'Agama', data: agamaCounts, type: 'pie' });
    } else if (tabId === 'keluarga') {
        const pddCounts = this.autoAggregate(filteredStudents, 'pendidikan_ayah');
        configs.push({ title: 'Pendidikan Ayah', data: pddCounts, type: 'bar' });
        const hslCounts = this.autoAggregate(filteredStudents, 'penghasilan_ayah');
        configs.push({ title: 'Penghasilan Ayah', data: hslCounts, type: 'bar' });
    } else if (tabId === 'akademik') {
        const ekskulCounts = this.autoAggregate(filteredStudents, 'ekstrakurikuler');
        configs.push({ title: 'Minat Ekstrakurikuler', data: ekskulCounts, type: 'bar' });
    } else if (tabId === 'sosial') {
        const jarakCounts = this.autoAggregate(filteredStudents, 'jarak_ke_sekolah');
        configs.push({ title: 'Jarak ke Sekolah', data: jarakCounts, type: 'pie' });
    } else if (tabId === 'kesehatan') {
        configs.push({ title: 'Kesehatan Fisik', data: {'Sehat': filteredStudents.length}, type: 'pie' });
    }

    container.innerHTML = '';
    configs.forEach((cfg, idx) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.style.marginBottom = '20px';
        
        const card = document.createElement('div');
        card.className = 'card fadeUp';
        card.style.background = 'var(--bg-card)';
        card.style.border = '1px solid var(--border)';
        card.style.padding = '16px';
        card.style.borderRadius = '8px';
        
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.style.marginBottom = '12px';
        title.innerText = cfg.title;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'pemetaan-chart-' + idx;
        
        card.appendChild(title);
        card.appendChild(canvas);
        col.appendChild(card);
        container.appendChild(col);
        
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(cfg.data);
        const data = Object.values(cfg.data);
        
        const chart = new Chart(ctx, {
            type: cfg.type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah',
                    data: data,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                },
                scales: cfg.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    },
                    x: {
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                } : {}
            }
        });
        this.pemetaanCharts.push(chart);
    });
  },

  // ─────────────────────────────────────
  // BUKU INDUK SISWA
  // ─────────────────────────────────────
  async renderBukuIndukList() {
    const tbody = document.getElementById('tbody-buku-induk');
    if (!tbody) return;
    
    // Fetch if empty
    if (!this.bukuIndukData || this.bukuIndukData.length === 0) {
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
    
    tbody.innerHTML = filtered.map((s, i) => `
      <tr class="hover-row">
        <td>${i + 1}</td>
        <td>${s.nisn || '-'}</td>
        <td style="font-weight:500; color:var(--text-primary);">${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-primary btn-sm" style="font-size:12px; padding:4px 10px;" onclick="AdminApp.openBukuIndukDetail(${s.id})">
            👁️ Lihat Detail
          </button>
        </td>
      </tr>
    `).join('');
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
      this.renderDrawerAkademik(data.rapor, studentId, s.nama);
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
    
    const targetPane = document.getElementById(`drawer-content-${tabId}`);
    if (targetPane) targetPane.classList.add('active');
  },

  renderDrawerBiodata(data) {
    const container = document.getElementById('drawer-biodata-view');
    container.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Lengkap</div>
          <div class="detail-value">${data.nama || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">NISN</div>
          <div class="detail-value">${data.nisn || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Kelas</div>
          <div class="detail-value">${data.kelas || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Jenis Kelamin</div>
          <div class="detail-value">${data.jk || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Tempat, Tanggal Lahir</div>
          <div class="detail-value">${data.tempat_lahir || '-'}, ${data.tanggal_lahir || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Agama</div>
          <div class="detail-value">${data.agama || '-'}</div>
        </div>
      </div>
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Data Orang Tua / Wali</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Nama Ayah</div>
          <div class="detail-value">${data.nama_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pekerjaan Ayah</div>
          <div class="detail-value">${data.pekerjaan_ayah || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">No. HP Orang Tua</div>
          <div class="detail-value" style="display:flex; align-items:center; gap:8px;">
            ${data.no_hp_ortu || '-'}
          </div>
        </div>
      </div>
    `;
  },
  
  renderDrawerAkademik(raporList, studentId, nama) {
    const container = document.getElementById('drawer-akademik-view');
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0; color:var(--text-primary);">Riwayat Akademik</h4>
        <button class="btn btn-primary btn-sm" style="display:flex;align-items:center;" onclick="ExportApp.exportRaporExcel(${studentId}, '${nama ? nama.replace(/'/g, "\\'") : ''}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Unduh Data (Excel)
        </button>
      </div>
    `;

    if (!raporList || raporList.length === 0) {
      container.innerHTML = html + '<div style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada data rapor yang diinput.</div>';
      return;
    }
    
    html += '<table class="table" style="width:100%; border-collapse:collapse; margin-top:10px;">';
    html += '<thead><tr><th style="text-align:left; padding:8px; border-bottom:2px solid var(--border);">Semester</th><th style="text-align:right; padding:8px; border-bottom:2px solid var(--border);">Nilai Rata-Rata</th></tr></thead><tbody>';
    raporList.forEach(r => {
      html += `<tr><td style="padding:12px 8px; border-bottom:1px solid var(--border);">Semester ${r.semester}</td><td style="text-align:right; padding:12px 8px; border-bottom:1px solid var(--border); font-weight:bold; color:var(--accent);">${r.rata_rata || r.nilai || '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    
    container.innerHTML = html;
  },

  renderDrawerNonAkademik(ekskulList, prestasiList) {
    const container = document.getElementById('drawer-non-akademik-view');
    container.innerHTML = `
      <h4 style="margin-bottom:12px; color:var(--text-primary);">Ekstrakurikuler & Organisasi</h4>
      ${(!ekskulList || ekskulList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : ekskulList.map(e => `<div class="card" style="margin-bottom:10px;padding:12px;">${e.nama_ekskul || e.nama} - ${e.jabatan || 'Anggota'}</div>`).join('')}
      
      <h4 style="margin-top:24px; margin-bottom:12px; color:var(--text-primary);">Prestasi & Penghargaan</h4>
      ${(!prestasiList || prestasiList.length === 0) ? '<p style="color:var(--text-muted);font-size:14px;">Belum ada data.</p>' : prestasiList.map(p => `<div class="card" style="margin-bottom:10px;padding:12px;">${p.nama_prestasi || p.nama} (${p.tingkat || 'Sekolah'})</div>`).join('')}
    `;
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

    container.innerHTML = `
      <div class="card" style="padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:var(--text-muted);">Status Pengisian</div>
          <div style="font-weight:bold; font-size:16px;">${dcmData.is_valid ? '<span style="color:var(--success);">Telah Mengisi (Valid)</span>' : '<span style="color:var(--danger);">Belum Valid</span>'}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-muted);">Masalah Dominan</div>
          <div style="font-weight:bold; font-size:16px; color:var(--danger);">Masalah ${highestCat}</div>
        </div>
      </div>
      
      <h4 style="margin-bottom:12px;">Persentase Masalah</h4>
      <div class="detail-grid">
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Pribadi</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.pribadi}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Belajar</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.belajar}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Sosial</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.sosial}%</div>
        </div>
        <div class="detail-item" style="text-align:center;">
          <div class="detail-label">Karir</div>
          <div class="detail-value" style="font-size:24px;">${dcmData.karir}%</div>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────
  // PEMETAAN DEMOGRAFI
  // ─────────────────────────────────────
  switchPemetaanTab(tabId) {
    const btnIds = ['tab-btn-demografi', 'tab-btn-keluarga', 'tab-btn-akademik', 'tab-btn-kesehatan', 'tab-btn-sosial'];
    btnIds.forEach(id => {
      const btn = _(id);
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.style.background = 'var(--bg-surface)';
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-primary)';
        if (id === `tab-btn-${tabId}`) {
          btn.classList.add('btn-primary');
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      }
    });
    this.activePemetaanTab = tabId;
    this.renderPemetaanSiswa();
  },

  autoAggregate(students, key, overrides = null) {
    const counts = {};
    students.forEach(s => {
      let p = {};
      try { if (s.data_pribadi) p = typeof s.data_pribadi === 'string' ? JSON.parse(s.data_pribadi) : s.data_pribadi; } catch (e) {}
      
      let val = p[key] || '';
      if (typeof val === 'string') val = val.trim();
      
      if (overrides) {
        let overriden = false;
        for (const [newKey, conditions] of Object.entries(overrides)) {
          if (conditions.some(cond => val.toLowerCase().includes(cond.toLowerCase()))) {
            val = newKey;
            overriden = true;
            break;
          }
        }
        if (!overriden && !val) val = 'Tidak Mengisi';
      } else {
        if (!val || val === '— Pilih —') val = 'Tidak Mengisi';
      }
      
      counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  },

  renderPemetaanSiswa() {
    if (!this.activePemetaanTab) this.activePemetaanTab = 'demografi';
    const tabId = this.activePemetaanTab;
    const filterEl = _('filter-pemetaan-kelas');

    const selectedClass = filterEl ? filterEl.value : '';
    const filteredStudents = selectedClass 
      ? this.bukuIndukData.filter(s => s.kelas === selectedClass)
      : this.bukuIndukData;

    if (_('pemetaan-total')) _('pemetaan-total').innerText = filteredStudents.length;

    // Dummy logic for cards
    if (_('pemetaan-broken')) _('pemetaan-broken').innerText = '0';
    if (_('pemetaan-yatim')) _('pemetaan-yatim').innerText = '0';
    if (_('pemetaan-khusus')) _('pemetaan-khusus').innerText = '26'; // placeholder
    
    // Clear old charts
    if(this.pemetaanCharts) {
        this.pemetaanCharts.forEach(c => c.destroy());
    }
    this.pemetaanCharts = [];
    
    const container = _('pemetaan-charts-container');
    if(!container) return;
    
    let configs = [];
    
    if (tabId === 'demografi') {
        const agamaCounts = this.autoAggregate(filteredStudents, 'agama');
        configs.push({ title: 'Agama', data: agamaCounts, type: 'pie' });
    } else if (tabId === 'keluarga') {
        const pddCounts = this.autoAggregate(filteredStudents, 'pendidikan_ayah');
        configs.push({ title: 'Pendidikan Ayah', data: pddCounts, type: 'bar' });
        const hslCounts = this.autoAggregate(filteredStudents, 'penghasilan_ayah');
        configs.push({ title: 'Penghasilan Ayah', data: hslCounts, type: 'bar' });
    } else if (tabId === 'akademik') {
        const ekskulCounts = this.autoAggregate(filteredStudents, 'ekstrakurikuler');
        configs.push({ title: 'Minat Ekstrakurikuler', data: ekskulCounts, type: 'bar' });
    } else if (tabId === 'sosial') {
        const jarakCounts = this.autoAggregate(filteredStudents, 'jarak_ke_sekolah');
        configs.push({ title: 'Jarak ke Sekolah', data: jarakCounts, type: 'pie' });
    } else if (tabId === 'kesehatan') {
        configs.push({ title: 'Kesehatan Fisik', data: {'Sehat': filteredStudents.length}, type: 'pie' });
    }

    container.innerHTML = '';
    configs.forEach((cfg, idx) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.style.marginBottom = '20px';
        
        const card = document.createElement('div');
        card.className = 'card fadeUp';
        card.style.background = 'var(--bg-card)';
        card.style.border = '1px solid var(--border)';
        card.style.padding = '16px';
        card.style.borderRadius = '8px';
        
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.style.marginBottom = '12px';
        title.innerText = cfg.title;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'pemetaan-chart-' + idx;
        
        card.appendChild(title);
        card.appendChild(canvas);
        col.appendChild(card);
        container.appendChild(col);
        
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(cfg.data);
        const data = Object.values(cfg.data);
        
        const chart = new Chart(ctx, {
            type: cfg.type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah',
                    data: data,
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                },
                scales: cfg.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    },
                    x: {
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary').trim() }
                    }
                } : {}
            }
        });
        this.pemetaanCharts.push(chart);
    });
  },

  // ─────────────────────────────────────
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
    
    tbody.innerHTML = filtered.map((s, i) => `
      <tr class="hover-row">
        <td style="text-align:center;">${i + 1}</td>
        <td>${s.nisn || '-'}</td>
        <td style="font-weight:500;">${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetPasswordMaster(${s.id}, '${s.nisn}')" title="Reset Password ke NISN">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Reset
          </button>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteMasterSiswa(${s.id}, '${s.nama.replace(/'/g, "\\'")}')">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');
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
    Modal.show('Tambah/Impor Siswa', `
      <p style="margin-top:0;font-size:13px;color:var(--text-muted)">Fitur ini belum diimplementasi pada demo ini. Anda bisa menggunakan file template Excel untuk mengimpor data secara massal.</p>
      <div style="margin-top:15px;text-align:center">
        <button class="btn btn-outline" disabled>Download Template</button>
        <button class="btn btn-primary" disabled>Upload Data</button>
      </div>
    `, () => {
      Modal.hide();
    });
  },

  // ─────────────────────────────────────
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
    
    tbody.innerHTML = filtered.map((s, i) => `
      <tr class="hover-row">
        <td style="text-align:center;">${i + 1}</td>
        <td>${s.nisn || '-'}</td>
        <td style="font-weight:500;">${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetPasswordMaster(${s.id}, '${s.nisn}')" title="Reset Password ke NISN">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Reset
          </button>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteMasterSiswa(${s.id}, '${s.nama.replace(/'/g, "\\'")}')">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');
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

  async loadMasterSiswa() {
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
    
    tbody.innerHTML = filtered.map((s, i) => `
      <tr class="hover-row">
        <td style="text-align:center;">${i + 1}</td>
        <td>${s.nisn || '-'}</td>
        <td style="font-weight:500;">${s.nama}</td>
        <td><span class="badge" style="background:var(--accent-glow); color:var(--accent);">${s.kelas || '-'}</span></td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="AdminApp.resetPasswordMaster(${s.id}, '${s.nisn}')" title="Reset Password ke NISN">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Reset
          </button>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-sm btn-danger" onclick="AdminApp.deleteMasterSiswa(${s.id}, '${s.nama.replace(/'/g, "\\'")}')">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');
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
        this.loadMasterSiswa(); // refresh
      }
    } catch(e) {
      Toast.error('Gagal menghapus: ' + e.message);
    }
  },

  showAddSiswaModal() {
    Modal.show('Tambah/Impor Siswa', `
      <p style="margin-top:0;font-size:13px;color:var(--text-muted)">Fitur ini belum diimplementasi pada demo ini. Anda bisa menggunakan file template Excel untuk mengimpor data secara massal.</p>
      <div style="margin-top:15px;text-align:center">
        <button class="btn btn-outline" disabled>Download Template</button>
        <button class="btn btn-primary" disabled>Upload Data</button>
      </div>
    `, () => {
      Modal.hide();
    });
  }
};
window.AdminApp = AdminApp;

// Auto-init
(function() {
  function runInit() {
    if (window.__adminInitDone) return;
    window.__adminInitDone = true;
    try { 
      AdminApp.init(); 
    } catch(e) { 
      console.error('[AdminApp] init error:', e); 
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'color:red; position:fixed; top:150px; left:10px; z-index:99999; background:white; padding:15px; border:3px solid red; font-family:monospace; max-width:90%;';
      errDiv.innerHTML = '<strong>INIT ERROR:</strong> ' + e.message + '<br><pre>' + e.stack + '</pre>';
      document.body.appendChild(errDiv);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
  } else {
    runInit();
  }
})();