module.exports.getLieScaleSvg = function(score) {
  const r = 70;
  const cx = 150;
  const cy = 110;
  const strokeWidth = 24;
  const C = 2 * Math.PI * r;
  const halfC = Math.PI * r;
  
  // 0-2 (Blue), 2-13 (Gradient Yellow), 13-22 (Red)
  const l1 = (2/22) * halfC;
  const l2 = (11/22) * halfC;
  const l3 = (9/22) * halfC;
  
  const o1 = 0;
  const o2 = -l1;
  const o3 = -(l1 + l2);

  const angle = -180 + (score/22)*180;

  return `
    <svg width="300" height="150" viewBox="0 0 300 150">
      <defs>
        <linearGradient id="grad-lie" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </linearGradient>
      </defs>
      
      <!-- Background track -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${strokeWidth}"
        stroke-dasharray="${halfC} ${halfC}" transform="rotate(180, ${cx}, ${cy})" />
      
      <!-- Blue segment 0-2 -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2563eb" stroke-width="${strokeWidth}"
        stroke-dasharray="${l1} ${C}" stroke-dashoffset="${o1}" transform="rotate(180, ${cx}, ${cy})" />
      
      <!-- Gradient segment 2-13 -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#grad-lie)" stroke-width="${strokeWidth}"
        stroke-dasharray="${l2} ${C}" stroke-dashoffset="${o2}" transform="rotate(180, ${cx}, ${cy})" />
      
      <!-- Red segment 13-22 -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ef4444" stroke-width="${strokeWidth}"
        stroke-dasharray="${l3} ${C}" stroke-dashoffset="${o3}" transform="rotate(180, ${cx}, ${cy})" />

      <!-- Labels -->
      <text x="${cx - r - 20}" y="${cy + 5}" font-size="11" font-weight="bold" fill="#000" text-anchor="end">SANGAT\nJUJUR</text>
      <text x="${cx - r - 15}" y="${cy - 30}" font-size="10" fill="#000">2</text>
      <text x="${cx}" y="${cy - r - 20}" font-size="11" font-weight="bold" fill="#000" text-anchor="middle" transform="rotate(-15, ${cx}, ${cy - r - 20})">WASPADA</text>
      <text x="${cx + 35}" y="${cy - r - 5}" font-size="10" fill="#000">13</text>
      <text x="${cx + r + 20}" y="${cy - 20}" font-size="11" font-weight="bold" fill="#000" text-anchor="start" transform="rotate(45, ${cx + r + 20}, ${cy - 20})">BERBOHONG</text>
      
      <text x="${cx - r - 10}" y="${cy + 25}" font-size="11" fill="#000" text-anchor="middle">0</text>
      <text x="${cx + r + 10}" y="${cy + 25}" font-size="11" fill="#000" text-anchor="middle">22</text>

      <!-- Needle -->
      <g transform="rotate(${angle}, ${cx}, ${cy})">
        <polygon points="${cx - 10},${cy} ${cx},${cy - 4} ${cx + r - 10},${cy} ${cx},${cy + 4}" fill="#1e3a8a"/>
        <circle cx="${cx}" cy="${cy}" r="6" fill="#1e3a8a"/>
      </g>
    </svg>
  `;
}

module.exports.getConsistencySvg = function(score) {
  // score = inkonsisten count (e.g. 1 out of 9)
  // we want 9 segments. inkonsisten segments are colored grey, konsisten are green.
  const r = 50;
  const cx = 150;
  const cy = 100;
  const strokeWidth = 30;
  const C = 2 * Math.PI * r;
  const segmentL = C / 9;
  
  let paths = '';
  // draw 9 segments.
  // Grey for 'score' times, Green for '9 - score' times.
  const greyCount = Math.round(score);
  
  for(let i=0; i<9; i++) {
    const isGrey = i < greyCount;
    const color = isGrey ? '#cbd5e1' : '#10b981';
    const angle = i * 40 - 90; // start at top (-90)
    
    // We use a small gap between segments? Yes, stroke-dasharray with gap.
    // segmentL is total length. gap = 2.
    const gap = 2;
    const drawL = segmentL - gap;
    
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
      stroke-dasharray="${drawL} ${C}" stroke-dashoffset="0" transform="rotate(${angle}, ${cx}, ${cy})" />\\n`;
  }

  return `
    <svg width="300" height="200" viewBox="0 0 300 200">
      ${paths}
      <!-- Inner text -->
      <text x="${cx}" y="${cy - 5}" font-size="28" font-weight="bold" fill="#000" text-anchor="middle">9</text>
      <text x="${cx}" y="${cy + 15}" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">TOTAL PASANG</text>
      <text x="${cx}" y="${cy + 27}" font-size="10" font-weight="bold" fill="#000" text-anchor="middle">PERNYATAAN</text>
    </svg>
  `;
}
