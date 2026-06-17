const { execSync } = require('child_process');
try {
  const out = execSync('git show HEAD:frontend/js/pages/export.js', { cwd: 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM' }).toString();
  console.log('Found export.js in HEAD, size:', out.length);
  require('fs').writeFileSync('scratch/export_js_from_git.js', out, 'utf8');
} catch(e) {
  console.log('Not in HEAD:', e.message.substring(0, 100));
  try {
    const commits = execSync('git log --oneline', { cwd: 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM' }).toString();
    console.log('Commits:', commits);
  } catch(e2) {}
}
