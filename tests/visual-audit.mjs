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
const fail = (kind, detail) => failures.push({ kind, detail });

// Data contract: bad generated quiz data must fail before deployment.
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

// Layout audit across target viewports.
for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#history');
  const options = await page.locator('#history option').evaluateAll(opts => opts.map(o => ({ value: o.value, text: o.textContent || '' })));
  for (const target of [{ key:'chem', match:'물질과 에너지' },{ key:'physics', match:'역학과 에너지' }]) {
    const found = options.find(o => o.text.includes(target.match));
    if (!found) { fail('missing-set', `${vp.name}: ${target.match}`); continue; }
    await page.selectOption('#history', found.value);
    await page.waitForTimeout(180);
    const metrics = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const visuals = [...document.querySelectorAll('.visual')].map((el, i) => {
        const r = el.getBoundingClientRect();
        const svg = el.querySelector('svg');
        const sr = svg?.getBoundingClientRect();
        return {i,left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,svgWidth:sr?Math.round(sr.width):null,svgHeight:sr?Math.round(sr.height):null,clippedX:r.left < -1 || r.right > vw + 1,internalOverflowX:el.scrollWidth > el.clientWidth + 2};
      });
      const choices = [...document.querySelectorAll('.choice')].map(el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width}; });
      const hero = document.querySelector('.hero')?.getBoundingClientRect();
      return {viewportWidth:vw,bodyOverflow:document.documentElement.scrollWidth-vw,visualCount:visuals.length,visuals,choiceOverflow:choices.some(r=>r.left < -1 || r.right > vw + 1),heroHeight:hero?Math.round(hero.height):null};
    });
    report.push({ viewport: vp, set: target.key, metrics });
    if (metrics.bodyOverflow > 2 || metrics.choiceOverflow || metrics.visuals.some(v=>v.clippedX)) fail('layout',{viewport:vp.name,set:target.key,metrics});
    if (metrics.heroHeight && metrics.heroHeight > 150) fail('hero-size',`${vp.name}: hero ${metrics.heroHeight}px`);
    await page.screenshot({ path:`audit-artifacts/${vp.name}-${target.key}-full.png`, fullPage:true });
  }
  await context.close();
}

// Functional mastery audit.
// 1) unanswered main questions cannot be graded
// 2) every wrong main question creates exactly two similar questions
// 3) after a partial retry result, already-correct retry questions stay passed
// 4) only missed retry questions return
// 5) solving the final missed retry marks the set complete.
{
  const context = await browser.newContext({ viewport: { width:390, height:844 }, deviceScaleFactor:1 });
  const page = await context.newPage();
  for (const target of [{key:'chem',match:'물질과 에너지'},{key:'physics',match:'역학과 에너지'}]) {
    await page.goto(baseURL, { waitUntil:'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil:'networkidle' });
    await page.waitForSelector('#history');
    const opts = await page.locator('#history option').evaluateAll(os => os.map(o => ({ value:o.value,text:o.textContent||'' })));
    const found = opts.find(o => o.text.includes(target.match));
    if (!found) { fail('functional-missing-set',target.match); continue; }
    await page.selectOption('#history',found.value);
    await page.waitForTimeout(120);

    // Empty submit must not create false wrong answers.
    await page.locator('#submit').click();
    await page.waitForTimeout(80);
    if (await page.locator('.answer.show').count()) fail('unanswered-main',`${target.key}: unanswered main was graded`);

    const data = await page.evaluate(() => {
      const text = document.querySelector('#history option:checked')?.textContent || '';
      const subject = text.includes('물질과 에너지') ? '물질과 에너지' : '역학과 에너지';
      const s = (window.QUIZ_SETS || []).find(x => x.subject === subject);
      return {id:s?.id || s?.date, answers:(s?.questions||[]).map(q=>q.answer), retries:(s?.questions||[]).flatMap((q,qi)=>(q.remediation||[]).map((r,ri)=>({id:`${qi}:${ri}`,answer:r.answer})))};
    });

    for (let i=0;i<data.answers.length;i++) await page.locator(`[data-q="${i}"][data-c="${(data.answers[i]+1)%4}"]`).click();
    await page.locator('#submit').click();
    await page.waitForTimeout(180);
    const expected = data.answers.length * 2;
    const retryCount = await page.locator('#remediation .rq').count();
    if (retryCount !== expected) fail('retry-flow',`${target.key}: expected ${expected}, got ${retryCount}`);
    const retryText = await page.locator('#remediation').innerText();
    if (!retryText.includes('틀린 문제 다시 연습') || retryText.includes('오답 보강')) fail('retry-copy',`${target.key}: unclear legacy retry copy remains`);

    // Make exactly one retry wrong and all others correct.
    const deliberatelyWrong = data.retries[0];
    for (const r of data.retries) {
      const pick = r.id === deliberatelyWrong.id ? (r.answer+1)%4 : r.answer;
      await page.locator(`[data-r="${r.id}"][data-c="${pick}"]`).click();
    }
    await page.locator('#remSubmit').click();
    await page.waitForTimeout(120);
    const partialText = await page.locator('#remResult').innerText();
    const retryButton = await page.locator('#remSubmit').innerText();
    if (!partialText.includes('남은 1개') || !partialText.includes('이미 맞힌 문제는 다시 안 풀어')) fail('partial-retry-copy',`${target.key}: ${partialText}`);
    if (!retryButton.includes('틀린 1문제 다시 풀기')) fail('partial-retry-button',`${target.key}: ${retryButton}`);

    await page.locator('#remSubmit').click();
    await page.waitForTimeout(120);
    const remainingCards = await page.locator('#remediation .rq').count();
    const passedCards = await page.locator('#remediation .retry-passed').count();
    if (remainingCards !== 1) fail('retry-only-missed-returns',`${target.key}: remaining=${remainingCards}`);
    if (passedCards !== expected-1) fail('retry-passed-preserved',`${target.key}: passed=${passedCards}, expected=${expected-1}`);

    await page.locator(`[data-r="${deliberatelyWrong.id}"][data-c="${deliberatelyWrong.answer}"]`).click();
    await page.locator('#remSubmit').click();
    await page.waitForTimeout(800);
    const completed = await page.evaluate((id) => {
      const raw = localStorage.getItem(`science-drill:${id}`);
      try { return Boolean(JSON.parse(raw || 'null')?.remediationDone); } catch { return false; }
    }, data.id);
    if (!completed) fail('retry-completion',`${target.key}: remediationDone false after final correct answer`);
    await page.screenshot({path:`audit-artifacts/functional-${target.key}-mastery.png`,fullPage:true});
  }
  await context.close();
}

await browser.close();
await fs.writeFile('audit-artifacts/report.json',JSON.stringify({report,failures},null,2));
console.log(JSON.stringify({audited:report.length,failures:failures.length,failuresDetail:failures},null,2));
if (failures.length) process.exitCode = 1;
