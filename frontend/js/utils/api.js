/**
 * Counselor Connect — API Client
 * Komunikasi ke backend REST API.
 * Jika backend belum ready, gunakan MOCK_MODE = true untuk data demo.
 */

const API_BASE = '/api';
const MOCK_MODE = false;

// ──────────────────────────────────────────
// MOCK DATA (Demo tanpa backend)
// ──────────────────────────────────────────
if (!Storage.get('mock_sessions')) {
  const defaultSessions = [
    { id:1, token:'abc123xyz', url: `${window.location.origin}/index.html?token=abc123xyz`, is_active:true, created_at:'2026-06-01T08:00:00Z' },
    { id:2, token:'def456uvw', url: `${window.location.origin}/index.html?token=def456uvw`, is_active:false, created_at:'2026-05-20T10:00:00Z', closed_at:'2026-05-25T12:00:00Z' },
  ];
  Storage.set('mock_sessions', defaultSessions);
}

const MOCK = {
  get sessions() {
    return Storage.get('mock_sessions', []);
  },
  set sessions(val) {
    Storage.set('mock_sessions', val);
  },
  summary: { total_responden:127, total_kelas:5, persentase_pengisian:81 },
  students: [
    { id:1, nama:'Ahmad Fauzi', kelas:'XII IPA 1', nisn:'0012345678', jenis_kelamin:'L', is_valid:true, lie_score:2, cc_score:1, status:'Valid', pribadi_pct:32, belajar_pct:45, sosial_pct:28, karir_pct:61 },
    { id:2, nama:'Siti Rahayu', kelas:'XII IPA 1', nisn:'0023456789', jenis_kelamin:'P', is_valid:true, lie_score:4, cc_score:2, status:'Valid', pribadi_pct:15, belajar_pct:38, sosial_pct:52, karir_pct:44 },
    { id:3, nama:'Budi Santoso', kelas:'XII IPA 2', nisn:'0034567890', jenis_kelamin:'L', is_valid:false, lie_score:10, cc_score:2, status:'Tidak Valid', pribadi_pct:0, belajar_pct:0, sosial_pct:0, karir_pct:0 },
    { id:4, nama:'Dewi Lestari', kelas:'XII IPS 1', nisn:'0045678901', jenis_kelamin:'P', is_valid:true, lie_score:3, cc_score:4, status:'Valid dengan Syarat', pribadi_pct:68, belajar_pct:72, sosial_pct:35, karir_pct:80 },
    { id:5, nama:'Reza Pratama', kelas:'XII IPS 1', nisn:'0056789012', jenis_kelamin:'L', is_valid:true, lie_score:1, cc_score:0, status:'Valid', pribadi_pct:22, belajar_pct:18, sosial_pct:14, karir_pct:29 },
  ],
  classes: ['XII IPA 1','XII IPA 2','XII IPS 1','XII IPS 2','XII Bahasa'],
  chartData: {
    bidang: { Pribadi:38, Belajar:47, Sosial:32, Karir:55 },
    subBidang: {
      'Gaya Hidup':42, 'Kematangan Emosi':35, 'Kesehatan Fisik':28,
      'Kesehatan Mental':44, 'Nilai & Moral':18,
      'Beban Belajar':55, 'Fasilitas Belajar':38, 'Fokus Belajar':62,
      'Keterampilan Belajar':44, 'Lingkungan Sekolah':31,
      'Lingkungan Sosial Belajar':29, 'Manajemen Waktu':58, 'Motivasi Belajar':47, 'Sikap Belajar':33,
      'Etika Sosial':22, 'Gaya Hidup & Lingkungan Sosial':35,
      'Hubungan Keluarga':40, 'Hubungan Teman':28, 'Keterampilan Sosial':31, 'Masalah Sosial':44,
      'Kesiapan Karir':60, 'Keterampilan Praktis':52, 'Minat & Bakat':48, 'Perencanaan Karir':66,
    }
  },
  settings: {
    nama_sekolah:'SMA Negeri 1 Contoh', alamat:'Jl. Pendidikan No. 1, Kota Contoh',
    nama_konselor:'Drs. Budi Raharjo, M.Pd.', tahun_ajaran:'2025/2026',
    logo_sekolah:null, logo_bk:null, cap_konselor:null, ttd_konselor:null,
  },
  deskripsi: {
    Pribadi: 'Siswa mulai mengalami sejumlah kesulitan dalam mengelola dinamika konflik internal yang secara berangsur menurunkan kualitas kesejahteraan pribadinya. Intervensi pencegahan dini melalui konseling kepribadian sangat disarankan.',
    Belajar: 'Efektivitas proses pembelajaran siswa sedang mengalami krisis pertengahan yang sangat jelas ditandai dengan demotivasi dan prokrastinasi berlebih. Pendampingan strategi belajar melalui layanan konseling individu harus diprioritaskan.',
    Sosial:  'Kompetensi komunikasi dan kualitas interaksi sosial siswa secara umum masih dinilai cukup kooperatif. Bimbingan klasikal mengenai teknik resolusi konflik ringan sangat relevan diberikan.',
    Karir:   'Siswa dihadapkan pada hambatan berat terkait ketidaksiapan karir yang terindikasi kuat diwarnai oleh konflik ekspektasi bersama keluarga. Intervensi bimbingan karir khusus wajib segera direalisasikan.',
  },
};

// ──────────────────────────────────────────
// HTTP Helper
// ──────────────────────────────────────────
async function http(method, path, body = null) {
  const token = Storage.getAdminToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? {'Authorization':`Bearer ${token}`} : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Terjadi kesalahan server');
  }
  return res.json();
}

// ──────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────
const API = {
  // Kuesioner (publik)
  async cekSesiAktif() {
    if (MOCK_MODE) {
      return { active: true };
    }
    const res = await http('GET', `/settings/assessment-status`);
    return { active: res.data ? res.data.active : false };
  },
  async cekNISN(nisn) {
    if (MOCK_MODE) return { exists: nisn === '0012345678' };
    const res = await http('GET', `/students/check-nisn/${nisn}`);
    return { exists: res.data ? res.data.exists : false };
  },
  async simpanBiodata(data) {
    if (MOCK_MODE) return { student_id: 999, ...data };
    const res = await http('POST', '/students', data);
    return { student_id: res.data ? res.data.student_id : null, ...data };
  },
  async getSoal() {
    if (MOCK_MODE) return QUESTIONS_DATA;
    const res = await http('GET', '/questions/shuffled');
    return res.data;
  },
  async simpanJawabanParsial(studentId, halaman, answers) {
    if (MOCK_MODE) return { ok: true };
    return http('POST', '/answers/partial', { student_id: studentId, halaman, answers });
  },
  async selesaiKuesioner(studentId, durasi) {
    if (MOCK_MODE) return { ok: true };
    return http('PATCH', `/students/${studentId}/finish`, { durasi });
  },

  // Admin — Auth
  async login(username, password) {
    if (MOCK_MODE) {
      if (username === 'admin' && password === 'admin123') {
        return { token: 'mock_token_xyz', user: { id:1, nama:'Administrator', username:'admin' } };
      }
      throw new Error('Username atau password salah');
    }
    return http('POST', '/auth/login', { username, password });
  },
  async logout() {
    Storage.clearAdminToken();
    if (MOCK_MODE) return { ok: true };
    return http('POST', '/auth/logout');
  },

  // Admin — Assessment Status
  async getAssessmentStatus() {
    if (MOCK_MODE) return { active: true };
    return (await http('GET', '/settings/assessment-status')).data;
  },
  async toggleAssessmentStatus(active) {
    if (MOCK_MODE) return { active };
    return (await http('POST', '/settings/assessment-status', { active })).data;
  },

  // Admin — Dashboard
  async getSummary() {
    if (MOCK_MODE) return MOCK.summary;
    const res = await http('GET', '/dashboard/summary');
    return res.data;
  },
  async getChartData(kelas = '', nisn = '') {
    if (MOCK_MODE) {
      let data = [...MOCK.students].filter(s => s.status !== 'Tidak Valid');
      if (kelas) data = data.filter(s => s.kelas === kelas);
      if (nisn) data = data.filter(s => s.nisn === nisn);

      if (data.length === 0) {
        return { bidang: { Pribadi:0, Belajar:0, Sosial:0, Karir:0 }, subBidang: {} };
      }

      let p=0, b=0, s=0, k=0;
      data.forEach(x => { p+=x.pribadi_pct; b+=x.belajar_pct; s+=x.sosial_pct; k+=x.karir_pct; });
      const len = data.length;
      
      const newBidang = {
        Pribadi: Math.round(p/len),
        Belajar: Math.round(b/len),
        Sosial: Math.round(s/len),
        Karir: Math.round(k/len)
      };

      // Buat variasi pseudo-random untuk subBidang agar terlihat dinamis
      const newSub = {};
      const seed = kelas.length + nisn.length;
      Object.entries(MOCK.chartData.subBidang).forEach(([key, val]) => {
        const variation = ((key.length + seed) % 21) - 10; // -10 to +10
        newSub[key] = Math.max(0, Math.min(100, val + variation));
      });

      return { bidang: newBidang, subBidang: newSub };
    }
    const res = await http('GET', `/dashboard/chart?kelas=${kelas}&nisn=${nisn}`);
    return res.data;
  },
  async getTableData(kelas = '', nisn = '') {
    if (MOCK_MODE) {
      let data = [...MOCK.students];
      if (kelas) data = data.filter(s => s.kelas === kelas);
      if (nisn)  data = data.filter(s => s.nisn === nisn);
      return data;
    }
    const res = await http('GET', `/dashboard/table?kelas=${kelas}&nisn=${nisn}`);
    return res.data;
  },
  async getDeskripsi(kelas = '', nisn = '') {
    if (MOCK_MODE) {
      const chart = await this.getChartData(kelas, nisn);
      const b = chart.bidang;
      const getDesc = (val, bidang) => {
        if (val === 0) return 'Belum ada data yang cukup untuk dianalisis.';
        if (val >= 61) return `(${val}%) Tingkat masalah ${bidang} tergolong TINGGI. Intervensi intensif dan penanganan segera sangat direkomendasikan.`;
        if (val >= 31) return `(${val}%) Tingkat masalah ${bidang} tergolong SEDANG. Perlu pendampingan preventif dan monitoring berkala.`;
        return `(${val}%) Tingkat masalah ${bidang} tergolong RENDAH. Terpantau cukup adaptif dan tidak memerlukan intervensi khusus saat ini.`;
      };
      return {
        Pribadi: getDesc(b.Pribadi, 'Pribadi'),
        Belajar: getDesc(b.Belajar, 'Belajar'),
        Sosial:  getDesc(b.Sosial, 'Sosial'),
        Karir:   getDesc(b.Karir, 'Karir')
      };
    }
    const res = await http('GET', `/dashboard/deskripsi?kelas=${kelas}&nisn=${nisn}`);
    return res.data;
  },
  async getKelas() {
    if (MOCK_MODE) return MOCK.classes;
    const res = await http('GET', '/dashboard/kelas');
    return res.data;
  },
  async getStudentsByKelas(kelas) {
    if (MOCK_MODE) return MOCK.students.filter(s => s.kelas === kelas);
    const res = await http('GET', `/dashboard/table?kelas=${kelas}`);
    return res.data;
  },
  async resetSesi(studentId) {
    if (MOCK_MODE) {
      const s = MOCK.students.find(s => s.id === studentId);
      if (s) MOCK.students.splice(MOCK.students.indexOf(s), 1);
      return { ok: true };
    }
    return http('POST', `/students/${studentId}/reset`);
  },

  // Admin — Pengaturan
  async getSettings() {
    if (!MOCK_MODE) {
      try {
        const res = await http('GET', '/settings');
        if (res.data) {
          Storage.set('settings', res.data);
          return res.data;
        }
      } catch (e) {
        console.warn("Failed to load settings from server, falling back to local storage", e);
      }
    }
    const saved = Storage.get('settings');
    if (saved) return saved;
    return MOCK.settings;
  },
  async saveSettings(data) {
    Storage.set('settings', data);
    if (MOCK_MODE) return { ok: true };
    return http('POST', '/settings', data);
  },

  // Admin — Manajemen Kelas (Manual)
  async getKelasOptions() {
    const saved = Storage.get('kelas_options');
    if (saved) return saved;
    // Default list jika belum diset
    return ['X IPA 1','X IPA 2','X IPS 1','X IPS 2', 'XI IPA 1','XI IPA 2','XI IPS 1','XI IPS 2', 'XII IPA 1','XII IPA 2','XII IPS 1','XII IPS 2'];
  },
  async addKelasOption(nama) {
    const arr = await this.getKelasOptions();
    if (!arr.includes(nama)) {
      arr.push(nama);
      Storage.set('kelas_options', arr);
    }
    return { ok: true };
  },
  async deleteKelasOption(nama) {
    const arr = await this.getKelasOptions();
    const filtered = arr.filter(k => k !== nama);
    Storage.set('kelas_options', filtered);
    return { ok: true };
  },

// Laporan (Menggunakan HTML Print View)
  async downloadLaporanIndividu(studentId, nama) {
    Toast.info('Mengunduh laporan PDF individu...');
    try {
      const token = Storage.getAdminToken();
      const url = `${API_BASE}/reports/individu/${studentId}?token=${token}`;
      window.location.href = url;
    } catch(err) {
      console.error(err);
      Toast.error('Gagal mengunduh laporan.');
    }
  },
  async downloadLaporanKelas(kelas) {
    Toast.info('Mengunduh laporan PDF kelas...');
    try {
      const token = Storage.getAdminToken();
      const url = `${API_BASE}/reports/kelas/${encodeURIComponent(kelas)}?token=${token}`;
      window.location.href = url;
    } catch(err) {
      console.error(err);
      Toast.error('Gagal mengunduh laporan kelas.');
    }
  },
  async downloadBulkIndividu(kelas) {
    Toast.info('Memulai unduhan PDF laporan individu...');
    const token = Storage.getAdminToken();
    const url = `${API_BASE}/export/zip/class/${encodeURIComponent(kelas)}?token=${token}`;
    window.location.href = url;
  },
  async downloadBulkSemuaIndividu() {
    Toast.info('Memulai unduhan PDF seluruh laporan individu...');
    const token = Storage.getAdminToken();
    const url = `${API_BASE}/export/zip/all?token=${token}`;
    window.location.href = url;
  },
  async downloadBulkKelas() {
    Toast.info('Memulai unduhan PDF seluruh laporan kelas...');
    const token = Storage.getAdminToken();
    const url = `${API_BASE}/export/zip/kelas/all?token=${token}`;
    window.location.href = url;
  },
  async exportExcel() {
    if (typeof XLSX === 'undefined') {
      Toast.error('Library Excel belum termuat. Periksa koneksi internet.');
      return;
    }
    if (!MOCK_MODE) {
      // Ketika backend aktif, download dari server
      const token = Storage.getAdminToken();
      const url = `${API_BASE}/export/excel?token=${token}`;
      window.open(url, '_blank');
      return;
    }
    // MOCK MODE: generate dari data lokal
    return; // ditangani di AdminApp.exportExcel()
  },
  async getStudentReport(studentId) {
    if (MOCK_MODE) return null;
    const res = await http('GET', `/students/${studentId}/report`);
    return res.data;
  },
  async getClassReport(kelas) {
    if (MOCK_MODE) return null;
    const res = await http('GET', `/dashboard/class-report/${encodeURIComponent(kelas)}`);
    return res.data;
  },
};
