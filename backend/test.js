const fs = require('fs');
const txt = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.svg', 'utf8');
const regex = /base64,([^"]+)/g;
let m = [];
let match;
while ((match = regex.exec(txt)) !== null) {
  m.push(match[1]);
}
console.log('Matches:', m.length);
if (m.length > 0) console.log('Match 0 len:', m[0].length);
if (m.length > 1) console.log('Match 1 len:', m[1].length);
