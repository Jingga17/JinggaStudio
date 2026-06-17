const fs = require('fs');

const path = 'C:\\Users\\LENOVO\\Desktop\\WORK\\aplikasi\\DCM\\frontend\\js\\pages\\student.js';
let js = fs.readFileSync(path, 'utf-8');

const targetHeader = `    const header = document.createElement('div');
    header.className = 'profile-tabs-header';
    header.style.display = 'flex';
    header.style.flexWrap = 'wrap';
    header.style.gap = '12px';
    header.style.marginBottom = '20px';
    header.style.borderBottom = '2px solid var(--border)';
    header.style.paddingBottom = '12px';`;

const newHeader = `    const header = document.createElement('div');
    header.className = 'profile-tabs-header';
    header.style.display = 'flex';
    header.style.flexWrap = 'wrap';
    header.style.gap = '8px';
    header.style.marginBottom = '24px';
    header.style.background = 'var(--bg-input)';
    header.style.padding = '6px';
    header.style.borderRadius = 'var(--radius-lg)';
    header.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.03)';`;

js = js.replace(targetHeader, newHeader);

const targetBtn = `      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'profile-tab-btn ' + (index === 0 ? 'active' : '');
      btn.textContent = title;
      btn.style.padding = '8px 12px';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.borderBottom = '2px solid transparent';
      btn.style.marginBottom = '-14px';
      btn.style.fontWeight = index === 0 ? '700' : '600';
      btn.style.fontSize = '14px';
      btn.style.color = index === 0 ? 'var(--accent)' : 'var(--text-muted)';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.2s ease';
      if (index === 0) btn.style.borderBottomColor = 'var(--accent)';`;

const newBtn = `      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'profile-tab-btn ' + (index === 0 ? 'active' : '');
      btn.textContent = title;
      btn.style.padding = '10px 16px';
      btn.style.background = index === 0 ? 'var(--bg-surface)' : 'transparent';
      btn.style.border = 'none';
      btn.style.borderRadius = 'var(--radius-md)';
      btn.style.fontWeight = '600';
      btn.style.fontSize = '13px';
      btn.style.color = index === 0 ? 'var(--accent)' : 'var(--text-secondary)';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'all 0.2s ease';
      if (index === 0) btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';`;

js = js.replace(targetBtn, newBtn);

const targetClick = `      btn.onclick = () => {
        // Hide all accordions
        accordions.forEach(a => {
          a.style.display = 'none';
          a.removeAttribute('open');
        });
        // Remove active class from all btns
        const allBtns = header.querySelectorAll('.profile-tab-btn');
        allBtns.forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--text-muted)';
          b.style.fontWeight = '600';
          b.style.borderBottomColor = 'transparent';
        });

        // Show target accordion
        acc.style.display = 'block';
        acc.setAttribute('open', '');
        // Activate this btn
        btn.classList.add('active');
        btn.style.color = 'var(--accent)';
        btn.style.fontWeight = '700';
        btn.style.borderBottomColor = 'var(--accent)';
      };`;

const newClick = `      btn.onclick = () => {
        // Hide all accordions
        accordions.forEach(a => {
          a.style.display = 'none';
          a.removeAttribute('open');
        });
        // Remove active class from all btns
        const allBtns = header.querySelectorAll('.profile-tab-btn');
        allBtns.forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--text-secondary)';
          b.style.background = 'transparent';
          b.style.boxShadow = 'none';
        });

        // Show target accordion
        acc.style.display = 'block';
        acc.setAttribute('open', '');
        // Activate this btn
        btn.classList.add('active');
        btn.style.color = 'var(--accent)';
        btn.style.background = 'var(--bg-surface)';
        btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
      };`;

js = js.replace(targetClick, newClick);

fs.writeFileSync(path, js);
console.log('student.js updated successfully!');
