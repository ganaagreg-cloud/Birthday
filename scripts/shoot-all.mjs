/* Drive the live site through every scene and screenshot each (design audit). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'http://localhost:3003/';
const OUT = 'design-shots';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 820 },
  { name: 'mobile', width: 390, height: 844 },
];

const wait = (p, ms) => p.waitForTimeout(ms);
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const tag = vp.name;
  const shot = (n) => `${OUT}/${tag}-${n}.png`;

  // ---- Pass A: linear flow (gate → envelope → letter → gallery → finale) ----
  let page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('pageerror', (e) => console.log(`  [${tag} pageerror]`, e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await wait(page, 600);
  await page.screenshot({ path: shot('1-gate') });

  await page.click('button[data-action="silent"]');
  await wait(page, 1200);
  await page.screenshot({ path: shot('2-envelope-sealed') });

  await page.click('[data-seal]');
  await wait(page, 1800);
  await page.screenshot({ path: shot('3-envelope-open') });

  await page.click('[data-open]');
  await wait(page, 1400);
  // fast-forward the line-by-line reveal by clicking the letter paper
  await page.evaluate(() => document.querySelector('[data-paper]')?.click());
  await wait(page, 900);
  await page.screenshot({ path: shot('4-letter') });

  await page.click('[data-next]');
  await wait(page, 1600);
  await page.screenshot({ path: shot('5-gallery') });
  // flip the active polaroid to show the back state
  await page.evaluate(() => document.querySelector('.polaroid')?.click());
  await wait(page, 900);
  await page.screenshot({ path: shot('5b-gallery-flip') });

  await page.click('[data-finish]');
  await wait(page, 2200);
  await page.screenshot({ path: shot('6-finale') });
  await page.close();

  // ---- Pass B: cake branch (envelope → letter → cake) ----
  page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('pageerror', (e) => console.log(`  [${tag} pageerror]`, e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.click('button[data-action="silent"]');
  await wait(page, 1000);
  await page.click('[data-seal]');
  await wait(page, 1600);
  await page.click('[data-open]');
  await wait(page, 1200);
  await page.click('[data-cake]');
  await wait(page, 3200);
  await page.screenshot({ path: shot('7-cake') });
  await page.evaluate(() => document.querySelector('[data-card]')?.click());
  await wait(page, 2200);
  await page.screenshot({ path: shot('8-cake-note') });
  await page.close();

  console.log(`done: ${tag}`);
}

await browser.close();
console.log('all screenshots saved to', OUT);
