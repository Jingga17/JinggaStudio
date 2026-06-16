const fs = require('fs');

(async () => {
  const svgData = fs.readFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/logo-full.svg', 'utf8');
  
  const regex = /base64,([^"]+)/g;
  let match;
  let matches = [];
  while ((match = regex.exec(svgData)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length > 1) {
    fs.writeFileSync('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/frontend/img/second_image.png', matches[1], 'base64');
    console.log("Saved second image");
  }
})();
