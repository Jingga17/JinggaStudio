const fs = require('fs');
const { execSync } = require('child_process');

// Get the base admin.js from git
const base = execSync('git show HEAD:frontend/js/pages/admin.js').toString();
const lines = base.split('\n');
// Show last 15 lines
console.log('Last 15 lines of base admin.js:');
lines.slice(-15).forEach((l, i) => console.log((lines.length - 14 + i) + ': ' + l));
