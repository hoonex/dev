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

await fs.mkdir('audit-artifacts', { recursive:true });
const browser = await chromium.launch({ headless:true });
const failures=[];
const report=[];
const fail=(kind,detail)=>failures.push({kind,detail});

// 1) Learning data / official scope / schema contract.
{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'});
  const schema=await page.evaluate(()=>(window.LEARNING_TRACKS||[]).map(t=>({
    id:t.id,range:t.range||'',units:(t.units||[]).map(u=>({id:u.id,lessons:(u.lesson||[]).map((l,i)=>({i,body:l.body||'',choices:l.check?.choices?.length,answer:l.check?.answer,prompt:l.check?.prompt||''}))}))
  })));
  const byId=Object.fromEntries(schema.map(t=>[t.id,t]));
  const required={physics:['p-vector','p-projectile','p-circle','p-gravity','p-escape','p-relativity'],chemistry:['c-gas','c-mixture','c-liquid','c-solid','c-enthalpy','c-hess','c-spontaneous']};
  if(!byId.physics?.range.includes('p.10~97')) fail('scope-range','physics p.10~97 missing');
  if(!byId.chemistry?.range.includes('p.10~71')||!byId.chemistry?.range.includes('p.108~151')) fail('scope-range','chemistry official range missing');
  for(const [trackId,ids] of Object.entries(required)){
    const actual=new Set((byId[trackId]?.units||[]).map(u=>u.id));
    for(const id of ids) if(!actual.has(id)) fail('scope-unit-missing',`${trackId}/${id}`);
  }
  for(const t of schema) for(const u of t.units){
    if(!u.lessons.length) fail('empty-unit',`${t.id}/${u.id}`);
    for(const l of u.lessons){
      if(l.choices!==4||!Number.isInteger(l.answer)||l.answer<0||l.answer>3) fail('check-schema',`${t.id}/${u.id}/${l.i}`);
      if(l.body.length<45) fail('explanation-too-short',`${t.id}/${u.id}/${l.i}`);
      if(!l.prompt.trim()) fail('check-prompt-data-missing',`${t.id}/${u.id}/${l.i}`);
    }
  }
  await context.close();
}

// 2) Home + visual-first lesson audit across all required viewports.
for(const vp of viewports){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('.unit-card');

  for(const track of ['physics','chemistry']){
    await page.locator(`[data-track="${track}"]`).click();
    const homeMetrics=await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth;
      const els=[...document.querySelectorAll('.hero,.overview,.unit-card,.tab,.tool-link,.ghost')];
      return {overflow:document.documentElement.scrollWidth-vw,clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),units:document.querySelectorAll('.unit-card').length};
    });
    if(homeMetrics.overflow>2||homeMetrics.clipped) fail('home-layout',{vp:vp.name,track,homeMetrics});
    if(!homeMetrics.units) fail('unit-missing',{vp:vp.name,track});

    await page.locator('.unit-card:not(.locked)').first().click();
    await page.waitForSelector('.lesson-card');
    const expectedPrompt=await page.evaluate((trackId)=>{
      const t=(window.LEARNING_TRACKS||[]).find(x=>x.id===trackId);
      return t?.units?.[0]?.lesson?.[0]?.check?.prompt||'';
    },track);
    const lessonMetrics=await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth;
      const els=[...document.querySelectorAll('.lesson-card,.concept-hero,.concept-scene,.concept-copy,.idea-card,.learn-detail,.trap-card,.recall-card,.check,.question-prompt,.choice,.btn,.rescue-toggle')];
      const prompt=document.querySelector('.question-prompt')?.innerText?.trim()||'';
      const recall=document.querySelector('.recall-question')?.innerText?.trim()||'';
      return {
        overflow:document.documentElement.scrollWidth-vw,
        clipped:els.some(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>vw+1}),
        choices:document.querySelectorAll('.choice').length,
        choiceIndices:document.querySelectorAll('.choice-index').length,
        hasScene:Boolean(document.querySelector('.concept-scene svg')),
        hasConceptCopy:Boolean(document.querySelector('.concept-copy')),
        ideaCards:document.querySelectorAll('.idea-card').length,
        details:document.querySelectorAll('.learn-detail').length,
        openDetails:document.querySelectorAll('.learn-detail[open]').length,
        prompt,
        recall,
        habit:document.querySelector('.study-rule')?.textContent||''
      };
    });
    report.push({viewport:vp.name,track,lessonMetrics});
    if(lessonMetrics.overflow>2||lessonMetrics.clipped) fail('lesson-layout',{vp:vp.name,track,lessonMetrics});
    if(lessonMetrics.choices!==4||lessonMetrics.choiceIndices!==4) fail('choice-render',{vp:vp.name,track,lessonMetrics});
    if(!lessonMetrics.hasScene||!lessonMetrics.hasConceptCopy) fail('visual-first-missing',{vp:vp.name,track});
    if(lessonMetrics.ideaCards<2) fail('short-explanation-cards-missing',{vp:vp.name,track,count:lessonMetrics.ideaCards});
    if(lessonMetrics.details<2||lessonMetrics.openDetails!==0) fail('collapsed-support-details',{vp:vp.name,track,lessonMetrics});
    if(!lessonMetrics.prompt||lessonMetrics.prompt!==expectedPrompt) fail('visible-check-prompt',{vp:vp.name,track,expectedPrompt,actual:lessonMetrics.prompt});
    if(!lessonMetrics.recall.includes(expectedPrompt)) fail('recall-lesson-mismatch',{vp:vp.name,track,expectedPrompt,actual:lessonMetrics.recall});
    if(track==='physics'&&!lessonMetrics.habit.includes('그림')) fail('physics-solving-habit',lessonMetrics.habit);
    if(track==='chemistry'&&!lessonMetrics.habit.includes('조건')) fail('chemistry-solving-habit',lessonMetrics.habit);
    await page.screenshot({path:`audit-artifacts/${vp.name}-${track}-lesson.png`,fullPage:true});
    await page.locator('#back').click();
  }
  await context.close();
}

// 3) Wrong -> alternate explanation -> retry -> correct -> exactly one concept progress and persistence.
{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-track="physics"]').click();
  const units=page.locator('.unit-card');
  if(!(await units.nth(1).getAttribute('class'))?.includes('locked')) fail('initial-lock','second physics unit should be locked');
  await units.first().click();
  const answer=await page.evaluate(()=>window.LEARNING_TRACKS[0].units[0].lesson[0].check.answer);
  const wrong=(answer+1)%4;
  await page.locator(`[data-c="${wrong}"]`).click();
  await page.locator('#grade').click();
  await page.waitForTimeout(100);
  const afterWrong=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0);
  if(afterWrong!==0) fail('wrong-advanced',afterWrong);
  if(!(await page.locator('#rescue').getAttribute('class'))?.includes('show')) fail('wrong-rescue-not-open','rescue should auto-open');
  const wrongFeedback=await page.locator('#feedback').innerText();
  if(!wrongFeedback.includes('다른 방식 설명')) fail('wrong-feedback',wrongFeedback);
  const mistakes=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.mistakes?.[0]||0);
  if(mistakes!==1) fail('mistake-not-recorded',mistakes);
  await page.locator(`[data-c="${answer}"]`).click();
  await page.locator('#grade').click();
  await page.waitForTimeout(100);
  const afterCorrect=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0);
  if(afterCorrect!==1) fail('correct-progress',afterCorrect);
  await page.reload({waitUntil:'networkidle'});
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('science-step-progress-v2')||'{}')['physics:p-vector']?.doneSteps||0);
  if(persisted!==1) fail('progress-persistence',persisted);
  await page.screenshot({path:'audit-artifacts/functional-guided-learning.png',fullPage:true});
  await context.close();
}

// 4) Daily drill legacy schema stays valid.
{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(new URL('drill.html?set=2026-09-08',baseURL).href,{waitUntil:'networkidle'});
  await page.waitForSelector('.qcard');
  const schema=await page.evaluate(()=>{
    const s=(window.QUIZ_SETS||[]).find(x=>x?.id==='2026-09-08');
    return s?{count:s.questions.length,questions:s.questions.map((q,i)=>({i,choices:q.choices?.length,answer:q.answer,rem:(q.remediation||[]).map(r=>({choices:r.choices?.length,answer:r.answer}))}))}:null;
  });
  if(!schema) fail('daily-set-missing','2026-09-08');
  else{
    if(schema.count<8||schema.count>12) fail('daily-question-count',schema.count);
    for(const q of schema.questions){
      if(q.choices!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3) fail('daily-main-schema',q);
      if(q.rem.length!==2) fail('daily-remediation-count',q);
      for(const r of q.rem) if(r.choices!==4||!Number.isInteger(r.answer)||r.answer<0||r.answer>3) fail('daily-remediation-schema',r);
    }
  }
  const vw=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,questions:document.querySelectorAll('.qcard').length}));
  if(vw.overflow>2) fail('drill-layout',vw);
  await page.screenshot({path:'audit-artifacts/daily-drill.png',fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile('audit-artifacts/report.json',JSON.stringify({report,failures},null,2));
console.log(JSON.stringify({audited:report.length,failures:failures.length,failuresDetail:failures},null,2));
if(failures.length) process.exitCode=1;
