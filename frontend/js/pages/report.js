const ReportApp = {
  params: new URLSearchParams(window.location.search),
  type: null,
  id: null, // student ID or Kelas name
  csvData: null,

  async init() {
    this.type = this.params.get('type');
    this.id = this.params.get('id');

    if (!this.type || !this.id) {
      document.getElementById('loading').innerHTML = 'Parameter laporan tidak valid.';
      return;
    }

    try {
      this.settings = await API.getSettings();
    } catch(e) {
      console.warn("Failed to load settings", e);
      this.settings = {};
    }

    // Gunakan data dari file JS yang digenerate oleh backend
    if (typeof DATA_ANALISIS_CSV !== 'undefined') {
        this.csvData = DATA_ANALISIS_CSV;
    } else {
        console.warn("DATA_ANALISIS_CSV tidak ditemukan. Harap jalankan backend setidaknya 1x untuk generate file.");
        this.csvData = { bidang: [], subBidang: [] };
    }

    if (!MOCK_MODE) {
      try {
        if (this.type === 'individu') {
          const reportData = await API.getStudentReport(this.id);
          this.renderIndividuReal(reportData);
        } else if (this.type === 'kelas') {
          const reportData = await API.getClassReport(this.id);
          this.renderKelasReal(reportData);
        }
      } catch (err) {
        document.getElementById('loading').innerHTML = 'Gagal memuat data laporan dari server: ' + err.message;
      }
    } else {
      setTimeout(() => {
        if (this.type === 'individu') {
          this.renderIndividu(this.id);
        } else if (this.type === 'kelas') {
          this.renderKelas(this.id);
        }
      }, 500);
    }
  },

  isInRentang(val, rentangStr) {
    if (!rentangStr) return false;
    let s = rentangStr.replace(/%/g, '').trim();
    if (s.includes('-')) {
      let parts = s.split('-');
      let min = parseFloat(parts[0]);
      let max = parseFloat(parts[1]);
      let v = Math.round(val);
      return v >= min && v <= max;
    } else if (s.startsWith('>')) {
      let min = parseFloat(s.substring(1));
      let v = Math.round(val);
      return v > min;
    }
    return false;
  },

  getDeskripsiAnalisis(tipe, nama, val, isKelas = false) {
    let result = `(Teks deskripsi belum tersedia untuk ${nama} - ${val})`;
    if (tipe === 'bidang' && this.csvData.bidang.length > 0) {
      const rows = this.csvData.bidang.filter(r => r.Kategori === nama);
      for (const r of rows) {
        if (this.isInRentang(val, r['Rentang / Skala'])) { result = r['Deskripsi Analisis']; break; }
      }
    } else if (tipe === 'subbidang' && this.csvData.subBidang.length > 0) {
      const rows = this.csvData.subBidang.filter(r => r['Sub Bidang'] === nama);
      for (const r of rows) {
        if (this.isInRentang(val, r['Rentang'])) { result = r['Deskripsi Analisis']; break; }
      }
    }

    if (isKelas && result !== `(Teks deskripsi belum tersedia untuk ${nama} - ${val})`) {
      result = result.replace(/^Siswa /g, 'Secara rata-rata, kelas ini ');
      result = result.replace(/Siswa /g, 'Siswa di kelas ini ');
      result = result.replace(/siswa /g, 'siswa di kelas ini ');
      result = result.replace(/dirinya/g, 'diri mereka');
    }
    
    return result;
  },


  getKopSurat(title) {
    const s = this.settings || {};
    const logo1 = s.logo_sekolah ? `<img src="${s.logo_sekolah}" style="width:100%;height:100%;object-fit:contain;">` : '<div style="background:#e2e8f0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:50%">LOGO</div>';
    const logo2 = s.logo_bk ? `<img src="${s.logo_bk}" style="width:100%;height:100%;object-fit:contain;">` : '<div style="background:#e2e8f0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:50%">LOGO BK</div>';

    return `
      <div class="kop-surat" style="display:flex;align-items:center;gap:20px;">
        <div style="width:80px;height:80px;flex-shrink:0;">${logo1}</div>
        <div style="flex:1;text-align:center;">
          <h1 style="margin:0 0 4px 0;font-size:20px;font-weight:800;text-transform:uppercase;color:#000;">${s.nama_sekolah || 'NAMA SEKOLAH'}</h1>
          <p style="margin:0;font-size:12px;color:#000;">${s.alamat ? s.alamat.replace(/\n/g, '<br>') : 'Alamat & Identitas Sekolah'}</p>
        </div>
        <div style="width:80px;height:80px;flex-shrink:0;">${logo2}</div>
      </div>
      <div class="kop-title">${title}</div>
    `;
  },

  getFooter() {
    const s = this.settings || {};
    const ttdKonselor = s.ttd_konselor ? `<img src="${s.ttd_konselor}" style="max-height:70px;object-fit:contain;position:absolute;bottom:25px;left:50%;transform:translateX(-50%);">` : '';
    const capKonselor = s.cap_konselor ? `<img src="${s.cap_konselor}" style="max-height:80px;object-fit:contain;position:absolute;bottom:20px;left:-30px;opacity:0.8;z-index:-1;">` : '';

    return `
      <div class="avoid-break">
        <div class="footer-ttd" style="display:flex;justify-content:flex-end;">
          <div class="ttd-box" style="position:relative;text-align:center;">
            ${capKonselor}
            ${ttdKonselor}
            <div>${s.kota || 'Kota'}, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
            <div style="margin-top:4px">Mengetahui,</div>
            <div>Guru Bimbingan dan Konseling</div>
            <div class="ttd-space" style="height:70px;"></div>
            <div><b><u>${s.nama_konselor || 'Nama Konselor'}</u></b></div>
            <div>NIP. ${s.nip || '-'}</div>
          </div>
        </div>
        <div class="footer-rahasia">
          <b>⚠ DOKUMEN INI BERSIFAT RAHASIA</b><br>
          Laporan ini hanya diperuntukkan bagi konselor dan pihak-pihak yang berkepentingan secara langsung. 
          Dilarang keras menyebarluaskan isi laporan ini kepada pihak yang tidak berwenang.
        </div>
      </div>
    `;
  },

  getKategoriWarna(pct) {
    if (pct >= 70) return { label: 'Sangat Berat', cls: 'tag-sangat-berat', hex: 'var(--border-sangat-berat)' };
    if (pct >= 50) return { label: 'Berat', cls: 'tag-berat', hex: 'var(--border-berat)' };
    if (pct >= 25) return { label: 'Sedang', cls: 'tag-sedang', hex: 'var(--border-sedang)' };
    return { label: 'Ringan', cls: 'tag-ringan', hex: 'var(--border-ringan)' };
  },

  // ==========================================
  // LAPORAN INDIVIDU
  // ==========================================
  renderIndividu(studentId) {
    const student = MOCK.students.find(s => s.id == studentId) || MOCK.students[0];
    
    // Hitung persentase
    const pPct = student.pribadi_pct;
    const bPct = student.belajar_pct;
    const sPct = student.sosial_pct;
    const kPct = student.karir_pct;

    const pKat = this.getKategoriWarna(pPct);
    const bKat = this.getKategoriWarna(bPct);
    const sKat = this.getKategoriWarna(sPct);
    const kKat = this.getKategoriWarna(kPct);

    const bidangList = [
      { nama: 'Pribadi', pct: pPct },
      { nama: 'Belajar', pct: bPct },
      { nama: 'Sosial', pct: sPct },
      { nama: 'Karir', pct: kPct }
    ].sort((a,b) => b.pct - a.pct);

    // Dummy Sub Bidang Data (for demo)
    const subPrioritas = [
      { name: 'Fokus Belajar', bidang: 'Belajar', score: 5, max: 7, pct: 71.4, kat: this.getKategoriWarna(71.4), icon: '🟢' },
      { name: 'Motivasi Belajar', bidang: 'Belajar', score: 5, max: 8, pct: 62.5, kat: this.getKategoriWarna(62.5), icon: '🟢' },
      { name: 'Manajemen Waktu', bidang: 'Belajar', score: 3, max: 5, pct: 60.0, kat: this.getKategoriWarna(60.0), icon: '🟢' },
      { name: 'Beban Belajar', bidang: 'Belajar', score: 4, max: 7, pct: 57.1, kat: this.getKategoriWarna(57.1), icon: '🟢' },
      { name: 'Kematangan Emosi', bidang: 'Pribadi', score: 6, max: 11, pct: 54.5, kat: this.getKategoriWarna(54.5), icon: '🔵' }
    ];

    let mockKrisisRows = '';
    let rowNo = 1;
    if (typeof QUESTIONS_DATA !== 'undefined') {
      subPrioritas.forEach(sub => {
        const qs = QUESTIONS_DATA.filter(q => q.sub_bidang === sub.name);
        const problemCount = Math.max(1, Math.round((sub.pct / 100) * qs.length));
        const problems = qs.slice(0, Math.min(problemCount, qs.length));
        problems.forEach(q => {
          const ans = q.arah === 'Negative' ? 'Ya' : 'Tidak';
          const indicator = q.arah === 'Negative' ? '🔴 Ya (Skor 1)' : '🔴 Tidak (Skor 1)';
          mockKrisisRows += `<tr>
            <td style="text-align:center">${rowNo++}</td>
            <td style="text-align:center"><b>${sub.name}</b></td>
            <td style="text-align:left">${q.teks}</td>
            <td style="text-align:center"><b>${ans}</b></td>
            <td style="text-align:center">${indicator}</td>
          </tr>`;
        });
      });
    }

    let html = `
      ${this.getKopSurat('LAPORAN ANALISIS INDIVIDU &mdash; Counselor Connect')}
      
      <h2>IDENTITAS SISWA</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Lengkap</th><td><b>${student.nama}</b></td></tr>
        <tr><th>Jenis Kelamin</th><td>${student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
        <tr><th>Kelas</th><td>${student.kelas}</td></tr>
        <tr><th>NISN</th><td>${student.nisn}</td></tr>
        <tr><th>Status Pengisian</th><td><b>${student.status}</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Lie Scale (Skala Kebohongan)</h3>
          <p>Skor: <b>${student.lie_score} dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:${(student.lie_score/22)*100}%; background:#3b82f6;"></div>
            </div>
            ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Consistency Check</h3>
          <p>Skor Inkonsistensi: <b>${student.cc_score} dari 9 pasang</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:${(student.cc_score/9)*100}%; background:#10b981;"></div>
            </div>
            ${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
          </div>
        </div>
      </div>

      <h2>B. PROFIL MASALAH PER BIDANG</h2>
      <div class="donut-container">
        <!-- Mock donut sizes using conic gradient based on pct relative to total -->
        <div class="donut-chart" style="background: conic-gradient(
          var(--c-pribadi) 0% 25%,
          var(--c-belajar) 25% 50%,
          var(--c-sosial) 50% 75%,
          var(--c-karir) 75% 100%
        );">
          <div class="donut-hole"></div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi: ${pPct}% <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar: ${bPct}% <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial: ${sPct}% <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir: ${kPct}% <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct)}
          </div>
        `).join('')}
      </div>

      <div class="page-break"></div>

      <h2>C. PROFIL 5 SUB BIDANG PRIORITAS</h2>
      <div class="chart-box">
        ${subPrioritas.map(s => `
          <div class="bar-row">
            <div class="bar-label">${s.icon} ${s.name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${s.pct}%; background:${s.kat.hex}"></div>
            </div>
            <div class="bar-value">${s.pct}%</div>
            <div style="width:80px; text-align:right;"><span class="tag ${s.kat.cls}">${s.kat.label}</span></div>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:15px; background:#f8fafc; padding:8px; border-radius:4px;">
            <b>Deskripsi Analisis:</b> ${this.getDeskripsiAnalisis('subbidang', s.name, s.pct)}
          </div>
        `).join('')}
      </div>

      <h2>D. TABEL JAWABAN KRISIS (5 SUB BIDANG PRIORITAS)</h2>
      <p>Berikut adalah rincian pernyataan yang terindikasi bermasalah dari 5 sub bidang prioritas tertinggi siswa:</p>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="width:140px;">Sub Bidang</th>
          <th style="text-align:left;">Pernyataan</th>
          <th style="width:90px;">Jawaban</th>
          <th style="width:130px;">Indikasi Masalah</th>
        </tr>
        ${mockKrisisRows}
      </table>

      <h2>E. KEKUATAN YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <tr>
          <th style="text-align:left;">Sub Bidang</th>
          <th style="width:130px;">Bidang</th>
          <th style="width:100px;">Persentase</th>
          <th style="width:140px;">Status</th>
        </tr>
        <tr><td>Nilai & Moral</td><td style="text-align:center">🔵 Pribadi</td><td style="text-align:center">0.0%</td><td style="text-align:center">✅ Sangat Baik</td></tr>
        <tr><td>Perencanaan Karir</td><td style="text-align:center">🟣 Karir</td><td style="text-align:center">14.3%</td><td style="text-align:center">✅ Baik</td></tr>
      </table>
      <p>Siswa memiliki fondasi nilai dan moral yang sangat kuat &mdash; tidak ditemukan masalah pada aspek ini. Hal ini merupakan aset besar yang perlu terus dipupuk.</p>

      <h2>F. REKOMENDASI</h2>
      <ul>
        <li><b>Layanan Konseling Individual (Prioritas Segera)</b>: Sesi konseling terfokus pada regulasi emosi dan manajemen stres akademik.</li>
        <li><b>Pelatihan Keterampilan Belajar</b>: Workshop manajemen waktu, pembuatan jadwal belajar efektif, dan teknik konsentrasi.</li>
        <li><b>Penguatan Motivasi Belajar</b>: Identifikasi motivasi intrinsik siswa melalui eksplorasi minat dan nilai pribadi.</li>
        <li><b>Koordinasi dengan Pihak Terkait</b>: Konsultasi dengan wali kelas mengenai kondisi akademik siswa dan koordinasi dengan orang tua.</li>
      </ul>

      ${this.getFooter()}
    `;
    
    document.getElementById('report-container').innerHTML = html;
  },

  // ==========================================
  // LAPORAN KELAS
  // ==========================================
  renderKelas(kelasName) {
    // Generate dummy class data based on MOCK
    const studentsInClass = MOCK.students.filter(s => s.kelas === kelasName || s.kelas === 'XII IPA 1'); // Fallback if empty
    const validCount = studentsInClass.filter(s => s.is_valid).length;
    
    const subPrioritas = [
      { name: 'Fokus Belajar', bidang: 'Belajar', pct: 75.5, kat: this.getKategoriWarna(75.5), icon: '🟢' },
      { name: 'Perencanaan Karir', bidang: 'Karir', pct: 71.4, kat: this.getKategoriWarna(71.4), icon: '🟣' },
      { name: 'Motivasi Belajar', bidang: 'Belajar', pct: 67.9, kat: this.getKategoriWarna(67.9), icon: '🟢' },
      { name: 'Kematangan Emosi', bidang: 'Pribadi', pct: 64.9, kat: this.getKategoriWarna(64.9), icon: '🔵' },
      { name: 'Manajemen Waktu', bidang: 'Belajar', pct: 64.3, kat: this.getKategoriWarna(64.3), icon: '🟢' }
    ];

    const bidangList = [
      { nama: 'Pribadi', pct: 44.7 },
      { nama: 'Belajar', pct: 63.7 },
      { nama: 'Sosial', pct: 48.3 },
      { nama: 'Karir', pct: 52.9 }
    ].sort((a,b) => b.pct - a.pct);

    let mockKelasRows = '';
    let rowK = 1;
    if (typeof QUESTIONS_DATA !== 'undefined') {
      subPrioritas.forEach(sub => {
        const qs = QUESTIONS_DATA.filter(q => q.sub_bidang === sub.name);
        const problemCount = Math.max(1, Math.round((sub.pct / 100) * qs.length));
        const problems = qs.slice(0, Math.min(problemCount, qs.length));
        problems.forEach(q => {
          const itemPct = Math.min(100, Math.max(0, sub.pct + (Math.random() * 20 - 10))).toFixed(1);
          const jmlMasalah = Math.round((itemPct / 100) * validCount);
          const indicator = itemPct >= 70 ? '🔴' : (itemPct >= 50 ? '🟠' : '🟡');
          const arahMasalah = q.arah === 'Negative' ? 'Ya' : 'Tidak';
          mockKelasRows += `<tr>
            <td style="text-align:center">${rowK++}</td>
            <td style="text-align:center"><b>${sub.name}</b></td>
            <td style="text-align:left">${q.teks}</td>
            <td style="text-align:center"><b>${arahMasalah}</b></td>
            <td style="text-align:center">${jmlMasalah} siswa</td>
            <td style="text-align:center"><b>${itemPct}%</b> ${indicator}</td>
          </tr>`;
        });
      });
    }

    let html = `
      ${this.getKopSurat(`LAPORAN ANALISIS KELAS &mdash; Counselor Connect<br>KELAS ${kelasName}`)}
      
      <h2>IDENTITAS KELAS</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Kelas</th><td><b>${kelasName}</b></td></tr>
        <tr><th>Tahun Ajaran</th><td>2025/2026</td></tr>
        <tr><th>Jumlah Mengisi</th><td>${studentsInClass.length} siswa</td></tr>
        <tr><th>Jumlah Valid (Digunakan)</th><td><b>${validCount} siswa</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Rata-Rata Lie Scale</h3>
          <p>Skor Kelas: <b>3.2 dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', 3.2, true)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Rata-Rata Consistency Check</h3>
          <p>Skor Kelas: <b>1.4 dari 9</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            ${this.getDeskripsiAnalisis('bidang', 'Consistency', 1.4, true)}
          </div>
        </div>
      </div>

      <h2>B. PROFIL MASALAH KELAS PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background: conic-gradient(
          var(--c-pribadi) 0% 20%,
          var(--c-belajar) 20% 55%,
          var(--c-sosial) 55% 75%,
          var(--c-karir) 75% 100%
        );">
          <div class="donut-hole"></div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi: 44.7% <span class="tag tag-sedang">Sedang</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar: 63.7% <span class="tag tag-berat">Berat</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial: 48.3% <span class="tag tag-sedang">Sedang</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir: 52.9% <span class="tag tag-berat">Berat</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct, true)}
          </div>
        `).join('')}
      </div>

      <div class="page-break"></div>

      <h2>C. PROFIL 5 SUB BIDANG PRIORITAS KELAS</h2>
      <div class="chart-box">
        ${subPrioritas.map(s => `
          <div class="bar-row">
            <div class="bar-label">${s.icon} ${s.name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${s.pct}%; background:${s.kat.hex}"></div>
            </div>
            <div class="bar-value">${s.pct}%</div>
            <div style="width:80px; text-align:right;"><span class="tag ${s.kat.cls}">${s.kat.label}</span></div>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:15px; background:#f8fafc; padding:8px; border-radius:4px;">
            <b>Deskripsi Analisis:</b> ${this.getDeskripsiAnalisis('subbidang', s.name, s.pct, true)}
          </div>
        `).join('')}
      </div>

      <h2>D. TABEL JAWABAN KRISIS KELAS (5 SUB BIDANG PRIORITAS)</h2>
      <p>Rekapitulasi pernyataan dengan persentase masalah tertinggi pada 5 sub bidang prioritas utama dari total ${validCount} siswa valid:</p>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="width:130px;">Sub Bidang</th>
          <th style="text-align:left;">Pernyataan</th>
          <th style="width:100px;">Indikator Masalah</th>
          <th style="width:100px;">Jml Masalah</th>
          <th style="width:100px;">% Masalah</th>
        </tr>
        ${mockKelasRows}
      </table>

      <h2>E. DAFTAR SISWA YANG PERLU PENANGANAN KHUSUS</h2>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="text-align:left;">Nama Siswa</th>
          <th style="width:140px;">Status Validitas</th>
          <th style="width:250px; text-align:left;">Keterangan Diagnostik</th>
        </tr>
        ${studentsInClass.map((s,i) => `
          <tr>
            <td style="text-align:center">${i+1}</td>
            <td><b>${s.nama}</b></td>
            <td style="text-align:center">${s.is_valid ? '<span style="color:green">✅ Valid</span>' : '<span style="color:red">❌ Tidak Valid</span>'}</td>
            <td>${s.is_valid ? 'Perlu pantauan (Belajar/Karir)' : 'Perlu wawancara ulang'}</td>
          </tr>
        `).join('')}
      </table>

      <h2>F. KEKUATAN KELAS YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <tr>
          <th style="text-align:left;">Sub Bidang</th>
          <th style="width:130px;">Bidang</th>
          <th style="width:100px;">Persentase</th>
          <th style="width:140px;">Status</th>
        </tr>
        <tr><td>Nilai & Moral</td><td style="text-align:center">🔵 Pribadi</td><td style="text-align:center">12.9%</td><td style="text-align:center">✅ Sangat Baik</td></tr>
        <tr><td>Etika Sosial</td><td style="text-align:center">🟠 Sosial</td><td style="text-align:center">23.8%</td><td style="text-align:center">✅ Baik</td></tr>
        <tr><td>Kesiapan Karir</td><td style="text-align:center">🟣 Karir</td><td style="text-align:center">30.1%</td><td style="text-align:center">✅ Cukup Baik</td></tr>
      </table>
      <p>Kelas ${kelasName} memiliki landasan nilai dan moral yang sangat kuat sebagai kolektif. Etika dalam berinteraksi sosial juga masih terjaga dengan baik. Ini merupakan modal sosial yang berharga.</p>

      <h2>G. REKOMENDASI PROGRAM</h2>
      <ul>
        <li><b>Program Intervensi Klasikal (Jangka Pendek)</b>: Layanan bimbingan belajar klasikal (teknik konsentrasi, manajemen waktu), sesi eksplorasi karir (talkshow alumni), dan pelatihan regulasi emosi kelompok.</li>
        <li><b>Program Bimbingan Kelompok (Jangka Menengah)</b>: Kelompok bimbingan belajar, peer counseling, dan workshop perencanaan karir.</li>
        <li><b>Koordinasi Lintas Fungsi</b>: Rapat koordinasi dengan seluruh guru kelas ${kelasName} membahas temuan asesmen dan konsultasi dengan wali kelas.</li>
        <li><b>Tindak Lanjut Siswa Khusus</b>: Panggilan konseling individual untuk siswa dengan skor berat di 3-4 bidang, serta verifikasi untuk siswa berstatus Tidak Valid.</li>
      </ul>

      ${this.getFooter()}
    `;
    
    document.getElementById('report-container').innerHTML = html;
  },

  // ==========================================
  // REAL LAPORAN INDIVIDU
  // ==========================================
  renderIndividuReal(data) {
    const { student, answers } = data;
    
    const pPct = student.pribadi_pct;
    const bPct = student.belajar_pct;
    const sPct = student.sosial_pct;
    const kPct = student.karir_pct;

    const pKat = this.getKategoriWarna(pPct);
    const bKat = this.getKategoriWarna(bPct);
    const sKat = this.getKategoriWarna(sPct);
    const kKat = this.getKategoriWarna(kPct);

    const bidangList = [
      { nama: 'Pribadi', pct: pPct },
      { nama: 'Belajar', pct: bPct },
      { nama: 'Sosial', pct: sPct },
      { nama: 'Karir', pct: kPct }
    ].sort((a,b) => b.pct - a.pct);

    // Dynamic Sub Bidang Prioritas
    const subPrioritas = Object.entries(student.subBidangPct)
      .map(([name, pct]) => {
        const q = QUESTIONS_DATA.find(x => x.sub_bidang === name);
        const bidang = q ? q.bidang : 'Pribadi';
        const iconSymbol = bidang === 'Pribadi' ? '🔵' : (bidang === 'Belajar' ? '🟢' : (bidang === 'Sosial' ? '🟠' : '🟣'));
        return { name, bidang, pct, kat: this.getKategoriWarna(pct), icon: iconSymbol };
      })
      .sort((a,b) => b.pct - a.pct)
      .slice(0, 5);

    let krisisRows = '';
    let rowNo = 1;
    const subNames = subPrioritas.map(s => s.name);
    
    // Filter answers belonging to top 5 sub bidangs that are problematic
    const problemAnswers = answers.filter(a => {
      if (!subNames.includes(a.sub_bidang)) return false;
      const ans = a.jawaban.toLowerCase();
      return (a.arah_jawaban === 'Negative' && ans === 'ya') ||
             (a.arah_jawaban === 'Positive' && ans === 'tidak');
    });

    problemAnswers.forEach(a => {
      const displayAns = a.jawaban.toLowerCase() === 'ya' ? 'Ya' : 'Tidak';
      const indicator = a.arah_jawaban === 'Negative' ? '🔴 Ya (Skor 1)' : '🔴 Tidak (Skor 1)';
      krisisRows += `<tr>
        <td style="text-align:center">${rowNo++}</td>
        <td style="text-align:center"><b>${a.sub_bidang}</b></td>
        <td style="text-align:left">${a.teks_soal}</td>
        <td style="text-align:center"><b>${displayAns}</b></td>
        <td style="text-align:center">${indicator}</td>
      </tr>`;
    });

    if (problemAnswers.length === 0) {
      krisisRows = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Tidak ditemukan jawaban krisis pada 5 sub bidang prioritas ini.</td></tr>`;
    }

    // Dynamic strengths (lowest 3 sub bidangs)
    const kekuatan = Object.entries(student.subBidangPct)
      .map(([name, pct]) => {
        const q = QUESTIONS_DATA.find(x => x.sub_bidang === name);
        const bidang = q ? q.bidang : 'Pribadi';
        const iconSymbol = bidang === 'Pribadi' ? '🔵' : (bidang === 'Belajar' ? '🟢' : (bidang === 'Sosial' ? '🟠' : '🟣'));
        let label = 'Cukup Baik';
        if (pct <= 15) label = 'Sangat Baik';
        else if (pct <= 30) label = 'Baik';
        return { name, bidang: `${iconSymbol} ${bidang}`, pct, status: `✅ ${label}` };
      })
      .sort((a,b) => a.pct - b.pct)
      .slice(0, 3);

    const kekuatanRows = kekuatan.map(k => `
      <tr>
        <td>${k.name}</td>
        <td style="text-align:center">${k.bidang}</td>
        <td style="text-align:center">${k.pct.toFixed(1)}%</td>
        <td style="text-align:center">${k.status}</td>
      </tr>
    `).join('');

    let html = `
      ${this.getKopSurat('LAPORAN ANALISIS INDIVIDU &mdash; Counselor Connect')}
      
      <h2>IDENTITAS SISWA</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Lengkap</th><td><b>${student.nama}</b></td></tr>
        <tr><th>Jenis Kelamin</th><td>${student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
        <tr><th>Kelas</th><td>${student.kelas}</td></tr>
        <tr><th>NISN</th><td>${student.nisn}</td></tr>
        <tr><th>Status Pengisian</th><td><b>${student.status}</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Lie Scale (Skala Kebohongan)</h3>
          <p>Skor: <b>${student.lie_score} dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:${(student.lie_score/22)*100}%; background:#3b82f6;"></div>
            </div>
            ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Consistency Check</h3>
          <p>Skor Inkonsistensi: <b>${student.cc_score} dari 9 pasang</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:${(student.cc_score/9)*100}%; background:#10b981;"></div>
            </div>
            ${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
          </div>
        </div>
      </div>

      <h2>B. PROFIL MASALAH PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background: conic-gradient(
          var(--c-pribadi) 0% 25%,
          var(--c-belajar) 25% 50%,
          var(--c-sosial) 50% 75%,
          var(--c-karir) 75% 100%
        );">
          <div class="donut-hole"></div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi: ${pPct}% <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar: ${bPct}% <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial: ${sPct}% <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir: ${kPct}% <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct)}
          </div>
        `).join('')}
      </div>

      <div class="page-break"></div>

      <h2>C. PROFIL 5 SUB BIDANG PRIORITAS</h2>
      <div class="chart-box">
        ${subPrioritas.map(s => `
          <div class="bar-row">
            <div class="bar-label">${s.icon} ${s.name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${s.pct}%; background:${s.kat.hex}"></div>
            </div>
            <div class="bar-value">${s.pct.toFixed(1)}%</div>
            <div style="width:80px; text-align:right;"><span class="tag ${s.kat.cls}">${s.kat.label}</span></div>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:15px; background:#f8fafc; padding:8px; border-radius:4px;">
            <b>Deskripsi Analisis:</b> ${this.getDeskripsiAnalisis('subbidang', s.name, s.pct)}
          </div>
        `).join('')}
      </div>

      <h2>D. TABEL JAWABAN KRISIS (5 SUB BIDANG PRIORITAS)</h2>
      <p>Berikut adalah rincian pernyataan yang terindikasi bermasalah dari 5 sub bidang prioritas tertinggi siswa:</p>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="width:140px;">Sub Bidang</th>
          <th style="text-align:left;">Pernyataan</th>
          <th style="width:90px;">Jawaban</th>
          <th style="width:130px;">Indikasi Masalah</th>
        </tr>
        ${krisisRows}
      </table>

      <h2>E. KEKUATAN YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <tr>
          <th style="text-align:left;">Sub Bidang</th>
          <th style="width:130px;">Bidang</th>
          <th style="width:100px;">Persentase</th>
          <th style="width:140px;">Status</th>
        </tr>
        ${kekuatanRows}
      </table>
      <p>Siswa memiliki beberapa sub-bidang dengan tingkat permasalahan yang sangat rendah, yang menjadi modal positif untuk terus ditingkatkan.</p>

      <h2>F. REKOMENDASI</h2>
      <ul>
        <li><b>Layanan Konseling Individual (Prioritas Segera)</b>: Sesi konseling terfokus pada regulasi emosi dan bidang prioritas tertinggi siswa.</li>
        <li><b>Pelatihan Keterampilan Belajar/Karir</b>: Disesuaikan dengan tingkat keparahan masalah siswa demi meminimalkan hambatan.</li>
        <li><b>Koordinasi Lintas Fungsi</b>: Menghubungi wali kelas dan orang tua siswa jika diperlukan intervensi bersama.</li>
      </ul>

      ${this.getFooter()}
    `;
    
    document.getElementById('report-container').innerHTML = html;
  },

  // ==========================================
  // REAL LAPORAN KELAS
  // ==========================================
  renderKelasReal(data) {
    const { kelas, total_responden, total_valid, lie_score_avg, cc_score_avg, bidang, subBidang, questionProblemsCount, students } = data;
    
    const pPct = bidang.Pribadi;
    const bPct = bidang.Belajar;
    const sPct = bidang.Sosial;
    const kPct = bidang.Karir;

    const pKat = this.getKategoriWarna(pPct);
    const bKat = this.getKategoriWarna(bPct);
    const sKat = this.getKategoriWarna(sPct);
    const kKat = this.getKategoriWarna(kPct);

    const bidangList = [
      { nama: 'Pribadi', pct: pPct },
      { nama: 'Belajar', pct: bPct },
      { nama: 'Sosial', pct: sPct },
      { nama: 'Karir', pct: kPct }
    ].sort((a,b) => b.pct - a.pct);

    // Dynamic subbidang prioritas kelas
    const subPrioritas = Object.entries(subBidang)
      .map(([name, pct]) => {
        const q = QUESTIONS_DATA.find(x => x.sub_bidang === name);
        const bidangName = q ? q.bidang : 'Pribadi';
        const iconSymbol = bidangName === 'Pribadi' ? '🔵' : (bidangName === 'Belajar' ? '🟢' : (bidangName === 'Sosial' ? '🟠' : '🟣'));
        return { name, bidang: bidangName, pct, kat: this.getKategoriWarna(pct), icon: iconSymbol };
      })
      .sort((a,b) => b.pct - a.pct)
      .slice(0, 5);

    let krisisRows = '';
    const subNames = subPrioritas.map(s => s.name);
    
    const classKrisisQuestions = QUESTIONS_DATA.filter(q => {
      return q.tipe === 'Core' && subNames.includes(q.sub_bidang);
    })
    .map(q => {
      const pCount = questionProblemsCount[q.id] || 0;
      const pct = total_valid > 0 ? ((pCount / total_valid) * 100) : 0;
      return { ...q, problemCount: pCount, pct };
    })
    .sort((a,b) => b.problemCount - a.problemCount)
    .slice(0, 15);

    krisisRows = classKrisisQuestions.map((q, idx) => {
      const indicator = q.pct >= 70 ? '🔴' : (q.pct >= 50 ? '🟠' : '🟡');
      const arahMasalah = q.arah === 'Negative' ? 'Ya' : 'Tidak';
      return `<tr>
        <td style="text-align:center">${idx+1}</td>
        <td style="text-align:center"><b>${q.sub_bidang}</b></td>
        <td style="text-align:left">${q.teks}</td>
        <td style="text-align:center"><b>${arahMasalah}</b></td>
        <td style="text-align:center">${q.problemCount} siswa</td>
        <td style="text-align:center"><b>${q.pct.toFixed(1)}%</b> ${indicator}</td>
      </tr>`;
    }).join('');

    // Student handling status table
    let studentRows = students.map((s, idx) => `
      <tr>
        <td style="text-align:center">${idx+1}</td>
        <td><b>${s.nama}</b></td>
        <td style="text-align:center">${s.is_valid ? '<span style="color:green">✅ Valid</span>' : '<span style="color:red">❌ Tidak Valid</span>'}</td>
        <td>${s.is_valid ? 'Perlu pantauan (Belajar/Karir)' : 'Perlu wawancara ulang / Reset Sesi'}</td>
      </tr>
    `).join('');

    // Dynamic strengths (lowest 3 sub bidangs)
    const kekuatan = Object.entries(subBidang)
      .map(([name, pct]) => {
        const q = QUESTIONS_DATA.find(x => x.sub_bidang === name);
        const bidangName = q ? q.bidang : 'Pribadi';
        const iconSymbol = bidangName === 'Pribadi' ? '🔵' : (bidangName === 'Belajar' ? '🟢' : (bidangName === 'Sosial' ? '🟠' : '🟣'));
        let label = 'Cukup Baik';
        if (pct <= 15) label = 'Sangat Baik';
        else if (pct <= 30) label = 'Baik';
        return { name, bidang: `${iconSymbol} ${bidangName}`, pct, status: `✅ ${label}` };
      })
      .sort((a,b) => a.pct - b.pct)
      .slice(0, 3);

    const kekuatanRows = kekuatan.map(k => `
      <tr>
        <td>${k.name}</td>
        <td style="text-align:center">${k.bidang}</td>
        <td style="text-align:center">${k.pct.toFixed(1)}%</td>
        <td style="text-align:center">${k.status}</td>
      </tr>
    `).join('');

    let html = `
      ${this.getKopSurat(`LAPORAN ANALISIS KELAS &mdash; Counselor Connect<br>KELAS ${kelas}`)}
      
      <h2>IDENTITAS KELAS</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Kelas</th><td><b>${kelas}</b></td></tr>
        <tr><th>Tahun Ajaran</th><td>${this.settings?.tahun_ajaran || '2025/2026'}</td></tr>
        <tr><th>Jumlah Mengisi</th><td>${total_responden} siswa</td></tr>
        <tr><th>Jumlah Valid (Digunakan)</th><td><b>${total_valid} siswa</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Rata-Rata Lie Scale</h3>
          <p>Skor Kelas: <b>${lie_score_avg} dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', lie_score_avg, true)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Rata-Rata Consistency Check</h3>
          <p>Skor Kelas: <b>${cc_score_avg} dari 9</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            ${this.getDeskripsiAnalisis('bidang', 'Consistency', cc_score_avg, true)}
          </div>
        </div>
      </div>

      <h2>B. PROFIL MASALAH KELAS PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background: conic-gradient(
          var(--c-pribadi) 0% 20%,
          var(--c-belajar) 20% 55%,
          var(--c-sosial) 55% 75%,
          var(--c-karir) 75% 100%
        );">
          <div class="donut-hole"></div>
        </div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi: ${pPct}% <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar: ${bPct}% <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial: ${sPct}% <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir: ${kPct}% <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct, true)}
          </div>
        `).join('')}
      </div>

      <div class="page-break"></div>

      <h2>C. PROFIL 5 SUB BIDANG PRIORITAS KELAS</h2>
      <div class="chart-box">
        ${subPrioritas.map(s => `
          <div class="bar-row">
            <div class="bar-label">${s.icon} ${s.name}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${s.pct}%; background:${s.kat.hex}"></div>
            </div>
            <div class="bar-value">${s.pct.toFixed(1)}%</div>
            <div style="width:80px; text-align:right;"><span class="tag ${s.kat.cls}">${s.kat.label}</span></div>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:15px; background:#f8fafc; padding:8px; border-radius:4px;">
            <b>Deskripsi Analisis:</b> ${this.getDeskripsiAnalisis('subbidang', s.name, s.pct, true)}
          </div>
        `).join('')}
      </div>

      <h2>D. TABEL JAWABAN KRISIS KELAS (5 SUB BIDANG PRIORITAS)</h2>
      <p>Rekapitulasi pernyataan dengan persentase masalah tertinggi pada 5 sub bidang prioritas utama dari total ${total_valid} siswa valid:</p>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="width:130px;">Sub Bidang</th>
          <th style="text-align:left;">Pernyataan</th>
          <th style="width:100px;">Indikator Masalah</th>
          <th style="width:100px;">Jml Masalah</th>
          <th style="width:100px;">% Masalah</th>
        </tr>
        ${krisisRows}
      </table>

      <h2>E. DAFTAR SISWA YANG PERLU PENANGANAN KHUSUS</h2>
      <table>
        <tr>
          <th style="width:40px;">No</th>
          <th style="text-align:left;">Nama Siswa</th>
          <th style="width:140px;">Status Validitas</th>
          <th style="width:250px; text-align:left;">Keterangan Diagnostik</th>
        </tr>
        ${studentRows}
      </table>

      <h2>F. KEKUATAN KELAS YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <tr>
          <th style="text-align:left;">Sub Bidang</th>
          <th style="width:130px;">Bidang</th>
          <th style="width:100px;">Persentase</th>
          <th style="width:140px;">Status</th>
        </tr>
        ${kekuatanRows}
      </table>
      <p>Kekuatan kelas dihitung berdasarkan sub-bidang dengan persentase masalah terendah sebagai modal positif kelas.</p>

      <h2>G. REKOMENDASI PROGRAM</h2>
      <ul>
        <li><b>Program Klasikal / Kelompok</b>: Disesuaikan dengan kebutuhan prioritas yang muncul secara agregat.</li>
        <li><b>Koordinasi Lintas Fungsi</b>: Koordinasi dengan Wali Kelas dan Orang Tua mengenai siswa berstatus Tidak Valid.</li>
        <li><b>Tindak Lanjut Individu</b>: Layanan konseling individual bagi siswa dengan tingkat keparahan masalah yang tinggi.</li>
      </ul>

      ${this.getFooter()}
    `;
    
    document.getElementById('report-container').innerHTML = html;
  }
};
