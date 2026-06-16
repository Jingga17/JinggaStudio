/**
 * Resilien — Scoring Engine
 * Implementasi logika hitung sesuai BACKEND_SPEC.md
 */

const Scoring = {

  /**
   * Hitung skor per soal (1 = masalah, 0 = aman)
   */
  hitungSkorSoal(soal, jawaban) {
    if (soal.tipe !== 'Core') return 0;
    if (soal.arah === 'Negative') return jawaban === 'ya' ? 1 : 0;
    if (soal.arah === 'Positive') return jawaban === 'tidak' ? 1 : 0;
    return 0;
  },

  /**
   * Hitung Lie Scale Score (0-22)
   */
  hitungLieScale(answers) {
    let score = 0;
    for (const id of LIE_SCALE_IDS) {
      if (answers[id] === 'ya') score++;
    }
    return score;
  },

  /**
   * Hitung Consistency Score (0-9)
   * Inkonsisten = dijawab SAMA (ya-ya atau tidak-tidak) → skor 1
   */
  hitungConsistency(answers) {
    let score = 0;
    for (const pair of CONSISTENCY_PAIRS) {
      const jawA = answers[pair.neg];
      const jawB = answers[pair.pos];
      if (jawA && jawB && jawA === jawB) score++; // sama = inkonsisten
    }
    return score;
  },

  /**
   * Tentukan status validitas berdasarkan lie scale & consistency
   */
  tentukanStatus(lieScore, consistencyScore) {
    const lieInvalid = lieScore > 8;
    const ccInvalid  = consistencyScore > 4;
    const lieWarn    = lieScore >= 5 && lieScore <= 8;
    const ccWarn     = consistencyScore >= 3 && consistencyScore <= 4;

    if (lieInvalid || ccInvalid) return 'Tidak Valid';
    if (lieWarn || ccWarn) return 'Valid dengan Syarat';
    return 'Valid';
  },

  /**
   * Hitung persentase per sub bidang
   */
  hitungSubBidang(answers) {
    const hasil = {};
    for (const [subName, meta] of Object.entries(SUB_BIDANG_META)) {
      const soalList = meta.ids.map(id => QUESTIONS_DATA.find(q => q.id === id));
      let skor = 0;
      let total = meta.count;
      for (const soal of soalList) {
        if (!soal) continue;
        const jaw = answers[soal.id];
        if (jaw) skor += this.hitungSkorSoal(soal, jaw);
      }
      const pct = total > 0 ? Math.round((skor / total) * 100) : 0;
      hasil[subName] = { skor, total, pct, bidang: meta.bidang };
    }
    return hasil;
  },

  /**
   * Hitung persentase per bidang dari hasil sub bidang
   */
  hitungBidang(subBidangHasil) {
    const bidangMap = { Pribadi: {s:0,t:0}, Belajar: {s:0,t:0}, Sosial: {s:0,t:0}, Karir: {s:0,t:0} };
    for (const [, data] of Object.entries(subBidangHasil)) {
      const b = bidangMap[data.bidang];
      if (b) { b.s += data.skor; b.t += data.total; }
    }
    const hasil = {};
    for (const [bidang, {s,t}] of Object.entries(bidangMap)) {
      hasil[bidang] = { skor: s, total: t, pct: t > 0 ? Math.round((s/t)*100) : 0 };
    }
    return hasil;
  },

  /**
   * Tentukan 5 sub bidang prioritas (pct tertinggi)
   */
  top5SubBidang(subBidangHasil) {
    return Object.entries(subBidangHasil)
      .sort((a,b) => b[1].pct - a[1].pct)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
  },

  /**
   * Klasifikasi persentase → kategori tampilan
   */
  kategori(pct) {
    if (pct <= 25) return 'Ringan';
    if (pct <= 50) return 'Sedang';
    if (pct <= 75) return 'Berat';
    return 'Sangat Berat';
  },

  /**
   * Sub-kategori untuk lookup deskripsi (8 rentang)
   */
  subKategori(pct) {
    if (pct <= 12) return 'Ringan - Rendah';
    if (pct <= 25) return 'Ringan - Tinggi';
    if (pct <= 38) return 'Sedang - Rendah';
    if (pct <= 50) return 'Sedang - Tinggi';
    if (pct <= 63) return 'Berat - Rendah';
    if (pct <= 75) return 'Berat - Tinggi';
    if (pct <= 88) return 'Sangat Berat - Rendah';
    return 'Sangat Berat - Tinggi';
  },

  /**
   * Kategori Lie Scale
   */
  lieKategori(score) {
    if (score <= 4) return { status: 'Valid', label: 'Valid – Tinggi', badge: 'valid' };
    if (score <= 8) return { status: 'Valid dengan Syarat', label: 'Valid Bersyarat – Sedang', badge: 'bersyarat' };
    return { status: 'Tidak Valid', label: 'Tidak Valid – Rendah', badge: 'invalid' };
  },

  /**
   * Kategori Consistency
   */
  ccKategori(score) {
    if (score <= 2) return { status: 'Valid', label: 'Valid – Sangat Konsisten', badge: 'valid' };
    if (score <= 4) return { status: 'Valid dengan Syarat', label: 'Valid Bersyarat – Cukup Konsisten', badge: 'bersyarat' };
    return { status: 'Tidak Valid', label: 'Tidak Valid – Inkonsisten', badge: 'invalid' };
  },

  /**
   * Warna CSS variable per bidang
   */
  warnaBidang(bidang) {
    return { Pribadi: '#3B82F6', Belajar: '#22C55E', Sosial: '#F97316', Karir: '#A855F7' }[bidang] || '#94A3B8';
  },

  /**
   * Hitung semua: input answers{id: 'ya'|'tidak'}, return hasil lengkap
   */
  hitungSemua(answers) {
    const lieScore  = this.hitungLieScale(answers);
    const ccScore   = this.hitungConsistency(answers);
    const lieCat    = this.lieKategori(lieScore);
    const ccCat     = this.ccKategori(ccScore);
    const status    = this.tentukanStatus(lieScore, ccScore);
    const subBidang = this.hitungSubBidang(answers);
    const bidang    = this.hitungBidang(subBidang);
    const top5      = this.top5SubBidang(subBidang);
    return { lieScore, ccScore, lieCat, ccCat, status, subBidang, bidang, top5 };
  },
};
