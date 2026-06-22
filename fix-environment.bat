@echo off
echo =======================================================
echo     MEMPERBAIKI ENVIRONMENT POWERSHELL DAN NPM
echo =======================================================
echo.
echo 1. Membuka akses Execution Policy (Butuh Run as Administrator jika gagal)
powershell -Command "Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force"
echo Execution Policy diperbarui.
echo.

cd backend
echo 2. Menginstall dependensi Node.js...
cmd /c npm install
echo.
echo 3. Menginstall papaparse untuk CSV...
cmd /c npm install papaparse

echo.
echo =======================================================
echo     Selesai! Kamu sekarang bisa menggunakan npm/bun
echo =======================================================
pause
