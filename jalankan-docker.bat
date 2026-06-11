@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     DCM 220 — Docker Local Setup             ║
echo  ║     Psikometri Problem Checklist             ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Cek apakah Docker sudah running
docker info >nul 2>&1
if errorlevel 1 (
    echo  ❌ ERROR: Docker Desktop belum berjalan!
    echo  Silakan buka Docker Desktop terlebih dahulu, tunggu sampai ikon Docker
    echo  di taskbar berwarna hijau, lalu jalankan ulang file ini.
    pause
    exit /b 1
)

echo  ✅ Docker terdeteksi dan berjalan
echo.

echo  🔄 Menghentikan container lama (down)...
docker compose down

echo.
echo  📦 Membangun dan menjalankan container baru...
echo  (Proses ini menyalin program seeder.js terbaru ke dalam Docker)
echo.

docker compose up --build -d

if errorlevel 1 (
    echo.
    echo  ❌ Gagal menjalankan Docker. Lihat log di atas untuk detail.
    pause
    exit /b 1
)

echo.
echo  ⏳ Menunggu backend siap (maks 30 detik)...
timeout /t 5 /nobreak >nul

:wait_loop
docker exec dcm-backend wget -q --spider http://localhost:3000/api >nul 2>&1
if errorlevel 1 (
    timeout /t 3 /nobreak >nul
    goto wait_loop
)

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  ✅ DCM 220 BERHASIL DIJALANKAN!             ║
echo  ╠══════════════════════════════════════════════╣
echo  ║  🌐 Kuesioner Siswa : http://localhost:8080  ║
echo  ║  🔐 Admin Panel     : http://localhost:8080/admin.html ║
echo  ║  🔑 Login           : admin / admin123       ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Buka browser otomatis
start http://localhost:8080/admin.html

pause
