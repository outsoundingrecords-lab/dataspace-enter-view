const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('pageerror', err => logs.push('PAGEERROR: ' + err.toString()));
  page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // wait 3 seconds
  console.log("LOGS:", logs);
  await browser.close();
})();
