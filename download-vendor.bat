@echo off
echo =========================================
echo   DOWNLOAD VENDOR LIBRARIES (Offline Mode)
echo =========================================
echo.

set VENDOR=frontend\vendor

if not exist %VENDOR% mkdir %VENDOR%

echo [1/5] Mengunduh chart.js...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js' -OutFile '%VENDOR%\chart.umd.min.js' -UseBasicParsing"

echo [2/5] Mengunduh xlsx.full.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js' -OutFile '%VENDOR%\xlsx.full.min.js' -UseBasicParsing"

echo [3/5] Mengunduh jszip.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js' -OutFile '%VENDOR%\jszip.min.js' -UseBasicParsing"

echo [4/5] Mengunduh FileSaver.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js' -OutFile '%VENDOR%\FileSaver.min.js' -UseBasicParsing"

echo [5/5] Mengunduh html2canvas.min.js...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' -OutFile '%VENDOR%\html2canvas.min.js' -UseBasicParsing"

echo.
echo =========================================

REM Cek apakah semua file berhasil diunduh
set MISSING=0
if not exist %VENDOR%\chart.umd.min.js (echo MISSING: chart.umd.min.js & set MISSING=1)
if not exist %VENDOR%\xlsx.full.min.js (echo MISSING: xlsx.full.min.js & set MISSING=1)
if not exist %VENDOR%\jszip.min.js (echo MISSING: jszip.min.js & set MISSING=1)
if not exist %VENDOR%\FileSaver.min.js (echo MISSING: FileSaver.min.js & set MISSING=1)
if not exist %VENDOR%\html2canvas.min.js (echo MISSING: html2canvas.min.js & set MISSING=1)

if %MISSING%==0 (
  echo SUKSES! Semua library berhasil diunduh ke folder vendor\
) else (
  echo PERINGATAN: Beberapa library gagal diunduh. Cek koneksi internet Anda.
)

echo.
pause
