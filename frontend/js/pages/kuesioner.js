/**
 * Resilien — Halaman Kuesioner
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

  async start(attemptId, profile, sessionId) {
    this.studentId = attemptId;
    this.student = profile;
    this.token = Storage.getStudentToken(); // Used for authentication in Kuesioner APIs

    // Cek apakah ada draft yang tersimpan untuk attempt ini
    const draftId = `draft_${attemptId}`;
    const draft = Storage.get(draftId);
    
    if (draft) {
      this.answers   = Storage.getAnswers(this.studentId) || {};
      this.soalOrder = Storage.getShuffledOrder(this.studentId) || this.generateOrder();
      this.currentPage = Storage.getCurrentPage(this.studentId) || 0;
      
      let savedTimer = Storage.getTimerStart(this.studentId);
      if (!savedTimer) {
        // Artinya mereka nge-refresh sebelum mulai dari panduan
        savedTimer = Date.now();
        Storage.saveTimerStart(this.studentId, savedTimer);
      }
      this.timerStart = savedTimer;

      // Langsung ke halaman soal
      this.showStep('soal');
      this.renderSoal();
      this.startTimer();
      return;
    }

    // Step 2: Panduan (langsung karena biodata sudah di dashboard)
    this.soalOrder   = this.generateOrder();
    this.currentPage = 0;
    this.answers     = {};
    Storage.set(draftId, true); // Tandai sudah mulai
    Storage.saveShuffledOrder(this.studentId, this.soalOrder);
    Storage.saveCurrentPage(this.studentId, 0);
    this.showStep('panduan');
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
    ['biodata','panduan','soal','selesai'].forEach(s => {
      const el = _(`step-${s}`);
      if (el) el.style.display = s === step ? 'block' : 'none';
    });
    const header = _('kuis-header');
    if (header) header.style.display = step === 'soal' ? 'flex' : 'none';
  },

  // (Fungsi Biodata dihapus karena sudah dipindah ke StudentApp / Dashboard)

  mulaiDariPanduan() {
    this.timerStart = Date.now();
    Storage.saveTimerStart(this.studentId, this.timerStart);
    this.showStep('soal');
    this.renderSoal();
    this.startTimer();
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-3px"><polyline points="20 6 9 17 4 12"/></svg> Ya, Sesuai
            </button>
            <button class="btn-tidak ${tidakSelected}" onclick="KuesionerApp.pilihJawaban(${soal.id}, 'tidak')" id="tidak-${soal.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:-3px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Tidak Sesuai
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

  handleAnswer(e) {
    const btn = e.target.closest('.btn-ya, .btn-tidak');
    if (!btn) return;
    const qidStr = btn.getAttribute('data-id');
    if (!qidStr) return;
    const qid = parseInt(qidStr, 10);
    const q = this.soalOrder.find(item => item.id === qid);
    if (!q) return;

    const val = btn.classList.contains('btn-ya') ? 'Ya' : 'Tidak';
    if (typeof this.answers[q.id] !== 'undefined') {
      this.answers[q.id] = (this.answers[q.id] === val) ? null : val;
    } else {
      this.answers[q.id] = val;
    }
    Storage.saveAnswer(this.studentId, q.id, this.answers[q.id]);
    this.renderSoal();
  },

  gantiSiswa() {
    Modal.confirm({
      title: 'Kembali ke Dashboard?',
      body: 'Apakah Anda yakin ingin kembali ke Dashboard? Jawaban Anda akan otomatis tersimpan.',
      okText: 'Ya, Kembali',
      onOk: () => {
        StudentApp.loadDashboard();
      }
    });
  },

  async nextPage() {
    const soalPage = this.getSoalForPage(this.currentPage);
    const belumJawab = soalPage.filter(s => !this.answers[s.id]);

    if (belumJawab.length > 0) {
      Toast.error(`Harap selesaikan ${belumJawab.length} soal yang belum dijawab di halaman ini sebelum melanjutkan.`);
      return;
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
      Storage.remove(`draft_${this.studentId}`);
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
