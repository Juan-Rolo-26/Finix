const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('BROWSER LOG:', msg.type(), msg.text());
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message, error.stack);
    });

    try {
        await page.goto('http://localhost:5173/portfolio');
        await page.waitForTimeout(5000);
        const html = await page.content();
        console.log('HTML length:', html.length);
    } catch (e) {
        console.log('Exception:', e.message);
    }
    await browser.close();
})();
