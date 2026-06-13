const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1200, height: 1600 });
        
        const url = 'http://127.0.0.1:8080/report.html?type=kelas&id=XII%20IPA%201';
        console.log(`Navigating to ${url}...`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for the SVG to render
        await page.waitForSelector('.validity-container', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // Take screenshot of the section
        const element = await page.$('.validity-container');
        if (element) {
            const dest = 'C:\\\\Users\\\\LENOVO\\\\.gemini\\\\antigravity-ide\\\\brain\\\\5986ac45-d17f-4ac2-adae-ff8b38a8e49a\\\\kelas_validity.png';
            await element.screenshot({ path: dest });
            console.log(`Screenshot saved to ${dest}`);
        } else {
            console.log('Element not found');
        }
        
        await browser.close();
    } catch(e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
