const fs = require('fs');
const vm = require('vm');
try {
  const code = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\admin.js', 'utf-8');
  new vm.Script(code);
  fs.writeFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\scratch\\syntax_result.txt', 'SUCCESS: No syntax error');
} catch (e) {
  fs.writeFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\scratch\\syntax_result.txt', 'ERROR: ' + e.stack);
}
