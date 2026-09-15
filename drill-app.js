(() => {
  const host = document.getElementById('drillHost');
  const tracks = Array.isArray(window.LEARNING_TRACKS) ? window.LEARNING_TRACKS : [];
  const learningState = (() => { try { return JSON.parse(localStorage.getItem('science-step-progress-v2') || '{}') || {}; } catch { return {}; } })();
  const conceptDone = (track, unit) => Math.min(learningState[`${track.id}:${unit.id}`]?.doneSteps || 0, unit.lesson.length) >= unit.lesson.length;
  const practiceDone = unitId => { try { return Boolean(JSON.parse(localStorage.getItem(`science-unit-practice-v1:${unitId}`) || '{}')?.completed); } catch { return false; } };
  const incomplete = tracks.flatMap(track => (track.units || []).filter(unit => !conceptDone(track,unit) || !practiceDone(unit.id)).map(unit => `${track.subject} · ${unit.title}`));
  if (tracks.length && incomplete.length) {
    if (host) host.innerHTML = `<div class="notice"><b style="font-size:19px">전범위 실전은 아직 잠겨 있음</b><p style="line-height:1.7;color:#687180">아직 배우지 않은 단원을 섞어서 풀지 않도록 막았습니다. 지금은 <b>개념 확인 → 해당 단원 문제 → 오답 보강</b> 순서로 진행하세요.</p><p style="font-size:12px;color:#687180">남은 단원 ${incomplete.length}개</p><a href="unit-practice.html" style="display:inline-block;margin-top:6px;text-decoration:none;color:#315ee8;font-weight:900">배운 단원 문제로 →</a></div>`;
    return;
  }

  const allSets = Array.isArray(window.QUIZ_SETS) ? window.QUIZ_SETS : [];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search);
  const requested = params.get('set');
  const formal = allSets.filter(s => s && !s.test && /^\d{4}-\d{2}-\d{2}$/.test(s.id || ''));
  formal.sort((a,b) => String(b.date || b.id).localeCompare(String(a.date || a.id)));
  const set = (requested && formal.find(s => s.id === requested)) || formal[0];
  if (!set || !host) {
    if (host) host.innerHTML = '<div class="notice">학습 문제 세트를 불러오지 못했습니다.</div>';
    return;
  }

  const storageKey = `science-drill-v4:${set.id}`;
  let state = {};
  try { state = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { state = {}; }
  state.main = state.main || {};
  state.remPassed = state.remPassed || {};
  state.remAnswers = state.remAnswers || {};
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const visual = v => typeof window.visualHtml === 'function' ? window.visualHtml(v) : '';
  const mainWrong = () => Array.isArray(state.wrongIndices) ? state.wrongIndices : [];
  const remId = (qi,ri) => `${qi}:${ri}`;

  function header() {
    return `<header class="set-head"><div><div class="kicker">${esc(set.subject)} · ${esc(set.range)}</div><h1>${esc(set.title)}</h1><p>${esc(set.note || '')}</p></div><div class="set-meta"><b>${set.questions.length}문제</b><span>마감 ${esc((set.deadline || '').replace('T',' ').replace('+09:00',''))}</span></div></header>`;
  }

  function renderMain() {
    const graded = Boolean(state.graded);
    const cards = set.questions.map((q,qi) => {
      const picked = state.main[qi];
      const result = graded ? (picked === q.answer ? 'correct' : 'wrong') : '';
      return `<article class="qcard" id="q${qi}"><div class="qtop"><span>${qi+1}</span><b>${esc(q.type || '문제')}</b></div><div class="prompt">${esc(q.prompt)}</div>${visual(q.visual)}<div class="choices">${q.choices.map((c,ci)=>`<button class="choice ${picked===ci?'selected':''} ${graded&&ci===q.answer?'correct':''} ${graded&&picked===ci&&picked!==q.answer?'wrong':''}" data-main="${qi}" data-choice="${ci}" ${graded?'disabled':''}>${ci+1}. ${esc(c)}</button>`).join('')}</div>${graded?`<div class="answer ${result}"><b>${result==='correct'?'맞음':'틀림'}</b> · ${esc(q.explanation)}<br><span>TIP · ${esc(q.tip || '')}</span></div>`:''}</article>`;
    }).join('');
    const unanswered = set.questions.filter((_,i)=>state.main[i]===undefined).length;
    return `${header()}<div class="progress-note">${graded ? `본 문제 ${set.questions.length-mainWrong().length}/${set.questions.length} 정답` : `답 선택 ${set.questions.length-unanswered}/${set.questions.length}`}</div>${cards}<div class="sticky-action"><button class="primary" id="gradeMain" ${graded?'disabled':''}>${graded?'본 문제 채점 완료':'본 문제 채점하기'}</button></div>`;
  }

  function remediationItems() {
    return mainWrong().flatMap(qi => (set.questions[qi].remediation || []).map((r,ri)=>({qi,ri,r,id:remId(qi,ri)})));
  }

  function renderRemediation() {
    if (!state.graded || !mainWrong().length) return '';
    const items = remediationItems();
    const pending = items.filter(x => !state.remPassed[x.id]);
    if (!pending.length) return `<section class="done"><b>오답 보강 완료</b><p>틀렸던 본 문제의 보강문제를 전부 맞혔습니다. 오늘 세트를 완료했습니다.</p></section>`;
    return `<section class="remed-wrap"><div class="remed-head"><div><div class="kicker">오답 재등장</div><h2>보강 ${pending.length}문제 남음</h2><p>맞힌 보강문제는 다시 나오지 않습니다. 남은 문제를 전부 맞혀야 완료입니다.</p></div></div>${pending.map(({qi,ri,r,id})=>{const picked=state.remAnswers[id];return `<article class="qcard remediation" data-rem-card="${id}"><div class="qtop"><span>R</span><b>원래 ${qi+1}번 · 보강 ${ri+1}/2</b></div><div class="prompt">${esc(r.prompt)}</div>${visual(r.visual)}<div class="choices">${r.choices.map((c,ci)=>`<button class="choice ${picked===ci?'selected':''}" data-rem="${id}" data-choice="${ci}">${ci+1}. ${esc(c)}</button>`).join('')}</div><div class="answer rem-feedback" id="rf-${qi}-${ri}"></div></article>`}).join('')}<div class="sticky-action"><button class="primary" id="gradeRem">남은 보강 채점하기</button></div></section>`;
  }

  function render() {
    host.innerHTML = `<div class="drill-shell">${renderMain()}${renderRemediation()}</div>`;
    host.querySelectorAll('[data-main]').forEach(b => b.onclick = () => {
      if (state.graded) return;
      const qi=Number(b.dataset.main), ci=Number(b.dataset.choice);
      state.main[qi]=ci; save();
      host.querySelectorAll(`[data-main="${qi}"]`).forEach(x=>x.classList.toggle('selected',x===b));
    });
    host.querySelector('#gradeMain')?.addEventListener('click', gradeMain);
    host.querySelectorAll('[data-rem]').forEach(b => b.onclick = () => {
      const id=b.dataset.rem, ci=Number(b.dataset.choice); state.remAnswers[id]=ci; save();
      host.querySelectorAll(`[data-rem="${CSS.escape(id)}"]`).forEach(x=>x.classList.toggle('selected',x===b));
    });
    host.querySelector('#gradeRem')?.addEventListener('click', gradeRem);
  }

  function gradeMain() {
    const missing=set.questions.map((_,i)=>i).filter(i=>state.main[i]===undefined);
    if(missing.length){document.getElementById(`q${missing[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'}); alert(`아직 ${missing.length}문제 답을 고르지 않았습니다.`); return;}
    state.graded=true;
    state.wrongIndices=set.questions.map((q,i)=>state.main[i]===q.answer?null:i).filter(i=>i!==null);
    state.completed=state.wrongIndices.length===0;
    save(); render();
    if(state.wrongIndices.length) document.querySelector('.remed-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function gradeRem() {
    const items=remediationItems().filter(x=>!state.remPassed[x.id]);
    const missing=items.filter(x=>state.remAnswers[x.id]===undefined);
    if(missing.length){document.querySelector(`[data-rem-card="${missing[0].id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}); alert(`아직 ${missing.length}개 보강문제 답을 고르지 않았습니다.`);return;}
    let firstWrong=null;
    for(const x of items){
      const ok=state.remAnswers[x.id]===x.r.answer;
      if(ok) state.remPassed[x.id]=true; else if(!firstWrong) firstWrong=x;
    }
    const allDone=remediationItems().every(x=>state.remPassed[x.id]);
    state.completed=allDone; save(); render();
    if(firstWrong) document.querySelector(`[data-rem-card="${firstWrong.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
    else if(allDone) document.querySelector('.done')?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  render();
})();