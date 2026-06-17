const { execSync } = require('child_process');
const fs = require('fs');

const cwd = 'c:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM';
const commits = [
  '9d72062', '0d2dbe8', '2c50a3e', 'ce2eb4c', '9739319', '8859484', 'd10388b', 'c9a621e'
];

for (const commit of commits) {
  try {
    const out = execSync(`git show ${commit}:frontend/js/pages/export.js`, { cwd }).toString();
    console.log(`Found in commit ${commit}, size: ${out.length}`);
    fs.writeFileSync('scratch/export_js_from_git.js', out, 'utf8');
    break;
  } catch(e) {
    console.log(`Not in ${commit}`);
  }
}
