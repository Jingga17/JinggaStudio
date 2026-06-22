@echo off
echo ========================================================
echo MEMULIHKAN ADMIN.JS SECARA PENUH
echo ========================================================
echo.
echo 1. Memulihkan versi asli dari git...
git checkout HEAD -- frontend/js/pages/admin.js
echo.
echo 2. Menyuntikkan Data Master Siswa...
node scratch\perbaiki-admin.js
echo.
echo 3. Menyuntikkan Buku Induk Siswa...
node patch_admin.js
echo.
echo ========================================================
echo SELESAI! SILAKAN REFRESH (F5) BROWSER ANDA.
echo Jika data dummy belum muncul, pastikan Anda telah menjalankan:
echo jalankan-seeder.bat
echo ========================================================
pause
