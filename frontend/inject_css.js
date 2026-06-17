const fs = require('fs');
const path = require('path');

const css = `

/* ══════════════════════════════════════════
   SLIDE-OVER DRAWER (BUKU INDUK)
══════════════════════════════════════════ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-overlay.open {
  opacity: 1;
  visibility: visible;
}

.drawer {
  position: fixed;
  top: 0;
  right: -800px;
  width: 100%;
  max-width: 800px;
  height: 100vh;
  background: var(--bg-primary);
  z-index: 1001;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}
.drawer.open {
  right: 0;
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--bg-card);
}

.drawer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent-glow);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
  gap: 24px;
  overflow-x: auto;
}
.drawer-tab {
  padding: 16px 0;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.drawer-tab:hover {
  color: var(--text-primary);
}
.drawer-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-primary);
}

.drawer-content-pane {
  display: none;
  animation: fadeIn 0.3s ease;
}
.drawer-content-pane.active {
  display: block;
}

/* Detail Tables/Grids inside Drawer */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.detail-item {
  background: var(--bg-card);
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
`;

const filePath = path.join(__dirname, 'css', 'style.css');
let currentCSS = fs.readFileSync(filePath, 'utf-8');

if (!currentCSS.includes('.drawer-overlay')) {
    fs.appendFileSync(filePath, css, 'utf-8');
    console.log('CSS appended.');
} else {
    console.log('CSS already exists.');
}
