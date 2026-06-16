const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const snippetPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\ekskul_snippet.html';

let html = fs.readFileSync(indexPath, 'utf-8');
const snippetHtml = fs.readFileSync(snippetPath, 'utf-8');

// 1. Tambah Tab Button
const tabTarget = `<button id="porto-tab-prestasi"`;
const ekskulTab = `
            <button id="porto-tab-ekskul" onclick="StudentApp.switchPortoTab('ekskul')" style="padding:10px 20px;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;font-weight:600;font-size:14px;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;gap:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Ekstrakurikuler
            </button>
`;
if (html.includes(tabTarget) && !html.includes('porto-tab-ekskul')) {
    html = html.replace(tabTarget, ekskulTab + tabTarget);
}

// 2. Tambah Container (setelah porto-content-prestasi tutupnya)
// We will look for <div id="porto-content-prestasi" ...> and insert right before its closing div, or after it.
// To insert AFTER it safely, we look for the end of the Portofolio page:
const portoPageEnd = `      </div><!-- end page-portofolio -->`;
if (html.includes(portoPageEnd) && !html.includes('id="porto-content-ekskul"')) {
    html = html.replace(portoPageEnd, snippetHtml + '\n' + portoPageEnd);
}

fs.writeFileSync(indexPath, html);
console.log('Inserted Ekstrakurikuler UI into index.html');
