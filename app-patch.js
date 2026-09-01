(() => {
  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#f3f4f6;--paper:#fff;--line:#d7dbe2;--text:#151922;--muted:#687180;--accent:#315ee8;--shadow:0 2px 8px rgba(20,28,45,.06)}
    html,body{background:#f3f4f6!important}body{background-image:none!important}
    .shell{width:min(920px,calc(100% - 28px));padding-top:14px}.top{min-height:52px;margin-bottom:22px;padding-bottom:12px;border-bottom:1px solid #dfe3e8}
    .brand{gap:9px;font-size:15px;letter-spacing:-.02em}.mark{width:auto;height:auto;min-width:36px;padding:5px 7px;border:1px solid #cbd1da;border-radius:6px;background:#fff!important;box-shadow:none!important;color:#404957!important;font-size:10px;font-weight:800;letter-spacing:.04em}
    .account{padding:8px 11px;border-radius:8px;background:#fff!important;box-shadow:none;font-size:13px}.hero{align-items:flex-end;margin:0 0 16px;min-height:0}.eyebrow{font-size:11px;letter-spacing:.06em;color:#737c8a;text-transform:none}.hero h1{margin:5px 0 0;font-size:30px;line-height:1.15;letter-spacing:-.035em}.hero-sub{margin-top:5px;font-size:13px;color:#737c8a;font-weight:600}.status{max-width:280px;font-size:12.5px;color:#737c8a;line-height:1.4}
    .panel{padding:20px;border-radius:14px;background:#fff!important;border:1px solid #dfe3e8;box-shadow:var(--shadow);backdrop-filter:none}.banner{border-radius:9px;background:#f7f5ff;color:#51458e}.pill{border-radius:7px;padding:6px 8px;background:#fafbfc}.title{font-size:21px}.choice{border-radius:10px}.answer{border-radius:9px}.progress{height:6px}.actions .btn,.btn{border-radius:9px}
    .remed{border-radius:12px;background:#fffdf8;border-color:#e6d8b8}.retry-intro{margin:10px 0 4px;padding:12px 13px;border:1px solid #e7dcc3;border-radius:9px;background:#fff;color:#4c5360;font-size:13px;line-height:1.55}.retry-intro b{color:#232935}.retry-passed-list{display:grid;gap:7px;margin:12px 0}.retry-passed{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #cfe3d7;border-radius:8px;background:#f3fbf6;color:#2f6648;font-size:12.5px;font-weight:700}.retry-check{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#dff3e6;color:#267345;font-size:12px}.rq{position:relative}.rq-label{display:inline-flex;margin-bottom:8px;padding:4px 7px;border-radius:5px;background:#f2f4f7;color:#5d6675;font-size:11px;font-weight:750}.retry-result{margin-top:13px;padding:13px 14px;border:1px solid #ead6a3;border-radius:9px;background:#fff9e9;color:#604b16;font-size:13.5px;line-height:1.55}.retry-result b{color:#3d310f}.retry-done{margin-top:13px;padding:13px 14px;border:1px solid #b8dfc9;border-radius:9px;background:#eef9f2;color:#245f3d;font-size:13.5px;line-height:1.55}.retry-toast{position:fixed;z-index:40;left:50%;bottom:18px;transform:translateX(-50%);padding:10px 13px;border:1px solid #d8dee8;border-radius:8px;background:#fff;color:#303744;font-size:13px;font-weight:750;box-shadow:0 6px 24px rgba(20,28,45,.12);pointer-events:none}
    @media(max-width:560px){.shell{width:min(100% - 20px,920px);padding-top:10px}.top{margin-bottom:18px}.hero{display:block}.hero h1{font-size:26px}.hero-sub{font-size:12.5px}.status{text-align:left;margin-top:9px;max-width:none}.panel{padding:14px;border-radius:11px}}
    @media(max-height:500px) and (orientation:landscape){.top{margin-bottom:10px;padding-bottom:7px}.hero{margin-bottom:10px}.hero h1{font-size:22px}.hero-sub{display:none}}
  `;
  document.head.appendChild(style);

  const brandText = document.querySelector('.brand span:last-child');
  const mark = document.querySelector('.mark');
  const eyebrow = document.querySelector('.eyebrow');
  const heading = document.querySelector('.hero h1');
  if (brandText) brandText.textContent = '중간고사 대비';
  if (mark) mark.textContent = '2학년';
  if (eyebrow) eyebrow.textContent = '2026 · 2학기 중간고사';
  if (heading) {
    heading.textContent = '물리 · 화학';
    if (!document.querySelector('.hero-sub')) {
      const sub = document.createElement('div');
      sub.className = 'hero-sub';
      sub.textContent = '역학과 에너지 / 물질과 에너지';
      heading.insertAdjacentElement('afterend', sub);
    }
  }

  const flowVersion = 3;
  const originalGradeMain = window.gradeMain;

  // Do not turn unanswered main questions into wrong answers.
  if (typeof originalGradeMain === 'function') {
    window.gradeMain = function(fromSaved = false) {
      const s = sets[setIndex];
      if (!fromSaved) {
        const unanswered = s.questions.map((_, i) => i).filter(i => selected[i] === undefined);
        if (unanswered.length) {
          toast(`아직 ${unanswered.length}문제 답을 안 골랐어.`);
          document.getElementById(`q${unanswered[0]}`)?.scrollIntoView({behavior:'smooth',block:'center'});
          return;
        }
      }
      originalGradeMain(fromSaved);
      const saved = savedFor(s);
      const box = document.getElementById('score');
      if (box && saved?.graded) {
        const wrong = Array.isArray(saved.wrongIndices) ? saved.wrongIndices.length : 0;
        const score = Number(saved.score ?? 0);
        const pct = Math.round(score / s.questions.length * 100);
        box.innerHTML = `<b>${score} / ${s.questions.length} · ${pct}점</b><br><span style="color:var(--muted)">${wrong ? `틀린 문제 ${wrong}개. 아래에서 각 문제와 비슷한 문제를 2개씩 풀면 돼.` : '전부 맞았어.'}${s.test ? ' · 오늘은 테스트라 진도에는 반영되지 않아.' : ''}</span>`;
      }
    };
  }

  function currentSet() { return sets[setIndex]; }
  function retryItemsFor(s, wrong) { return remediationItems(s, wrong); }
  function retryMissing(s, wrong) {
    return (wrong || []).filter(qi => !Array.isArray(s?.questions?.[qi]?.remediation) || s.questions[qi].remediation.length !== 2);
  }
  function migrateRetryState(s, saved) {
    if (!saved || saved.retryFlowVersion === flowVersion) return saved;
    const next = {...saved, retryFlowVersion:flowVersion, remediationAnswers:{}, remediationPassed:{}, remediationDone:false, at:Date.now()};
    persist(s, next);
    return next;
  }
  function passedSummary(items, passed) {
    const done = items.filter(r => passed[r.id]);
    if (!done.length) return '';
    return `<div class="retry-passed-list">${done.map(r => `<div class="retry-passed"><span class="retry-check">✓</span><span>원래 ${r.qi+1}번과 같은 개념 · 연습 ${r.ri+1}/2 맞힘</span></div>`).join('')}</div>`;
  }

  window.renderRemediation = function(wrong, saved) {
    const s = currentSet();
    const host = document.getElementById('remediation');
    if (!host) return;
    const missing = retryMissing(s, wrong);
    if (missing.length) {
      host.innerHTML = `<div class="notice"><b>연습문제를 불러오지 못했어.</b><br>${missing.map(x => `원래 ${x+1}번`).join(', ')}에 필요한 비슷한 문제가 부족해. 이 상태로는 학습 완료로 처리하지 않아.</div>`;
      if (saved) { saved.remediationDone = false; persist(s, saved); }
      return;
    }

    saved = migrateRetryState(s, saved) || saved || {};
    const items = retryItemsFor(s, wrong);
    const passed = saved.remediationPassed || {};
    remSelected = saved.remediationAnswers || {};
    const pending = items.filter(r => !passed[r.id]);

    if (!pending.length) {
      const next = {...saved, remediationDone:true, retryFlowVersion:flowVersion, at:Date.now()};
      persist(s, next);
      host.innerHTML = `<section class="remed"><div class="retry-done"><b>틀렸던 문제 다시 연습 끝.</b><br>비슷한 문제를 모두 맞혔어. 이 세트는 여기까지 하면 돼.</div></section>`;
      return;
    }

    host.innerHTML = `<section class="remed">
      <div class="remed-head"><div><div class="remed-title">틀린 문제 다시 연습</div><div class="small">틀린 문제마다 비슷한 문제 2개를 풀어. 맞힌 문제는 다시 풀지 않아.</div></div><span class="remed-badge">남은 ${pending.length}문제</span></div>
      <div class="retry-intro"><b>어떻게 하면 되냐면:</b> 아래 문제를 풀고 채점해. 틀린 것만 다시 나오고, 전부 맞히면 끝이야.</div>
      ${passedSummary(items, passed)}
      ${pending.map((r, i) => `<article class="rq" data-retry-id="${r.id}"><div class="rq-label">원래 ${r.qi+1}번과 같은 개념 · 연습 ${r.ri+1}/2</div><div class="prompt">${esc(r.prompt)}</div>${visualHtml(r.visual)}<div class="choices">${r.choices.map((c,j)=>`<button class="choice rchoice" data-r="${r.id}" data-c="${j}">${j+1}. ${esc(c)}</button>`).join('')}</div><div class="ranswer" id="ra-${r.qi}-${r.ri}"></div></article>`).join('')}
      <div id="remResult"></div><div class="remed-actions"><button class="btn primary" id="remSubmit">비슷한 문제 채점하기</button></div>
    </section>`;

    document.querySelectorAll('.rchoice').forEach(b => b.onclick = () => {
      remSelected[b.dataset.r] = +b.dataset.c;
      document.querySelectorAll(`[data-r="${b.dataset.r}"]`).forEach(x => x.classList.toggle('selected', x === b));
    });
    Object.entries(remSelected).forEach(([id, ci]) => {
      if (passed[id]) return;
      document.querySelectorAll(`[data-r="${id}"]`).forEach(b => b.classList.toggle('selected', +b.dataset.c === +ci));
    });
    document.getElementById('remSubmit').onclick = () => window.gradeRemediation(items);
  };

  window.gradeRemediation = function(items) {
    const s = currentSet();
    const saved = savedFor(s) || {};
    const passed = {...(saved.remediationPassed || {})};
    const pending = items.filter(r => !passed[r.id]);
    const unanswered = pending.filter(r => remSelected[r.id] === undefined);
    if (unanswered.length) {
      const result = document.getElementById('remResult');
      result.className = 'retry-result';
      result.innerHTML = `<b>아직 ${unanswered.length}문제 답을 안 골랐어.</b><br>답을 고른 다음 채점하면 돼.`;
      document.querySelector(`[data-retry-id="${unanswered[0].id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    const wrongNow = [];
    pending.forEach(r => {
      const picked = remSelected[r.id];
      const ok = picked === r.answer;
      if (ok) passed[r.id] = true; else wrongNow.push(r.id);
      document.querySelectorAll(`[data-r="${r.id}"]`).forEach(b => {
        b.disabled = true;
        const c = +b.dataset.c;
        b.classList.remove('selected');
        if (c === r.answer) b.classList.add('correct');
        else if (picked === c) b.classList.add('wrong');
      });
      const a = document.getElementById(`ra-${r.qi}-${r.ri}`);
      if (a) {
        a.innerHTML = `<b>${ok ? '맞음' : '틀림'} · 정답 ${r.answer+1}번</b><br>${esc(r.explanation || '')}${r.tip ? `<br><span style="color:#88734d">TIP · ${esc(r.tip)}</span>` : ''}`;
        a.classList.add('show');
      }
    });

    const totalPassed = items.filter(r => passed[r.id]).length;
    const remaining = items.length - totalPassed;
    const all = remaining === 0;
    const next = {...saved, remediationAnswers:{...remSelected}, remediationPassed:passed, remediationDone:all, retryFlowVersion:flowVersion, at:Date.now()};
    persist(s, next);
    const result = document.getElementById('remResult');
    const btn = document.getElementById('remSubmit');

    if (all) {
      result.className = 'retry-done';
      result.innerHTML = `<b>다 맞혔어.</b><br>틀렸던 문제와 비슷한 문제까지 전부 해결했어.`;
      btn.textContent = '연습 끝'; btn.disabled = true;
      setTimeout(() => render(), 650);
      return;
    }

    result.className = 'retry-result';
    result.innerHTML = `<b>비슷한 문제 ${items.length}개 중 ${totalPassed}개 맞혔어.</b><br>남은 ${remaining}개만 다시 풀면 돼. 이미 맞힌 문제는 다시 안 풀어.`;
    btn.textContent = `틀린 ${remaining}문제 다시 풀기`;
    btn.onclick = () => {
      const keptAnswers = {};
      Object.keys(passed).forEach(id => { if (passed[id] && remSelected[id] !== undefined) keptAnswers[id] = remSelected[id]; });
      const retryState = {...next, remediationAnswers:keptAnswers, at:Date.now()};
      persist(s, retryState);
      window.renderRemediation(saved.wrongIndices || [], retryState);
      document.querySelector('#remediation .rq')?.scrollIntoView({behavior:'smooth',block:'center'});
    };
  };

  let lastPendingCount = 0;
  const watcher = new MutationObserver(() => {
    const remed = document.querySelector('#remediation .remed');
    if (!remed) { lastPendingCount = 0; return; }
    const count = remed.querySelectorAll('.rq').length;
    if (count && count !== lastPendingCount) {
      lastPendingCount = count;
      document.querySelector('.retry-toast')?.remove();
      const toastEl = document.createElement('div');
      toastEl.className = 'retry-toast';
      toastEl.textContent = `비슷한 문제 ${count}개 풀면 돼`;
      document.body.appendChild(toastEl);
      setTimeout(() => toastEl.remove(), 1800);
    }
  });
  const appEl = document.getElementById('app');
  if (appEl) watcher.observe(appEl, {subtree:true, childList:true, characterData:true});
})();