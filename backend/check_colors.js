const Jimp = require('jimp');

(async () => {
  const img = await Jimp.read('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/second_image.png');
  let hasColors = false;
  let hasBlack = false;
  
  for(let x=0; x<img.bitmap.width; x+=10) {
    for(let y=0; y<img.bitmap.height; y+=10) {
      const idx = (y * img.bitmap.width + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx+1];
      const b = img.bitmap.data[idx+2];
      if (Math.abs(r - g) > 20 || Math.abs(r - b) > 20) {
        hasColors = true;
      }
      if (r < 50 && g < 50 && b < 50) {
        hasBlack = true;
      }
    }
  }
  console.log("Has colors:", hasColors);
  console.log("Has black:", hasBlack);
})();
