const http = require('http');

function runTest() {
  const port = process.env.PORT || 3000;
  const opts = { hostname: 'localhost', port: port, path: '/api/reports/individu/1', method: 'GET' };
  const req = http.request(opts, res => {
    console.log('status', res.statusCode);
    console.log('content-type', res.headers['content-type']);
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log('bytes', buf.length);
      if (res.statusCode === 200 && (res.headers['content-type'] || '').includes('pdf') && buf.length > 100) {
        console.log('OK: PDF endpoint appears functional');
        process.exit(0);
      } else {
        console.error('FAIL: PDF endpoint did not return expected PDF');
        process.exit(2);
      }
    });
  });
  req.on('error', e => { console.error('ERROR', e.message); process.exit(3); });
  req.end();
}

runTest();

