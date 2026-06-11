const http = require('http');
const fs = require('fs');

const port = process.env.PORT || 3001;

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(data);
    const opts = { hostname: 'localhost', port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } };
    const req = http.request(opts, res => {
      let buf = [];
      res.on('data', c => buf.push(c));
      res.on('end', () => {
        try { const json = JSON.parse(Buffer.concat(buf).toString()); resolve(json); }
        catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.write(d);
    req.end();
  });
}

function getToFile(path, token, outPath) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port, path, method: 'GET', headers: { Authorization: `Bearer ${token}` } };
    const req = http.request(opts, res => {
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(outPath)));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const login = await postJSON('/api/auth/login', { username: 'admin', password: 'admin123' });
    const token = login.token;
    console.log('Got token length', token.length);
    const out = await getToFile('/api/export/zip/class/' + encodeURIComponent('XII IPA 1'), token, 'test_output_laporan2.zip');
    console.log('Saved', out, 'size', fs.statSync(out).size);
    // check for %PDF signatures
    const buf = fs.readFileSync(out);
    const sig = Buffer.from('%PDF');
    let count = 0;
    for (let i=0;i<buf.length - sig.length;i++){
      let ok = true; for (let j=0;j<sig.length;j++){ if(buf[i+j] !== sig[j]){ ok=false; break; }}
      if(ok) count++;
    }
    console.log('PDF signatures found:', count);
  } catch (e) {
    console.error('ERROR', e && e.message || e);
    process.exit(2);
  }
})();
