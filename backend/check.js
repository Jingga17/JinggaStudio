const fs = require('fs');
const { Jimp } = require('jimp');

(async () => {
  const svgData = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.svg', 'utf8');
  const regex = /base64,([^"]+)/g;
  let match;
  let m = [];
  while((match = regex.exec(svgData)) !== null) m.push(match[1]);
  
  const buf = Buffer.from(m[0], 'base64');
  const img = await Jimp.read(buf);
  let hasColors = false;
  for(let x=0; x<img.bitmap.width; x+=10) {
    for(let y=0; y<img.bitmap.height; y+=10) {
      const idx = (y * img.bitmap.width + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx+1];
      const b = img.bitmap.data[idx+2];
      if (Math.abs(r - g) > 20 || Math.abs(r - b) > 20) hasColors = true;
    }
  }
  console.log('Match 0 has colors:', hasColors);
})();
