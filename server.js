/**
 * server.js - Simple static file server + API proxy
 * Jalankan: node server.js
 * Tidak butuh npm install - pakai module bawaan Node.js
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const BACKEND_PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.sqlite': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let reqPath = parsed.pathname;

  // ─── API Proxy ke backend port 3000 ─────────────────────
  if (reqPath.startsWith('/api/') || reqPath === '/api') {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxy = http.request(options, (backendRes) => {
      res.writeHead(backendRes.statusCode, {
        ...backendRes.headers,
        'Access-Control-Allow-Origin': '*',
      });
      backendRes.pipe(res, { end: true });
    });

    proxy.on('error', (e) => {
      // Backend tidak berjalan, kembalikan error yang jelas
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend tidak aktif. Jalankan: cd backend && node src/index.js', detail: e.message }));
    });

    req.pipe(proxy, { end: true });
    return;
  }

  // ─── Static File Server ──────────────────────────────────
  // Default ke index.html jika path adalah /
  if (reqPath === '/') reqPath = '/index.html';

  // Cegah path traversal
  const filePath = path.join(FRONTEND_DIR, reqPath);
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback ke index.html
      const fallback = path.join(FRONTEND_DIR, 'index.html');
      fs.readFile(fallback, (e2, data) => {
        if (e2) { res.writeHead(404); res.end('404 Not Found'); return; }
        res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const cacheControl = ['.html', '.js', '.css'].includes(ext) ? 'no-cache, must-revalidate' : 'public, max-age=604800';

    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheControl });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  =====================================================');
  console.log('    🚀 Resilien Static Server berjalan!');
  console.log('  =====================================================');
  console.log(`  📁 Melayani folder: ${FRONTEND_DIR}`);
  console.log(`  🌐 URL: http://localhost:${PORT}/admin.html`);
  console.log('');
  console.log('  ⚠️  CATATAN: Server ini HANYA untuk file statis.');
  console.log('     Untuk fitur penuh (login, data), jalankan juga:');
  console.log('       cd backend && node src/index.js');
  console.log('');
  console.log('  Tekan Ctrl+C untuk berhenti.');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  ❌ Port ${PORT} sudah dipakai proses lain!`);
    console.error('     Coba tutup aplikasi yang menggunakan port tersebut,');
    console.error('     atau ganti PORT di baris atas file ini.\n');
  } else {
    console.error('Server error:', e.message);
  }
  process.exit(1);
});
