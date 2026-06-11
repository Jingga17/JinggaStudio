const fs = require('fs');

(async () => {
  try {
    const port = process.env.PORT || 3001;
    // Login to obtain JWT
    const loginRes = await fetch(`http://localhost:${port}/api/auth/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.status);
    const loginJson = await loginRes.json();
    const token = loginJson.token;

    const zipUrl = `http://localhost:${port}/api/export/zip/class/${encodeURIComponent('XII IPA 1')}`;
    const res = await fetch(zipUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to download ZIP: ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = 'test_output_laporan.zip';
    fs.writeFileSync(outPath, buf);
    console.log('Saved ZIP to', outPath, 'size', buf.length);

    // Quick scan for PDF signatures
    const sig = Buffer.from('%PDF');
    let count = 0;
    for (let i = 0; i < buf.length - sig.length; i++) {
      let match = true;
      for (let j = 0; j < sig.length; j++) if (buf[i+j] !== sig[j]) { match = false; break; }
      if (match) count++;
    }
    console.log('Found %PDF signature count:', count);
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(2);
  }
})();
