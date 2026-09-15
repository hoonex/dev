(() => {
  const host=document.getElementById('practiceHost');
  const sets=window.UNIT_PRACTICE_SETS||{};
  const tracks=Array.isArray(window.LEARNING_TRACKS)?window.LEARNING_TRACKS:[];
  const learningKey='science-step-progress-v2';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const visual=v=>typeof window.visualHtml==='function'?window.visualHtml(v):'';
  let learning={}; try{learning=JSON.parse(localStorage.getItem(learningKey)||'{}')||{};}catch{learning={};}
  const params=new URLSearchParams(location.search);
  const requested=params.get('unit');

  const unitMeta=id=>{
    for(const track of tracks){
      const index=(track.units||[]).findIndex(u=>u.id===id);
      if(index>=0)return{track,unit:track.units[index],index};
    }
    return null;
  };
  const conceptDone=id=>{
    const m=unitMeta(id); if(!m)return false;
    const done=learning[`${m.track.id}:${id}`]?.doneSteps||0;
    return done>=m.unit.lesson.length;
  };
  const conceptProgress=id=>{
    const m=unitMeta(id); if(!m)return{done:0,total:0};
    return{done:Math.min(learning[`${m.track.id}:${id}`]?.doneSteps||0,m.unit.lesson.length),total:m.unit.lesson.length};
  };
  const practiceKey=id=>`science-unit-practice-v1:${id}`;
  const practiceState=id=>{try{return JSON.parse(localStorage.getItem(practiceKey(id))||'{}')||{};}catch{return{};}};
  const practicePassed=id=>Boolean(practiceState(id).completed);

  function listPage(){
    const cards=tracks.flatMap(track=>(track.units||[]).map((unit,index)=>{
      const p=conceptProgress(unit.id), unlocked=conceptDone(unit.id), passed=practicePassed(unit.id), set=sets[unit.id];
      const status=passed?'문제 완료':unlocked?'문제 풀기 가능':`개념 ${p.done}/${p.total}`;
      const body=!set?'문제 세트 준비 중':unlocked?'이 단원에서 배운 범위만 출제됩니다.':'먼저 이 단원의 개념 확인을 전부 통과해야 합니다.';
      return `<article class="unit ${unlocked?'':'locked'}"><div class="unit-top"><span class="badge ${passed?'done':''}">${esc(track.subject)}</span><span class="badge ${passed?'done':''}">${status}</span></div><h3>${esc(unit.title)}</h3><p>${esc(body)}</p>${unlocked&&set?`<a href="unit-practice.html?unit=${encodeURIComponent(unit.id)}">${passed?'다시 풀기':'단원 문제 시작 →'}</a>`:`<button disabled>개념 학습 먼저</button>`}</article>`;
    })).join('');
    const doneCount=Object.keys(sets).filter(practicePassed).length;
    host.innerHTML=`<section class="hero"><div class="kicker">LEARN → PRACTICE → NEXT UNIT</div><h1>배운 단원만 문제로 굳힌다</h1><p>이제 전범위 문제를 먼저 던지지 않습니다. 한 단원의 개념 확인을 끝내면 그 단원 범위만 완자형·내신형으로 변형해 풀고, 오답 보강까지 끝낸 뒤 다음 단원으로 넘어갑니다.</p><div class="source-note">화학은 업로드된 2022 개정 2026판 완자 원본을 우선 근거로 문제 유형을 변형합니다. 물리는 현재 Library에서 역학과 에너지 완자 원본 PDF가 확인되지 않아, 정동고 공식 범위와 학습 개념을 바탕으로 새 문항을 만듭니다.</div></section><div class="progress">단원 문제 완료 ${doneCount} / ${Object.keys(sets).length}</div><section class="unit-grid">${cards}</section>`;
  }

  if(!requested||!sets[requested]){listPage();return;}
  const set=sets[requested];
  const meta=unitMeta(requested);
  if(!meta){host.innerHTML='<div class="notice">단원 정보를 찾지 못했습니다.</div>';return;}
  if(!conceptDone(requested)){
    const p=conceptProgress(requested);
    host.innerHTML=`<a class="back-list" href="unit-practice.html">← 단원 문제 목록</a><section class="notice"><h2>아직 이 단원 문제는 잠겨 있음</h2><p><b>${esc(meta.unit.title)}</b> 개념 확인이 ${p.done}/${p.total}개 완료되었습니다. 먼저 개념을 전부 이해 확인한 뒤 문제를 풀도록 막아 두었습니다.</p><a href="./" style="display:inline-block;margin-top:10px;color:#526cff;font-weight:900;text-decoration:none">개념 학습으로 돌아가기 →</a></section>`;
    return;
  }

  const key=practiceKey(requested);
  let state=practiceState(requested);
  state.main=state.main||{}; state.remPassed=state.remPassed||{}; state.remAnswers=state.remAnswers||{};
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const wrongIndices=()=>Array.isArray(state.wrongIndices)?state.wrongIndices:[];
  const remId=(qi,ri)=>`${qi}:${ri}`;

  function header(){
    return `<a class="back-list" href="unit-practice.html">← 단원 문제 목록</a><section class="hero"><div class="kicker">${esc(meta.track.subject)} · UNIT PRACTICE</div><h1>${esc(set.title)} 단원 문제</h1><p>${esc(set.range)}에서 방금 배운 개념만 묻습니다. 개념 확인 문제보다 한 단계 더 실제 내신형으로 바꿨고, 틀린 문제는 보강 2문제를 통과해야 완료됩니다.</p><div class="source-note">${esc(set.source)}</div></section>`;
  }

  function mainCards(){
    const graded=Boolean(state.graded);
    return set.questions.map((q,qi)=>{
      const picked=state.main[qi]; const result=graded?(picked===q.answer?'good':'bad'):'';
      return `<article class="qcard" id="q${qi}"><div class="qtop"><span>${qi+1}</span><b>${esc(q.type||'문제')}</b></div><div class="prompt">${esc(q.prompt)}</div>${visual(q.visual)}<div class="choices">${q.choices.map((c,ci)=>`<button class="choice ${picked===ci?'selected':''} ${graded&&ci===q.answer?'correct':''} ${graded&&picked===ci&&picked!==q.answer?'wrong':''}" data-main="${qi}" data-choice="${ci}" ${graded?'disabled':''}>${ci+1}. ${esc(c)}</button>`).join('')}</div>${graded?`<div class="answer show ${result}"><b>${result==='good'?'맞음':'틀림'}</b> · ${esc(q.explanation)}<br><span>TIP · ${esc(q.tip||'')}</span></div>`:''}</article>`;
    }).join('');
  }

  function remediationItems(){
    return wrongIndices().flatMap(qi=>(set.questions[qi].remediation||[]).map((r,ri)=>({qi,ri,r,id:remId(qi,ri)})));
  }
  function remediation(){
    if(!state.graded||!wrongIndices().length)return'';
    const pending=remediationItems().filter(x=>!state.remPassed[x.id]);
    if(!pending.length)return `<section class="done"><h3>오답 보강 완료</h3><p>틀린 본문 문제의 보강문제를 모두 맞혔습니다. 이 단원 문제 세트를 완료했습니다.</p><div class="done-actions"><a href="./">학습 목록</a><a class="primary-link" href="unit-practice.html">다른 단원 문제 →</a></div></section>`;
    return `<section class="rem-wrap"><h3>틀린 개념만 다시 확인</h3><p>본문 정답을 외우는 대신 같은 핵심을 다른 상황으로 다시 적용합니다. 남은 ${pending.length}문제를 전부 맞혀야 완료입니다.</p>${pending.map(({qi,ri,r,id})=>{const picked=state.remAnswers[id];return `<article class="qcard remediation" data-rem-card="${id}"><div class="qtop"><span>R</span><b>${qi+1}번 보강 ${ri+1}/2</b></div><div class="prompt">${esc(r.prompt)}</div>${visual(r.visual)}<div class="choices">${r.choices.map((c,ci)=>`<button class="choice ${picked===ci?'selected':''}" data-rem="${id}" data-choice="${ci}">${ci+1}. ${esc(c)}</button>`).join('')}</div><div class="answer" id="rf-${qi}-${ri}"></div></article>`}).join('')}<div class="actions"><button class="primary" id="gradeRem">남은 보강 채점하기</button></div></section>`;
  }

  function render(){
    const answered=set.questions.filter((_,i)=>state.main[i]!==undefined).length;
    const score=state.graded?set.questions.length-wrongIndices().length:null;
    host.innerHTML=`${header()}<div class="set-head"><div><h2>개념을 문제로 바꾸는 단계</h2><p>아직 배우지 않은 다른 단원은 섞지 않습니다.</p></div><div class="set-meta"><b>${set.questions.length}문제</b><span>${state.completed?'완료됨':state.graded?`본문 ${score}/${set.questions.length}`:`선택 ${answered}/${set.questions.length}`}</span></div></div><div class="progress">${state.completed?'이 단원 문제 완료':state.graded?`본문 채점 완료 · 오답 ${wrongIndices().length}개`:`답 선택 ${answered}/${set.questions.length}`}</div>${mainCards()}${remediation()}${!state.graded?'<div class="actions"><button class="primary" id="gradeMain">본문 문제 채점하기</button></div>':''}`;
    bind();
  }

  function bind(){
    host.querySelectorAll('[data-main]').forEach(b=>b.onclick=()=>{
      if(state.graded)return; const qi=Number(b.dataset.main),ci=Number(b.dataset.choice); state.main[qi]=ci; save();
      host.querySelectorAll(`[data-main="${qi}"]`).forEach(x=>x.classList.toggle('selected',x===b));
    });
    host.querySelector('#gradeMain')?.addEventListener('click',gradeMain);
    host.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.rem,ci=Number(b.dataset.choice);state.remAnswers[id]=ci;save();host.querySelectorAll(`[data-rem="${CSS.escape(id)}"]`).forEach(x=>x.classList.toggle('selected',x===b));
    });
    host.querySelector('#gradeRem')?.addEventListener('click',gradeRem);
  }

  function gradeMain(){
    const missing=set.questions.map((_,i)=>i).filter(i=>state.main[i]===undefined);
    if(missing.length){document.getElementById(`q${missing[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'});alert(`아직 ${missing.length}문제 답을 고르지 않았습니다.`);return;}
    state.graded=true; state.wrongIndices=set.questions.map((q,i)=>state.main[i]===q.answer?null:i).filter(i=>i!==null); state.completed=state.wrongIndices.length===0; save();render();
    if(state.completed)document.querySelector('.progress')?.scrollIntoView({behavior:'smooth',block:'center'}); else document.querySelector('.rem-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function gradeRem(){
    const pending=remediationItems().filter(x=>!state.remPassed[x.id]);
    const missing=pending.filter(x=>state.remAnswers[x.id]===undefined);
    if(missing.length){document.querySelector(`[data-rem-card="${missing[0].id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});alert(`아직 ${missing.length}개 보강문제 답을 고르지 않았습니다.`);return;}
    let firstWrong=null;
    for(const x of pending){if(state.remAnswers[x.id]===x.r.answer)state.remPassed[x.id]=true;else if(!firstWrong)firstWrong=x;}
    state.completed=remediationItems().every(x=>state.remPassed[x.id]);save();render();
    if(firstWrong)document.querySelector(`[data-rem-card="${firstWrong.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});else if(state.completed)document.querySelector('.done')?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  render();
})();