/* Drive the live site to the cake scene and screenshot it (debug tool). */
import { chromium } from 'playwright';

const URL = 'http://localhost:3003/';
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 820 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('pageerror', (e) => console.log(`  [${vp.name} pageerror]`, e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.click('button[data-action="silent"]');
  await page.waitForTimeout(900);
  await page.click('[data-seal]');
  await page.waitForTimeout(1600);
  await page.click('[data-open]');
  await page.waitForTimeout(1400);
  await page.click('[data-cake]');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: `cake-${vp.name}.png` });
  console.log(`saved cake-${vp.name}.png`);

  // open a memory envelope
  await page.evaluate(() => document.querySelector('[data-card]')?.click());
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `cake-${vp.name}-envelope.png` });
  console.log(`saved cake-${vp.name}-envelope.png`);

  await page.close();
}

await browser.close();
