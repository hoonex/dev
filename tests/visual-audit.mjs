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
const required={physics:['p-vector','p-projectile','p-circle','p-gravity','p-escape','p-relativity'],chemistry:['c-gas','c-mixture','c-liquid','c-solid','c-enthalpy','c-hess','c-spontaneous']};

await fs.mkdir('audit-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[]; const report=[]; const fail=(kind,detail)=>failures.push({kind,detail});

// 1) Official learning scope + concept-check schema.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'});
  const schema=await page.evaluate(()=>(window.LEARNING_TRACKS||[]).map(t=>({id:t.id,range:t.range||'',units:(t.units||[]).map(u=>({id:u.id,lessons:(u.lesson||[]).map((l,i)=>({i,body:l.body||'',choices:l.check?.choices?.length,answer:l.check?.answer,prompt:l.check?.prompt||''}))}))})));
  const byId=Object.fromEntries(schema.map(t=>[t.id,t]));
  if(!byId.physics?.range.includes('p.10~97'))fail('scope-range','physics');
  if(!byId.chemistry?.range.includes('p.10~71')||!byId.chemistry?.range.includes('p.108~151'))fail('scope-range','chemistry');
  for(const [trackId,ids] of Object.entries(required)){const actual=new Set((byId[trackId]?.units||[]).map(u=>u.id));for(const id of ids)if(!actual.has(id))fail('scope-unit-missing',`${trackId}/${id}`);}
  for(const t of schema)for(const u of t.units)for(const l of u.lessons){if(l.choices!==4||!Number.isInteger(l.answer)||l.answer<0||l.answer>3)fail('check-schema',`${t.id}/${u.id}/${l.i}`);if(l.body.length<45)fail('explanation-too-short',`${t.id}/${u.id}/${l.i}`);if(!l.prompt.trim())fail('check-prompt-data-missing',`${t.id}/${u.id}/${l.i}`);}
  const problemLink=await page.locator('.tool-row .tool-link').getAttribute('href');
  if(problemLink!=='unit-practice.html')fail('home-practice-link',problemLink);
  await context.close();
}

// 2) Every unit has a valid learned-unit practice bank: 4 choices + exactly two remediations.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(new URL('unit-practice.html',baseURL).href,{waitUntil:'networkidle'});
  const schema=await page.evaluate(()=>Object.fromEntries(Object.entries(window.UNIT_PRACTICE_SETS||{}).map(([id,s])=>[id,{track:s.track,source:s.source||'',questions:(s.questions||[]).map((q,i)=>({i,choices:q.choices?.length,answer:q.answer,hasVisual:Boolean(q.visual),rem:(q.remediation||[]).map((r,j)=>({j,choices:r.choices?.length,answer:r.answer}))}))}])));
  for(const [trackId,ids] of Object.entries(required))for(const id of ids){
    const s=schema[id]; if(!s){fail('unit-practice-missing',id);continue;}
    if(s.track!==trackId)fail('unit-practice-track',{id,track:s.track});
    if(s.questions.length<3)fail('unit-practice-too-short',{id,count:s.questions.length});
    if(!s.questions.some(q=>q.hasVisual))fail('unit-practice-no-visual',id);
    if(trackId==='physics'&&!s.source.includes('원본 PDF는 확인되지'))fail('physics-source-honesty',id);
    if(trackId==='chemistry'&&!s.source.includes('2022 개정 2026판 완자'))fail('chemistry-source-note',id);
    for(const q of s.questions){if(q.choices!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)fail('unit-main-schema',{id,q:q.i});if(q.rem.length!==2)fail('unit-remediation-count',{id,q:q.i,count:q.rem.length});for(const r of q.rem)if(r.choices!==4||!Number.isInteger(r.answer)||r.answer<0||r.answer>3)fail('unit-remediation-schema',{id,q:q.i,r:r.j});}
  }
  await context.close();
}

// 3) Guided tutor remains visual-first and responsive on all six required viewports.
for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:'networkidle'}); await page.waitForSelector('.unit-card');
  for(const track of ['physics','chemistry']){
    await page.locator(`[data-track="${track}"]`).click(); await page.waitForTimeout(60);
    const homeMetrics=await page.evaluate(()=>{const vw=document.documentElement.clientWidth;const els=[...document.querySelectorAll('.hero,.overview,.unit-card,.tab,.tool-link,.ghost')];return{overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),units:document.querySelectorAll('.unit-card').length};});
    if(homeMetrics.overflow>2||homeMetrics.clipped)fail('home-layout',{vp:vp.name,track,homeMetrics});if(!homeMetrics.units)fail('unit-render',{vp:vp.name,track});
    await page.locator('.unit-card:not(.locked)').first().click(); await page.waitForSelector('.lesson-card');
    const expectedPrompt=await page.evaluate(trackId=>{const t=(window.LEARNING_TRACKS||[]).find(x=>x.id===trackId);return t?.units?.[0]?.lesson?.[0]?.check?.prompt||'';},track);
    const m=await page.evaluate(()=>{const vw=document.documentElement.clientWidth,els=[...document.querySelectorAll('.lesson-card,.concept-hero,.concept-scene,.concept-copy,.idea-card,.learn-detail,.trap-card,.recall-card,.check,.question-prompt,.choice,.btn,.rescue-toggle')];return{overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),choices:document.querySelectorAll('.choice').length,indices:document.querySelectorAll('.choice-index').length,scene:Boolean(document.querySelector('.concept-scene svg')),copy:Boolean(document.querySelector('.concept-copy')),ideas:document.querySelectorAll('.idea-card').length,details:document.querySelectorAll('.learn-detail').length,openDetails:document.querySelectorAll('.learn-detail[open]').length,prompt:document.querySelector('.question-prompt')?.innerText?.trim()||'',recall:document.querySelector('.recall-question')?.innerText?.trim()||'',habit:document.querySelector('.study-rule')?.textContent||''};});
    report.push({viewport:vp.name,track,lesson:m});
    if(m.overflow>2||m.clipped)fail('lesson-layout',{vp:vp.name,track,m});if(m.choices!==4||m.indices!==4)fail('choice-render',{vp:vp.name,track,m});if(!m.scene||!m.copy)fail('visual-first-missing',{vp:vp.name,track});if(m.ideas<2)fail('explanation-cards',{vp:vp.name,track});if(m.details<2||m.openDetails!==0)fail('collapsed-details',{vp:vp.name,track,m});if(m.prompt!==expectedPrompt)fail('visible-check-prompt',{vp:vp.name,track,expectedPrompt,actual:m.prompt});if(!m.recall.includes(expectedPrompt))fail('recall-mismatch',{vp:vp.name,track});if(track==='physics'&&!m.habit.includes('그림'))fail('physics-habit',m.habit);if(track==='chemistry'&&!m.habit.includes('조건'))fail('chemistry-habit',m.habit);
    await page.screenshot({path:`audit-artifacts/${vp.name}-${track}-lesson.png`,fullPage:true}); await page.locator('#back').click();
  }
  await context.close();
}

// 4) With zero progress, unit practice and full-range drill must be locked.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>localStorage.clear());
  await page.goto(new URL('unit-practice.html',baseURL).href,{waitUntil:'networkidle'});
  const list=await page.evaluate(()=>({open:document.querySelectorAll('.unit:not(.locked) a').length,locked:document.querySelectorAll('.unit.locked').length,text:document.body.innerText}));
  if(list.open!==0||!list.locked)fail('practice-unlearned-unlocked',list);
  await page.goto(new URL('unit-practice.html?unit=p-vector',baseURL).href,{waitUntil:'networkidle'});
  if(!(await page.locator('.notice').innerText()).includes('잠겨'))fail('direct-unit-practice-bypass',await page.locator('body').innerText());
  await page.goto(new URL('drill.html?set=2026-09-08',baseURL).href,{waitUntil:'networkidle'});
  const drillLock=await page.locator('.notice').innerText(); if(!drillLock.includes('전범위 실전은 아직 잠겨'))fail('full-drill-unlearned-unlocked',drillLock);if(await page.locator('.qcard').count())fail('full-drill-qcards-visible',await page.locator('.qcard').count());
  await page.screenshot({path:'audit-artifacts/full-drill-locked.png',fullPage:true}); await context.close();
}

// 5) Complete first unit concepts: its practice opens, but the next unit remains locked until practice remediation is completed.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>{
    localStorage.clear(); const t=window.LEARNING_TRACKS.find(x=>x.id==='physics'),u=t.units[0]; localStorage.setItem('science-step-progress-v2',JSON.stringify({'physics:p-vector':{doneSteps:u.lesson.length}}));
  }); await page.reload({waitUntil:'networkidle'}); await page.locator('[data-track="physics"]').click(); await page.waitForTimeout(100);
  const gate=await page.evaluate(()=>({first:document.querySelectorAll('.unit-card')[0]?.innerText||'',secondClass:document.querySelectorAll('.unit-card')[1]?.className||'',secondText:document.querySelectorAll('.unit-card')[1]?.innerText||'',continueLabel:document.querySelector('#continueLabel')?.innerText||''}));
  if(!gate.first.includes('문제 풀이 필요'))fail('practice-required-badge',gate);if(!gate.secondClass.includes('practice-locked')||!gate.secondClass.includes('locked'))fail('next-unit-not-practice-locked',gate);if(!gate.continueLabel.includes('단원 문제 필요'))fail('continue-not-practice-first',gate);

  await page.goto(new URL('unit-practice.html?unit=p-vector',baseURL).href,{waitUntil:'networkidle'}); await page.waitForSelector('.qcard');
  if(await page.locator('.qcard').count()!==3)fail('unit-practice-main-count',await page.locator('.qcard').count());
  const mainAnswers=await page.evaluate(()=>window.UNIT_PRACTICE_SETS['p-vector'].questions.map(q=>q.answer));
  for(let i=0;i<mainAnswers.length;i++){const choice=i===0?(mainAnswers[i]+1)%4:mainAnswers[i];await page.locator(`[data-main="${i}"][data-choice="${choice}"]`).click();}
  await page.locator('#gradeMain').click(); await page.waitForTimeout(100);
  const pendingRem=await page.locator('[data-rem-card]').count(); if(pendingRem!==2)fail('unit-remediation-not-two',pendingRem);
  const completedAfterWrong=await page.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('science-unit-practice-v1:p-vector')||'{}').completed)); if(completedAfterWrong)fail('unit-completed-before-remediation',true);
  const remAnswers=await page.evaluate(()=>window.UNIT_PRACTICE_SETS['p-vector'].questions[0].remediation.map((r,ri)=>({id:`0:${ri}`,answer:r.answer})));
  for(const x of remAnswers)await page.locator(`[data-rem="${x.id}"][data-choice="${x.answer}"]`).click();
  await page.locator('#gradeRem').click(); await page.waitForTimeout(100);
  const completed=await page.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('science-unit-practice-v1:p-vector')||'{}').completed)); if(!completed)fail('unit-practice-not-completed',false);
  await page.screenshot({path:'audit-artifacts/unit-practice-completed.png',fullPage:true});

  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.locator('[data-track="physics"]').click(); await page.waitForTimeout(120);
  const second=await page.locator('.unit-card').nth(1).getAttribute('class'); if(second?.includes('locked'))fail('next-unit-still-locked-after-practice',second);
  await context.close();
}

// 6) Unit practice layout is usable on all six viewports when the first unit has been learned.
for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>{localStorage.clear();const t=window.LEARNING_TRACKS.find(x=>x.id==='physics'),u=t.units[0];localStorage.setItem('science-step-progress-v2',JSON.stringify({'physics:p-vector':{doneSteps:u.lesson.length}}));});
  await page.goto(new URL('unit-practice.html?unit=p-vector',baseURL).href,{waitUntil:'networkidle'}); await page.waitForSelector('.qcard');
  const m=await page.evaluate(()=>{const vw=document.documentElement.clientWidth,els=[...document.querySelectorAll('.hero,.qcard,.visual,.choice,.primary')];return{overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),questions:document.querySelectorAll('.qcard').length,visuals:document.querySelectorAll('.qcard .visual').length};});
  if(m.overflow>2||m.clipped)fail('unit-practice-layout',{vp:vp.name,m});if(m.questions!==3)fail('unit-practice-render',{vp:vp.name,m});if(m.visuals<2)fail('unit-practice-visual-density',{vp:vp.name,m});
  if(['phone-portrait','tablet-portrait','desktop'].includes(vp.name))await page.screenshot({path:`audit-artifacts/${vp.name}-unit-practice.png`,fullPage:true});
  await context.close();
}

// 7) Full-range drill becomes available only after every official unit concept + unit practice is complete; legacy schema stays valid.
{
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'}); await page.evaluate(()=>{
    const learning={}; for(const t of window.LEARNING_TRACKS||[])for(const u of t.units||[]){learning[`${t.id}:${u.id}`]={doneSteps:u.lesson.length};localStorage.setItem(`science-unit-practice-v1:${u.id}`,JSON.stringify({completed:true}));} localStorage.setItem('science-step-progress-v2',JSON.stringify(learning));
  });
  await page.goto(new URL('drill.html?set=2026-09-08',baseURL).href,{waitUntil:'networkidle'}); await page.waitForSelector('.qcard');
  const schema=await page.evaluate(()=>({sets:(window.QUIZ_SETS||[]).map(s=>({id:s.id,test:!!s.test,questions:(s.questions||[]).map((q,i)=>({i,choices:q.choices?.length,answer:q.answer,rem:(q.remediation||[]).map((r,j)=>({j,choices:r.choices?.length,answer:r.answer}))}))})),rendered:document.querySelectorAll('.qcard').length}));
  if(!schema.rendered)fail('full-drill-not-rendered-after-all-units',schema.rendered);
  for(const s of schema.sets)for(const q of s.questions){if(q.choices!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)fail('daily-main-schema',{set:s.id,q:q.i});if(q.rem.length!==2)fail('daily-remediation-count',{set:s.id,q:q.i,count:q.rem.length});for(const r of q.rem)if(r.choices!==4||!Number.isInteger(r.answer)||r.answer<0||r.answer>3)fail('daily-remediation-schema',{set:s.id,q:q.i,r:r.j});}
  if(!schema.sets.some(s=>s.test))fail('test-set-missing','9/1 test set');
  await page.screenshot({path:'audit-artifacts/full-drill-unlocked.png',fullPage:true}); await context.close();
}

await browser.close(); await fs.writeFile('audit-artifacts/report.json',JSON.stringify({report,failures},null,2)); console.log(JSON.stringify({failures:failures.length,failuresDetail:failures},null,2)); if(failures.length)process.exitCode=1;
