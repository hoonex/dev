import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:4173/';
const viewports = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'desktop-wide', width: 1920, height: 1080 },
];

await fs.mkdir('audit-artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#history');

  const options = await page.locator('#history option').evaluateAll(opts => opts.map(o => ({ value: o.value, text: o.textContent || '' })));
  const targets = [
    { key: 'chem', match: '물질과 에너지' },
    { key: 'physics', match: '역학과 에너지' },
  ];

  for (const target of targets) {
    const found = options.find(o => o.text.includes(target.match));
    if (!found) continue;
    await page.selectOption('#history', found.value);
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bodyOverflow = document.documentElement.scrollWidth - vw;
      const visuals = [...document.querySelectorAll('.visual')].map((el, i) => {
        const r = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        const sr = svg?.getBoundingClientRect();
        return {
          i,
          left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
          svgWidth: sr ? Math.round(sr.width) : null,
          svgHeight: sr ? Math.round(sr.height) : null,
          clippedX: r.left < -1 || r.right > vw + 1,
          internalOverflowX: el.scrollWidth > el.clientWidth + 2,
        };
      });
      const choices = [...document.querySelectorAll('.choice')].map(el => {
        const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, width:r.width };
      });
      return {
        viewportWidth: vw,
        bodyOverflow,
        visualCount: visuals.length,
        visuals,
        choiceOverflow: choices.some(r => r.left < -1 || r.right > vw + 1),
      };
    });

    report.push({ viewport: vp, set: target.key, metrics });
    await page.screenshot({ path: `audit-artifacts/${vp.name}-${target.key}-full.png`, fullPage: true });

    const visuals = page.locator('.visual');
    const count = await visuals.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await visuals.nth(i).screenshot({ path: `audit-artifacts/${vp.name}-${target.key}-visual-${i+1}.png` });
    }
  }
  await context.close();
}

await browser.close();
await fs.writeFile('audit-artifacts/report.json', JSON.stringify(report, null, 2));

const failures = report.filter(r => r.metrics.bodyOverflow > 2 || r.metrics.choiceOverflow || r.metrics.visuals.some(v => v.clippedX));
console.log(JSON.stringify({ audited: report.length, failures: failures.length, failuresDetail: failures }, null, 2));
if (failures.length) process.exitCode = 1;
