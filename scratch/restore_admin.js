const { execSync } = require('child_process');
try {
  console.log("Restoring admin.js...");
  execSync('git checkout HEAD -- frontend/js/pages/admin.js', { cwd: 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM' });
  console.log("Restored successfully.");
} catch(e) {
  console.error("Error:", e.message);
}
