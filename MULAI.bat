@echo off
title Resilien — Mulai Server
color 0A

echo.
echo  ============================================================
echo    Resilien DCM — Mulai Aplikasi
echo  ============================================================
echo.

cd /d "%~dp0"

REM ── Cek Node.js ──
where node >nul 2>&1
if %errorlevel% neq 0 (
  color 0C
  echo [ERROR] Node.js tidak ditemukan!
  echo Silakan install dari: https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODEVER=%%i
echo [OK] Node.js %NODEVER% ditemukan.
echo.

REM ── Jalankan Static Server di jendela sendiri ──
echo [1/2] Menyalakan Static Server di port 8080...
start "Resilien Static Server" cmd /k "node server.js"

REM ── Tunggu sebentar lalu jalankan Backend ──
timeout /t 2 /nobreak >nul

REM ── Cek apakah node_modules sudah ada ──
if exist "backend\node_modules\express" (
  echo [2/2] Menyalakan Backend API di port 3000...
  start "Resilien Backend API" cmd /k "cd backend && node src/index.js"
) else (
  echo [2/2] Install dependensi backend dulu...
  start "Resilien Backend Setup" cmd /k "cd backend && npm install --legacy-peer-deps && node src/index.js"
)

REM ── Tunggu server siap lalu buka browser ──
timeout /t 3 /nobreak >nul
echo.
echo  ============================================================
echo    Membuka browser...
echo  ============================================================
echo.
start "" http://localhost:8080/admin.html

echo.
echo  [INFO] Dua jendela server sudah terbuka.
echo  [INFO] Jangan tutup jendela CMD manapun!
echo.
echo  Tekan Enter untuk menutup jendela ini (server tetap jalan).
pause >nul
