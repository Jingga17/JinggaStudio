/**
 * Counselor Connect — Halaman Kuesioner
 * Biodata → Soal (11 halaman × 20 soal) → Selesai
 */

const KuesionerApp = {
  token: null,
  studentId: null,
  student: null,
  soalOrder: [],      // array of question IDs in shuffled order
  answers: {},        // { questionId: 'ya'|'tidak' }
  currentPage: 0,     // 0-10 (11 halaman)
  SOAL_PER_HAL: 20,
  TOTAL_HAL: 11,
  timerInterval: null,
  timerStart: null,

  async init() {
    // Ambil token dari URL
    const params = new URLSearchParams(window.location.search);
    this.token = params.get('token');

    if (!this.token) {
      this.showError('Link tidak valid', 'Silakan gunakan link yang diberikan oleh guru/konselor Anda.');
      return;
    }

    Spinner.show();
    try {
      const sesi = await API.cekSesiAktif(this.token);
      if (!sesi.active) {
        Spinner.hide();
        this.showError('Sesi Sudah Ditutup', 'Link asesmen ini sudah tidak aktif. Hubungi guru/konselor Anda untuk informasi lebih lanjut.');
        return;
      }
    } catch(e) {
      Spinner.hide();
      this.showError('Gagal Terhubung', e.message);
      return;
    }
    Spinner.hide();

    // Cek apakah ada draft yang tersimpan
    const draft = Storage.getStudentDraft();
    if (draft && draft.token === this.token) {
      this.student   = draft;
      this.studentId = draft.student_id;
      this.answers   = Storage.getAnswers(this.studentId);
      this.soalOrder = Storage.getShuffledOrder(this.studentId) || this.generateOrder();
      this.currentPage = Storage.getCurrentPage(this.studentId);
      this.timerStart  = Storage.getTimerStart(this.studentId) || Date.now();

      // Langsung ke halaman soal
      this.showStep('soal');
      this.renderSoal();
      this.startTimer();
      return;
    }

    // Step 1: Biodata
    this.showStep('biodata');
    this.initBiodataForm();
  },

  showError(title, msg) {
    _('page-kuesioner').innerHTML = `
      <div class="error-page">
        <div class="card" style="max-width:440px;text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:16px">🔒</div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px">${title}</h2>
          <p style="color:var(--text-muted);font-size:14px;line-height:1.6">${msg}</p>
        </div>
      </div>`;
  },

  showStep(step) {
    ['biodata','soal','selesai'].forEach(s => {
      const el = _(`step-${s}`);
      if (el) el.style.display = s === step ? 'block' : 'none';
    });
    const header = _('kuis-header');
    if (header) header.style.display = step === 'selesai' || step === 'biodata' ? 'none' : 'flex';
  },

  // ─── BIODATA ───────────────────────────
  async initBiodataForm() {
    const form = _('biodata-form');
    if (!form) return;
    
    try {
      const classes = await API.getKelasOptions();
      const select = _('b-kelas');
      if (select) {
        select.innerHTML = '<option value="">— Pilih Kelas —</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    } catch(e) { console.warn("Gagal memuat kelas", e); }

    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.submitBiodata();
    };
  },

  async submitBiodata() {
    const jkRadio = document.querySelector('input[name="b-jk"]:checked');
    const fields = {
      nama:          _('b-nama')?.value.trim(),
      jenis_kelamin: jkRadio ? jkRadio.value : '',
      kelas:         _('b-kelas')?.value,
      ttl:           _('b-ttl')?.value,
      nisn:          _('b-nisn')?.value.trim(),
    };

    // Validasi client
    if (!fields.nama || !fields.jenis_kelamin || !fields.kelas || !fields.ttl || !fields.nisn) {
      Toast.error('Harap isi semua data dengan lengkap');
      return;
    }
    if (!/^\d{8,10}$/.test(fields.nisn)) {
      this.showFieldError('nisn', 'NISN harus berupa 8-10 digit angka');
      return;
    }

    Spinner.show();
    try {
      // Cek NISN
      const nisnCheck = await API.cekNISN(fields.nisn);
      if (nisnCheck.exists) {
        Spinner.hide();
        await Modal.alert({
          title: '⚠️ NISN Sudah Terdaftar',
          body: `<p>NISN <strong>${fields.nisn}</strong> sudah pernah digunakan untuk mengisi kuesioner ini.</p>
                 <p style="margin-top:8px;color:var(--text-muted)">Jika Anda merasa ini adalah kesalahan, hubungi guru/konselor Anda.</p>`,
          btnText: 'Mengerti'
        });
        return;
      }

      // Simpan biodata
      const result = await API.simpanBiodata({ ...fields, token: this.token });
      this.student   = { ...fields, student_id: result.student_id, token: this.token };
      this.studentId = result.student_id;

      // Inisiasi sesi kuesioner
      Storage.saveStudentDraft(this.student);
      this.soalOrder  = this.generateOrder();
      this.currentPage = 0;
      this.timerStart  = Date.now();
      Storage.saveShuffledOrder(this.studentId, this.soalOrder);
      Storage.saveCurrentPage(this.studentId, 0);
      Storage.saveTimerStart(this.studentId, this.timerStart);

      Spinner.hide();
      this.showStep('soal');
      this.renderSoal();
      this.startTimer();
    } catch(e) {
      Spinner.hide();
      Toast.error(e.message);
    }
  },

  showFieldError(field, msg) {
    const el = document.querySelector(`[data-field="${field}"] .form-error`);
    if (el) el.textContent = msg;
  },

  // ─── SOAL ──────────────────────────────
  generateOrder() {
    return shuffle(QUESTIONS_DATA.map(q => q.id));
  },

  getSoalForPage(pageIndex) {
    const start = pageIndex * this.SOAL_PER_HAL;
    const ids   = this.soalOrder.slice(start, start + this.SOAL_PER_HAL);
    return ids.map(id => QUESTIONS_DATA.find(q => q.id === id)).filter(Boolean);
  },

  renderSoal() {
    const soalList = this.getSoalForPage(this.currentPage);
    const offset   = this.currentPage * this.SOAL_PER_HAL;
    const totalJawab = Object.keys(this.answers).length;
    const pct = Math.round((totalJawab / 220) * 100);

    // Update header
    _('progress-bar').style.width = pct + '%';
    _('progress-pct').textContent  = pct + '%';
    _('progress-label').textContent = `Halaman ${this.currentPage + 1} dari ${this.TOTAL_HAL}`;

    // Step dots
    const dotsEl = _('step-dots');
    if (dotsEl) {
      dotsEl.innerHTML = Array.from({length: this.TOTAL_HAL}, (_,i) =>
        `<div class="step-dot ${i < this.currentPage ? 'completed' : i === this.currentPage ? 'active' : ''}"></div>`
      ).join('');
    }

    // Render soal
    const container = _('soal-list');
    if (!container) return;
    container.innerHTML = soalList.map((soal, idx) => {
      const jawaban = this.answers[soal.id];
      const yaSelected    = jawaban === 'ya' ? 'selected' : '';
      const tidakSelected = jawaban === 'tidak' ? 'selected' : '';
      return `
        <div class="soal-card ${jawaban ? 'answered' : ''}" id="soal-card-${soal.id}">
          <div class="soal-nomor">Soal ${offset + idx + 1} / 220</div>
          <div class="soal-text">${soal.teks}</div>
          <div class="soal-actions">
            <button class="btn-ya ${yaSelected}" onclick="KuesionerApp.pilihJawaban(${soal.id}, 'ya')" id="ya-${soal.id}">
              👍 Ya
            </button>
            <button class="btn-tidak ${tidakSelected}" onclick="KuesionerApp.pilihJawaban(${soal.id}, 'tidak')" id="tidak-${soal.id}">
              👎 Tidak
            </button>
          </div>
        </div>`;
    }).join('');

    // Navigation
    const isFirst = this.currentPage === 0;
    const isLast  = this.currentPage === this.TOTAL_HAL - 1;
    _('nav-prev').disabled = isFirst;
    _('nav-next').textContent = isLast ? '📤 Kirim Jawaban' : 'Selanjutnya →';
    _('nav-next').className = isLast ? 'btn btn-success' : 'btn btn-primary';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  pilihJawaban(questionId, jawaban) {
    this.answers[questionId] = jawaban;
    Storage.saveAnswer(this.studentId, questionId, jawaban);

    // Update UI
    const card = _(`soal-card-${questionId}`);
    if (card) {
      card.classList.add('answered');
      _(`ya-${questionId}`)?.classList.toggle('selected', jawaban === 'ya');
      _(`tidak-${questionId}`)?.classList.toggle('selected', jawaban === 'tidak');
    }

    // Update progress bar
    const totalJawab = Object.keys(this.answers).length;
    const pct = Math.round((totalJawab / 220) * 100);
    _('progress-bar').style.width = pct + '%';
    _('progress-pct').textContent  = pct + '%';
  },

  async prevPage() {
    if (this.currentPage <= 0) return;
    await this.saveParsial();
    this.currentPage--;
    Storage.saveCurrentPage(this.studentId, this.currentPage);
    this.renderSoal();
  },

  async nextPage() {
    const soalPage = this.getSoalForPage(this.currentPage);
    const belumJawab = soalPage.filter(s => !this.answers[s.id]);

    if (belumJawab.length > 0) {
      const ok = await Modal.confirm({
        title: `${belumJawab.length} Soal Belum Dijawab`,
        body: `Masih ada <strong>${belumJawab.length} soal</strong> di halaman ini yang belum dijawab. Yakin ingin melanjutkan? (bisa kembali lagi nanti)`,
        confirmText: 'Lanjutkan',
        cancelText: 'Isi dulu'
      });
      if (!ok) return;
    }

    if (this.currentPage === this.TOTAL_HAL - 1) {
      await this.konfirmasiKirim();
      return;
    }

    Spinner.show();
    await this.saveParsial();
    Spinner.hide();
    this.currentPage++;
    Storage.saveCurrentPage(this.studentId, this.currentPage);
    this.renderSoal();
  },

  async saveParsial() {
    try {
      const soalPage   = this.getSoalForPage(this.currentPage);
      const pageAnswers = {};
      soalPage.forEach(s => { if (this.answers[s.id]) pageAnswers[s.id] = this.answers[s.id]; });
      await API.simpanJawabanParsial(this.studentId, this.currentPage, pageAnswers);
    } catch(e) { /* silent — jawaban sudah di localStorage */ }
  },

  async konfirmasiKirim() {
    const totalJawab = Object.keys(this.answers).length;
    const belum = 220 - totalJawab;
    const ok = await Modal.confirm({
      title: '📤 Kirim Jawaban?',
      body: `<p>Anda telah menjawab <strong>${totalJawab} dari 220 soal</strong>${belum > 0 ? ` (<strong style="color:var(--sedang)">${belum} belum dijawab</strong>)` : ' <span style="color:var(--belajar)">✓ Semua soal terjawab</span>'}.</p>
             <p style="margin-top:8px;color:var(--text-muted)">Setelah dikirim, jawaban tidak bisa diubah lagi.</p>`,
      confirmText: 'Ya, Kirim Sekarang',
      cancelText: 'Cek Lagi',
      danger: false,
    });
    if (!ok) return;

    Spinner.show();
    try {
      await this.saveParsial();
      const durasi = Math.round((Date.now() - this.timerStart) / 1000);
      await API.selesaiKuesioner(this.studentId, durasi);
      this.stopTimer();
      Storage.clearStudentDraft();
      Spinner.hide();
      this.showSelesai(durasi, totalJawab);
    } catch(e) {
      Spinner.hide();
      Toast.error('Gagal mengirim jawaban: ' + e.message);
    }
  },

  showSelesai(durasi, totalJawab) {
    this.showStep('selesai');
    const m = Math.floor(durasi/60), s = durasi%60;
    _('selesai-durasi').textContent  = `${m} menit ${s} detik`;
    _('selesai-jawab').textContent   = totalJawab;
    _('selesai-nama').textContent    = this.student?.nama || '';
  },

  // ─── TIMER ─────────────────────────────
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      const el = _('timer-display');
      if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  },
  stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  },
};
