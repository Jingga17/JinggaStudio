const fs = require('fs');
let c = fs.readFileSync('scratch/pemetaan_code_0.js', 'utf8');
if(c.startsWith('"') && c.endsWith('"')) {
  c = JSON.parse(c);
} else {
  c = c.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}
fs.writeFileSync('scratch/pemetaan_code_0_formatted.js', c, 'utf8');

let adminjs = fs.readFileSync('frontend/js/pages/admin.js', 'utf8');
const lastBrace = adminjs.lastIndexOf('}');
if(lastBrace > -1) {
  adminjs = adminjs.substring(0, lastBrace) + ',\n' + c + '\n' + adminjs.substring(lastBrace);
  fs.writeFileSync('frontend/js/pages/admin.js', adminjs, 'utf8');
  console.log('Injected back into admin.js successfully.');
}
