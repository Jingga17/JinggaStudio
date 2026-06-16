/**
 * Resilien — Portal Siswa
 * Login, Dashboard, Asesmen, Biodata, Pengaturan
 */

const StudentApp = {
  token: null,
  profile: null,
  currentPage: 'dashboard',

  // ─────────────────────────────────────
  // INIT
  // ─────────────────────────────────────
  async init() {
    this.initTheme();
    this.initProfileTabs();

    // Password toggle
    const passToggle = _('student-pass-toggle');
    if (passToggle) {
      passToggle.addEventListener('click', () => {
        const inp = _('login-password');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        passToggle.innerHTML = inp.type === 'password'
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
      });
    }

    // Checkbox exclusive logic
    document.addEventListener('change', (e) => {
      if (e.target.name === 'internet') {
        if (e.target.value === 'Tidak Ada Akses' && e.target.checked) {
          document.querySelectorAll('input[name="internet"]').forEach(el => {
            if (el !== e.target) el.checked = false;
          });
        } else if (e.target.checked) {
          const noneCb = Array.from(document.querySelectorAll('input[name="internet"]')).find(el => el.value === 'Tidak Ada Akses');
          if (noneCb) noneCb.checked = false;
        }
      }
      if (e.target.name === 'gadget') {
        if (e.target.value === 'Tidak Punya' && e.target.checked) {
          document.querySelectorAll('input[name="gadget"]').forEach(el => {
            if (el !== e.target) el.checked = false;
          });
        } else if (e.target.checked) {
          const noneCb = Array.from(document.querySelectorAll('input[name="gadget"]')).find(el => el.value === 'Tidak Punya');
          if (noneCb) noneCb.checked = false;
        }
      }
      if (e.target.name === 'medsos') {
        if (e.target.value === 'Lainnya') {
          const inpLainnya = _('prof-medsos-lainnya');
          if (inpLainnya) {
            inpLainnya.style.display = e.target.checked ? 'block' : 'none';
            if (!e.target.checked) inpLainnya.value = '';
          }
        }
      }
    });

    this.token = Storage.getStudentToken();
    if (this.token) {
      await this.loadDashboard();
    } else {
      this.showLogin();
    }
  },

  // ─────────────────────────────────────
  // TABS MANAGEMENT
  // ─────────────────────────────────────
  initProfileTabs() {
    const container = _('student-profile-form');
    if (!container) return;
    const accordions = Array.from(container.querySelectorAll('.profile-accordion'));
    if (accordions.length === 0) return;

    const header = document.createElement('div');
    header.className = 'profile-tabs-header';
    header.style.display = 'flex';
    header.style.flexWrap = 'wrap';
    header.style.gap = '12px';
    header.style.marginBottom = '20px';
    header.style.borderBottom = '2px solid var(--border)';
    header.style.paddingBottom = '12px';

    // Insert header before the first accordion
    container.insertBefore(header, accordions[0]);

    accordions.forEach((acc, index) => {
      const summary = acc.querySelector('summary');
      const title = summary.textContent.replace(/^[0-9]+\.\s*/, ''); // Remove "1. "
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'profile-tab-btn ' + (index === 0 ? 'active' : '');
      btn.textContent = title;
      btn.style.padding = '8px 12px';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.borderBottom = '2px solid transparent';
      btn.style.marginBottom = '-14px';
      btn.style.fontWeight = index === 0 ? '700' : '600';
      btn.style.fontSize = '14px';
      btn.style.color = index === 0 ? 'var(--accent)' : 'var(--text-muted)';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.2s ease';
      if (index === 0) btn.style.borderBottomColor = 'var(--accent)';

      const content = acc.querySelector('.accordion-content');
      const pane = document.createElement('div');
      pane.className = 'profile-tab-pane ' + (index === 0 ? 'active' : '');
      pane.style.display = index === 0 ? 'block' : 'none';
      
      // Styling for content pane
      content.style.padding = '24px';
      content.style.background = 'var(--bg-surface)';
      content.style.borderRadius = 'var(--radius-lg)';
      content.style.border = '1px solid var(--border)';
      
      pane.appendChild(content);

      btn.onclick = () => {
        // Reset all
        document.querySelectorAll('.profile-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--text-muted)';
          b.style.fontWeight = '600';
          b.style.borderBottomColor = 'transparent';
        });
        document.querySelectorAll('.profile-tab-pane').forEach(p => {
          p.classList.remove('active');
          p.style.display = 'none';
        });
        
        // Activate current
        btn.classList.add('active');
        btn.style.color = 'var(--accent)';
        btn.style.fontWeight = '700';
        btn.style.borderBottomColor = 'var(--accent)';
        pane.classList.add('active');
        pane.style.display = 'block';
      };

      header.appendChild(btn);
      acc.replaceWith(pane);
    });
  },

  // ─────────────────────────────────────
  // THEME MANAGEMENT
  // ─────────────────────────────────────
  initTheme() {
    const savedTheme = localStorage.getItem('dcm_theme') || 'system';
    this.applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem('dcm_theme') === 'system') {
        this.applyTheme('system');
      }
    });
  },

  toggleTheme() {
    let current = localStorage.getItem('dcm_theme') || 'system';
    if (current === 'system') {
      current = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dcm_theme', next);
    this.applyTheme(next);
  },

  toggleThemeFromSwitch(isDark) {
    const next = isDark ? 'dark' : 'light';
    localStorage.setItem('dcm_theme', next);
    this.applyTheme(next);
  },

  applyTheme(theme) {
    let isDark = false;
    if (theme === 'system' || !theme) {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    if (isDark) {
      document.body.classList.add('dark-theme');
      _('student-theme-icon-sun')?.setAttribute('style', 'display:block;');
      _('student-theme-icon-moon')?.setAttribute('style', 'display:none;');
      // sync admin icons if on same page
      document.getElementById('theme-icon-sun')?.setAttribute('style', 'display:block;');
      document.getElementById('theme-icon-moon')?.setAttribute('style', 'display:none;');
    } else {
      document.body.classList.remove('dark-theme');
      _('student-theme-icon-sun')?.setAttribute('style', 'display:none;');
      _('student-theme-icon-moon')?.setAttribute('style', 'display:block;');
      document.getElementById('theme-icon-sun')?.setAttribute('style', 'display:none;');
      document.getElementById('theme-icon-moon')?.setAttribute('style', 'display:block;');
    }

    // Update toggle switch in pengaturan page
    const toggleSwitch = _('student-dark-mode-toggle');
    if (toggleSwitch) toggleSwitch.checked = isDark;
  },

  // ─────────────────────────────────────
  // SHOW / HIDE PAGES
  // ─────────────────────────────────────
  showLogin() {
    _('page-login').style.display = 'block';
    _('page-dashboard').style.display = 'none';
    _('page-kuesioner').style.display = 'none';
  },

  showShell() {
    _('page-login').style.display = 'none';
    _('page-dashboard').style.display = 'block';
    _('page-kuesioner').style.display = 'none';
  },

  showKuesioner() {
    _('page-login').style.display = 'none';
    _('page-dashboard').style.display = 'none';
    _('page-kuesioner').style.display = 'block';

    // Mencegah siswa menggunakan tombol Back di browser
    history.pushState(null, '', location.href);
    window.onpopstate = function () {
      if (_('page-kuesioner').style.display === 'block') {
        history.pushState(null, '', location.href);
        Toast.info('Anda harus menyelesaikan asesmen ini sebelum kembali.');
      }
    };
  },

  // ─────────────────────────────────────
  // SIDEBAR NAVIGATION
  // ─────────────────────────────────────
  toggleSidebar() {
    const sidebar = _('student-sidebar');
    const overlay = _('student-sidebar-overlay');
    sidebar.classList.toggle('open');
    const isOpen = sidebar.classList.contains('open');
    overlay.style.display = isOpen ? 'block' : 'none';
    if (isOpen) overlay.classList.add('visible');
    else overlay.classList.remove('visible');
  },

  closeSidebar() {
    const sidebar = _('student-sidebar');
    const overlay = _('student-sidebar-overlay');
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
    overlay.classList.remove('visible');
  },

  navigateTo(page) {
    this.currentPage = page;
    this.closeSidebar();

    // Update nav items
    document.querySelectorAll('.student-nav-item[data-student-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.studentPage === page);
    });

    // Topbar title
    const titles = {
      'dashboard': 'Dashboard',
      'asesmen': 'Asesmen',
      'biodata': 'Data Diri',
      'pengaturan': 'Pengaturan',
      'portofolio': 'Portofolio Akademik'
    };
    const titleEl = _('student-topbar-title');
    if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';

    // Show/hide page content
    ['dashboard', 'asesmen', 'biodata', 'pengaturan', 'portofolio'].forEach(p => {
      const el = _(`student-page-${p}`);
      if (el) el.style.display = p === page ? 'block' : 'none';
    });

    // Load page-specific data
    if (page === 'asesmen') {
      this.loadActiveSessions();
    } else if (page === 'biodata') {
      this.populateBiodataForm();
    } else if (page === 'portofolio') {
      this.loadPortofolio();
    } else if (page === 'pengaturan') {
      // Sync the toggle switch with current theme
      const isDark = document.body.classList.contains('dark-theme');
      const toggleSwitch = _('student-dark-mode-toggle');
      if (toggleSwitch) toggleSwitch.checked = isDark;
    }
  },

  // ─────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────
  async login() {
    const nisn = _('login-nisn').value.trim();
    const password = _('login-password').value;
    const errorEl = _('student-login-error');

    if (!nisn || !password) {
      errorEl.textContent = 'NISN dan Password harus diisi';
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    const btn = _('student-login-btn');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Masuk...';

    try {
      const res = await API.studentLogin(nisn, password);
      if (res.token) {
        Storage.setStudentToken(res.token);
        this.token = res.token;
        _('login-nisn').value = '';
        _('login-password').value = '';
        await this.loadDashboard();
      }
    } catch (e) {
      errorEl.textContent = e.message;
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  },

  logout() {
    Storage.clearStudentToken();
    this.token = null;
    this.profile = null;
    this.showLogin();
    Toast.success('Berhasil keluar');
  },

  // ─────────────────────────────────────
  // LOAD DASHBOARD
  // ─────────────────────────────────────
  async loadDashboard() {
    Spinner.show();
    try {
      const res = await API.getStudentProfile(this.token);
      this.profile = res.user;

      // Update sidebar & header
      const name = this.profile.nama || this.profile.nisn;
      const kelas = this.profile.kelas ? 'Kelas ' + this.profile.kelas : 'Kelas belum diatur';
      
      _('dash-student-name').textContent = name;
      _('dash-student-kelas').textContent = kelas;
      _('dash-student-name-banner').textContent = name;
      _('dash-student-kelas-banner').textContent = kelas;

      // Cek apakah ada asesmen yang masih berjalan (draft) untuk mengunci siswa
      const sessions = await API.getActiveSessions(this.token);
      const draftSession = sessions.find(s => s.status_pengisian === 'draft');
      
      if (draftSession) {
        Spinner.hide();
        Toast.info('Lanjutkan asesmen Anda yang belum selesai.');
        return this.startAssessment(draftSession.id);
      }

      this.showShell();
      this.navigateTo('dashboard');

      // Load sessions for dashboard preview + stats
      this._renderDashboardStats(sessions);

      Spinner.hide();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal memuat profil: ' + e.message);
      this.logout();
    }
  },

  _renderDashboardStats(sessions) {
    const previewEl = _('dash-active-sessions-preview');
    try {
      const total = sessions.length;
      const selesai = sessions.filter(s => s.status_pengisian === 'selesai').length;
      const tersedia = sessions.filter(s => s.status_pengisian !== 'selesai').length;

      _('dash-stat-total').textContent = total;
      _('dash-stat-selesai').textContent = selesai;
      _('dash-stat-tersedia').textContent = tersedia;

      if (!sessions || sessions.length === 0) {
        previewEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">Tidak ada asesmen aktif saat ini.</div>';
        return;
      }

      // Show only first 2 in preview
      const preview = sessions.slice(0, 2);
      previewEl.innerHTML = preview.map(s => this._renderSessionCard(s)).join('');
      if (sessions.length > 2) {
        previewEl.innerHTML += `<div style="text-align:center;margin-top:8px;"><button class="btn btn-ghost btn-sm" onclick="StudentApp.navigateTo('asesmen')">Lihat ${sessions.length - 2} asesmen lainnya →</button></div>`;
      }
    } catch (e) {
      previewEl.innerHTML = `<div style="color:var(--danger);font-size:13px;">Gagal memuat: ${e.message}</div>`;
    }
  },

  // ─────────────────────────────────────
  // LOAD ACTIVE SESSIONS (Asesmen Page)
  // ─────────────────────────────────────
  async loadActiveSessions() {
    const container = _('active-sessions-list');
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">Memuat daftar asesmen...</p>';

    try {
      const sessions = await API.getActiveSessions(this.token);
      const isProfileComplete = !!(this.profile && this.profile.jenis_kelamin && this.profile.ttl);

      if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center;padding:32px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);margin-bottom:12px"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg><p style="color:var(--text-muted);font-size:14px;">Tidak ada asesmen yang sedang aktif.</p></div>';
        return;
      }

      container.innerHTML = sessions.map(s => this._renderSessionCard(s, isProfileComplete)).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:var(--danger);font-size:13px;">Gagal memuat: ${e.message}</div>`;
    }
  },

  _renderSessionCard(s, isProfileComplete = true) {
    const isSelesai = s.status_pengisian === 'selesai';
    let btnHtml = '';

    if (!isProfileComplete) {
      btnHtml = `<button class="btn btn-outline btn-sm" onclick="StudentApp.navigateTo('biodata')" title="Lengkapi data diri terlebih dahulu">Lengkapi Data Diri</button>`;
    } else if (isSelesai) {
      btnHtml = `<span class="session-card-done">✓ Selesai</span>`;
    } else {
      const btnText = s.status_pengisian === 'draft' ? 'Lanjutkan →' : 'Mulai Asesmen →';
      const btnCls = s.status_pengisian === 'draft' ? 'btn-outline' : 'btn-primary';
      btnHtml = `<button class="btn ${btnCls} btn-sm" onclick="StudentApp.startAssessment(${s.id})">${btnText}</button>`;
    }

    return `
      <div class="session-card">
        <div class="session-card-info">
          <div class="session-card-name">${s.name}</div>
          <div class="session-card-status">${isSelesai ? '✅ Anda sudah menyelesaikan asesmen ini' : s.status_pengisian === 'draft' ? '📝 Sedang dikerjakan (lanjutkan)' : '📋 Tersedia untuk dikerjakan'}</div>
        </div>
        <div style="margin-left:16px;">${btnHtml}</div>
      </div>
    `;
  },

  // ─────────────────────────────────────
  // BIODATA / PROFILE
  // ─────────────────────────────────────
  populateBiodataForm() {
    if (!this.profile) return;
    
    // Core fields
    if(_('prof-nama-lengkap')) _('prof-nama-lengkap').value = this.profile.nama || '';
    if(_('prof-nisn')) _('prof-nisn').value = this.profile.nisn || '';
    if(_('prof-jk')) _('prof-jk').value = this.profile.jenis_kelamin || '';
    if(_('prof-ttl')) _('prof-ttl').value = this.profile.ttl || '';
    if(_('prof-nohp')) _('prof-nohp').value = this.profile.no_hp || '';
    if(_('prof-alamat')) _('prof-alamat').value = this.profile.alamat || '';
    if(_('prof-hobi')) _('prof-hobi').value = this.profile.hobi || '';
    if(_('prof-citacita')) _('prof-citacita').value = this.profile.cita_cita || '';
    
    // Parse data_pribadi
    const extra = this.profile.data_pribadi || {};
    
    // Map extra fields safely
    const setVal = (id, val) => { if (_(id)) _(id).value = val || ''; };
    setVal('prof-nama-panggilan', extra.nama_panggilan);
    setVal('prof-agama', extra.agama);
    setVal('prof-kewarganegaraan', extra.kewarganegaraan);
    setVal('prof-email', extra.email);
    setVal('prof-anak-ke', extra.anak_ke);
    setVal('prof-dari-bersaudara', extra.dari_bersaudara);
    
    setVal('prof-ayah-nama', extra.ayah_nama);
    setVal('prof-ayah-status', extra.ayah_status);
    setVal('prof-ayah-pendidikan', extra.ayah_pendidikan);
    setVal('prof-ayah-pekerjaan', extra.ayah_pekerjaan);
    setVal('prof-ayah-penghasilan', extra.ayah_penghasilan);
    setVal('prof-ayah-nohp', extra.ayah_nohp);
    
    setVal('prof-ibu-nama', extra.ibu_nama);
    setVal('prof-ibu-status', extra.ibu_status);
    setVal('prof-ibu-pendidikan', extra.ibu_pendidikan);
    setVal('prof-ibu-pekerjaan', extra.ibu_pekerjaan);
    setVal('prof-ibu-penghasilan', extra.ibu_penghasilan);
    setVal('prof-ibu-nohp', extra.ibu_nohp);
    setVal('prof-wali-nama', extra.wali_nama);
    setVal('prof-wali-hubungan', extra.wali_hubungan);
    setVal('prof-wali-pekerjaan', extra.wali_pekerjaan);
    setVal('prof-wali-nohp', extra.wali_nohp);
    setVal('prof-ortu-nikah', extra.status_ortu);
    
    setVal('prof-goldarah', extra.gol_darah);
    setVal('prof-tinggi', extra.tinggi);
    setVal('prof-berat', extra.berat);
    setVal('prof-penyakit', extra.penyakit);
    setVal('prof-disabilitas', extra.disabilitas);
    setVal('prof-kacamata', extra.kacamata);
    setVal('prof-alergi', extra.alergi);
    
    setVal('prof-asal-sekolah', extra.asal_sekolah);
    setVal('prof-status-siswa', extra.status_siswa);
    setVal('prof-tinggal-kelas', extra.tinggal_kelas);
    setVal('prof-ikut-bimbel', extra.ikut_bimbel || 'Tidak');
    setVal('prof-jenis-bimbel', extra.jenis_bimbel);
    setVal('prof-nama-bimbel', extra.nama_bimbel);
    setVal('prof-lama-bimbel', extra.lama_bimbel);
    
    // Trigger conditional display for bimbel
    const bimbelSelect = _('prof-ikut-bimbel');
    if(bimbelSelect) bimbelSelect.dispatchEvent(new Event('change'));

    setVal('prof-kendala-belajar', extra.kendala_belajar);
    
    setVal('prof-mapel-suka', extra.mapel_suka);
    setVal('prof-mapel-tidaksuka', extra.mapel_tidaksuka);
    setVal('prof-gaya-belajar', extra.gaya_belajar);
    setVal('prof-rencana-lulus', extra.rencana_lulus);
    
    setVal('prof-tinggal', extra.status_tempat_tinggal);
    setVal('prof-status-rumah', extra.status_rumah);
    
    const internetStr = extra.internet || '';
    document.querySelectorAll('input[name="internet"]').forEach(el => {
      el.checked = internetStr.includes(el.value);
    });
    
    setVal('prof-motor', extra.kendaraan_motor);
    setVal('prof-mobil', extra.kendaraan_mobil);
    
    const gadgetStr = extra.gadget || '';
    document.querySelectorAll('input[name="gadget"]').forEach(el => {
      el.checked = gadgetStr.includes(el.value);
    });
    
    setVal('prof-waktu-belajar', extra.waktu_belajar);
    setVal('prof-jarak', extra.jarak_rumah);
    setVal('prof-transportasi', extra.transportasi);
    
    setVal('prof-teman-sekolah', extra.teman_sekolah);
    setVal('prof-bergaul', extra.bergaul);
    setVal('prof-hub-sekelas', extra.hub_sekelas);
    setVal('prof-bullying', extra.bullying);
    setVal('prof-curhat', extra.curhat);
    
    const medsosStr = extra.medsos || '';
    document.querySelectorAll('input[name="medsos"]').forEach(el => {
      el.checked = medsosStr.includes(el.value);
    });
    setVal('prof-medsos-lainnya', extra.medsos_lainnya);
    const lainnyaCb = Array.from(document.querySelectorAll('input[name="medsos"]')).find(el => el.value === 'Lainnya');
    if (lainnyaCb && lainnyaCb.checked && _('prof-medsos-lainnya')) {
      _('prof-medsos-lainnya').style.display = 'block';
    } else if (_('prof-medsos-lainnya')) {
      _('prof-medsos-lainnya').style.display = 'none';
    }
  },

  async updateProfile() {
    const getVal = (id) => _(id) ? _(id).value.trim() : '';
    
    const extra = {
      nama_panggilan: getVal('prof-nama-panggilan'),
      agama: getVal('prof-agama'),
      kewarganegaraan: getVal('prof-kewarganegaraan'),
      email: getVal('prof-email'),
      anak_ke: getVal('prof-anak-ke'),
      dari_bersaudara: getVal('prof-dari-bersaudara'),
      
      ayah_nama: getVal('prof-ayah-nama'),
      ayah_status: getVal('prof-ayah-status'),
      ayah_pendidikan: getVal('prof-ayah-pendidikan'),
      ayah_pekerjaan: getVal('prof-ayah-pekerjaan'),
      ayah_penghasilan: getVal('prof-ayah-penghasilan'),
      ayah_nohp: getVal('prof-ayah-nohp'),
      
      ibu_nama: getVal('prof-ibu-nama'),
      ibu_status: getVal('prof-ibu-status'),
      ibu_pendidikan: getVal('prof-ibu-pendidikan'),
      ibu_pekerjaan: getVal('prof-ibu-pekerjaan'),
      ibu_penghasilan: getVal('prof-ibu-penghasilan'),
      ibu_nohp: getVal('prof-ibu-nohp'),
      wali_nama: getVal('prof-wali-nama'),
      wali_hubungan: getVal('prof-wali-hubungan'),
      wali_pekerjaan: getVal('prof-wali-pekerjaan'),
      wali_nohp: getVal('prof-wali-nohp'),
      status_ortu: getVal('prof-ortu-nikah'),
      
      gol_darah: getVal('prof-goldarah'),
      tinggi: getVal('prof-tinggi'),
      berat: getVal('prof-berat'),
      penyakit: getVal('prof-penyakit'),
      disabilitas: getVal('prof-disabilitas'),
      kacamata: getVal('prof-kacamata'),
      alergi: getVal('prof-alergi'),
      
      asal_sekolah: getVal('prof-asal-sekolah'),
      status_siswa: getVal('prof-status-siswa'),
      tinggal_kelas: getVal('prof-tinggal-kelas'),
      ikut_bimbel: getVal('prof-ikut-bimbel'),
      jenis_bimbel: getVal('prof-jenis-bimbel'),
      nama_bimbel: getVal('prof-nama-bimbel'),
      lama_bimbel: getVal('prof-lama-bimbel'),
      kendala_belajar: getVal('prof-kendala-belajar'),
      
      mapel_suka: getVal('prof-mapel-suka'),
      mapel_tidaksuka: getVal('prof-mapel-tidaksuka'),
      gaya_belajar: getVal('prof-gaya-belajar'),
      rencana_lulus: getVal('prof-rencana-lulus'),
      
      status_tempat_tinggal: getVal('prof-tinggal'),
      status_rumah: getVal('prof-status-rumah'),
      internet: Array.from(document.querySelectorAll('input[name="internet"]:checked')).map(el => el.value).join(', '),
      gadget: Array.from(document.querySelectorAll('input[name="gadget"]:checked')).map(el => el.value).join(', '),
      kendaraan_motor: getVal('prof-motor'),
      kendaraan_mobil: getVal('prof-mobil'),
      
      waktu_belajar: getVal('prof-waktu-belajar'),
      jarak_rumah: getVal('prof-jarak'),
      transportasi: getVal('prof-transportasi'),
      
      teman_sekolah: getVal('prof-teman-sekolah'),
      bergaul: getVal('prof-bergaul'),
      hub_sekelas: getVal('prof-hub-sekelas'),
      bullying: getVal('prof-bullying'),
      curhat: getVal('prof-curhat'),
      medsos: Array.from(document.querySelectorAll('input[name="medsos"]:checked')).map(el => el.value).join(', '),
      medsos_lainnya: getVal('prof-medsos-lainnya'),
    };

    const data = {
      jenis_kelamin: getVal('prof-jk'),
      ttl: getVal('prof-ttl'),
      no_hp: getVal('prof-nohp'),
      alamat: getVal('prof-alamat'),
      hobi: getVal('prof-hobi'),
      cita_cita: getVal('prof-citacita'),
      nama_ortu: extra.ayah_nama || extra.ibu_nama,
      pekerjaan_ortu: extra.ayah_pekerjaan || extra.ibu_pekerjaan,
      data_pribadi: extra
    };

    if (!data.jenis_kelamin || !data.ttl) {
      return Toast.error('Jenis Kelamin dan Tanggal Lahir wajib diisi');
    }

    const btn = document.querySelector('#student-profile-form button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Menyimpan...';

    const statusEl = _('prof-save-status');

    try {
      await API.updateStudentProfile(data, this.token);
      this.profile = { ...this.profile, ...data };
      Toast.success('Data diri berhasil diperbarui');
      if (statusEl) statusEl.textContent = '✓ Tersimpan';
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
    } catch (e) {
      Toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  },

  // ─────────────────────────────────────
  // START ASSESSMENT
  // ─────────────────────────────────────
  async startAssessment(sessionId) {
    Spinner.show();
    try {
      const res = await API.startAssessment(sessionId, this.token);
      this.showKuesioner();
      await KuesionerApp.start(res.data ? res.data.student_id : res.student_id, this.profile, sessionId);
      Spinner.hide();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal memulai asesmen: ' + e.message);
    }
  },

  // ─────────────────────────────────────
  // AKADEMIK
  // ─────────────────────────────────────
  switchAkademikKelas(kelasId) {
    // Hide all contents
    [10, 11, 12].forEach(k => {
      const content = document.getElementById(`akademik-kelas-content-${k}`);
      const btn = document.getElementById(`akademik-kelas-tab-${k}`);
      if (content) content.style.display = 'none';
      if (btn) {
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.fontWeight = '600';
      }
    });
    
    // Show active
    const activeContent = document.getElementById(`akademik-kelas-content-${kelasId}`);
    const activeBtn = document.getElementById(`akademik-kelas-tab-${kelasId}`);
    if (activeContent) activeContent.style.display = 'block';
    if (activeBtn) {
      activeBtn.style.borderBottomColor = 'var(--accent)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '700';
    }

    // Toggle Mapel Pilihan Form (hanya untuk kelas 11 dan 12)
    const mapelContainer = document.getElementById('akademik-mapel-pilihan-container');
    if (mapelContainer) {
      mapelContainer.style.display = (kelasId === 11 || kelasId === 12) ? 'block' : 'none';
    }

    // Auto-switch to the first semester of that class
    if (kelasId === 10) this.switchAkademikSemester(1);
    else if (kelasId === 11) this.switchAkademikSemester(3);
    else if (kelasId === 12) this.switchAkademikSemester(5);
  },

  switchAkademikSemester(semId) {
    // Determine the array of semesters based on the current class
    let sems = [];
    if (semId === 1 || semId === 2) sems = [1, 2];
    else if (semId === 3 || semId === 4) sems = [3, 4];
    else if (semId === 5 || semId === 6) sems = [5, 6];

    sems.forEach(s => {
      const content = document.getElementById(`akademik-sem-content-${s}`);
      const btn = document.getElementById(`akademik-sem-tab-${s}`);
      if (content) content.style.display = 'none';
      if (btn) {
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.fontWeight = '500';
      }
    });

    const activeContent = document.getElementById(`akademik-sem-content-${semId}`);
    const activeBtn = document.getElementById(`akademik-sem-tab-${semId}`);
    if (activeContent) activeContent.style.display = 'block';
    if (activeBtn) {
      activeBtn.style.borderBottomColor = 'var(--accent)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '600';
    }
  },

  updateMapelPilihan() {
    for (let p = 1; p <= 4; p++) {
      const select = document.getElementById(`akademik_pil_${p}`);
      if (!select) continue;
      const mapel = select.value || `Pilihan ${p}`;
      const labels = document.querySelectorAll(`.label-pil-${p}`);
      labels.forEach(lbl => {
        lbl.textContent = mapel;
      });
    }
  },

  loadAkademik() {
    const data = this.profile?.nilai_akademik || {};
    
    // Load dropdown pilihan
    for (let p = 1; p <= 4; p++) {
      const select = document.getElementById(`akademik_pil_${p}`);
      if (select && data[`pil_${p}`]) {
        select.value = data[`pil_${p}`];
      }
    }
    this.updateMapelPilihan();

    // Load semua nilai
    const form = document.getElementById('student-akademik-form');
    if (!form) return;
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      const val = data[input.name];
      if (val !== undefined && val !== null) {
        input.value = val;
      } else {
        input.value = '';
      }
    });

    this.switchAkademikKelas(10);
  },

  async saveAkademik() {
    const form = document.getElementById('student-akademik-form');
    if (!form) return;

    const data = {};
    
    // Save mapel pilihan names
    for (let p = 1; p <= 4; p++) {
      const select = document.getElementById(`akademik_pil_${p}`);
      if (select) data[`pil_${p}`] = select.value;
    }

    // Save grades
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      if (input.value !== '') {
        data[input.name] = Number(input.value);
      }
    });

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Menyimpan...';
    
    const statusEl = document.getElementById('akademik-save-status');

    try {
      const res = await fetch(`${API.baseUrl}/students/akademik`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ nilai_akademik: data })
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      
      this.profile.nilai_akademik = data;
      Toast.success('Nilai Akademik berhasil disimpan');
      if (statusEl) statusEl.textContent = '✓ Tersimpan';
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
    } catch (e) {
      Toast.error('Gagal menyimpan nilai: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  },

  // ─────────────────────────────────────
  // PORTFOLIO
  // ─────────────────────────────────────
  _raporData: [],
  _prestasiData: [],
  _ekskulData: [],
  _currentPortoTab: 'rapor',

  switchPortoTab(tab) {
    this._currentPortoTab = tab;
    const tabs = ['rapor', 'prestasi', 'ekskul'];
    tabs.forEach(t => {
      const btn = _(`porto-tab-${t}`);
      const content = _(`porto-content-${t}`);
      if (btn) {
        const isActive = t === tab;
        btn.style.borderBottomColor = isActive ? 'var(--accent)' : 'transparent';
        btn.style.color = isActive ? 'var(--accent)' : 'var(--text-muted)';
        btn.style.fontWeight = isActive ? '700' : '600';
      }
      if (content) content.style.display = t === tab ? 'block' : 'none';
    });
    if (tab === 'rapor') {
      this.loadAkademik();
      this.renderRaporTable();
    }
    if (tab === 'prestasi') this.renderPrestasiList();
    if (tab === 'ekskul') this.renderEkskulList();
  },

  async loadPortofolio() {
    Spinner.show();
    try {
      const [rapor, prestasi, ekskul] = await Promise.all([
        API.getRapor(this.token),
        API.getPrestasi(this.token),
        API.getEkskul(this.token),
      ]);
      this._raporData = rapor || [];
      this._prestasiData = prestasi || [];
      this._ekskulData = ekskul || [];
      this.switchPortoTab(this._currentPortoTab);
    } catch (e) {
      Toast.error('Gagal memuat portofolio: ' + e.message);
    }
    Spinner.hide();
  },

  // ── RAPOR ──
  renderRaporTable() {
    const container = _('rapor-table-container');
    if (!container) return;
    const filterSemester = _('rapor-filter-semester')?.value || '';
    let data = this._raporData;
    if (filterSemester) data = data.filter(r => r.semester === filterSemester);

    if (!data.length) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;display:block;opacity:0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Belum ada nilai rapor yang dimasukkan.
      </div>`;
      return;
    }

    // Group by semester
    const grouped = {};
    data.forEach(r => {
      if (!grouped[r.semester]) grouped[r.semester] = [];
      grouped[r.semester].push(r);
    });

    container.innerHTML = Object.entries(grouped).map(([sem, items]) => {
      const avg = (items.reduce((s, r) => s + r.nilai, 0) / items.length).toFixed(1);
      const rowsHtml = items.map(r => `
        <tr>
          <td>${r.mata_pelajaran}</td>
          <td style="text-align:center;font-weight:700;color:${r.nilai >= 75 ? 'var(--belajar)' : r.nilai >= 60 ? 'var(--sedang)' : 'var(--sangat-berat)'}">
            ${r.nilai}
          </td>
          <td style="text-align:center;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;${r.nilai >= 75 ? 'background:rgba(16,185,129,0.1);color:var(--belajar)' : r.nilai >= 60 ? 'background:rgba(245,158,11,0.1);color:var(--sedang)' : 'background:rgba(239,68,68,0.1);color:var(--sangat-berat)'}">
              ${r.nilai >= 75 ? 'Tuntas' : 'Remedial'}
            </span>
          </td>
          <td style="text-align:center;">
            <button class="btn btn-ghost btn-sm" onclick="StudentApp.deleteRapor(${r.id})" title="Hapus" style="padding:4px 8px;color:var(--sangat-berat);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:700;font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">${sem}</div>
            <div style="font-size:12px;color:var(--text-muted);">Rata-rata: <strong style="color:var(--accent)">${avg}</strong></div>
          </div>
          <div style="border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:var(--bg-input);">
                  <th style="padding:8px 12px;text-align:left;font-weight:700;color:var(--text-muted);font-size:11px;text-transform:uppercase;">Mata Pelajaran</th>
                  <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-muted);font-size:11px;text-transform:uppercase;">Nilai</th>
                  <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-muted);font-size:11px;text-transform:uppercase;">Status</th>
                  <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-muted);font-size:11px;text-transform:uppercase;"></th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  },

  async submitRapor() {
    const semester = _('rapor-semester').value;
    const mapel = _('rapor-mapel').value.trim();
    const nilai = _('rapor-nilai').value;
    if (!semester || !mapel || nilai === '') return Toast.error('Semua field wajib diisi');

    Spinner.show();
    try {
      await API.addRapor({ semester, mata_pelajaran: mapel, nilai: Number(nilai) }, this.token);
      Toast.success('Nilai berhasil disimpan');
      _('form-rapor').reset();
      await this.loadPortofolio();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  },

  async deleteRapor(id) {
    const ok = await Modal.confirm({
      title: 'Hapus Nilai?',
      body: 'Nilai ini akan dihapus permanen.',
      confirmText: 'Hapus', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.deleteRapor(id, this.token);
      Toast.success('Nilai dihapus');
      await this.loadPortofolio();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  },

  // ── PRESTASI ──
  _tingkatBadgeColor(tingkat) {
    const map = {
      'Internasional': { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed' },
      'Nasional':      { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
      'Provinsi':      { bg: 'rgba(249,115,22,0.12)', color: '#c2410c' },
      'Kota/Kabupaten':{ bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
      'Kecamatan':     { bg: 'rgba(16,185,129,0.12)', color: '#047857' },
      'Sekolah':       { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
    };
    return map[tingkat] || { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' };
  },

  renderPrestasiList() {
    const container = _('prestasi-list-container');
    if (!container) return;
    const data = this._prestasiData;

    if (!data.length) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 8px;display:block;opacity:0.4"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
        Belum ada prestasi yang ditambahkan.
      </div>`;
      return;
    }

    container.innerHTML = data.map(p => {
      const badge = this._tingkatBadgeColor(p.tingkat);
      return `
        <div style="display:flex;gap:14px;padding:14px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;background:var(--bg-primary);">
          <div style="width:40px;height:40px;background:${badge.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${badge.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div style="font-weight:700;font-size:14px;color:var(--text-primary);line-height:1.4;">${p.nama_prestasi}</div>
              <div style="display:flex;gap:4px;flex-shrink:0;">
                <button class="btn btn-ghost btn-sm" onclick="StudentApp.editPrestasi(${p.id})" title="Edit" style="padding:3px 7px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm" onclick="StudentApp.deletePrestasi(${p.id})" title="Hapus" style="padding:3px 7px;color:var(--sangat-berat);">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
              <span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${badge.bg};color:${badge.color};">Tingkat ${p.tingkat}</span>
              ${p.posisi ? `<span style="padding:2px 8px;border-radius:999px;font-size:11px;background:var(--bg-input);color:var(--text-secondary);">${p.posisi}</span>` : ''}
              ${p.tahun ? `<span style="padding:2px 8px;border-radius:999px;font-size:11px;background:var(--bg-input);color:var(--text-secondary);">${p.tahun}</span>` : ''}
              ${p.penyelenggara ? `<span style="padding:2px 8px;border-radius:999px;font-size:11px;background:var(--bg-input);color:var(--text-secondary);">${p.penyelenggara}</span>` : ''}
            </div>
            ${p.keterangan ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);line-height:1.5;">${p.keterangan}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  async submitPrestasi() {
    const editId = _('prestasi-edit-id').value;
    const data = {
      nama_prestasi: _('prestasi-nama').value.trim(),
      tingkat: _('prestasi-tingkat').value,
      posisi: _('prestasi-posisi').value.trim(),
      tahun: _('prestasi-tahun').value.trim(),
      penyelenggara: _('prestasi-penyelenggara').value.trim(),
      keterangan: _('prestasi-keterangan').value.trim(),
    };
    if (!data.nama_prestasi || !data.tingkat) return Toast.error('Nama prestasi dan tingkat wajib diisi');

    Spinner.show();
    try {
      if (editId) {
        await API.updatePrestasi(editId, data, this.token);
        Toast.success('Prestasi berhasil diperbarui');
      } else {
        await API.addPrestasi(data, this.token);
        Toast.success('Prestasi berhasil ditambahkan');
      }
      this.cancelEditPrestasi();
      await this.loadPortofolio();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  },

  editPrestasi(id) {
    const p = this._prestasiData.find(x => x.id === id);
    if (!p) return;
    _('prestasi-edit-id').value = p.id;
    _('prestasi-nama').value = p.nama_prestasi;
    _('prestasi-tingkat').value = p.tingkat;
    _('prestasi-posisi').value = p.posisi || '';
    _('prestasi-tahun').value = p.tahun || '';
    _('prestasi-penyelenggara').value = p.penyelenggara || '';
    _('prestasi-keterangan').value = p.keterangan || '';
    _('btn-submit-prestasi').innerHTML = '💾 Perbarui Prestasi';
    _('btn-cancel-prestasi').style.display = 'inline-flex';
    _('form-prestasi').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  cancelEditPrestasi() {
    _('prestasi-edit-id').value = '';
    _('form-prestasi').reset();
    _('btn-submit-prestasi').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Simpan Prestasi`;
    _('btn-cancel-prestasi').style.display = 'none';
  },

  async deletePrestasi(id) {
    const ok = await Modal.confirm({
      title: 'Hapus Prestasi?',
      body: 'Data prestasi ini akan dihapus permanen.',
      confirmText: 'Hapus', danger: true
    });
    if (!ok) return;
    Spinner.show();
    try {
      await API.deletePrestasi(id, this.token);
      Toast.success('Prestasi dihapus');
      await this.loadPortofolio();
    } catch (e) {
      Spinner.hide();
      Toast.error('Gagal: ' + e.message);
    }
  }
};

// Helper shorthand
function _(id) { return document.getElementById(id); }

