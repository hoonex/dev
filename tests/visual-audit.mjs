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

// Learning data + confirmed school-scope contract.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  const schema = await page.evaluate(() => (window.LEARNING_TRACKS || []).map(t => ({
    id:t.id,
    range:t.range || '',
    units:(t.units||[]).map(u => ({id:u.id,lessons:(u.lesson||[]).map((l,i)=>({i,choices:l.check?.choices?.length,answer:l.check?.answer,body:l.body||''}))}))
  })));
  if (schema.length < 2) fail('learning-data','expected physics and chemistry tracks');
  const byId = Object.fromEntries(schema.map(t => [t.id, t]));
  const required = {
    physics:['p-vector','p-projectile','p-circle','p-gravity','p-escape','p-relativity'],
    chemistry:['c-gas','c-mixture','c-liquid','c-solid','c-enthalpy','c-hess','c-spontaneous']
  };
  if (!byId.physics?.range.includes('p.10~97')) fail('scope-range','physics must show official p.10~97');
  if (!byId.chemistry?.range.includes('p.10~71') || !byId.chemistry?.range.includes('p.108~151')) fail('scope-range','chemistry must show official p.10~71, p.108~151');
  for (const [trackId, ids] of Object.entries(required)) {
    const actual = new Set((byId[trackId]?.units || []).map(u => u.id));
    for (const id of ids) if (!actual.has(id)) fail('scope-unit-missing',`${trackId}/${id}`);
  }
  for (const t of schema) for (const u of t.units) {
    if (!u.lessons.length) fail('empty-unit',`${t.id}/${u.id}`);
    for (const l of u.lessons) {
      if (l.choices !== 4 || !Number.isInteger(l.answer) || l.answer < 0 || l.answer > 3) fail('check-schema',`${t.id}/${u.id}/${l.i}`);
      if (l.body.length < 45) fail('explanation-too-short',`${t.id}/${u.id}/${l.i}`);
    }
  }
  await context.close();
}

// Legacy generated practice data must remain available.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(new URL('quiz-data.js', baseURL).href);
  const text = await page.locator('body').innerText().catch(()=> '');
  if (!text.includes('window.QUIZ_SETS')) fail('legacy-data','quiz-data.js missing or unreadable');
  await context.close();
}

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.unit');

  for (const track of ['physics','chemistry']) {
    await page.locator(`[data-track="${track}"]`).click();
    await page.waitForTimeout(80);
    const metrics = await page.evaluate(() => {
      const vw=document.documentElement.clientWidth;
      const boxes=[...document.querySelectorAll('.hero,.unit,.tab')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right}});
      return {overflow:document.documentElement.scrollWidth-vw,clipped:boxes.some(r=>r.left < -1 || r.right > vw+1),units:document.querySelectorAll('.unit').length};
    });
    report.push({viewport:vp.name,track,metrics});
    if (metrics.overflow > 2 || metrics.clipped) fail('home-layout',{viewport:vp.name,track,metrics});
    if (!metrics.units) fail('unit-missing',`${vp.name}/${track}`);

    await page.locator('.unit:not(.locked)').first().click();
    await page.waitForSelector('.lesson-card');
    const lessonMetrics=await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth;
      const els=[...document.querySelectorAll('.lesson-card,.visual,.choice,.btn')];
      return {overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left < -1 || r.right > vw+1}),choiceCount:document.querySelectorAll('.choice').length};
    });
    if (lessonMetrics.overflow > 2 || lessonMetrics.clipped) fail('lesson-layout',{viewport:vp.name,track,lessonMetrics});
    if (lessonMetrics.choiceCount !== 4) fail('choice-render',`${vp.name}/${track}: ${lessonMetrics.choiceCount}`);
    await page.screenshot({path:`audit-artifacts/${vp.name}-${track}-lesson.png`,fullPage:true});
    await page.locator('#back').click();
  }
  await context.close();
}

// Wrong -> retry -> correct must advance exactly one concept and persist.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil:'networkidle' });
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-track="physics"]').click();
  const units=page.locator('.unit');
  if (!(await units.nth(1).getAttribute('class'))?.includes('locked')) fail('initial-lock','second physics unit should start locked');
  await units.first().click();
  const answer=await page.evaluate(()=>window.LEARNING_TRACKS[0].units[0].lesson[0].check.answer);
  const wrong=(answer+1)%4;
  await page.locator(`[data-c="${wrong}"]`).click();
  await page.locator('#grade').click();
  await page.waitForTimeout(80);
  const afterWrong=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v1')||'{}')['physics:p-vector']?.doneSteps||0);
  if (afterWrong !== 0) fail('wrong-advanced',`doneSteps=${afterWrong}`);
  if (!(await page.locator('#feedback').innerText()).includes('설명')) fail('wrong-feedback','retry feedback should direct learner back to explanation');
  await page.locator(`[data-c="${answer}"]`).click();
  await page.locator('#grade').click();
  await page.waitForTimeout(80);
  const afterCorrect=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v1')||'{}')['physics:p-vector']?.doneSteps||0);
  if (afterCorrect !== 1) fail('correct-progress',`expected 1, got ${afterCorrect}`);
  if (!(await page.locator('#grade').innerText()).includes('다음')) fail('continue-copy',await page.locator('#grade').innerText());
  await page.reload({waitUntil:'networkidle'});
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v1')||'{}')['physics:p-vector']?.doneSteps||0);
  if (persisted !== 1) fail('progress-persistence',`expected 1, got ${persisted}`);
  await page.screenshot({path:'audit-artifacts/functional-guided-learning.png',fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile('audit-artifacts/report.json',JSON.stringify({report,failures},null,2));
console.log(JSON.stringify({audited:report.length,failures:failures.length,failuresDetail:failures},null,2));
if(failures.length) process.exitCode=1;
