const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('http://127.0.0.1:5500/frontend/admin.html');
    await page.waitForTimeout(2000);
    
    // Login
    const nameInput = await page.$('#login-username');
    if (nameInput) {
        await page.type('#login-username', 'admin');
        await page.type('#login-pass', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
    }
    
    // Click Peta Pemetaan
    const navItems = await page.$$('.nav-item[data-page="pemetaan"]');
    if (navItems.length > 0) {
        await navItems[0].click();
        await page.waitForTimeout(2000);
        console.log("Clicked Peta Kerawanan Siswa");
    } else {
        console.log("nav item not found");
    }
    
    await browser.close();
})();
