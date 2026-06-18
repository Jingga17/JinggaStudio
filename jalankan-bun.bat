@echo off
echo =======================================================
echo     MENJALANKAN APLIKASI MENGGUNAKAN BUN
echo =======================================================
echo.
cd backend
echo Sedang menginstall dependensi...
bun install
echo.
echo Sedang menjalankan server dengan Bun...
start "" http://localhost:3000/admin.html
bun run src/index.js
pause
