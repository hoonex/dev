(() => {
  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#f3f4f6;--paper:#fff;--line:#d7dbe2;--text:#151922;--muted:#687180;--accent:#315ee8;--shadow:0 2px 8px rgba(20,28,45,.06)}
    html,body{background:#f3f4f6!important}
    body{background-image:none!important}
    .shell{width:min(920px,calc(100% - 28px));padding-top:14px}
    .top{min-height:52px;margin-bottom:22px;padding-bottom:12px;border-bottom:1px solid #dfe3e8}
    .brand{gap:9px;font-size:15px;letter-spacing:-.02em}
    .mark{width:auto;height:auto;min-width:36px;padding:5px 7px;border:1px solid #cbd1da;border-radius:6px;background:#fff!important;box-shadow:none!important;color:#404957!important;font-size:10px;font-weight:800;letter-spacing:.04em}
    .account{padding:8px 11px;border-radius:8px;background:#fff!important;box-shadow:none;font-size:13px}
    .hero{align-items:flex-end;margin:0 0 16px;min-height:0}
    .eyebrow{font-size:11px;letter-spacing:.06em;color:#737c8a;text-transform:none}
    .hero h1{margin:5px 0 0;font-size:30px;line-height:1.15;letter-spacing:-.035em}
    .hero-sub{margin-top:5px;font-size:13px;color:#737c8a;font-weight:600}
    .status{max-width:280px;font-size:12.5px;color:#737c8a;line-height:1.4}
    .panel{padding:20px;border-radius:14px;background:#fff!important;border:1px solid #dfe3e8;box-shadow:var(--shadow);backdrop-filter:none}
    .banner{border-radius:9px;background:#f7f5ff;color:#51458e}
    .pill{border-radius:7px;padding:6px 8px;background:#fafbfc}
    .title{font-size:21px}.choice{border-radius:10px}.answer{border-radius:9px}
    .progress{height:6px}.actions .btn,.btn{border-radius:9px}
    .remed{border-radius:12px;background:#fff9ec}
    .retry-toast{position:fixed;z-index:40;left:50%;bottom:18px;transform:translateX(-50%);padding:10px 13px;border:1px solid #e3c77f;border-radius:9px;background:#fff8e7;color:#6d5009;font-size:13px;font-weight:750;box-shadow:0 6px 24px rgba(41,35,20,.12);pointer-events:none}
    @media(max-width:560px){
      .shell{width:min(100% - 20px,920px);padding-top:10px}
      .top{margin-bottom:18px}.hero{display:block}.hero h1{font-size:26px}.hero-sub{font-size:12.5px}.status{text-align:left;margin-top:9px;max-width:none}.panel{padding:14px;border-radius:11px}
    }
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

  // Never silently treat a missing retry bank as completed.
  const originalRenderRemediation = window.renderRemediation;
  if (typeof originalRenderRemediation === 'function') {
    window.renderRemediation = function(wrong, saved) {
      const s = window.QUIZ_SETS?.[typeof setIndex === 'number' ? setIndex : 0];
      const missing = Array.isArray(wrong) ? wrong.filter(qi => !Array.isArray(s?.questions?.[qi]?.remediation) || s.questions[qi].remediation.length < 2) : [];
      if (missing.length) {
        const host = document.getElementById('remediation');
        if (host) host.innerHTML = `<div class="notice"><b>오답 보강 데이터 오류</b><br>${missing.map(x=>`본문 ${x+1}번`).join(', ')}의 유사문제가 부족해 완료 처리하지 않았어.</div>`;
        if (saved) { saved.remediationDone = false; if (s && typeof persist === 'function') persist(s, saved); }
        return;
      }
      return originalRenderRemediation(wrong, saved);
    };
  }

  let lastRetryCount = 0;
  const watcher = new MutationObserver(() => {
    const remed = document.querySelector('#remediation .remed');
    if (!remed) { lastRetryCount = 0; return; }
    const count = remed.querySelectorAll('.rq').length;
    if (count && count !== lastRetryCount) {
      lastRetryCount = count;
      document.querySelector('.retry-toast')?.remove();
      const toast = document.createElement('div');
      toast.className = 'retry-toast';
      toast.textContent = `오답 보강 ${count}문제 생성됨`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2200);
      setTimeout(() => remed.scrollIntoView({behavior:'smooth',block:'start'}), 120);
    }
  });
  const app = document.getElementById('app');
  if (app) watcher.observe(app,{subtree:true,childList:true});
})();