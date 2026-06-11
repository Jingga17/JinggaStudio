const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dcm220-secret-key-123';

function runTest() {
  const token = jwt.sign({ id: 1, username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const port = process.env.PORT || 3000;
  const opts = { hostname: 'localhost', port: port, path: '/api/export/excel', method: 'GET', headers: { Authorization: `Bearer ${token}` } };
  const req = http.request(opts, res => {
    console.log('status', res.statusCode);
    console.log('content-type', res.headers['content-type']);
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log('bytes', buf.length);
      if (res.statusCode === 200 && (res.headers['content-type'] || '').includes('csv') && buf.length > 50) {
        console.log('OK: export endpoint appears functional');
        process.exit(0);
      } else {
        console.error('FAIL: export endpoint did not return expected CSV');
        process.exit(2);
      }
    });
  });
  req.on('error', e => { console.error('ERROR', e.message); process.exit(3); });
  req.end();
}

runTest();
