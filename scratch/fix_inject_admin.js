const fs = require('fs');
const path = require('path');
let js = fs.readFileSync(path.join(__dirname, 'inject_admin.js'), 'utf-8');
js = js.replace("currentJS = currentJS.replace('};\\nwindow.AdminApp = AdminApp;', jsInjection + '\\n};\\nwindow.AdminApp = AdminApp;');", "currentJS = currentJS.replace(/\\}\\;\\s*window\\.AdminApp = AdminApp;/, jsInjection + '\\n};\\nwindow.AdminApp = AdminApp;');");
fs.writeFileSync(path.join(__dirname, 'inject_admin.js'), js, 'utf-8');
