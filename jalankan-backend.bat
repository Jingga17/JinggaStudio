@echo off
echo =======================================================
echo     MENGINSTALL & MENJALANKAN BACKEND Resilien
echo =======================================================
echo.
echo Sedang masuk ke folder backend...
cd backend

echo.
echo Membersihkan cache NPM yang nyangkut...
call npm cache clean --force

echo.
echo Sedang mendownload modul (menggunakan server Yarn agar lebih cepat)...
echo Harap tunggu, ini mungkin memakan waktu 1-3 menit tergantung koneksi internet Anda.
call npm install --registry=https://registry.yarnpkg.com/ --no-audit --no-fund --legacy-peer-deps

echo.
echo =======================================================
echo Menjalankan seeder (menyiapkan database awal)...
call npm run seed

echo.
echo =======================================================
echo Download selesai! Sedang menyalakan server...
echo =======================================================
start "" http://localhost:3000/admin.html
call npm start
pause
