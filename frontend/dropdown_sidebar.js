const fs = require('fs');

const indexPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\index.html';
const jsPath = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\student.js';

let html = fs.readFileSync(indexPath, 'utf-8');
let js = fs.readFileSync(jsPath, 'utf-8');

// 1. Sidebar HTML Change
const oldSidebarPorto = `<div class="student-nav-item" data-student-page="portofolio" onclick="StudentApp.navigateTo('portofolio')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
          <span>Portofolio</span>
        </div>`;

const newSidebarPorto = `<div class="nav-group">
          <div class="student-nav-item" onclick="StudentApp.toggleNavSubmenu('nav-portofolio-sub', this)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>
            <span>Portofolio</span>
            <svg class="nav-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto; transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div id="nav-portofolio-sub" style="display:none; flex-direction:column; padding-left:28px; margin-top:4px; gap:4px;">
            <div class="student-nav-item submenu-item" data-student-page="portofolio-rapor" onclick="StudentApp.navigateToPorto('rapor', this)" style="padding:8px 12px; font-size:13px; min-height:auto;">
              <span>Nilai Rapor</span>
            </div>
            <div class="student-nav-item submenu-item" data-student-page="portofolio-ekskul" onclick="StudentApp.navigateToPorto('ekskul', this)" style="padding:8px 12px; font-size:13px; min-height:auto;">
              <span>Ekstrakurikuler</span>
            </div>
            <div class="student-nav-item submenu-item" data-student-page="portofolio-prestasi" onclick="StudentApp.navigateToPorto('prestasi', this)" style="padding:8px 12px; font-size:13px; min-height:auto;">
              <span>Prestasi</span>
            </div>
          </div>
        </div>`;

if(html.includes(oldSidebarPorto)) {
    html = html.replace(oldSidebarPorto, newSidebarPorto);
} else {
    // Maybe whitespace differs, fallback to regex
    const regexOldSidebar = /<div class="student-nav-item" data-student-page="portofolio" onclick="StudentApp\.navigateTo\('portofolio'\)">[\s\S]*?<span>Portofolio<\/span>\s*<\/div>/;
    html = html.replace(regexOldSidebar, newSidebarPorto);
}

// 2. Hide Top Portofolio Tabs Wrapper
const oldTopTabs = `<!-- Tab Switcher -->
          <div style="display:flex;gap:8px;margin-bottom:24px;background:var(--bg-input);padding:6px;border-radius:var(--radius-lg);box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);overflow-x:auto;">`;
const newTopTabs = `<!-- Tab Switcher -->
          <div style="display:none;gap:8px;margin-bottom:24px;background:var(--bg-input);padding:6px;border-radius:var(--radius-lg);box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);overflow-x:auto;">`;
html = html.replace(oldTopTabs, newTopTabs);

// 3. Add JS Functions
const targetJS = `  navigateTo(page) {`;
const newJS = `  toggleNavSubmenu(id, btn) {
    const sub = document.getElementById(id);
    const chevron = btn.querySelector('.nav-chevron');
    if (sub.style.display === 'none') {
      sub.style.display = 'flex';
      if(chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
      sub.style.display = 'none';
      if(chevron) chevron.style.transform = 'rotate(0deg)';
    }
  },

  navigateToPorto(tab, btn) {
    // 1. Show main portofolio page container
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const pageEl = document.getElementById('student-page-portofolio');
    if (pageEl) pageEl.classList.add('active');
    
    // 2. Reset active states in sidebar
    document.querySelectorAll('.student-nav-item').forEach(el => el.classList.remove('active'));
    
    // 3. Activate the clicked submenu item
    btn.classList.add('active');
    
    // 4. Activate parent so it looks highlighted
    btn.parentElement.previousElementSibling.classList.add('active');

    // 5. Switch the inner tab content
    this.switchPortoTab(tab);
  },

  navigateTo(page) {`;

if (!js.includes('toggleNavSubmenu')) {
    js = js.replace(targetJS, newJS);
}

// Update the main portofolio title slightly so it responds dynamically if needed, 
// actually the user just clicks the submenu and it opens the page.

fs.writeFileSync(indexPath, html);
fs.writeFileSync(jsPath, js);
console.log('Sidebar dropdown updated successfully!');
