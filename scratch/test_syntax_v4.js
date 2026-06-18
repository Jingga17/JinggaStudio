const fs = require('fs');
const content = fs.readFileSync('frontend/js/pages/admin.js', 'utf8');

try {
  // If we can parse it as a function, there are no syntax errors
  new Function(content);
  console.log("SUCCESS: admin.js parses correctly!");
} catch(e) {
  console.error("SYNTAX ERROR in admin.js:", e.message);
  console.error(e.stack);
}
