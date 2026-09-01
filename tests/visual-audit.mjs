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
const failures = [];

function fail(kind, detail) { failures.push({ kind, detail }); }

// Data contract audit: a bad generated set must fail CI before deployment is considered healthy.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  const schema = await page.evaluate(() => (window.QUIZ_SETS || []).map((s, si) => ({
    id: s.id || s.date || `set-${si}`,
    questions: (s.questions || []).map((q, qi) => ({
      qi,
      choices: Array.isArray(q.choices) ? q.choices.length : 0,
      answer: q.answer,
      retries: Array.isArray(q.remediation) ? q.remediation.map((r, ri) => ({ri,choices:Array.isArray(r.choices)?r.choices.length:0,answer:r.answer})) : []
    }))
  })));
  for (const s of schema) for (const q of s.questions) {
    if (q.choices !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) fail('quiz-schema', `${s.id} Q${q.qi+1}: main choices/answer invalid`);
    if (q.retries.length !== 2) fail('retry-bank', `${s.id} Q${q.qi+1}: expected 2 retries, got ${q.retries.length}`);
    for (const r of q.retries) if (r.choices !== 4 || !Number.isInteger(r.answer) || r.answer < 0 || r.answer > 3) fail('retry-schema', `${s.id} Q${q.qi+1} R${r.ri+1}: choices/answer invalid`);
  }
  await context.close();
}

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
    if (!found) { fail('missing-set', `${vp.name}: ${target.match}`); continue; }
    await page.selectOption('#history', found.value);
    await page.waitForTimeout(200);

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
      const hero = document.querySelector('.hero')?.getBoundingClientRect();
      return {
        viewportWidth: vw,
        bodyOverflow,
        visualCount: visuals.length,
        visuals,
        choiceOverflow: choices.some(r => r.left < -1 || r.right > vw + 1),
        heroHeight: hero ? Math.round(hero.height) : null,
      };
    });

    report.push({ viewport: vp, set: target.key, metrics });
    if (metrics.bodyOverflow > 2 || metrics.choiceOverflow || metrics.visuals.some(v => v.clippedX)) fail('layout', {viewport:vp.name,set:target.key,metrics});
    if (metrics.heroHeight && metrics.heroHeight > 150) fail('hero-size', `${vp.name}: hero ${metrics.heroHeight}px`);

    await page.screenshot({ path: `audit-artifacts/${vp.name}-${target.key}-full.png`, fullPage: true });
    const visuals = page.locator('.visual');
    const count = await visuals.count();
    for (let i = 0; i < Math.min(count, 4); i++) await visuals.nth(i).screenshot({ path: `audit-artifacts/${vp.name}-${target.key}-visual-${i+1}.png` });
  }
  await context.close();
}

// Functional audit: intentionally miss every main question and require exactly two retry questions per miss.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#history');
  const options = await page.locator('#history option').evaluateAll(opts => opts.map(o => ({ value: o.value, text: o.textContent || '' })));
  for (const target of [{key:'chem',match:'물질과 에너지'},{key:'physics',match:'역학과 에너지'}]) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil:'networkidle' });
    await page.waitForSelector('#history');
    const opts = await page.locator('#history option').evaluateAll(os => os.map(o => ({ value:o.value,text:o.textContent||'' })));
    const found = opts.find(o => o.text.includes(target.match));
    if (!found) { fail('functional-missing-set', target.match); continue; }
    await page.selectOption('#history', found.value);
    await page.waitForTimeout(150);
    const answers = await page.evaluate(() => {
      const selectedText = document.querySelector('#history option:checked')?.textContent || '';
      const subject = selectedText.includes('물질과 에너지') ? '물질과 에너지' : '역학과 에너지';
      const s = (window.QUIZ_SETS || []).find(x => x.subject === subject);
      return (s?.questions || []).map(q => q.answer);
    });
    for (let i=0;i<answers.length;i++) {
      const wrong = (answers[i] + 1) % 4;
      await page.locator(`[data-q="${i}"][data-c="${wrong}"]`).click();
    }
    await page.locator('#submit').click();
    await page.waitForTimeout(250);
    const retryCount = await page.locator('#remediation .rq').count();
    const expected = answers.length * 2;
    const errorNotice = await page.locator('#remediation .notice').count();
    if (retryCount !== expected || errorNotice) fail('retry-flow', `${target.key}: expected ${expected}, got ${retryCount}, errorNotice=${errorNotice}`);
    await page.screenshot({ path:`audit-artifacts/functional-${target.key}-retries.png`, fullPage:true });
  }
  await context.close();
}

await browser.close();
await fs.writeFile('audit-artifacts/report.json', JSON.stringify({report,failures}, null, 2));
console.log(JSON.stringify({ audited: report.length, failures: failures.length, failuresDetail: failures }, null, 2));
if (failures.length) process.exitCode = 1;
