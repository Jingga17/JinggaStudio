# DCM 220 — Frontend

**Psikometri Problem Checklist | Sistem Asesmen & Analisis Masalah Siswa**

---

## 📁 Struktur File

```
frontend/
├── index.html          ← Halaman Kuesioner (untuk siswa)
├── admin.html          ← Panel Admin (untuk konselor/guru)
├── css/
│   └── style.css       ← Design system lengkap
└── js/
    ├── data-soal.js    ← 220 butir soal DCM
    ├── utils/
    │   ├── scoring.js  ← Engine hitung skor DCM
    │   ├── storage.js  ← LocalStorage helper
    │   └── api.js      ← API client (dengan MOCK data)
    ├── components/
    │   └── ui.js       ← Toast, Modal, Spinner, Charts
    └── pages/
        ├── kuesioner.js ← Logic halaman kuesioner
        └── admin.js     ← Logic panel admin
```

---

## 🚀 Cara Membuka (Tanpa Server)

### Kuesioner (Siswa)
Buka file langsung di browser:
```
frontend/index.html?token=abc123xyz
```
> ⚠️ Beberapa browser memblokir file lokal. Gunakan server lokal.

### Panel Admin
Buka file:
```
frontend/admin.html
```
Login dengan:
- **Username:** `admin`
- **Password:** `admin123`

---

## 🌐 Cara Jalankan dengan Server Lokal

### Opsi 1: Python (jika Python terinstall)
```bash
python -m http.server 8080 --directory frontend/
# Buka: http://localhost:8080/admin.html
# Kuesioner: http://localhost:8080/index.html?token=abc123xyz
```

### Opsi 2: Node.js (jika Node.js terinstall)
```bash
npx serve frontend/ -p 8080
# Buka: http://localhost:8080
```

### Opsi 3: VS Code Extension
Install ekstensi **"Live Server"** di VS Code → klik kanan `admin.html` → **"Open with Live Server"**

---

## 🔧 Mode Demo vs Mode Live

File `js/utils/api.js` baris 12:
```js
const MOCK_MODE = true;  // ← ubah ke false jika backend sudah aktif
```

**Mode MOCK (true):**  
- Semua data menggunakan data dummy
- Tidak perlu backend
- Login: admin / admin123
- Token kuesioner aktif: `abc123xyz`

**Mode LIVE (false):**  
- Terhubung ke backend Express di `http://localhost:3000/api`

---

## 📋 Fitur Halaman

### index.html (Kuesioner)
- ✅ Validasi token sesi aktif
- ✅ Form biodata (nama, JK, kelas, TTL, NISN)
- ✅ 220 soal dalam 11 halaman (20 soal/halaman)
- ✅ Urutan soal diacak setiap siswa (seeded shuffle)
- ✅ Auto-save ke localStorage
- ✅ Timer pengerjaan
- ✅ Progress bar realtime
- ✅ Modal konfirmasi kirim
- ✅ Halaman selesai dengan ringkasan

### admin.html (Panel Admin)
- ✅ Login / Logout
- ✅ Buat & kelola sesi (link kuesioner unik)
- ✅ Salin link ke clipboard
- ✅ Stop/tutup sesi aktif
- ✅ Filter: semua kelas / per kelas / per siswa
- ✅ Chart Donut (skor 4 bidang)
- ✅ Chart Bar (skor 24 sub bidang)
- ✅ Tabel rekap siswa + status validitas
- ✅ Deskripsi analisis per bidang
- ✅ Reset sesi siswa
- ✅ Notifikasi backup tahunan
- ✅ Cetak laporan individu (per siswa)
- ✅ Cetak laporan kelas (per kelas)
- ✅ Download bulk ZIP
- ✅ Export Excel semua data
- ✅ Pengaturan identitas sekolah & konselor
- ✅ Upload logo, TTD, cap konselor
- ✅ Preview posisi di laporan

---

## 🎨 Desain

| Bidang | Warna | CSS Variable |
|--------|-------|-------------|
| Pribadi | Biru | `--pribadi: #3B82F6` |
| Belajar | Hijau | `--belajar: #22C55E` |
| Sosial | Oranye | `--sosial: #F97316` |
| Karir | Ungu | `--karir: #A855F7` |

| Kategori | Rentang | Warna |
|----------|---------|-------|
| Ringan | 0-25% | Hijau |
| Sedang | 26-50% | Kuning |
| Berat | 51-75% | Oranye |
| Sangat Berat | 76-100% | Merah |

---

## 📝 Catatan Teknis

- **PDF generation** memerlukan backend (Node.js + pdfkit)
- **Validasi**: Lie Scale > 8 atau Consistency > 4 → status "Tidak Valid"
- **Top 5 Sub Bidang**: Ranking berdasarkan persentase masalah tertinggi
