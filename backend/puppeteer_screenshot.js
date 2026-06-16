const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('about:blank');
  
  const svgData = fs.readFileSync('../frontend/img/logo-full.svg', 'utf8');
  
  // Set content with inline SVG
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background: transparent;">
      <div id="svg-container" style="display: inline-block; width: 1000px; height: 1000px;">
        ${svgData}
      </div>
    </body>
    </html>
  `);

  // Force SVG to fill container
  await page.addStyleTag({ content: 'svg { width: 100%; height: 100%; }' });

  const element = await page.$('#svg-container');
  await element.screenshot({ 
    path: '../frontend/img/logo-full.png', 
    omitBackground: true 
  });
  
  await browser.close();
  console.log("Screenshot Done");
})();
