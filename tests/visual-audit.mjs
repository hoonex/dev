import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:4173/';
const viewports = [
  { name:'phone-portrait', width:390, height:844 },
  { name:'phone-landscape', width:844, height:390 },
  { name:'tablet-portrait', width:768, height:1024 },
  { name:'tablet-landscape', width:1024, height:768 },
  { name:'desktop', width:1366, height:768 },
  { name:'desktop-wide', width:1920, height:1080 },
];
const failures=[]; const report=[]; const fail=(kind,detail)=>failures.push({kind,detail});
await fs.mkdir('audit-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});

// Scope + schema + tutor-home contract.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'});
  const schema=await page.evaluate(()=>(window.LEARNING_TRACKS||[]).map(t=>({id:t.id,range:t.range||'',units:(t.units||[]).map(u=>({id:u.id,lessons:(u.lesson||[]).map((l,i)=>({i,choices:l.check?.choices?.length,answer:l.check?.answer,body:l.body||''}))}))})));
  const byId=Object.fromEntries(schema.map(t=>[t.id,t]));
  const required={physics:['p-vector','p-projectile','p-circle','p-gravity','p-escape','p-relativity'],chemistry:['c-gas','c-mixture','c-liquid','c-solid','c-enthalpy','c-hess','c-spontaneous']};
  if(!byId.physics?.range.includes('p.10~97')) fail('scope-range','physics');
  if(!byId.chemistry?.range.includes('p.10~71')||!byId.chemistry?.range.includes('p.108~151')) fail('scope-range','chemistry');
  for(const [trackId,ids] of Object.entries(required)){const actual=new Set((byId[trackId]?.units||[]).map(u=>u.id));for(const id of ids)if(!actual.has(id))fail('scope-unit-missing',`${trackId}/${id}`);}
  for(const t of schema)for(const u of t.units)for(const l of u.lessons){if(l.choices!==4||!Number.isInteger(l.answer)||l.answer<0||l.answer>3)fail('check-schema',`${t.id}/${u.id}/${l.i}`);if(l.body.length<45)fail('explanation-too-short',`${t.id}/${u.id}/${l.i}`);}
  const home=await page.evaluate(()=>({hero:document.querySelector('.hero-main h1')?.innerText||'',recovery:Boolean(document.querySelector('.recovery-card')),continue:Boolean(document.querySelector('#continueStudy')),reset:Boolean(document.querySelector('#resetStudy')),progress:Boolean(document.querySelector('#bar'))}));
  if(!home.hero.includes('처음부터 이해'))fail('tutor-home-copy',home.hero); if(!home.recovery||!home.continue||!home.reset||!home.progress)fail('home-study-controls',home);
  await context.close();
}

for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:'networkidle'}); await page.waitForSelector('.unit-card');
  for(const track of ['physics','chemistry']){
    await page.locator(`[data-track="${track}"]`).click(); await page.waitForTimeout(60);
    const homeMetrics=await page.evaluate(()=>{const vw=document.documentElement.clientWidth;const els=[...document.querySelectorAll('.hero,.overview,.unit-card,.tab,.tool-link,.ghost')];return {overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),units:document.querySelectorAll('.unit-card').length};});
    if(homeMetrics.overflow>2||homeMetrics.clipped)fail('home-layout',{vp:vp.name,track,homeMetrics}); if(!homeMetrics.units)fail('unit-render',{vp:vp.name,track});
    await page.locator('.unit-card:not(.locked)').first().click(); await page.waitForSelector('.lesson-card');
    const lessonMetrics=await page.evaluate(()=>{const vw=document.documentElement.clientWidth;const els=[...document.querySelectorAll('.lesson-card,.learn-block,.visual,.choice,.btn,.recall-card,.rescue-toggle')];return {overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),blocks:document.querySelectorAll('.learn-block').length,choices:document.querySelectorAll('.choice').length,rule:document.querySelector('.study-rule')?.innerText||'',recall:Boolean(document.querySelector('.recall-card')),rescue:Boolean(document.querySelector('.rescue-toggle'))};});
    if(lessonMetrics.overflow>2||lessonMetrics.clipped)fail('lesson-layout',{vp:vp.name,track,lessonMetrics}); if(lessonMetrics.blocks<6)fail('lesson-depth',{vp:vp.name,track,blocks:lessonMetrics.blocks}); if(lessonMetrics.choices!==4)fail('choice-render',{vp:vp.name,track}); if(!lessonMetrics.recall||!lessonMetrics.rescue)fail('learning-aids',{vp:vp.name,track}); if(track==='physics'&&!lessonMetrics.rule.includes('그림'))fail('physics-habit',lessonMetrics.rule); if(track==='chemistry'&&!lessonMetrics.rule.includes('조건'))fail('chemistry-habit',lessonMetrics.rule);
    await page.locator('.rescue-toggle').click(); if(!(await page.locator('#rescue').getAttribute('class'))?.includes('show'))fail('manual-rescue',{vp:vp.name,track});
    await page.screenshot({path:`audit-artifacts/${vp.name}-${track}-lesson.png`,fullPage:true}); await page.locator('#back').click();
  }
  await context.close();
}

// Wrong -> rescue + mistake record -> retry -> exactly one step -> persistence.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:'networkidle'}); await page.locator('[data-track="physics"]').click();
  const units=page.locator('.unit-card'); if(!(await units.nth(1).getAttribute('class'))?.includes('locked'))fail('initial-lock','second physics unit should start locked'); await units.first().click();
  const answer=await page.evaluate(()=>window.LEARNING_TRACKS[0].units[0].lesson[0].check.answer); const wrong=(answer+1)%4;
  await page.locator(`[data-c="${wrong}"]`).click(); await page.locator('#grade').click(); await page.waitForTimeout(60);
  const afterWrong=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0); const mistakes=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.mistakes?.[0]||0);
  if(afterWrong!==0)fail('wrong-advanced',afterWrong); if(mistakes!==1)fail('mistake-record',mistakes); if(!(await page.locator('#rescue').getAttribute('class'))?.includes('show'))fail('wrong-rescue','not opened'); if(!(await page.locator('#feedback').innerText()).includes('다른 방식'))fail('wrong-feedback',await page.locator('#feedback').innerText());
  await page.locator(`[data-c="${answer}"]`).click(); await page.locator('#grade').click(); await page.waitForTimeout(60);
  const afterCorrect=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0); if(afterCorrect!==1)fail('correct-progress',afterCorrect); if(!(await page.locator('#grade').innerText()).includes('다음'))fail('continue-copy',await page.locator('#grade').innerText());
  await page.reload({waitUntil:'networkidle'}); const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0); if(persisted!==1)fail('progress-persistence',persisted);
  await page.screenshot({path:'audit-artifacts/functional-tutor-flow.png',fullPage:true}); await context.close();
}

// Daily drill schema remains valid; test sets do not count as formal progress.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(new URL('drill.html',baseURL).href,{waitUntil:'networkidle'}); await page.waitForSelector('.qcard');
  const schema=await page.evaluate(()=>({sets:(window.QUIZ_SETS||[]).map(s=>({id:s.id,test:!!s.test,questions:(s.questions||[]).map((q,i)=>({i,choices:q.choices?.length,answer:q.answer,rem:(q.remediation||[]).map((r,j)=>({j,choices:r.choices?.length,answer:r.answer}))}))}))}));
  for(const s of schema.sets){for(const q of s.questions){if(q.choices!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)fail('daily-main-schema',{set:s.id,q:q.i});if(q.rem.length!==2)fail('daily-remediation-count',{set:s.id,q:q.i,count:q.rem.length});for(const r of q.rem)if(r.choices!==4||!Number.isInteger(r.answer)||r.answer<0||r.answer>3)fail('daily-remediation-schema',{set:s.id,q:q.i,r:r.j});}}
  const testSet=schema.sets.find(s=>s.test); if(!testSet)fail('test-set-missing','9/1 test set should remain'); await context.close();
}

await browser.close(); await fs.writeFile('audit-artifacts/report.json',JSON.stringify({report,failures},null,2)); console.log(JSON.stringify({failures:failures.length,failuresDetail:failures},null,2)); if(failures.length)process.exitCode=1;
