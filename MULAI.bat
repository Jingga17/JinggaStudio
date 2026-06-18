@echo off
title Resilien — Mulai Server
color 0A

echo.
echo  ============================================================
echo    Resilien DCM — Setup Otomatis ^& Jalankan Server
echo  ============================================================
echo.

cd /d "%~dp0"

REM ── Cek Node.js tersedia ──
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js tidak ditemukan!
  echo Silakan install Node.js dari https://nodejs.org
  pause
  exit /b 1
)

echo [OK] Node.js ditemukan.
echo.

REM ── Install dependensi backend jika belum ada ──
if not exist "backend\node_modules\express" (
  echo [SETUP] Menginstall dependensi backend...
  cd backend
  call npm install --legacy-peer-deps
  if %errorlevel% neq 0 (
    echo [ERROR] npm install gagal! Cek koneksi internet.
    cd ..
    pause
    exit /b 1
  )
  cd ..
  echo [OK] Dependensi backend siap!
  echo.
)

REM ── Download vendor libraries jika belum ada ──
if not exist "frontend\vendor\chart.umd.min.js" (
  echo [SETUP] Mengunduh library frontend ke vendor\...
  echo         Ini butuh koneksi internet sebentar...
  node download-vendor.js
  echo.
)

echo.
echo  ============================================================
echo    Menyalakan Server Resilien di http://localhost:3000
echo  ============================================================
echo.
echo  PENTING: Jangan tutup jendela ini selama menggunakan aplikasi!
echo  Tekan Ctrl+C untuk menghentikan server.
echo.

REM ── Buka browser setelah 3 detik ──
start "" /B cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000/admin.html"

REM ── Jalankan backend dengan DATABASE_PATH yang benar ──
cd backend
set DATABASE_PATH=%~dp0backend\database.sqlite
set NODE_ENV=development
node src/index.js

pause
