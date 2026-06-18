const fs = require('fs');
const vm = require('vm');
try {
  const code = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\admin.js', 'utf-8');
  new vm.Script(code);
  fs.writeFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\syntax_result.txt', 'SYNTAX_OK');
} catch (e) {
  fs.writeFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\syntax_result.txt', 'SYNTAX_ERROR: ' + e.stack);
}
