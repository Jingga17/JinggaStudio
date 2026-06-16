const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const snippetPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\akademik_snippet.html';

let html = fs.readFileSync(indexPath, 'utf-8');

// 1. Remove the old separate student-page-akademik div
// Note: It starts with <!-- ── PAGE: AKADEMIK ── --> and ends right before <!-- ── PAGE: PENGATURAN ── -->
const startMarker = '<!-- ── PAGE: AKADEMIK ── -->';
const endMarker = '<!-- ── PAGE: PENGATURAN ── -->';
if (html.includes(startMarker)) {
    const p1 = html.indexOf(startMarker);
    const p2 = html.indexOf(endMarker);
    html = html.substring(0, p1) + html.substring(p2);
}

// 2. Remove the sidebar nav item
const navItemHtml = `
        <div class="student-nav-item" data-student-page="akademik" onclick="StudentApp.navigateTo('akademik')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
          <span>Nilai Akademik</span>
        </div>`;
html = html.replace(navItemHtml, '');

// 3. Read snippet but remove the wrapper div #student-page-akademik
let snippetHtml = fs.readFileSync(snippetPath, 'utf-8');
snippetHtml = snippetHtml.replace('<!-- ── PAGE: AKADEMIK ── -->', '');
snippetHtml = snippetHtml.replace('<div id="student-page-akademik" style="display:none">', '');
// Remove the last </div>
snippetHtml = snippetHtml.substring(0, snippetHtml.lastIndexOf('</div>'));


// 4. Replace porto-content-rapor content
const portoStart = '<div id="porto-content-rapor">';
const portoEnd = '<div id="porto-content-prestasi" style="display:none">';
if (html.includes(portoStart) && html.includes(portoEnd)) {
    const p1 = html.indexOf(portoStart) + portoStart.length;
    const p2 = html.indexOf(portoEnd);
    html = html.substring(0, p1) + '\\n' + snippetHtml + '\\n          </div>\\n\\n          <!-- TAB: PRESTASI -->\\n          ' + html.substring(p2);
}

fs.writeFileSync(indexPath, html);
console.log('Moved successfully!');
