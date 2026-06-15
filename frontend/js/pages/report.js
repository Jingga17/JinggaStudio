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
      <div style="text-align:center; font-size:13px; font-weight:700; margin-top:-10px; margin-bottom: 20px;">
        TAHUN AJARAN ${s.tahun_ajaran || '2025/2026'}
      </div>
      <div class="kop-title">${title}</div>
    `;
  },

  getFooter() {
    const s = this.settings || {};
    const ttdKonselor = s.ttd_konselor ? `<img src="${s.ttd_konselor}" style="max-height:95px;object-fit:contain;position:absolute;bottom:15px;left:50%;transform:translateX(-50%);mix-blend-mode:multiply;z-index:2;">` : '';
    const capKonselor = s.cap_konselor ? `<img src="${s.cap_konselor}" style="width:120px;height:120px;object-fit:contain;position:absolute;bottom:5px;left:50%;transform:translateX(-95%);opacity:0.85;mix-blend-mode:multiply;z-index:1;">` : '';

    return `
      <div class="avoid-break">
        <div style="text-align:justify; font-size:12.5px; color:#1e293b; margin: 0 0 30px 0; line-height: 1.5;">
          Dokumen ini berisi laporan analisis komprehensif mengenai profil perkembangan dan indikasi hambatan siswa pada bidang Pribadi, Belajar, Sosial, dan Karir. Hasil analisis ini berfungsi sebagai instrumen deteksi dini bagi konselor untuk memberikan layanan intervensi dan konseling yang sesuai dengan kebutuhan prioritas siswa. Seluruh data dalam dokumen ini bersifat rahasia dan hanya diperuntukkan bagi pihak yang berkepentingan.
        </div>
        <div class="footer-ttd" style="display:flex;justify-content:flex-end;">
          <div class="ttd-box" style="position:relative;text-align:center;">
            ${capKonselor}
            ${ttdKonselor}
            <div>${s.kota || 'Kota'}, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
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

  
  
   getLieScaleSvg(score) {
    const r = 55;
    const cx = 150;
    const cy = 100;
    const strokeWidth = 20;
    const C = 2 * Math.PI * r;
    const halfC = Math.PI * r;
    
    const s = Math.min(Math.max(score, 0), 22);
    const angle = -180 + (s/22)*180;

    return `
      <svg width="100%" height="100" viewBox="0 0 300 130" style="overflow:visible; font-family: 'Inter', sans-serif;">
        <defs>
          <linearGradient id="soft-grad-lie" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#60a5fa"/> <!-- Soft Blue -->
            <stop offset="50%" stop-color="#fde047"/> <!-- Soft Yellow -->
            <stop offset="100%" stop-color="#f87171"/> <!-- Soft Red -->
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.05"/>
          </filter>
        </defs>
        
        <!-- Background track -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"
          stroke-dasharray="${halfC} ${halfC}" stroke-linecap="round" transform="rotate(180, ${cx}, ${cy})" />
        
        <!-- Gradient segment -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#soft-grad-lie)" stroke-width="${strokeWidth}"
          stroke-dasharray="${halfC} ${halfC}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(180, ${cx}, ${cy})" filter="url(#shadow)"/>

        <!-- Labels -->
        <text x="${cx - r - 25}" y="${cy + 5}" font-size="9" font-weight="600" fill="#64748b" text-anchor="end">SANGAT</text>
        <text x="${cx - r - 25}" y="${cy + 17}" font-size="9" font-weight="600" fill="#64748b" text-anchor="end">JUJUR</text>
        
        <text x="${cx}" y="${cy - r - 20}" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">WASPADA</text>
        
        <text x="${cx + r + 25}" y="${cy + 5}" font-size="9" font-weight="600" fill="#64748b" text-anchor="start">BERBOHONG</text>
        
        <text x="${cx - r}" y="${cy + 22}" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">0</text>
        <text x="${cx + r}" y="${cy + 22}" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">22</text>

        <!-- Needle -->
        <g transform="rotate(${angle}, ${cx}, ${cy})">
          <polygon points="${cx - 4},${cy} ${cx},${cy - r + 10} ${cx + 4},${cy}" fill="#475569"/>
          <circle cx="${cx}" cy="${cy}" r="6" fill="#1e293b"/>
          <circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff"/>
        </g>
      </svg>
    `
  },

  getConsistencySvg(score, isClass = false) {
    const r = 55;
    const cx = 150;
    const cy = 100;
    const strokeWidth = 20;
    const C = 2 * Math.PI * r;
    const halfC = Math.PI * r;
    
    // score adalah jumlah pasangan yang inkonsisten (abu-abu di versi sebelumnya)
    // 0 = paling konsisten, 9 = paling tidak konsisten
    const s = isClass ? parseFloat(score) : Math.min(Math.max(score, 0), 9);
    const angle = -180 + (s/9)*180;
    const konsisten = 9 - s;
    const inkonsisten = s;

    return `
      <svg width="100%" height="100" viewBox="0 0 300 130" style="overflow:visible; font-family: 'Inter', sans-serif;">
        <defs>
          <linearGradient id="soft-grad-cons" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#34d399"/> <!-- Soft Green (Consistent) -->
            <stop offset="50%" stop-color="#fde047"/> <!-- Soft Yellow -->
            <stop offset="100%" stop-color="#f87171"/> <!-- Soft Red (Inconsistent) -->
          </linearGradient>
          <filter id="shadow-cons" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.05"/>
          </filter>
        </defs>
        
        <!-- Background track -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"
          stroke-dasharray="${halfC} ${halfC}" stroke-linecap="round" transform="rotate(180, ${cx}, ${cy})" />
        
        <!-- Gradient segment -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#soft-grad-cons)" stroke-width="${strokeWidth}"
          stroke-dasharray="${halfC} ${halfC}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(180, ${cx}, ${cy})" filter="url(#shadow-cons)"/>

        <!-- Labels -->
        <text x="${cx - r - 25}" y="${cy + 5}" font-size="9" font-weight="600" fill="#64748b" text-anchor="end">SANGAT</text>
        <text x="${cx - r - 25}" y="${cy + 17}" font-size="9" font-weight="600" fill="#64748b" text-anchor="end">KONSISTEN</text>
        
        <text x="${cx}" y="${cy - r - 20}" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">KURANG KONSISTEN</text>
        
        <text x="${cx + r + 25}" y="${cy + 10}" font-size="9" font-weight="600" fill="#64748b" text-anchor="start">INKONSISTEN</text>
        
        <text x="${cx - r}" y="${cy + 22}" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">0</text>
        <text x="${cx + r}" y="${cy + 22}" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="middle">9</text>

        <!-- Needle -->
        <g transform="rotate(${angle}, ${cx}, ${cy})">
          <polygon points="${cx - 4},${cy} ${cx},${cy - r + 10} ${cx + 4},${cy}" fill="#475569"/>
          <circle cx="${cx}" cy="${cy}" r="6" fill="#1e293b"/>
          <circle cx="${cx}" cy="${cy}" r="2" fill="#ffffff"/>
        </g>
      </svg>
    `
  },

  getDonutSvg(pPct, bPct, sPct, kPct) {
    const total = pPct + bPct + sPct + kPct || 1;
    const p = (pPct/total) * 100;
    const b = (bPct/total) * 100;
    const s = (sPct/total) * 100;
    const k = (kPct/total) * 100;
    
    const cx = 21;
    const cy = 21;
    const rText = 15.91549430918954; 
    
    function getText(offsetStart, length, val) {
        if (val <= 0) return '';
        const midLength = offsetStart + (length / 2);
        const angle = (midLength / 100) * 2 * Math.PI;
        const tx = cx + rText * Math.sin(angle);
        const ty = cy - rText * Math.cos(angle);
        return `<text x="${tx}" y="${ty}" fill="white" font-size="3" font-weight="bold" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">${Math.round(val)}%</text>`;
    }
    
    const tP = getText(0, p, pPct);
    const tB = getText(p, b, bPct);
    const tS = getText(p+b, s, sPct);
    const tK = getText(p+b+s, k, kPct);

    return `
    <svg width="100%" height="100%" viewBox="0 0 42 42" style="border-radius:50%;">
      <g transform="rotate(-90 21 21)">
        <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#cbd5e1" stroke-width="8"></circle>
        ${p>0 ? `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" stroke-width="8" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="0"></circle>` : ''}
        ${b>0 ? `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="8" stroke-dasharray="${b} ${100 - b}" stroke-dashoffset="-${p}"></circle>` : ''}
        ${s>0 ? `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="8" stroke-dasharray="${s} ${100 - s}" stroke-dashoffset="-${p + b}"></circle>` : ''}
        ${k>0 ? `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#8b5cf6" stroke-width="8" stroke-dasharray="${k} ${100 - k}" stroke-dashoffset="-${p + b + s}"></circle>` : ''}
      </g>
      <circle cx="21" cy="21" r="11.91549430918954" fill="white"></circle>
      ${tP}
      ${tB}
      ${tS}
      ${tK}
    </svg>`;
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

      let alertBanner = '';
      const maxPct = Math.max(pPct, bPct, sPct, kPct);
      if (student.status === 'Tidak Valid') {
        alertBanner += `
        <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-left:4px solid #64748b; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#334155; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            ⚠️ STATUS PENGISIAN TIDAK VALID
          </h3>
          <p style="margin:0; font-size:12px; color:#475569; font-weight:600; line-height:1.4;">
            Hasil instrumen siswa ini terdeteksi <b>TIDAK VALID</b> berdasarkan Skala Kebohongan (Lie Scale) atau Konsistensi. Disarankan untuk memanggil siswa dan melakukan asesmen ulang.
          </p>
        </div>`;
      }
      if (maxPct >= 70) {
        alertBanner += `
        <div style="background:#fef2f2; border:1px solid #fca5a5; border-left:4px solid #ef4444; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#b91c1c; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            🚨 BUTUH PENANGANAN SEGERA
          </h3>
          <p style="margin:0; font-size:12px; color:#991b1b; font-weight:600; line-height:1.4;">
            Sangat disarankan untuk segera dijadwalkan sesi konseling.
          </p>
        </div>`;
      } else if (maxPct >= 50) {
        alertBanner += `
        <div style="background:#fff7ed; border:1px solid #fdba74; border-left:4px solid #f97316; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#c2410c; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            ⚠️ BUTUH PENANGANAN
          </h3>
          <p style="margin:0; font-size:12px; color:#9a3412; font-weight:600; line-height:1.4;">
            Disarankan untuk dijadwalkan sesi konseling preventif.
          </p>
        </div>`;
      }

      let html = `
      ${this.getKopSurat('LAPORAN ANALISIS INDIVIDU')}
      ${alertBanner}
      <h2>IDENTITAS SISWA</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Lengkap</th><td><b>${student.nama}</b></td></tr>
        <tr><th>Jenis Kelamin</th><td>${student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
        <tr><th>Kelas</th><td>${student.kelas}</td></tr>
        <tr><th>NISN</th><td>${student.nisn}</td></tr>
        <tr><th>Status Pengisian</th><td><b>${student.status}</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Lie Scale (Skala Kebohongan)
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getLieScaleSvg(student.lie_score, false)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Skor: <span style="color:#1e293b;">${student.lie_score} dari 22</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Consistency Check
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getConsistencySvg(student.cc_score, false)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Skor Inkonsistensi: <span style="color:#1e293b;">${student.cc_score} dari 9 pasang</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN 👍</h4>
          <ul>
            <li>PROFIL DATA SANGAT VALID</li>
            <li>DAPAT DIANDALKAN</li>
            <li>LANDASAN INTERVENSI KOKOH</li>
          </ul>
        </div>
      </div>

      <h2>B. PROFIL MASALAH PER BIDANG</h2>
      <div class="donut-container">
        <!-- Mock donut sizes using conic gradient based on pct relative to total -->
        <div class="donut-chart" style="background:none;">${this.getDonutSvg(pPct, bPct, sPct, kPct)}</div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct)}
          </div>
        `).join('')}
      </div>

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
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="width:140px;">Sub Bidang</th>
            <th style="text-align:left;">Pernyataan</th>
            <th style="width:90px;">Jawaban</th>
            <th style="width:130px;">Indikasi Masalah</th>
          </tr>
        </thead>
        <tbody>
          ${mockKrisisRows}
        </tbody>
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
    
    const pPct = 44.7;
    const bPct = 63.7;
    const sPct = 48.3;
    const kPct = 52.9;

    const pKat = this.getKategoriWarna(pPct);
    const bKat = this.getKategoriWarna(bPct);
    const sKat = this.getKategoriWarna(sPct);
    const kKat = this.getKategoriWarna(kPct);
    
    const subPrioritas = [
      { name: 'Fokus Belajar', bidang: 'Belajar', pct: 75.5, kat: this.getKategoriWarna(75.5), icon: '🟢' },
      { name: 'Perencanaan Karir', bidang: 'Karir', pct: 71.4, kat: this.getKategoriWarna(71.4), icon: '🟣' },
      { name: 'Motivasi Belajar', bidang: 'Belajar', pct: 67.9, kat: this.getKategoriWarna(67.9), icon: '🟢' },
      { name: 'Kematangan Emosi', bidang: 'Pribadi', pct: 64.9, kat: this.getKategoriWarna(64.9), icon: '🔵' },
      { name: 'Manajemen Waktu', bidang: 'Belajar', pct: 64.3, kat: this.getKategoriWarna(64.3), icon: '🟢' }
    ];

    const bidangList = [
      { nama: 'Pribadi', pct: pPct },
      { nama: 'Belajar', pct: bPct },
      { nama: 'Sosial', pct: sPct },
      { nama: 'Karir', pct: kPct }
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
      ${this.getKopSurat(`LAPORAN ANALISIS KELAS<br>KELAS ${kelasName}`)}
      
      <h2>IDENTITAS KELAS</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Kelas</th><td><b>${kelasName}</b></td></tr>
        <tr><th>Jumlah Mengisi</th><td>${studentsInClass.length} siswa</td></tr>
        <tr><th>Jumlah Valid (Digunakan)</th><td><b>${validCount} siswa</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Rata-Rata Lie Scale
          </div>
          <div class="validity-body">
            <div class="validity-score-box">
              <div style="color:#2563eb;font-size:14px;margin-bottom:2px">👁️</div>
              Skor Kelas: <b>3.2 dari 22</b>
            </div>
            <div style="text-align:center; margin-top:-10px;">
              ${this.getLieScaleSvg(3.2, true)}
            </div>
            <div class="validity-bar">
              <div style="width:${((22 - 3.2)/22)*100}%; background:#2563eb;"></div>
              <div style="width:${(3.2/22)*100}%; background:#cbd5e1;"></div>
            </div>
            <div class="validity-legend">
              <div><span style="display:inline-block;width:10px;height:10px;background:#2563eb;margin-right:5px;"></span> Rata-rata Kejujuran: <b>${(22 - 3.2).toFixed(1)}</b></div>
              <div><span style="display:inline-block;width:10px;height:10px;background:#cbd5e1;margin-right:5px;"></span> Rata-rata Berbohong: <b>3.2</b></div>
            </div>
            <div class="validity-desc" style="margin-top:15px;">
              ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', 3.2, true)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Rata-Rata Consistency Check
          </div>
          <div class="validity-body">
            <div style="display:flex; align-items:flex-start; gap:10px;">
              <div class="validity-score-box" style="align-self:flex-start; flex-shrink:0;">
                <div style="color:#10b981;font-size:14px;margin-bottom:2px">👍</div>
                Skor Kelas: <b>1.4<br>dari 9 pasang</b>
              </div>
              <div style="flex:1; min-width:0; overflow:hidden;">
                ${this.getConsistencySvg(1.4, true)}
              </div>
            </div>
            <div class="validity-desc" style="margin-top:8px;">
              ${this.getDeskripsiAnalisis('bidang', 'Consistency', 1.4, true)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN KELAS 👍</h4>
          <ul>
            <li>DATA KELAS CUKUP VALID</li>
            <li>DAPAT DIANDALKAN SECARA KOLEKTIF</li>
          </ul>
        </div>
      </div>

      <h2>B. PROFIL MASALAH KELAS PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background:none;">${this.getDonutSvg(pPct, bPct, sPct, kPct)}</div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct, true)}
          </div>
        `).join('')}
      </div>

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
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="width:130px;">Sub Bidang</th>
            <th style="text-align:left;">Pernyataan</th>
            <th style="width:100px;">Indikator Masalah</th>
            <th style="width:100px;">Jml Masalah</th>
            <th style="width:100px;">% Masalah</th>
          </tr>
        </thead>
        <tbody>
          ${mockKelasRows}
        </tbody>
      </table>

      <h2>E. DAFTAR SISWA YANG PERLU PENANGANAN KHUSUS</h2>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="text-align:left;">Nama Siswa</th>
            <th style="width:140px;">Status Validitas</th>
            <th style="width:250px; text-align:left;">Keterangan Diagnostik</th>
          </tr>
        </thead>
        <tbody>
          ${studentsInClass.map((s,i) => `
            <tr>
              <td style="text-align:center">${i+1}</td>
              <td><b>${s.nama}</b></td>
              <td style="text-align:center">${s.is_valid ? '<span style="color:green">✅ Valid</span>' : '<span style="color:red">❌ Tidak Valid</span>'}</td>
              <td>${s.is_valid ? 'Perlu pantauan (Belajar/Karir)' : 'Perlu wawancara ulang'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>F. KEKUATAN KELAS YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Sub Bidang</th>
            <th style="width:130px;">Bidang</th>
            <th style="width:100px;">Persentase</th>
            <th style="width:140px;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Nilai & Moral</td><td style="text-align:center">🔵 Pribadi</td><td style="text-align:center">12.9%</td><td style="text-align:center">✅ Sangat Baik</td></tr>
          <tr><td>Etika Sosial</td><td style="text-align:center">🟠 Sosial</td><td style="text-align:center">23.8%</td><td style="text-align:center">✅ Baik</td></tr>
          <tr><td>Kesiapan Karir</td><td style="text-align:center">🟣 Karir</td><td style="text-align:center">30.1%</td><td style="text-align:center">✅ Cukup Baik</td></tr>
        </tbody>
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

    
      const kekuatanSubNames = kekuatan.map(k => k.name);
      const strengthAnswers = answers.filter(a => {
        if (!kekuatanSubNames.includes(a.sub_bidang)) return false;
        const ans = a.jawaban.toLowerCase();
        return (a.arah_jawaban === 'Negative' && ans === 'tidak') ||
               (a.arah_jawaban === 'Positive' && ans === 'ya');
      }).slice(0, 10);
      
      let kekuatanAnsRows = '';
      let kRowNo = 1;
      strengthAnswers.forEach(a => {
        const displayAns = a.jawaban.toLowerCase() === 'ya' ? 'Ya' : 'Tidak';
        const indicator = '✅ Kondusif';
        kekuatanAnsRows += `<tr>
          <td style="text-align:center">${kRowNo++}</td>
          <td style="text-align:center"><b>${a.sub_bidang}</b></td>
          <td style="text-align:left">${a.teks_soal}</td>
          <td style="text-align:center"><b>${displayAns}</b></td>
          <td style="text-align:center; color: #10b981;">${indicator}</td>
        </tr>`;
      });
      if (strengthAnswers.length === 0) {
        kekuatanAnsRows = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Tidak ditemukan pernyataan kekuatan.</td></tr>`;
      }

      let alertBanner = '';
      const maxPct = Math.max(student.pribadi_pct, student.belajar_pct, student.sosial_pct, student.karir_pct);
      if (student.status === 'Tidak Valid') {
        alertBanner += `
        <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-left:4px solid #64748b; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#334155; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            ⚠️ STATUS PENGISIAN TIDAK VALID
          </h3>
          <p style="margin:0; font-size:12px; color:#475569; font-weight:600; line-height:1.4;">
            Hasil instrumen siswa ini terdeteksi <b>TIDAK VALID</b> berdasarkan Skala Kebohongan (Lie Scale) atau Konsistensi. Disarankan untuk memanggil siswa dan melakukan asesmen ulang.
          </p>
        </div>`;
      }
      if (maxPct >= 70) {
        alertBanner += `
        <div style="background:#fef2f2; border:1px solid #fca5a5; border-left:4px solid #ef4444; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#b91c1c; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            🚨 BUTUH PENANGANAN SEGERA
          </h3>
          <p style="margin:0; font-size:12px; color:#991b1b; font-weight:600; line-height:1.4;">
            Sangat disarankan untuk segera dijadwalkan sesi konseling.
          </p>
        </div>`;
      } else if (maxPct >= 50) {
        alertBanner += `
        <div style="background:#fff7ed; border:1px solid #fdba74; border-left:4px solid #f97316; padding:12px 16px; margin-bottom:20px; border-radius:6px; page-break-inside: avoid;">
          <h3 style="margin:0 0 4px 0; color:#c2410c; font-size:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
            ⚠️ BUTUH PENANGANAN
          </h3>
          <p style="margin:0; font-size:12px; color:#9a3412; font-weight:600; line-height:1.4;">
            Disarankan untuk dijadwalkan sesi konseling preventif.
          </p>
        </div>`;
      }

      let html = `
      ${this.getKopSurat('LAPORAN ANALISIS INDIVIDU')}
      ${alertBanner}
      <h2>IDENTITAS SISWA</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Lengkap</th><td><b>${student.nama}</b></td></tr>
        <tr><th>Jenis Kelamin</th><td>${student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
        <tr><th>Kelas</th><td>${student.kelas}</td></tr>
        <tr><th>NISN</th><td>${student.nisn}</td></tr>
        <tr><th>Status Pengisian</th><td><b>${student.status}</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Lie Scale (Skala Kebohongan)
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getLieScaleSvg(student.lie_score, true)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Rata-rata Skor: <span style="color:#1e293b;">${student.lie_score} dari 22</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Consistency Check
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getConsistencySvg(student.cc_score, true)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Rata-rata Inkonsistensi: <span style="color:#1e293b;">${student.cc_score} dari 9 pasang</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN 👍</h4>
          <ul>
            ${student.status === 'Valid' ? `
              <li>PROFIL DATA SANGAT VALID</li>
              <li>DAPAT DIANDALKAN</li>
              <li>LANDASAN INTERVENSI KOKOH</li>
            ` : student.status === 'Valid dengan Syarat' ? `
              <li>PROFIL DATA CUKUP VALID</li>
              <li>DAPAT DIANDALKAN DENGAN CATATAN</li>
              <li>PERLU WASPADA BIAS JAWABAN</li>
            ` : `
              <li>PROFIL DATA TIDAK VALID</li>
              <li>TIDAK DAPAT DIANDALKAN</li>
              <li>DISARANKAN RESET SESI / WAWANCARA</li>
            `}
          </ul>
        </div>
      </div>

      <h2>B. PROFIL MASALAH PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background:none;">${this.getDonutSvg(pPct, bPct, sPct, kPct)}</div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct)}
          </div>
        `).join('')}
      </div>

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
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="width:140px;">Sub Bidang</th>
            <th style="text-align:left;">Pernyataan</th>
            <th style="width:90px;">Jawaban</th>
            <th style="width:130px;">Indikasi Masalah</th>
          </tr>
        </thead>
        <tbody>
          ${krisisRows}
        </tbody>
      </table>

      <h2>E. KEKUATAN YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Sub Bidang</th>
            <th style="width:130px;">Bidang</th>
            <th style="width:100px;">Persentase</th>
            <th style="width:140px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${kekuatanRows}
        </tbody>
      </table>
      <p>Siswa memiliki beberapa sub-bidang dengan tingkat permasalahan yang sangat rendah, yang menjadi modal positif untuk terus ditingkatkan.</p>
        <h3 style="margin-top: 20px;">Daftar Jawaban Kekuatan</h3>
        <table>
          <thead>
            <tr>
              <th style="width:40px;">No</th>
              <th style="width:140px;">Sub Bidang</th>
              <th style="text-align:left;">Pernyataan</th>
              <th style="width:90px;">Jawaban</th>
              <th style="width:130px;">Indikasi Kekuatan</th>
            </tr>
          </thead>
          <tbody>
            ${kekuatanAnsRows}
          </tbody>
        </table>

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

    
      const classKekuatanSubNames = kekuatan.map(k => k.name);
      const classKekuatanQuestions = QUESTIONS_DATA.filter(q => {
        return q.tipe === 'Core' && classKekuatanSubNames.includes(q.sub_bidang);
      })
      .map(q => {
        const pCount = questionProblemsCount[q.id] || 0;
        const nonProblemCount = total_valid - pCount;
        const pct = total_valid > 0 ? ((nonProblemCount / total_valid) * 100) : 0;
        return { ...q, nonProblemCount, pct };
      })
      .sort((a,b) => b.nonProblemCount - a.nonProblemCount)
      .slice(0, 10);
      
      let classKekuatanAnsRows = classKekuatanQuestions.map((q, idx) => {
        const arahKekuatan = q.arah === 'Negative' ? 'Tidak' : 'Ya';
        return `<tr>
          <td style="text-align:center">${idx+1}</td>
          <td style="text-align:center"><b>${q.sub_bidang}</b></td>
          <td style="text-align:left">${q.teks}</td>
          <td style="text-align:center"><b>${arahKekuatan}</b></td>
          <td style="text-align:center">${q.nonProblemCount} siswa</td>
          <td style="text-align:center; color: #10b981;"><b>${q.pct.toFixed(1)}%</b> ✅ Kondusif</td>
        </tr>`;
      }).join('');
      if (classKekuatanQuestions.length === 0) {
        classKekuatanAnsRows = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Tidak ditemukan pernyataan kekuatan.</td></tr>`;
      }

      let html = `
      ${this.getKopSurat(`LAPORAN ANALISIS KELAS<br>KELAS ${kelas}`)}
      
      <h2>IDENTITAS KELAS</h2>
      <table class="tbl-identitas">
        <tr><th>Nama Kelas</th><td><b>${kelas}</b></td></tr>
        <tr><th>Jumlah Mengisi</th><td>${total_responden} siswa</td></tr>
        <tr><th>Jumlah Valid (Digunakan)</th><td><b>${total_valid} siswa</b></td></tr>
      </table>

      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Rata-Rata Lie Scale
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getLieScaleSvg(lie_score_avg, true)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Rata-rata Skor Kelas: <span style="color:#1e293b;">${lie_score_avg} dari 22</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Lie Scale', lie_score_avg, true)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Rata-Rata Consistency Check
          </div>
          <div class="validity-body" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div style="width: 100%; max-width: 250px; margin: 10px auto;">
              ${this.getConsistencySvg(cc_score_avg, true)}
            </div>
            <div style="font-size: 13px; color: #475569; font-weight: 600; margin-top: -15px; margin-bottom: 15px;">
              Rata-rata Inkonsistensi Kelas: <span style="color:#1e293b;">${cc_score_avg} dari 9 pasang</span>
            </div>
            <div class="validity-desc" style="text-align:justify; width: 100%;">
              ${this.getDeskripsiAnalisis('bidang', 'Consistency', cc_score_avg, true)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN KELAS 👍</h4>
          <ul>
            <li>DATA KELAS CUKUP VALID</li>
            <li>DAPAT DIANDALKAN SECARA KOLEKTIF</li>
          </ul>
        </div>
      </div>

      <h2>B. PROFIL MASALAH KELAS PER BIDANG</h2>
      <div class="donut-container">
        <div class="donut-chart" style="background:none;">${this.getDonutSvg(pPct, bPct, sPct, kPct)}</div>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-color" style="background:var(--c-pribadi)"></div> 🔵 Pribadi <span class="tag ${pKat.cls}">${pKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-belajar)"></div> 🟢 Belajar <span class="tag ${bKat.cls}">${bKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-sosial)"></div> 🟠 Sosial <span class="tag ${sKat.cls}">${sKat.label}</span></div>
          <div class="legend-item"><div class="legend-color" style="background:var(--c-karir)"></div> 🟣 Karir <span class="tag ${kKat.cls}">${kKat.label}</span></div>
        </div>
      </div>
      <div style="margin-top:20px;">
        ${bidangList.map(b => `
          <div class="desc-box" style="margin-top:10px;">
            <b>Bidang ${b.nama} (${b.pct}%):</b> ${this.getDeskripsiAnalisis('bidang', b.nama, b.pct, true)}
          </div>
        `).join('')}
      </div>

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
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="width:130px;">Sub Bidang</th>
            <th style="text-align:left;">Pernyataan</th>
            <th style="width:100px;">Indikator Masalah</th>
            <th style="width:100px;">Jml Masalah</th>
            <th style="width:100px;">% Masalah</th>
          </tr>
        </thead>
        <tbody>
          ${krisisRows}
        </tbody>
      </table>

      <h2>E. DAFTAR SISWA YANG PERLU PENANGANAN KHUSUS</h2>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th style="text-align:left;">Nama Siswa</th>
            <th style="width:140px;">Status Validitas</th>
            <th style="width:250px; text-align:left;">Keterangan Diagnostik</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>

      <h2>F. KEKUATAN KELAS YANG PERLU DIPERTAHANKAN</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Sub Bidang</th>
            <th style="width:130px;">Bidang</th>
            <th style="width:100px;">Persentase</th>
            <th style="width:140px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${kekuatanRows}
        </tbody>
      </table>
      <p>Kekuatan kelas dihitung berdasarkan sub-bidang dengan persentase masalah terendah sebagai modal positif kelas.</p>
        <h3 style="margin-top: 20px;">Daftar Jawaban Kekuatan Kelas</h3>
        <table>
          <thead>
            <tr>
              <th style="width:40px;">No</th>
              <th style="width:130px;">Sub Bidang</th>
              <th style="text-align:left;">Pernyataan</th>
              <th style="width:100px;">Indikator Ideal</th>
              <th style="width:100px;">Jml Kuat</th>
              <th style="width:100px;">% Kuat</th>
            </tr>
          </thead>
          <tbody>
            ${classKekuatanAnsRows}
          </tbody>
        </table>\n

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
