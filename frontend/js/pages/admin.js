/**
 * Counselor Connect — Admin App
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
        passToggle.textContent = inp.type === 'password' ? '👁' : '🙈';
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
      'dashboard-global': '🏠 Dashboard Utama',
      'home': '📋 Dashboard Problem Checklist', 
      'dummy-sosiogram': '🔗 Dashboard Sosiogram',
      'dummy-ikms': '📊 Dashboard IKMS',
      'laporan': '🖨️ Pusat Cetak Laporan', 
      'pengaturan': '⚙️ Pengaturan Global' 
    };
    _('topbar-title').textContent = titles[page] || titles['dashboard-global'];

    // Show/hide content
    const allPages = ['dashboard-global', 'home', 'dummy-sosiogram', 'dummy-ikms', 'laporan', 'pengaturan'];
    allPages.forEach(p => {
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
    }).filter(s => s.maxPct >= 50 && s.status === 'Valid')
      .sort((a, b) => b.maxPct - a.maxPct);

    if (!priorityStudents.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:15px;">🎉 Bagus! Saat ini tidak ada siswa yang terindikasi butuh penanganan segera.</td></tr>`;
      return;
    }

    tbody.innerHTML = priorityStudents.map((s, i) => {
      const isSangatBerat = s.maxPct >= 70;
      const color = isSangatBerat ? '#b91c1c' : '#c2410c';
      const bg = isSangatBerat ? '#fef2f2' : '#fff7ed';
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
    tbody.innerHTML = students.map((s, i) => {
      const maxPct = Math.max(s.pribadi_pct || 0, s.belajar_pct || 0, s.sosial_pct || 0, s.karir_pct || 0);
      let konselingBadge = '';
      if (maxPct >= 70 && s.status === 'Valid') {
        konselingBadge = `<span style="margin-left:8px; font-size:10px; background:#fef2f2; color:#b91c1c; padding:2px 6px; border-radius:4px; border:1px solid #b91c1c; font-weight:bold;">🚨 Butuh Konseling Segera</span>`;
      } else if (maxPct >= 50 && s.status === 'Valid') {
        konselingBadge = `<span style="margin-left:8px; font-size:10px; background:#fff7ed; color:#c2410c; padding:2px 6px; border-radius:4px; border:1px solid #c2410c; font-weight:bold;">⚠️ Butuh Konseling</span>`;
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
};

window.AdminApp = AdminApp;