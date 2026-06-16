const fs = require('fs');
const { Jimp } = require('jimp');

(async () => {
  const svgData = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.svg', 'utf8');
  
  const regex = /base64,([^"]+)/g;
  let match;
  let matches = [];
  while ((match = regex.exec(svgData)) !== null) {
    matches.push(match[1]);
  }
  
  const base64Data = matches.length > 1 ? matches[1] : matches[0];
  const buffer = Buffer.from(base64Data, 'base64');
  
  let image;
  if (Jimp && Jimp.read) {
    image = await Jimp.read(buffer);
  } else {
    const JimpDefault = require('jimp');
    image = await JimpDefault.read(buffer);
  }
  
  // Make black background transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    
    // If pixel is black or near-black, make it transparent
    if (red < 15 && green < 15 && blue < 15) {
      this.bitmap.data[idx + 3] = 0; // alpha
    }
  });
  
  if (image.writeAsync) {
    await image.writeAsync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.png');
    await image.writeAsync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo.png');
  } else {
    image.write('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.png');
    image.write('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo.png');
  }
  console.log("Done extracting and fixing second image");
})();
