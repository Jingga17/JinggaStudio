/**
 * Counselor Connect — UI Components
 * Toast, Modal, Spinner, Charts
 */

// ════════════════════════════════════════
// SPINNER
// ════════════════════════════════════════
const Spinner = {
  show() { document.getElementById('global-spinner')?.classList.add('show'); },
  hide() { document.getElementById('global-spinner')?.classList.remove('show'); },
};

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    if (!this.container) return;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      el.addEventListener('animationend', () => el.remove());
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); },
};

// ════════════════════════════════════════
// MODAL
// ════════════════════════════════════════
const Modal = {
  activeResolve: null,

  confirm({ title, body, confirmText = 'Ya', cancelText = 'Batal', danger = false }) {
    return new Promise(resolve => {
      const overlay = document.getElementById('modal-overlay');
      const mTitle  = document.getElementById('modal-title');
      const mBody   = document.getElementById('modal-body');
      const mOk     = document.getElementById('modal-ok');
      const mCancel = document.getElementById('modal-cancel');

      mTitle.textContent  = title;
      mBody.innerHTML     = body;
      mOk.textContent     = confirmText;
      mOk.className       = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
      mCancel.textContent = cancelText;

      const close = (result) => {
        overlay.classList.remove('show');
        mOk.onclick = null; mCancel.onclick = null;
        resolve(result);
      };
      mOk.onclick     = () => close(true);
      mCancel.onclick = () => close(false);
      overlay.onclick = (e) => { if (e.target === overlay) close(false); };
      overlay.classList.add('show');
    });
  },

  alert({ title, body, btnText = 'OK' }) {
    return new Promise(resolve => {
      const overlay = document.getElementById('modal-overlay');
      const mTitle  = document.getElementById('modal-title');
      const mBody   = document.getElementById('modal-body');
      const mOk     = document.getElementById('modal-ok');
      const mCancel = document.getElementById('modal-cancel');

      mTitle.textContent = title;
      mBody.innerHTML    = body;
      mOk.textContent    = btnText;
      mOk.className      = 'btn btn-primary';
      mCancel.style.display = 'none';

      const close = () => {
        overlay.classList.remove('show');
        mOk.onclick = null;
        mCancel.style.display = '';
        resolve();
      };
      mOk.onclick = close;
      overlay.onclick = (e) => { if (e.target === overlay) close(); };
      overlay.classList.add('show');
    });
  },
};

// ════════════════════════════════════════
// CHARTS (Canvas-based, no dependencies)
// ════════════════════════════════════════
const Charts = {
  BIDANG_COLORS: {
    Pribadi: '#3B82F6',
    Belajar: '#22C55E',
    Sosial:  '#F97316',
    Karir:   '#A855F7',
  },

  /**
   * Gambar Donut Chart untuk 4 bidang
   */
  drawDonut(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    const outerR = Math.min(W,H)/2 - 10;
    const innerR = outerR * 0.58;

    ctx.clearRect(0, 0, W, H);

    const entries = Object.entries(data); // [['Pribadi', 38], ...]
    const total   = entries.reduce((s,[,v]) => s + v, 0);

    if (total === 0) {
      // Draw empty gray ring
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
    } else {
      let startAngle = -Math.PI / 2;
      entries.forEach(([bidang, pct]) => {
        const angle = (pct / total) * Math.PI * 2;
        const color = this.BIDANG_COLORS[bidang] || '#64748B';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        startAngle += angle;
      });
    }

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI*2);
    ctx.fillStyle = '#1E293B';
    ctx.fill();

    // Center label
    const avg = entries.length > 0 ? Math.round(total / entries.length) : 0;
    ctx.fillStyle = '#F1F5F9';
    ctx.font = `bold ${Math.round(outerR*0.35)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${avg}%`, cx, cy - 4);
    ctx.font = `${Math.round(outerR*0.15)}px Inter, sans-serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText('rata-rata', cx, cy + outerR*0.2);
  },

  /**
   * Gambar Bar Chart untuk sub bidang
   */
  drawBar(canvasId, data, subBidangMeta) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const entries = Object.entries(data);
    if (entries.length === 0) return;

    const padL = 110, padR = 16, padT = 10, padB = 24;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barH   = Math.max(8, (chartH / entries.length) - 4);
    const gap    = (chartH / entries.length) - barH;

    // Grid lines
    [25,50,75,100].forEach(pct => {
      const x = padL + (pct/100) * chartW;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + chartH);
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, x, padT + chartH + 14);
    });

    entries.forEach(([subBidang, pct], i) => {
      const meta  = subBidangMeta ? subBidangMeta[subBidang] : null;
      const color = meta ? (this.BIDANG_COLORS[meta.bidang] || '#64748B') : '#64748B';
      const y = padT + i * (barH + gap);
      const bw = (pct/100) * chartW;

      // BG bar
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      this.roundRect(ctx, padL, y, chartW, barH, 3);
      ctx.fill();

      // Value bar
      if (bw > 0) {
        ctx.beginPath();
        ctx.fillStyle = color + 'CC';
        this.roundRect(ctx, padL, y, bw, barH, 3);
        ctx.fill();
      }

      // Label
      const label = subBidang.length > 18 ? subBidang.substring(0,17) + '…' : subBidang;
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, padL - 6, y + barH/2);

      // Value text
      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${pct}%`, padL + bw + 4, y + barH/2);
    });
  },

  roundRect(ctx, x, y, w, h, r) {
    if (w < 2*r) r = w/2;
    if (h < 2*r) r = h/2;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  },

  /**
   * Resize canvas to container width
   */
  resizeCanvas(canvasId, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width  = container.clientWidth;
    canvas.height = height || container.clientWidth * 0.7;
  },
};

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function _(id) { return document.getElementById(id); }
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatDurasi(seconds) {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function kategoriColor(kat) {
  const map = { 'Ringan':'#22C55E','Sedang':'#EAB308','Berat':'#F97316','Sangat Berat':'#EF4444' };
  return map[kat] || '#94A3B8';
}
function badgeKategori(pct) {
  const kat = Scoring.kategori(pct);
  const cls = { 'Ringan':'badge-ringan','Sedang':'badge-sedang','Berat':'badge-berat','Sangat Berat':'badge-sangat-berat' }[kat] || '';
  return `<span class="badge ${cls}">${kat}</span>`;
}
function badgeStatus(status) {
  const cls = status === 'Valid' ? 'badge-valid' : status === 'Valid dengan Syarat' ? 'badge-bersyarat' : 'badge-invalid';
  return `<span class="badge ${cls}">${status}</span>`;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => Toast.success('Link berhasil disalin!'),
    () => { const i = document.createElement('input'); i.value=text; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); Toast.success('Link disalin!'); }
  );
}
