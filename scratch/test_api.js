const http = require('http');

http.get('http://localhost:3000/api/students/master', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('SUCCESS! API Backend merespons dengan 200 OK.');
      const parsed = JSON.parse(data);
      console.log('Jumlah siswa master:', parsed.data ? parsed.data.length : 0);
    } else {
      console.log('ERROR! API Backend merespons dengan:', res.statusCode);
      console.log(data);
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.log('ERROR KONEKSI:', err.message);
  process.exit(1);
});
