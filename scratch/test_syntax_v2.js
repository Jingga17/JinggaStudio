const fs = require('fs');
const vm = require('vm');
try {
  const code = fs.readFileSync('c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\admin.js', 'utf-8');
  new vm.Script(code);
  console.log("SYNTAX_OK");
} catch (e) {
  console.log("SYNTAX_ERROR: " + e.message);
  console.log(e.stack);
}
