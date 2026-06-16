const fs = require('fs');
const txt = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/admin.html', 'utf8');
const lines = txt.split('\n');
lines.forEach((l, i) => {
  if (l.includes('data-page') || l.includes('id="page-')) {
    console.log(i + ': ' + l.trim());
  }
});
