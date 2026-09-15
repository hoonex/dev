(() => {
  const tracks = Array.isArray(window.LEARNING_TRACKS) ? window.LEARNING_TRACKS : [];
  const home = document.getElementById('home');
  const study = document.getElementById('study');
  const trackEl = document.getElementById('track');
  const lessonEl = document.getElementById('lesson');
  const back = document.getElementById('back');

  // v2 deliberately starts from real study progress, not earlier QA/demo clicks.
  const storageKey = 'science-step-progress-v2';
  let state = {};
  try { state = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { state = {}; }

  let currentTrackId = tracks[0]?.id || 'physics';
  let currentUnit = null;
  let selected = null;
  let mastered = false;
  let rescueOpen = false;

  const tutor = {
    'p-vector': {
      prereq:'숫자만 있는 값과 방향까지 필요한 값을 구분하면 된다. 오른쪽·위쪽을 +로 잡는 것처럼 먼저 기준 방향을 하나 정한다.',
      why:'힘은 방향이 있는 양이라 단순한 숫자 덧셈만으로는 처리할 수 없다. 결국 모든 복잡한 힘 문제는 x방향과 y방향 숫자로 바꾸는 작업이다.',
      method:['그림에 화살표를 그린다.','+방향을 먼저 정한다.','각 힘을 x, y 성분으로 나눈다.','같은 축끼리 부호를 포함해 더한다.','마지막에 크기와 방향을 다시 읽는다.'],
      trap:'반대 방향 힘을 그냥 더하거나, 수직인 두 힘을 3+4=7처럼 더하는 실수가 가장 흔하다.',
      worked:'오른쪽 8 N, 왼쪽 3 N이면 오른쪽을 +로 잡아 +8+(-3)=+5 N. 답은 “5 N”만이 아니라 “오른쪽 5 N”이다.',
      rescue:'벡터는 “얼마나?”와 “어디로?”가 한 세트다. 지도에서 5 km만 말하면 목적지를 못 찾는 것과 같다. 힘도 5 N만으로는 부족하고 방향이 붙어야 완성된다.'
    },
    'p-projectile': {
      prereq:'한 물체의 움직임을 가로와 세로로 따로 생각할 수 있다는 것만 필요하다. 두 방향의 운동은 동시에 진행된다.',
      why:'공을 비스듬히 던져도 중력은 오직 아래쪽으로만 작용한다. 그래서 가로 운동은 거의 그대로, 세로 운동만 계속 변한다.',
      method:['궤적을 그린다.','속도를 vₓ와 vᵧ로 분해한다.','가로는 aₓ=0, 세로는 aᵧ=-g를 적는다.','시간을 공통 변수로 두고 각각 계산한다.','마지막에 두 결과를 다시 합친다.'],
      trap:'최고점에서 vᵧ=0인 것을 “속도 전체가 0” 또는 “가속도도 0”으로 착각하지 않는다.',
      worked:'수평으로 던진 공은 세로로는 그냥 자유낙하한다. 먼저 h=½gt²로 떨어지는 시간을 구한 뒤, x=vₓt로 가로 거리를 구한다.',
      rescue:'영상을 가로 방향과 세로 방향 두 장으로 겹쳐 본다고 생각하면 된다. 가로 영상은 일정한 속도로 이동하고, 세로 영상은 떨어지는 자유낙하다.'
    },
    'p-circle': {
      prereq:'속력은 숫자만, 속도는 방향까지 포함한다. 따라서 속력이 일정해도 방향이 바뀌면 속도는 변한 것이다.',
      why:'원을 따라가려면 물체의 진행 방향을 계속 안쪽으로 꺾어야 한다. 그 역할을 하는 것이 중심 방향의 구심가속도와 구심력이다.',
      method:['원의 중심을 표시한다.','현재 위치에서 속도는 접선 방향으로 그린다.','가속도·합력은 중심 방향으로 그린다.','a=v²/r 또는 v=2πr/T 중 필요한 관계를 고른다.','비례 관계로 먼저 크기를 예상한 뒤 계산한다.'],
      trap:'구심력은 새로운 종류의 힘이 아니다. 장력·중력·마찰력 등의 합력이 중심 방향일 때 그 합력을 구심력이라고 부른다.',
      worked:'r이 같고 v가 2배면 a=v²/r이므로 구심가속도는 4배다. 제곱을 빼먹지 않는다.',
      rescue:'자동차가 원형 트랙을 돌 때 핸들을 계속 안쪽으로 꺾지 않으면 직선으로 나가 버린다. “계속 안쪽으로 꺾이는 정도”가 구심가속도다.'
    },
    'p-gravity': {
      prereq:'제곱에 반비례한다는 말은 거리가 2배일 때 값이 1/4, 3배일 때 1/9이 된다는 뜻이다.',
      why:'케플러 법칙은 행성의 실제 운동 규칙을, 만유인력은 그 운동이 왜 생기는지를 연결한다.',
      method:['중심 천체와 궤도를 먼저 그린다.','현재 거리 r인지 긴반지름 a인지 구분한다.','힘 문제면 F∝1/r², 주기 문제면 T²∝a³를 고른다.','비율로 먼저 계산한다.','단위와 중심천체가 같은 조건인지 확인한다.'],
      trap:'케플러 제3법칙의 a는 행성의 “현재 거리”가 아니라 타원 궤도의 긴반지름이다.',
      worked:'같은 별을 도는 행성의 a가 4배면 T²은 4³=64배, 따라서 T는 8배다.',
      rescue:'중력은 멀어질수록 빠르게 약해진다. 케플러 제3법칙은 더 큰 궤도를 도는 행성일수록 한 바퀴 도는 데 훨씬 오래 걸린다는 규칙이다.'
    },
    'p-escape': {
      prereq:'운동 에너지는 ½mv²이고, 중력 퍼텐셜 에너지는 천체에서 멀어질수록 0에 가까워진다는 감각만 있으면 된다.',
      why:'탈출 속도는 엔진을 계속 켜지 않고도 중력에 다시 끌려오지 않을 최소 초기 속력을 에너지 보존으로 찾은 값이다.',
      method:['출발 위치의 중심거리 R을 확인한다.','천체 질량 M을 확인한다.','vₑ=√(2GM/R)을 쓴다.','배수 문제는 먼저 M/R 비를 구한다.','마지막에 제곱근을 취한다.'],
      trap:'발사체 질량 m은 최종 탈출 속도 식에서 사라진다. 무거운 물체라고 탈출 속도가 더 큰 것이 아니다.',
      worked:'같은 반지름에서 천체 질량이 4배면 M/R이 4배이므로 탈출 속도는 √4=2배다.',
      rescue:'언덕 위로 공을 점점 세게 던진다고 생각하자. 충분히 세게 던져 다시 내려오지 않게 되는 경계의 시작 속력이 탈출 속도다.'
    },
    'p-relativity': {
      prereq:'가속은 속도의 크기나 방향이 바뀌는 것이고, 중력은 질량 주변에서 나타나는 현상이라는 정도만 필요하다.',
      why:'일반 상대성 이론은 중력을 단순한 당기는 힘으로만 보지 않고, 질량·에너지가 시공간의 구조를 바꾸는 현상으로 설명한다.',
      method:['어느 곳의 중력이 더 강한지 먼저 비교한다.','등가 원리 상황인지 확인한다.','빛의 경로와 시간 흐름을 각각 판단한다.','강한 중력일수록 시간은 더 느리다는 방향을 확인한다.','관측 자료가 중력 렌즈·시간 지연 중 무엇을 보여 주는지 연결한다.'],
      trap:'“등가”를 모든 상황에서 완전히 똑같다는 뜻으로 해석하지 않는다. 국소적인 관찰에서 중력과 가속 효과를 구별하기 어렵다는 것이 핵심이다.',
      worked:'질량이 큰 천체 근처와 멀리 떨어진 곳의 시계를 비교하면, 더 강한 중력장에 있는 시계가 더 느리게 간다.',
      rescue:'팽팽한 천 위에 무거운 공을 올려 주변이 휘는 모습을 떠올리면 된다. 실제 시공간은 4차원이지만, “질량이 주변의 길을 바꾼다”는 직관에는 도움이 된다.'
    },
    'c-gas': {
      prereq:'기체 입자는 계속 움직이고, 용기 벽에 충돌하면서 압력을 만든다. 절대온도 K는 섭씨온도에 273을 더해 생각한다.',
      why:'압력 P, 부피 V, 온도 T, 몰수 n은 따로 움직이는 값이 아니라 한 식 PV=nRT로 연결된다.',
      method:['조건에서 일정한 값을 표시한다.','단위를 맞춘다.','P·V·T·n 중 필요한 값만 적는다.','보일/샤를/아보가드로 또는 PV=nRT를 고른다.','답의 증가·감소 방향이 상식과 맞는지 확인한다.'],
      trap:'샤를 법칙에서 섭씨온도를 그대로 비례식에 넣지 않는다. 온도 비례는 절대온도 K 기준이다.',
      worked:'T와 n이 일정한데 V가 절반이면 PV가 일정하므로 P는 2배가 된다.',
      rescue:'피스톤 안 기체를 작은 공들이 벽을 두드리는 모습으로 생각하자. 공간을 줄이면 같은 공들이 벽을 더 자주 때려 압력이 커진다.'
    },
    'c-mixture': {
      prereq:'몰수는 입자 수를 세는 화학의 단위다. 혼합되어도 각 기체는 자기 입자 수에 해당하는 압력 기여분을 가진다.',
      why:'혼합 기체의 전체 압력은 각 기체의 부분 압력을 더한 값이고, 부분 압력은 몰분율에 비례한다.',
      method:['전체 몰수 nₜ를 구한다.','각 성분의 몰분율 Xᵢ=nᵢ/nₜ를 구한다.','Pᵢ=XᵢPₜ로 부분 압력을 구한다.','모든 부분 압력 합이 전체 압력인지 확인한다.','물 위 포집이면 수증기 압력을 따로 뺀다.'],
      trap:'물 위에서 모은 기체의 측정 압력을 곧바로 순수 기체 압력으로 쓰면 안 된다. 수증기 압력이 섞여 있다.',
      worked:'A 1 mol, B 3 mol이 전체 8 atm이면 A의 몰분율은 1/4이고 부분 압력은 2 atm이다.',
      rescue:'피자 네 조각 중 한 조각이 A라고 생각하면 A의 몫은 1/4이다. 전체 압력 8 atm 중 A의 몫도 1/4인 2 atm이다.'
    },
    'c-liquid': {
      prereq:'분자 사이에도 서로 끌어당기는 힘이 있고, 그 힘이 강할수록 서로 떨어져 기체가 되기 어렵다.',
      why:'액체의 증기압·끓는점·표면 성질은 분자 사이 힘의 세기와 동적 평형으로 연결된다.',
      method:['분자의 극성과 수소 결합 가능 여부를 본다.','분자 사이 힘의 상대적 세기를 판단한다.','증기압과 끓는점의 방향을 반대로 연결한다.','온도·외부 압력 조건을 확인한다.','끓음은 증기압=외부압력일 때임을 적용한다.'],
      trap:'증발은 표면에서 어느 온도에서도 일어날 수 있지만, 끓음은 액체 전체에서 특정 조건에 도달했을 때 일어난다.',
      worked:'분자 사이 힘이 더 강하면 액체를 벗어나기 어려워 증기압은 낮고, 끓이려면 더 높은 온도가 필요해 끓는점은 높다.',
      rescue:'사람들이 서로 강하게 손을 잡고 있으면 무리에서 빠져나가기 어렵다고 생각하자. 분자 사이 힘이 강한 액체도 기체로 빠져나가기 어렵다.'
    },
    'c-solid': {
      prereq:'고체에서도 입자를 묶는 방식이 다르면 녹는점, 전기 전도성, 단단함이 달라진다.',
      why:'이온 결정·금속 결정·분자 결정·공유 결정은 “무엇이 무엇을 붙잡고 있는가”로 구분하면 성질까지 예측할 수 있다.',
      method:['구성 입자를 확인한다.','입자 사이 결합/힘을 확인한다.','고체 상태에서 움직일 전하가 있는지 본다.','녹였을 때 전하 이동 가능성이 바뀌는지 본다.','녹는점·단단함 자료와 함께 결정 종류를 판정한다.'],
      trap:'이온 결정은 이온이 있어도 고체에서는 제자리라 전기가 잘 통하지 않는다. 녹이거나 수용액이 되어 움직일 수 있어야 전도된다.',
      worked:'NaCl 고체는 이온이 격자에 고정되어 전도하지 않지만, 용융 NaCl은 이온이 이동할 수 있어 전도한다.',
      rescue:'전기가 통하려면 전하가 “존재”하는 것만으로는 부족하고 “움직일 수” 있어야 한다. 이 기준으로 결정의 전도성을 보면 된다.'
    },
    'c-enthalpy': {
      prereq:'열이 밖으로 나가면 계는 에너지를 잃고, 열이 들어오면 계는 에너지를 얻는다. 부호는 계를 기준으로 정한다.',
      why:'반응 엔탈피 ΔH는 반응 전후의 에너지 차이를 숫자와 부호로 나타낸다.',
      method:['반응물·생성물의 상태를 확인한다.','반응식 계수를 확인한다.','ΔH=H(생성물)-H(반응물)을 적용한다.','발열이면 -, 흡열이면 +인지 검산한다.','열량계 문제는 q=cmΔT와 반응열의 부호를 구분한다.'],
      trap:'용액 온도가 올라갔다면 용액은 열을 받은 것이고, 반응계는 그 열을 내놓은 것이므로 반응은 발열이다.',
      worked:'생성물의 엔탈피가 반응물보다 50 kJ 낮으면 ΔH=-50 kJ이고 발열 반응이다.',
      rescue:'계좌 잔액처럼 생각하면 된다. 반응 후 에너지가 더 낮아졌다면 그 차이만큼 밖으로 내보낸 것이므로 ΔH는 음수다.'
    },
    'c-hess': {
      prereq:'반응 엔탈피는 처음 상태와 마지막 상태가 같으면 중간 경로와 관계없이 전체 변화량이 같다.',
      why:'헤스 법칙은 원하는 반응을 여러 반응식의 덧셈으로 만들어, 직접 재기 어려운 ΔH를 계산하는 방법이다.',
      method:['목표 반응식을 맨 위에 쓴다.','주어진 반응식을 필요한 방향으로 뒤집는다.','필요한 계수만큼 곱한다.','중간 물질이 양변에서 소거되는지 확인한다.','같은 조작을 ΔH에도 적용해 더한다.'],
      trap:'반응식을 뒤집으면 ΔH 부호도 뒤집고, 계수를 2배 하면 ΔH도 2배 해야 한다.',
      worked:'A→B가 +20 kJ, B→C가 -50 kJ이면 두 식을 더해 A→C, ΔH=-30 kJ이다.',
      rescue:'지도에서 A→B→C로 가든 다른 길로 가든 출발점과 도착점의 고도 차는 같다. 헤스 법칙도 “처음-끝 차이”만 본다.'
    },
    'c-spontaneous': {
      prereq:'계는 우리가 관찰하는 대상, 주위는 그 밖의 모든 것이다. 전체 변화는 계와 주위를 함께 봐야 한다.',
      why:'자발성은 “반응이 빠른가”가 아니라 주어진 조건에서 외부의 지속적인 도움 없이 어느 방향으로 진행하려는가를 말한다.',
      method:['계와 주위를 나눈다.','ΔH계의 부호를 확인한다.','ΔS계의 증가·감소를 판단한다.','주위의 엔트로피 변화 방향을 연결한다.','ΔS전체=ΔS계+ΔS주위의 부호로 최종 판단한다.'],
      trap:'ΔS계가 증가하거나 발열이라는 한 조건만으로 무조건 자발이라고 결론 내리지 않는다. 전체를 봐야 한다.',
      worked:'계의 엔트로피가 줄어도 발열로 주위 엔트로피가 더 크게 증가하면 전체 엔트로피는 증가해 자발적일 수 있다.',
      rescue:'방 하나만 깨끗해졌다고 집 전체가 정돈됐다고 말할 수 없는 것과 같다. 자발성은 계만이 아니라 계+주위 전체를 판단한다.'
    }
  };

  const progressKey = (trackId, unitId) => `${trackId}:${unitId}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const currentTrack = () => tracks.find(t => t.id === currentTrackId);
  const unitState = (track, unit) => state[progressKey(track.id, unit.id)] || {};
  const doneCount = (track, unit) => Math.min(unitState(track, unit).doneSteps || 0, unit.lesson.length);
  const unitUnlocked = (track, index) => index === 0 || doneCount(track, track.units[index - 1]) >= track.units[index - 1].lesson.length;
  const mistakesCount = (track, unit) => Object.values(unitState(track, unit).mistakes || {}).reduce((a,b)=>a+b,0);

  function injectTutorStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .tutor-note{margin:16px 0;padding:15px 16px;border-radius:18px;background:#f8faff;border:1px solid #dfe6f1;line-height:1.7;color:#344156;font-size:14px}
      .tutor-note b{color:#1e2837}.tutor-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.tutor-section{padding:16px;border-radius:20px;background:var(--panel);box-shadow:var(--inset)}
      .tutor-section h3{font-size:13px;margin:0 0 9px;color:#5c78ff}.tutor-section p{font-size:14px!important;line-height:1.72!important}.tutor-section ol{margin:0;padding-left:20px;color:#394559;font-size:14px;line-height:1.8}.tutor-section.trap h3{color:#a45b32}.tutor-section.trap{background:#fff8ef}.tutor-section.worked{background:#f3f7ff}.micro-label{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:10px;background:#e6ecff;color:#4966e7;font-size:11px;font-weight:900;margin-bottom:10px}.rescue-toggle{width:100%;border:1px solid #cfd8e8;background:#f8faff;border-radius:16px;padding:12px 14px;font-weight:900;cursor:pointer;color:#4f5d73;margin-top:4px}.rescue{display:none;margin-top:10px;padding:15px 16px;border-radius:18px;background:#fff6d9;color:#655017;line-height:1.72;font-size:14px}.rescue.show{display:block}.study-rule{margin:0 0 14px;padding:12px 14px;border-radius:16px;background:#edf2ff;color:#4257b9;font-size:12px;font-weight:800;line-height:1.6}.unit .weak{margin-top:8px;font-size:11px;color:#9a5a33;font-weight:800}.real-progress{font-size:11px;color:var(--muted);margin-top:6px}.reset-study{border:0;background:transparent;color:var(--muted);font-size:11px;font-weight:800;cursor:pointer;text-decoration:underline}.lesson-card .check{margin-top:18px}.lesson-card .check h3{font-size:17px}.feedback.bad .rescue-inline{display:block;margin-top:7px;font-weight:800}.source-note{margin-top:18px;font-size:10px;color:#8a95a7;line-height:1.55}
      @media(max-width:700px){.tutor-grid{grid-template-columns:1fr}.tutor-section{padding:14px}.tutor-note{padding:13px 14px}.lesson-card p{font-size:15px}.lesson-card{padding:18px}}
      @media(max-height:430px) and (orientation:landscape){.tutor-grid{grid-template-columns:1fr 1fr}.tutor-section{padding:12px}.tutor-section p,.tutor-section ol{font-size:12px!important;line-height:1.55!important}.tutor-note{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function updateHomeCopy() {
    const title = document.querySelector('.hero-main h1');
    const desc = document.querySelector('.hero-main p');
    const dailyStrong = document.querySelector('.daily-entry strong');
    const dailySpan = document.querySelector('.daily-entry span');
    if (title) title.innerHTML = '완자 범위를<br>처음부터 이해하기';
    if (desc) desc.textContent = '공식을 외우기 전에 왜 그런지부터. 선수개념 → 직관 → 그림 → 풀이 순서 → 함정 → 확인 문제까지 사이트 안에서 끝낸다.';
    if (dailyStrong) dailyStrong.textContent = '개념 학습 후 실전 문제';
    if (dailySpan) dailySpan.textContent = '먼저 위 학습 트리에서 실제로 이해한 개념을 쌓고, 그 다음 표·그래프·계산 문제로 확인한다.';
    const footer = document.querySelector('.footer-note');
    if (footer) footer.innerHTML = `진도는 <b>실제로 맞혀 통과한 개념만</b> 저장돼. 이전 테스트 진행률은 새 학습 진도에 포함하지 않아. · <button class="reset-study" id="resetStudy">진도 0%로 다시 시작</button>`;
  }

  function totalStats() {
    let total = 0, done = 0;
    for (const track of tracks) for (const unit of track.units) {
      total += unit.lesson.length;
      done += doneCount(track, unit);
    }
    const percent = total ? Math.round(done / total * 100) : 0;
    const pct = document.getElementById('pct');
    const bar = document.getElementById('bar');
    if (pct) pct.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  function renderTrack() {
    const track = currentTrack();
    if (!track) return;
    trackEl.className = track.id === 'chemistry' ? 'chem' : '';
    trackEl.innerHTML = `
      <div class="track-head">
        <div><h2>${track.subject}</h2><p>${track.range}</p></div>
        <div class="meta">날짜 진도 X · 실제 이해 기준</div>
      </div>
      <div class="unit-list">
        ${track.units.map((unit, index) => {
          const done = doneCount(track, unit);
          const unlocked = unitUnlocked(track, index);
          const stars = Math.round(3 * done / unit.lesson.length);
          const mistakes = mistakesCount(track, unit);
          return `<article class="clay unit ${unlocked ? '' : 'locked'}" data-unit-index="${index}" aria-disabled="${unlocked ? 'false' : 'true'}">
            <div class="unit-top"><div class="unit-num">${index + 1}</div>${done >= unit.lesson.length ? '<span class="badge">이해 완료</span>' : ''}</div>
            <h3>${unit.title}</h3>
            <div class="meta">약 ${unit.minutes}분 · ${done}/${unit.lesson.length}개 실제 통과</div>
            <div class="stars">${[0,1,2].map(i => `<span class="star ${i < stars ? 'on' : ''}">★</span>`).join('')}</div>
            ${mistakes ? `<div class="weak">헷갈렸던 개념 ${mistakes}회 · 다시 설명 제공</div>` : '<div class="real-progress">처음 보는 기준으로 설명</div>'}
          </article>`;
        }).join('')}
      </div>`;
    totalStats();
  }

  function renderVisual(v) {
    if (!v) return '';
    if (v.type === 'formula') return `<div class="visual"><div class="formula">${v.text}</div></div>`;
    if (v.type === 'split') return `<div class="visual"><div class="split"><div>${v.left}</div><div>${v.right}</div></div></div>`;
    if (v.type === 'trajectory') return `<div class="visual"><div class="trajectory"><span>${v.label || ''}</span></div></div>`;
    if (v.type === 'circle') return `<div class="visual"><div class="circle-v"><span>${v.label || ''}</span></div></div>`;
    if (v.type === 'chips') return `<div class="visual"><div class="chips">${(v.items || []).map(item => `<div class="chip">${item}</div>`).join('')}</div></div>`;
    if (v.type === 'chain') return `<div class="visual"><div class="formula compact-formula">${v.text}</div></div>`;
    if (v.type === 'vector') return `<div class="visual"><div class="split"><div>${v.a}</div><div>${v.b}</div></div></div>`;
    return `<div class="visual"><div class="micro-label">핵심 자료</div><div>${v.text || v.label || '자료를 보고 관계를 먼저 읽는다.'}</div></div>`;
  }

  function openUnit(index) {
    const track = currentTrack();
    if (!track || !unitUnlocked(track, index)) return;
    currentUnit = track.units[index];
    home.classList.add('hide');
    study.classList.add('show');
    renderLesson();
    window.scrollTo(0, 0);
  }

  function renderLesson() {
    const track = currentTrack();
    if (!track || !currentUnit) return;
    const done = doneCount(track, currentUnit);
    if (done >= currentUnit.lesson.length) return renderCelebrate();

    const lesson = currentUnit.lesson[done];
    const guide = tutor[currentUnit.id] || {};
    selected = null;
    mastered = false;
    rescueOpen = false;
    const subjectRule = track.id === 'physics'
      ? '물리 시작 습관: 그림 → 주어진 값 → 구할 값 → 단위 → 방향/부호'
      : '화학 시작 습관: 조건 → 단위 → 상태 → 부호 → 반응식 계수';

    lessonEl.innerHTML = `
      <article class="clay lesson-card">
        <div class="lesson-kicker">${currentUnit.title} · ${done + 1}/${currentUnit.lesson.length}</div>
        <h2>${lesson.title}</h2>
        <div class="study-rule">${subjectRule}</div>

        <section class="tutor-note"><span class="micro-label">① 30초 선수개념</span><br><b>여기까지만 알고 시작</b><br>${guide.prereq || '지금 화면의 설명에 필요한 내용만 확인하고 시작한다.'}</section>

        <section class="tutor-section">
          <h3>② 먼저 감으로 이해</h3>
          <p>${lesson.body}</p>
        </section>

        ${renderVisual(lesson.visual)}

        <div class="tutor-grid">
          <section class="tutor-section">
            <h3>③ 왜 이렇게 되는가</h3>
            <p>${guide.why || lesson.body}</p>
          </section>
          <section class="tutor-section worked">
            <h3>④ 아주 쉬운 예시</h3>
            <p>${guide.worked || '주어진 조건을 하나씩 표시한 뒤 핵심 관계를 적용한다.'}</p>
          </section>
        </div>

        <section class="tutor-section">
          <h3>⑤ 시험에서 푸는 순서</h3>
          <ol>${(guide.method || ['조건을 표시한다.','필요한 관계를 고른다.','단위와 부호를 확인한다.']).map(step=>`<li>${step}</li>`).join('')}</ol>
        </section>

        <section class="tutor-section trap">
          <h3>⑥ 정동고 내신에서 걸리기 쉬운 함정</h3>
          <p>${guide.trap || lesson.check.explanation}</p>
        </section>

        <button class="rescue-toggle" type="button" data-action="rescue">아직 이해 안 됨 · 더 쉽게 다시 설명</button>
        <div class="rescue" id="rescue"><b>다른 방식으로 보면</b><br>${guide.rescue || lesson.check.explanation}</div>

        <div class="check">
          <h3>⑦ 이제 딱 하나만 직접 판단</h3>
          <div class="choices">${lesson.check.choices.map((choice, i) => `<button class="choice" data-c="${i}">${choice}</button>`).join('')}</div>
          <div class="feedback" id="feedback"></div>
          <div class="actions"><button class="btn primary" id="grade" data-action="grade" disabled>내 답 확인</button></div>
        </div>
        <div class="source-note">시험범위: ${track.range}. 설명은 현재 단원 이해에 필요한 범위만 사용하며, 다음 잠금 단원의 지식을 선행 요구하지 않는다.</div>
      </article>`;
  }

  function toggleRescue(forceOpen = false) {
    rescueOpen = forceOpen ? true : !rescueOpen;
    document.getElementById('rescue')?.classList.toggle('show', rescueOpen);
    const button = lessonEl.querySelector('.rescue-toggle');
    if (button) button.textContent = rescueOpen ? '쉬운 설명 접기' : '아직 이해 안 됨 · 더 쉽게 다시 설명';
    if (forceOpen) document.getElementById('rescue')?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function choose(choiceButton) {
    if (mastered) return;
    selected = Number(choiceButton.dataset.c);
    lessonEl.querySelectorAll('.choice').forEach(button => button.classList.remove('selected', 'bad'));
    choiceButton.classList.add('selected');
    const grade = document.getElementById('grade');
    if (grade) grade.disabled = false;
  }

  function recordMistake(track, unit, stepIndex) {
    const key = progressKey(track.id, unit.id);
    const existing = state[key] || {};
    const mistakes = {...(existing.mistakes || {})};
    mistakes[stepIndex] = (mistakes[stepIndex] || 0) + 1;
    state[key] = {...existing, mistakes};
    save();
  }

  function grade() {
    if (selected === null || mastered) return;
    const track = currentTrack();
    if (!track || !currentUnit) return;
    const done = doneCount(track, currentUnit);
    const lesson = currentUnit.lesson[done];
    if (!lesson) return;
    const feedback = document.getElementById('feedback');
    const gradeButton = document.getElementById('grade');

    if (selected !== lesson.check.answer) {
      const wrongButton = lessonEl.querySelector(`.choice[data-c="${selected}"]`);
      wrongButton?.classList.add('bad');
      recordMistake(track, currentUnit, done);
      if (feedback) {
        feedback.className = 'feedback show bad';
        feedback.innerHTML = `<b>이 개념은 아직 통과 처리하지 않아.</b> ${lesson.check.explanation}<span class="rescue-inline">아래에 다른 방식의 설명을 열었어. 읽고 바로 다시 골라봐.</span>`;
      }
      selected = null;
      if (gradeButton) gradeButton.disabled = true;
      toggleRescue(true);
      return;
    }

    mastered = true;
    lessonEl.querySelectorAll('.choice').forEach((button, i) => {
      button.classList.remove('selected', 'bad');
      if (i === lesson.check.answer) button.classList.add('good');
      button.disabled = true;
    });
    if (feedback) {
      feedback.className = 'feedback show good';
      feedback.innerHTML = `<b>통과.</b> ${lesson.check.explanation}<br>정답 하나를 외운 게 아니라 위 풀이 순서까지 설명할 수 있으면 이 개념은 제대로 잡힌 거야.`;
    }

    const key = progressKey(track.id, currentUnit.id);
    state[key] = { ...(state[key] || {}), doneSteps: done + 1, lastStudiedAt: new Date().toISOString() };
    save();
    totalStats();

    if (gradeButton) {
      gradeButton.disabled = false;
      gradeButton.dataset.action = 'continue';
      gradeButton.textContent = done + 1 >= currentUnit.lesson.length ? '단원 완료 보기' : '다음 개념으로';
    }
  }

  function continueLesson() {
    const track = currentTrack();
    if (!track || !currentUnit) return;
    if (doneCount(track, currentUnit) >= currentUnit.lesson.length) renderCelebrate();
    else renderLesson();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderCelebrate() {
    const track = currentTrack();
    const mistakes = track && currentUnit ? mistakesCount(track,currentUnit) : 0;
    lessonEl.innerHTML = `<div class="clay celebrate show">
      <div class="big">✓</div>
      <h2>${currentUnit.title} 이해 완료</h2>
      <p>${currentUnit.lesson.length}개 개념을 설명→확인까지 실제로 통과했어.${mistakes ? ` 중간에 헷갈린 기록 ${mistakes}회도 저장했어. 나중에 오답 복습에 다시 쓰면 돼.` : ''}</p>
      <span class="xp">+ ${currentUnit.lesson.length * 20} XP</span>
      <div class="actions completion-actions"><button class="btn primary" data-action="home">다음 단원 보기</button></div>
    </div>`;
    totalStats();
  }

  function backHome() {
    study.classList.remove('show');
    home.classList.remove('hide');
    currentUnit = null;
    selected = null;
    mastered = false;
    rescueOpen = false;
    renderTrack();
    window.scrollTo(0, 0);
  }

  function resetStudy() {
    const ok = window.confirm('실제 학습 진도를 0%로 초기화할까? 문제 세트 기록은 지워지지 않아.');
    if (!ok) return;
    state = {};
    localStorage.removeItem(storageKey);
    renderTrack();
    totalStats();
  }

  trackEl.addEventListener('click', event => {
    const card = event.target.closest('.unit');
    if (!card || card.classList.contains('locked')) return;
    openUnit(Number(card.dataset.unitIndex));
  });

  lessonEl.addEventListener('click', event => {
    const choice = event.target.closest('.choice');
    if (choice) return choose(choice);
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'grade') grade();
    else if (action === 'continue') continueLesson();
    else if (action === 'home') backHome();
    else if (action === 'rescue') toggleRescue();
  });

  back?.addEventListener('click', backHome);
  document.addEventListener('click', event => {
    if (event.target?.id === 'resetStudy') resetStudy();
  });
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    currentTrackId = button.dataset.track;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderTrack();
  }));

  injectTutorStyles();
  updateHomeCopy();
  renderTrack();
})();