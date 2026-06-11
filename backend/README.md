# Counselor Connect Backend — Running & Tests

Instruksi singkat untuk menjalankan server dan tes lokal pada Windows.

Prereqs:
- Node.js (v16+ recommended)

Install dependencies:

```powershell
cd backend
npm install
```

Menjalankan server:

```powershell
# optional: set token statis
$env:ADMIN_TOKEN='secret-admin-token'
# lalu jalankan
node src/index.js
```

Login Admin:
- Buka UI Admin (mis. http://localhost:3000/admin.html)
- Masuk dengan akun admin (dari seeder atau DB) untuk mendapatkan JWT.

Endpoint penting:
- `GET /api/reports/individu/:id` — Unduh PDF laporan individu (memerlukan Authorization: Bearer <token> or ADMIN_TOKEN)
- `GET /api/export/excel` — Export CSV semua siswa (memerlukan auth)
- `GET /api/export/class/:kelas` — Export CSV per kelas (memerlukan auth)
- `GET /api/export/zip/class/:kelas` — ZIP berisi PDF per siswa di kelas (memerlukan auth)

Menjalankan tes otomatis (server harus jalan):

```powershell
cd backend
npm run test:report
npm run test:export
npm run test:zip
```

Catatan teknis:
- Middleware auth menerima JWT (dari `POST /api/auth/login`) atau `ADMIN_TOKEN` environment variable.
- Jika Anda melihat `EADDRINUSE` berarti port 3000 sudah digunakan — hentikan service yang berjalan atau ubah port di `src/index.js` sebelum menjalankan.

Jika ada error saat menjalankan, kirimkan output terminalnya supaya saya bantu perbaiki.
