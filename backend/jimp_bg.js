const fs = require('fs');
const { Jimp } = require('jimp');

(async () => {
  const svgData = fs.readFileSync('../frontend/img/logo-full.svg', 'utf8');
  const match = svgData.match(/base64,([^"]+)/);
  if (!match) {
    console.log("Base64 not found");
    return;
  }
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  let image;
  if (Jimp && Jimp.read) {
    image = await Jimp.read(buffer);
  } else {
    const JimpDefault = require('jimp');
    image = await JimpDefault.read(buffer);
  }
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    
    // If pixel is near white
    if (red > 240 && green > 240 && blue > 240) {
      this.bitmap.data[idx + 3] = 0; // alpha
    }
  });
  
  if (image.writeAsync) {
    await image.writeAsync('../frontend/img/logo-full.png');
    await image.writeAsync('../frontend/img/logo.png');
  } else {
    image.write('../frontend/img/logo-full.png');
    image.write('../frontend/img/logo.png');
  }
  console.log("Done");
})();
