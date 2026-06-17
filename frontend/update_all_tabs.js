const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const jsPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\student.js';

let html = fs.readFileSync(indexPath, 'utf-8');
let js = fs.readFileSync(jsPath, 'utf-8');

// 1. Update Portofolio Tab Wrapper
html = html.replace(
  '<div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0;">',
  '<div style="display:flex;gap:8px;margin-bottom:24px;background:var(--bg-input);padding:6px;border-radius:var(--radius-lg);box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);overflow-x:auto;">'
);

// Update porto tabs buttons
html = html.replace(/id="porto-tab-rapor"[^>]+style="[^"]+"/g, `id="porto-tab-rapor" onclick="StudentApp.switchPortoTab('rapor')" style="padding:10px 16px;background:var(--bg-surface);border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--accent);cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 4px rgba(0,0,0,0.06);transition:all 0.2s ease;white-space:nowrap;"`);
html = html.replace(/id="porto-tab-ekskul"[^>]+style="[^"]+"/g, `id="porto-tab-ekskul" onclick="StudentApp.switchPortoTab('ekskul')" style="padding:10px 16px;background:transparent;border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s ease;white-space:nowrap;"`);
html = html.replace(/id="porto-tab-prestasi"[^>]+style="[^"]+"/g, `id="porto-tab-prestasi" onclick="StudentApp.switchPortoTab('prestasi')" style="padding:10px 16px;background:transparent;border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s ease;white-space:nowrap;"`);


// 2. Update Akademik Kelas Tab Wrapper
html = html.replace(
  '<div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0;overflow-x:auto;">',
  '<div style="display:flex;gap:8px;margin-bottom:24px;background:var(--bg-input);padding:6px;border-radius:var(--radius-lg);box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);overflow-x:auto;">'
);
html = html.replace(/id="akademik-kelas-tab-10"[^>]+style="[^"]+"/g, `id="akademik-kelas-tab-10" onclick="StudentApp.switchAkademikKelas(10)" style="padding:10px 16px;background:var(--bg-surface);border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--accent);cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.06);transition:all 0.2s ease;white-space:nowrap;"`);
html = html.replace(/id="akademik-kelas-tab-11"[^>]+style="[^"]+"/g, `id="akademik-kelas-tab-11" onclick="StudentApp.switchAkademikKelas(11)" style="padding:10px 16px;background:transparent;border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--text-secondary);cursor:pointer;transition:all 0.2s ease;white-space:nowrap;"`);
html = html.replace(/id="akademik-kelas-tab-12"[^>]+style="[^"]+"/g, `id="akademik-kelas-tab-12" onclick="StudentApp.switchAkademikKelas(12)" style="padding:10px 16px;background:transparent;border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:var(--text-secondary);cursor:pointer;transition:all 0.2s ease;white-space:nowrap;"`);

// 3. Update Akademik Semester Tab Wrappers
const semesterWrapperTarget = '<div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:0;">';
const semesterWrapperNew = '<div style="display:flex;gap:8px;margin-bottom:24px;background:var(--bg-input);padding:6px;border-radius:var(--radius-lg);box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);overflow-x:auto;">';
html = html.split(semesterWrapperTarget).join(semesterWrapperNew);

const updateSemTab = (idNum, isFirst) => {
    const regex = new RegExp(`id="akademik-sem-tab-${idNum}"[^>]+style="[^"]+"`, 'g');
    const bg = isFirst ? 'var(--bg-surface)' : 'transparent';
    const color = isFirst ? 'var(--accent)' : 'var(--text-secondary)';
    const shadow = isFirst ? 'box-shadow:0 2px 4px rgba(0,0,0,0.06);' : '';
    html = html.replace(regex, `id="akademik-sem-tab-${idNum}" onclick="StudentApp.switchAkademikSemester(${idNum})" style="padding:8px 16px;background:${bg};border:none;border-radius:var(--radius-md);font-weight:600;font-size:13px;color:${color};cursor:pointer;${shadow}transition:all 0.2s ease;white-space:nowrap;"`);
};
updateSemTab(1, true);
updateSemTab(2, false);
updateSemTab(3, true);
updateSemTab(4, false);
updateSemTab(5, true);
updateSemTab(6, false);


// ==== UPDATE JS ====

// switchAkademikKelas
let kelasResetTarget = `      if (btn) {
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.fontWeight = '600';
      }`;
let kelasResetNew = `      if (btn) {
        btn.style.background = 'transparent';
        btn.style.boxShadow = 'none';
        btn.style.color = 'var(--text-secondary)';
        btn.style.fontWeight = '600';
      }`;
js = js.replace(kelasResetTarget, kelasResetNew);

let kelasActiveTarget = `    if (activeBtn) {
      activeBtn.style.borderBottomColor = 'var(--accent)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '700';
    }`;
let kelasActiveNew = `    if (activeBtn) {
      activeBtn.style.background = 'var(--bg-surface)';
      activeBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '700';
    }`;
js = js.replace(kelasActiveTarget, kelasActiveNew);


// switchAkademikSemester
let semResetTarget = `      if (btn) {
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.fontWeight = '500';
      }`;
let semResetNew = `      if (btn) {
        btn.style.background = 'transparent';
        btn.style.boxShadow = 'none';
        btn.style.color = 'var(--text-secondary)';
        btn.style.fontWeight = '600';
      }`;
js = js.replace(semResetTarget, semResetNew);

let semActiveTarget = `    if (activeBtn) {
      activeBtn.style.borderBottomColor = 'var(--accent)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '600';
    }`;
let semActiveNew = `    if (activeBtn) {
      activeBtn.style.background = 'var(--bg-surface)';
      activeBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      activeBtn.style.color = 'var(--accent)';
      activeBtn.style.fontWeight = '600';
    }`;
js = js.replace(semActiveTarget, semActiveNew);


// switchPortoTab
let portoResetTarget = `        btn.style.borderBottomColor = isActive ? 'var(--accent)' : 'transparent';
        btn.style.color = isActive ? 'var(--accent)' : 'var(--text-muted)';
        btn.style.fontWeight = isActive ? '700' : '600';`;
let portoResetNew = `        btn.style.background = isActive ? 'var(--bg-surface)' : 'transparent';
        btn.style.boxShadow = isActive ? '0 2px 4px rgba(0,0,0,0.06)' : 'none';
        btn.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
        btn.style.fontWeight = isActive ? '700' : '600';`;
js = js.replace(portoResetTarget, portoResetNew);

fs.writeFileSync(indexPath, html);
fs.writeFileSync(jsPath, js);
console.log('Update Tabs Success');
