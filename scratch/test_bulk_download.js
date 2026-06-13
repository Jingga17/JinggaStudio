const fs = require('fs');
const path = require('path');
const http = require('http');

async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username: 'admin', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).token);
        } else {
          reject(new Error(`Login failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function downloadZip(token, apiPath, outputPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: apiPath,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          reject(new Error(`Download failed: ${res.statusCode} ${body}`));
        });
        return;
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Login successful. Token acquired.');

    // Test Class ZIP
    const classZipPath = path.join(__dirname, 'XII_IPA_1_laporan.zip');
    console.log('Downloading XII IPA 1 ZIP...');
    await downloadZip(token, '/api/export/zip/class/XII%20IPA%201', classZipPath);
    console.log(`Saved class ZIP to ${classZipPath}`);
    const statsClass = fs.statSync(classZipPath);
    console.log(`Class ZIP size: ${statsClass.size} bytes`);

    // Test All ZIP
    const allZipPath = path.join(__dirname, 'Bulk_Semua_Laporan.zip');
    console.log('Downloading All ZIP...');
    await downloadZip(token, '/api/export/zip/all', allZipPath);
    console.log(`Saved all ZIP to ${allZipPath}`);
    const statsAll = fs.statSync(allZipPath);
    console.log(`All ZIP size: ${statsAll.size} bytes`);

    console.log('ZIP downloads complete. Checking contents...');
    // We can use JSZip or similar if available, but let's check size first.
    if (statsClass.size < 100 || statsAll.size < 100) {
      throw new Error('ZIP files are too small, likely empty or invalid!');
    }
    console.log('Success!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest();
