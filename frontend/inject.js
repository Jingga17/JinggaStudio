const fs = require('fs');
const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const snippetPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\akademik_snippet.html';

let indexHtml = fs.readFileSync(indexPath, 'utf-8');
const snippetHtml = fs.readFileSync(snippetPath, 'utf-8');

indexHtml = indexHtml.replace('<!-- ── PAGE: PENGATURAN ── -->', snippetHtml + '\n\n        <!-- ── PAGE: PENGATURAN ── -->');

fs.writeFileSync(indexPath, indexHtml);
console.log('Injected successfully.');
