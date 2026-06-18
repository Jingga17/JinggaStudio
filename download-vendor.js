/**
 * download-vendor.js
 * Jalankan dengan: node download-vendor.js
 * Script ini mengunduh semua library CDN ke folder vendor/ secara lokal
 */
const https = require('https');
const http = require('http');
const fs   = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, 'frontend', 'vendor');
if (!fs.existsSync(VENDOR_DIR)) fs.mkdirSync(VENDOR_DIR, { recursive: true });

const libs = [
  {
    name: 'html2canvas.min.js',
    url:  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  },
  {
    name: 'jspdf.umd.min.js',
    url:  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  },
  {
    name: 'chart.umd.min.js',
    url:  'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js'
  },
  {
    name: 'xlsx.full.min.js',
    url:  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
  },
  {
    name: 'jszip.min.js',
    url:  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
  },
  {
    name: 'FileSaver.min.js',
    url:  'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
  },
];

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

async function main() {
  console.log('📦 Mengunduh vendor libraries...\n');
  let ok = 0, fail = 0;
  for (const lib of libs) {
    const dest = path.join(VENDOR_DIR, lib.name);
    process.stdout.write(`  ⬇️  ${lib.name.padEnd(30)} ... `);
    try {
      await download(lib.url, dest);
      const size = Math.round(fs.statSync(dest).size / 1024);
      console.log(`✅  ${size} KB`);
      ok++;
    } catch (e) {
      console.log(`❌  GAGAL: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n📊 Hasil: ${ok} berhasil, ${fail} gagal`);
  if (fail === 0) {
    console.log('🎉 Semua library siap! Aplikasi sekarang bisa jalan offline.\n');
  } else {
    console.log('⚠️  Beberapa library gagal diunduh. Cek koneksi internet Anda.\n');
  }
}

main().catch(console.error);
