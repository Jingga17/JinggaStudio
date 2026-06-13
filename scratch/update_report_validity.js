const fs = require('fs');
let code = fs.readFileSync('frontend/js/pages/report.js', 'utf8');

const svgFunctions = `
  getLieScaleSvg(score, isClass = false) {
    const r = 70;
    const cx = 150;
    const cy = 100;
    const strokeWidth = 24;
    const C = 2 * Math.PI * r;
    const halfC = Math.PI * r;
    
    const l1 = (2/22) * halfC;
    const l2 = (11/22) * halfC;
    const l3 = (9/22) * halfC;
    
    const o1 = 0;
    const o2 = -l1;
    const o3 = -(l1 + l2);

    const s = Math.min(Math.max(score, 0), 22);
    const angle = -180 + (s/22)*180;

    return \`
      <svg width="100%" height="130" viewBox="0 0 300 130" style="overflow:visible">
        <defs>
          <linearGradient id="grad-lie" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="50%" stop-color="#facc15"/>
            <stop offset="100%" stop-color="#ef4444"/>
          </linearGradient>
        </defs>
        
        <!-- Background track -->
        <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="#e2e8f0" stroke-width="\${strokeWidth}"
          stroke-dasharray="\${halfC} \${halfC}" transform="rotate(180, \${cx}, \${cy})" />
        
        <!-- Blue segment 0-2 -->
        <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="#2563eb" stroke-width="\${strokeWidth}"
          stroke-dasharray="\${l1} \${C}" stroke-dashoffset="\${o1}" transform="rotate(180, \${cx}, \${cy})" />
        
        <!-- Gradient segment 2-13 -->
        <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="url(#grad-lie)" stroke-width="\${strokeWidth}"
          stroke-dasharray="\${l2} \${C}" stroke-dashoffset="\${o2}" transform="rotate(180, \${cx}, \${cy})" />
        
        <!-- Red segment 13-22 -->
        <circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="#ef4444" stroke-width="\${strokeWidth}"
          stroke-dasharray="\${l3} \${C}" stroke-dashoffset="\${o3}" transform="rotate(180, \${cx}, \${cy})" />

        <!-- Labels -->
        <text x="\${cx - r - 20}" y="\${cy + 5}" font-size="11" font-weight="bold" fill="#000" text-anchor="end">SANGAT</text>
        <text x="\${cx - r - 20}" y="\${cy + 17}" font-size="11" font-weight="bold" fill="#000" text-anchor="end">JUJUR</text>
        <text x="\${cx - r - 10}" y="\${cy - 20}" font-size="10" fill="#000">2</text>
        <text x="\${cx - 15}" y="\${cy - r - 15}" font-size="11" font-weight="bold" fill="#000" text-anchor="middle" transform="rotate(-15, \${cx}, \${cy - r - 20})">WASPADA</text>
        <text x="\${cx + 35}" y="\${cy - r - 5}" font-size="10" fill="#000">13</text>
        <text x="\${cx + r + 20}" y="\${cy - 20}" font-size="11" font-weight="bold" fill="#000" text-anchor="start" transform="rotate(45, \${cx + r + 20}, \${cy - 20})">BERBOHONG</text>
        
        <text x="\${cx - r - 10}" y="\${cy + 25}" font-size="11" fill="#000" text-anchor="middle">0</text>
        <text x="\${cx + r + 10}" y="\${cy + 25}" font-size="11" fill="#000" text-anchor="middle">22</text>

        <!-- Needle -->
        <g transform="rotate(\${angle}, \${cx}, \${cy})">
          <polygon points="\${cx - 5},\${cy} \${cx},\${cy - 3} \${cx + r - 5},\${cy} \${cx},\${cy + 3}" fill="#1e3a8a"/>
          <circle cx="\${cx}" cy="\${cy}" r="5" fill="#1e3a8a"/>
        </g>
      </svg>
    \`;
  },

  getConsistencySvg(score, isClass = false) {
    const r = 50;
    const cx = 150;
    const cy = 100;
    const strokeWidth = 25;
    const C = 2 * Math.PI * r;
    const segmentL = C / 9;
    
    let paths = '';
    const greyCount = Math.round(score);
    
    for(let i=0; i<9; i++) {
      const isGrey = isClass ? (i < greyCount) : (i < score);
      const color = isGrey ? '#cbd5e1' : '#10b981';
      const angle = i * 40 - 90;
      const gap = 2;
      const drawL = segmentL - gap;
      
      paths += \`<circle cx="\${cx}" cy="\${cy}" r="\${r}" fill="none" stroke="\${color}" stroke-width="\${strokeWidth}"
        stroke-dasharray="\${drawL} \${C}" stroke-dashoffset="0" transform="rotate(\${angle}, \${cx}, \${cy})" />\`;
    }

    const konsisten = 9 - (isClass ? score : greyCount);
    const inkonsisten = isClass ? score : greyCount;

    return \`
      <svg width="100%" height="160" viewBox="0 0 300 160" style="overflow:visible">
        \${paths}
        <!-- Inner text -->
        <text x="\${cx}" y="\${cy - 5}" font-size="28" font-weight="bold" fill="#000" text-anchor="middle">9</text>
        <text x="\${cx}" y="\${cy + 15}" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">TOTAL PASANG</text>
        <text x="\${cx}" y="\${cy + 27}" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">PERNYATAAN</text>
        
        <!-- Lines and labels -->
        <!-- Consistent Line -->
        <polyline points="\${cx - r - 20},\${cy + 10} \${cx - r - 50},\${cy + 10}" fill="none" stroke="#94a3b8" stroke-width="1"/>
        <text x="\${cx - r - 50}" y="\${cy + 5}" font-size="11" font-weight="bold" fill="#000" text-anchor="start">KONSISTEN: \${konsisten}</text>
        
        <!-- Inconsistent Line -->
        <polyline points="\${cx + r + 15},\${cy - 30} \${cx + r + 50},\${cy - 30}" fill="none" stroke="#94a3b8" stroke-width="1"/>
        <text x="\${cx + r + 50}" y="\${cy - 35}" font-size="11" font-weight="bold" fill="#000" text-anchor="end">INKONSISTEN: \${inkonsisten}</text>
      </svg>
    \`;
  },
`;

if (!code.includes('getLieScaleSvg(')) {
  code = code.replace('getDonutSvg(p, b, s, k) {', svgFunctions + '\n  getDonutSvg(p, b, s, k) {');
  fs.writeFileSync('frontend/js/pages/report.js', code);
  console.log('Injected SVG functions');
} else {
  console.log('SVG functions already injected');
}

// Now replace the Section A rendering in Individu
const targetIndividu = `      <h2>A. VALIDITAS PENGISIAN</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Lie Scale (Skala Kebohongan)</h3>
          <p>Skor: <b>\${student.lie_score} dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:\${(student.lie_score/22)*100}%; background:#3b82f6;"></div>
            </div>
            \${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Consistency Check</h3>
          <p>Skor Inkonsistensi: <b>\${student.cc_score} dari 9 pasang</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            <div style="display:flex; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:5px;">
              <div style="width:\${(student.cc_score/9)*100}%; background:#10b981;"></div>
            </div>
            \${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
          </div>
        </div>
      </div>`;

const replaceIndividu = `      <h2>A. VALIDITAS PENGISIAN</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Lie Scale (Skala Kebohongan)
          </div>
          <div class="validity-body">
            <div class="validity-score-box">
              <div style="color:#2563eb;font-size:14px;margin-bottom:2px">👁️</div>
              Skor: <b>\${student.lie_score} dari 22</b>
            </div>
            <div style="text-align:center; margin-top:-10px;">
              \${this.getLieScaleSvg(student.lie_score, false)}
            </div>
            <div class="validity-bar">
              <div style="width:\${((22 - student.lie_score)/22)*100}%; background:#2563eb;"></div>
              <div style="width:\${(student.lie_score/22)*100}%; background:#cbd5e1;"></div>
            </div>
            <div class="validity-legend">
              <div><span style="display:inline-block;width:10px;height:10px;background:#2563eb;margin-right:5px;"></span> Respon Konsisten dengan Kejujuran: <b>\${22 - student.lie_score}</b></div>
              <div><span style="display:inline-block;width:10px;height:10px;background:#cbd5e1;margin-right:5px;"></span> Indikasi Berbohong: <b>\${student.lie_score}</b></div>
            </div>
            <div class="validity-desc" style="margin-top:15px;">
              \${this.getDeskripsiAnalisis('bidang', 'Lie Scale', student.lie_score)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Consistency Check
          </div>
          <div class="validity-body">
            <div class="validity-score-box" style="align-self:flex-start;">
              <div style="color:#10b981;font-size:14px;margin-bottom:2px">👍</div>
              Skor Inkonsistensi: <b>\${student.cc_score}<br>dari 9 pasang</b>
            </div>
            <div style="position:absolute; top:30px; right:-20px; width:250px;">
              \${this.getConsistencySvg(student.cc_score, false)}
            </div>
            <div class="validity-desc" style="margin-top:110px;">
              \${this.getDeskripsiAnalisis('bidang', 'Consistency', student.cc_score)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN 👍</h4>
          <ul>
            <li>PROFIL DATA SANGAT VALID</li>
            <li>DAPAT DIANDALKAN</li>
            <li>LANDASAN INTERVENSI KOKOH</li>
          </ul>
        </div>
      </div>`;

// Now for Kelas
const targetKelas = `      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div style="display:flex; gap:20px;">
        <div class="chart-box" style="flex:1;">
          <h3>A.1 Rata-Rata Lie Scale</h3>
          <p>Skor Kelas: <b>\${lie_score_avg} dari 22</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            \${this.getDeskripsiAnalisis('bidang', 'Lie Scale', lie_score_avg, true)}
          </div>
        </div>
        <div class="chart-box" style="flex:1;">
          <h3>A.2 Rata-Rata Consistency Check</h3>
          <p>Skor Kelas: <b>\${cc_score_avg} dari 9</b></p>
          <div style="margin-top:10px; font-size:11px; color:#475569;">
            \${this.getDeskripsiAnalisis('bidang', 'Consistency', cc_score_avg, true)}
          </div>
        </div>
      </div>`;

const replaceKelas = `      <h2>A. VALIDITAS PENGISIAN KELAS</h2>
      <div class="validity-container">
        <!-- Lie Scale Card -->
        <div class="validity-card blue">
          <div class="validity-header">
            <span>👁️</span> A.1 Rata-Rata Lie Scale
          </div>
          <div class="validity-body">
            <div class="validity-score-box">
              <div style="color:#2563eb;font-size:14px;margin-bottom:2px">👁️</div>
              Skor Kelas: <b>\${lie_score_avg} dari 22</b>
            </div>
            <div style="text-align:center; margin-top:-10px;">
              \${this.getLieScaleSvg(lie_score_avg, true)}
            </div>
            <div class="validity-bar">
              <div style="width:\${((22 - lie_score_avg)/22)*100}%; background:#2563eb;"></div>
              <div style="width:\${(lie_score_avg/22)*100}%; background:#cbd5e1;"></div>
            </div>
            <div class="validity-legend">
              <div><span style="display:inline-block;width:10px;height:10px;background:#2563eb;margin-right:5px;"></span> Rata-rata Kejujuran: <b>\${(22 - lie_score_avg).toFixed(1)}</b></div>
              <div><span style="display:inline-block;width:10px;height:10px;background:#cbd5e1;margin-right:5px;"></span> Rata-rata Berbohong: <b>\${lie_score_avg}</b></div>
            </div>
            <div class="validity-desc" style="margin-top:15px;">
              \${this.getDeskripsiAnalisis('bidang', 'Lie Scale', lie_score_avg, true)}
            </div>
          </div>
        </div>

        <!-- Consistency Card -->
        <div class="validity-card green">
          <div class="validity-header">
            <span>⚖️</span> A.2 Rata-Rata Consistency Check
          </div>
          <div class="validity-body">
            <div class="validity-score-box" style="align-self:flex-start;">
              <div style="color:#10b981;font-size:14px;margin-bottom:2px">👍</div>
              Skor Kelas: <b>\${cc_score_avg}<br>dari 9 pasang</b>
            </div>
            <div style="position:absolute; top:30px; right:-20px; width:250px;">
              \${this.getConsistencySvg(cc_score_avg, true)}
            </div>
            <div class="validity-desc" style="margin-top:110px;">
              \${this.getDeskripsiAnalisis('bidang', 'Consistency', cc_score_avg, true)}
            </div>
          </div>
        </div>

        <!-- Kesimpulan Badge -->
        <div class="kesimpulan-badge">
          <h4>👁️ KESIMPULAN KELAS 👍</h4>
          <ul>
            <li>DATA KELAS CUKUP VALID</li>
            <li>DAPAT DIANDALKAN SECARA KOLEKTIF</li>
          </ul>
        </div>
      </div>`;

// Apply replacements
if (code.includes('<h3>A.1 Lie Scale (Skala Kebohongan)</h3>')) {
  code = code.replace(targetIndividu, replaceIndividu);
  code = code.replace(targetKelas, replaceKelas);
  fs.writeFileSync('frontend/js/pages/report.js', code);
  console.log('Replaced Individu and Kelas layouts');
} else {
  console.log('Could not find target layout');
}
