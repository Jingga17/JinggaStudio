const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');
  
  const svgData = fs.readFileSync('../frontend/img/logo-full.svg', 'utf8');
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script>
        window.processImage = function(svgString) {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.getElementById('c');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imgData.data;
              for(let i = 0; i < data.length; i += 4) {
                // If white or very close to white, make transparent
                if(data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                  data[i+3] = 0; // alpha = 0
                }
              }
              ctx.putImageData(imgData, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          });
        };
      </script>
    </body>
    </html>
  `);

  const dataUrl = await page.evaluate((svg) => window.processImage(svg), svgData);
  
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync('../frontend/img/logo-full.png', base64Data, 'base64');
  fs.writeFileSync('../frontend/img/logo.png', base64Data, 'base64');
  
  await browser.close();
  console.log("Done");
})();
