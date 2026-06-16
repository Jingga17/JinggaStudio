const fs = require('fs');
const { Jimp } = require('jimp');

(async () => {
  const svgData = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.svg', 'utf8');
  const regex = /base64,([^"]+)/g;
  let match;
  let m = [];
  while((match = regex.exec(svgData)) !== null) m.push(match[1]);
  
  const buf = Buffer.from(m[1], 'base64');
  const img = await Jimp.read(buf);
  
  let blueCount = 0;
  let yellowCount = 0;
  let whiteCount = 0;
  let blackCount = 0;
  
  for(let x=0; x<img.bitmap.width; x+=10) {
    for(let y=0; y<img.bitmap.height; y+=10) {
      const idx = (y * img.bitmap.width + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx+1];
      const b = img.bitmap.data[idx+2];
      
      if (r < 20 && g < 20 && b < 20) blackCount++;
      else if (r > 235 && g > 235 && b > 235) whiteCount++;
      else if (b > r + 50 && b > g + 50) blueCount++;
      else if (r > b + 50 && g > b + 50) yellowCount++;
    }
  }
  
  console.log('Blue:', blueCount);
  console.log('Yellow:', yellowCount);
  console.log('White:', whiteCount);
  console.log('Black:', blackCount);
})();
