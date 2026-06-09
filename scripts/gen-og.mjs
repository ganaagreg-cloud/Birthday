/* Generate the 1200×630 social share image (Open Graph / Twitter card).
 * Renders a palette-matched card with Playwright and writes public/og-image.png.
 * Run: node scripts/gen-og.mjs  (no dev server needed) */
import { chromium } from 'playwright';

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400&display=swap&subset=cyrillic,cyrillic-ext,latin" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 24px; text-align: center;
    font-family: 'Inter', sans-serif;
    background:
      radial-gradient(120% 90% at 50% 18%, rgba(156,107,116,0.45) 0%, rgba(42,26,31,0) 55%),
      radial-gradient(140% 120% at 50% 110%, rgba(217,178,124,0.18) 0%, rgba(42,26,31,0) 55%),
      linear-gradient(160deg, #2a1a1f 0%, #160d10 100%);
    position: relative; overflow: hidden;
  }
  .heart { font-size: 84px; filter: drop-shadow(0 8px 28px rgba(217,178,124,0.55)); }
  h1 {
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 78px; line-height: 1.05; letter-spacing: -0.01em;
    background: linear-gradient(110deg, #f5ece2 20%, #f0cf9a 50%, #f5ece2 80%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    max-width: 980px;
  }
  p { color: #c79aa1; font-weight: 300; font-size: 32px; letter-spacing: 0.04em; }
  .dot { position: absolute; border-radius: 50%; background: rgba(217,178,124,0.5); }
</style></head>
<body>
  <div class="heart">💌</div>
  <h1>Төрсөн өдрийн мэнд хүргэе</h1>
  <p>Чамд зориулсан захидал</p>
  <script>
    // a few ambient gold specks for warmth
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('div'); d.className = 'dot';
      const s = Math.random() * 4 + 1.5;
      d.style.width = d.style.height = s + 'px';
      d.style.left = Math.random() * 1200 + 'px';
      d.style.top = Math.random() * 630 + 'px';
      d.style.opacity = (Math.random() * 0.5 + 0.2).toFixed(2);
      document.body.appendChild(d);
    }
  </script>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('saved public/og-image.png (1200×630)');
