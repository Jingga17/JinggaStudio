const fs = require('fs');
const { Jimp } = require('jimp');

(async () => {
  const svgData = fs.readFileSync('../frontend/img/logo-full.svg', 'utf8');
  
  // Find all base64 matches
  const regex = /base64,([^"]+)/g;
  let match;
  let matches = [];
  while ((match = regex.exec(svgData)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length < 2) {
    console.log("Second Base64 not found, using first");
  }
  
  // Use the second image (which is the colored one), or the last one available
  const base64Data = matches.length > 1 ? matches[1] : matches[0];
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
    
    // If pixel is near white, make it transparent
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
  console.log("Done extracting second image");
})();
