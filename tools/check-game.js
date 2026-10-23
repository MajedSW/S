// Opens a game in headless Chromium, presses its first button (Start / Launch / Play),
// flies around for a few seconds and reports script errors.
// usage: node tools/check-game.js my-game.html
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const file = path.resolve(process.argv[2] || 'my-game.html');
  const shot = path.join(os.tmpdir(), path.basename(file, '.html') + '-check.png');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('file://' + file);
  await page.waitForTimeout(2000);
  const start = page.locator('button:visible').first();
  if (await start.count()) await start.click().catch(() => {});
  for (let i = 0; i < 80; i++) {
    await page.mouse.move(195 + Math.sin(i / 6) * 140, 620);
    await page.waitForTimeout(50);
  }
  await page.screenshot({ path: shot });
  await browser.close();

  console.log('screenshot: ' + shot);
  if (errors.length) {
    console.log('ERRORS:\n' + errors.map(e => '  ' + e).join('\n'));
    process.exit(1);
  }
  console.log('OK: no errors');
})();
