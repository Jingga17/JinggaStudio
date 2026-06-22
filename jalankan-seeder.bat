@echo off
echo ============================================
echo  DCM - Jalankan Seeder Data Dummy
echo ============================================
echo.
echo [1] Menjalankan seeder di dalam Docker container...
docker exec dcm-backend node src/db/seed-dummy-full.js
echo.
echo [2] Selesai! Silakan refresh halaman browser.
echo.
pause
