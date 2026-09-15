(() => {
  const tracks = Array.isArray(window.LEARNING_TRACKS) ? window.LEARNING_TRACKS : [];
  const home = document.getElementById('home');
  const study = document.getElementById('study');
  const trackEl = document.getElementById('track');
  const lessonEl = document.getElementById('lesson');
  const back = document.getElementById('back');
  const storageKey = 'science-step-progress-v2';
  const examDate = new Date('2026-09-28T00:00:00+09:00');

  let state = {};
  try { state = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { state = {}; }
  let currentTrackId = tracks[0]?.id || 'physics';
  let currentUnitIndex = null;
  let selected = null;
  let mastered = false;
  let rescueOpen = false;
  let recallOpen = false;

  const guides = {
    'p-vector':{prereq:'숫자만 있는 값과 방향까지 필요한 값을 구분하면 된다. 오른쪽·위쪽을 +로 잡듯 기준 방향을 먼저 하나 정한다.',why:'힘은 방향이 있는 양이다. 복잡한 힘 문제도 결국 화살표를 x, y축 숫자로 바꾸는 작업으로 단순해진다.',method:['그림에 힘 화살표 표시','+방향 결정','x·y 성분으로 분해','같은 축끼리 부호 포함 합','크기와 방향으로 다시 해석'],worked:'오른쪽 8 N, 왼쪽 3 N이면 오른쪽을 +로 잡아 +8+(-3)=+5 N. 정답은 “5 N”이 아니라 “오른쪽 5 N”이다.',trap:'반대 방향을 그냥 더하거나 수직인 3 N과 4 N을 7 N으로 처리하는 실수가 가장 흔하다.',rescue:'벡터는 “얼마나?”와 “어디로?”가 한 세트다. 지도에서 5 km만 말하면 목적지를 못 찾는 것과 같다.',recall:['힘 5 N이라고만 쓰면 무엇이 빠졌을까?','방향이다. 힘은 크기와 방향이 모두 있어야 완전히 정해진다.']},
    'p-projectile':{prereq:'한 물체의 움직임을 가로와 세로로 따로 볼 수 있다는 것만 필요하다. 두 운동은 같은 시간 동안 동시에 일어난다.',why:'공기 저항을 무시하면 중력은 아래쪽으로만 작용한다. 그래서 가로 운동과 세로 운동을 분리하면 포물선이 훨씬 단순해진다.',method:['궤적과 축 그리기','v를 vₓ·vᵧ로 분해','aₓ=0, aᵧ=-g 표시','공통 시간 t로 각각 계산','두 방향 결과를 함께 해석'],worked:'수평으로 던진 공은 세로 방향으로는 자유낙하다. 먼저 h=½gt²로 시간을 구하고 x=vₓt로 가로 거리를 구한다.',trap:'최고점에서 vᵧ=0인 것을 “속도 전체가 0” 또는 “가속도도 0”으로 착각하지 않는다.',rescue:'영상을 두 장 겹쳐 본다고 생각하면 된다. 가로 영상은 일정한 속도, 세로 영상은 자유낙하다.',recall:['포물선 최고점에서 0이 되는 것은 정확히 무엇일까?','수직 속도 성분 vᵧ만 0이다. vₓ와 아래쪽 중력가속도는 남는다.']},
    'p-circle':{prereq:'속력은 숫자, 속도는 방향까지 포함한다. 따라서 속력이 일정해도 방향이 바뀌면 속도는 변한다.',why:'원을 따라가려면 진행 방향을 계속 중심 쪽으로 꺾어야 한다. 그 변화율이 구심가속도다.',method:['원의 중심 표시','v는 접선 방향','a와 합력은 중심 방향','a=v²/r 또는 v=2πr/T 선택','비례관계로 먼저 예상 후 계산'],worked:'r이 같고 v가 2배면 a=v²/r이므로 구심가속도는 4배다.',trap:'구심력은 새로운 종류의 힘이 아니다. 장력·중력·마찰력 등의 합력이 중심 방향일 때 그 합력을 구심력이라고 부른다.',rescue:'원형 트랙에서 핸들을 놓으면 차는 원을 계속 돌지 않고 접선 방향으로 나간다. 계속 안쪽으로 꺾이는 정도가 구심가속도다.',recall:['등속 원운동에서 가속도가 존재하는 이유는?','속력은 일정해도 속도 방향이 계속 바뀌기 때문이다.']},
    'p-gravity':{prereq:'제곱에 반비례는 거리가 2배면 1/4, 3배면 1/9이 되는 관계다.',why:'케플러 법칙은 천체가 어떻게 움직이는지를, 만유인력은 왜 그렇게 움직이는지를 연결한다.',method:['중심천체·궤도 그림','현재거리 r와 긴반지름 a 구분','힘이면 1/r², 주기면 T²∝a³','비율로 계산','같은 중심천체 조건 확인'],worked:'같은 별에서 a가 4배면 T²은 64배, 따라서 T는 8배다.',trap:'케플러 제3법칙의 a는 “지금 별에서 떨어진 거리”가 아니라 타원 궤도의 긴반지름이다.',rescue:'중력은 멀어질수록 빠르게 약해지고, 더 큰 궤도일수록 한 바퀴 도는 데 훨씬 오래 걸린다.',recall:['거리 r가 2배가 되면 중력의 크기는?','1/r²에 비례하므로 1/4배가 된다.']},
    'p-escape':{prereq:'운동에너지 ½mv²와, 천체에서 멀어질수록 중력 퍼텐셜 에너지가 0에 가까워진다는 감각만 있으면 된다.',why:'탈출 속도는 추가 추진 없이도 다시 끌려오지 않을 최소 초기 속력을 에너지 보존으로 찾은 값이다.',method:['출발 중심거리 R 확인','천체 질량 M 확인','vₑ=√(2GM/R)','배수는 M/R부터 비교','마지막에 제곱근'],worked:'같은 반지름에서 천체 질량이 4배면 M/R이 4배이므로 탈출 속도는 2배다.',trap:'발사체 질량은 식에서 사라진다. 무거운 물체라고 탈출 속도가 더 큰 것이 아니다.',rescue:'언덕 위로 공을 더 세게 던질수록 더 멀리 간다. 결국 다시 내려오지 않는 경계의 시작 속력이 탈출 속도다.',recall:['탈출 속도 식에 발사체 질량 m이 없는 이유는?','에너지식 양쪽에 m이 공통으로 들어가 약분되기 때문이다.']},
    'p-relativity':{prereq:'가속은 속도의 크기나 방향이 변하는 것이고, 중력은 질량 주변에서 나타나는 현상이라는 정도만 필요하다.',why:'일반 상대성 이론은 중력을 단순한 당기는 힘이 아니라 질량·에너지가 시공간 구조를 바꾸는 현상으로 설명한다.',method:['중력 세기 비교','등가 원리 상황 확인','빛의 경로 판단','시간 흐름 비교','관측자료를 렌즈·시간지연과 연결'],worked:'질량이 큰 천체 근처와 먼 곳의 시계를 비교하면 강한 중력장에 있는 시계가 더 느리게 간다.',trap:'등가 원리를 “모든 상황에서 중력과 가속이 완전히 같다”로 확대하면 안 된다. 핵심은 국소적 동등성이다.',rescue:'팽팽한 천 위에 무거운 공을 올리면 주변 길이 휘어진다. 실제 시공간은 더 복잡하지만 “질량이 길을 바꾼다”는 직관에는 도움이 된다.',recall:['중력이 더 강한 곳의 시간은 어떻게 흐를까?','멀리 떨어진 곳과 비교하면 더 느리게 흐른다.']},
    'c-gas':{prereq:'기체 입자는 계속 움직이며 용기 벽과 충돌해 압력을 만든다. 기체 법칙의 온도는 절대온도 K를 사용한다.',why:'압력 P, 부피 V, 온도 T, 몰수 n은 따로 움직이는 값이 아니라 PV=nRT로 연결된다.',method:['일정한 조건 표시','단위 확인','P·V·T·n 정리','알맞은 기체 법칙 선택','증가·감소 방향 검산'],worked:'T와 n이 일정한데 V가 절반이면 PV가 일정하므로 P는 2배가 된다.',trap:'샤를 법칙이나 이상기체식에서 섭씨온도를 그대로 비례식에 넣지 않는다.',rescue:'피스톤 안의 작은 공들이 벽을 두드린다고 생각하자. 공간을 줄이면 같은 공들이 벽을 더 자주 때려 압력이 커진다.',recall:['기체 법칙 계산에서 섭씨온도 대신 무엇을 써야 할까?','절대온도 K를 써야 한다.']},
    'c-mixture':{prereq:'몰수는 입자 수를 세는 단위다. 혼합되어도 각 기체는 자기 몫의 압력을 만든다.',why:'전체 압력은 각 성분의 부분 압력 합이고, 같은 온도·부피에서는 부분 압력이 몰분율에 비례한다.',method:['전체 몰수 계산','몰분율 Xᵢ=nᵢ/nₜ','Pᵢ=XᵢPₜ','부분압력 합 검산','물 위 포집이면 수증기압 제외'],worked:'A 1 mol, B 3 mol이 전체 8 atm이면 A의 몰분율은 1/4, 부분압력은 2 atm이다.',trap:'물 위에서 포집한 기체의 측정 압력에는 수증기 압력이 포함된다.',rescue:'피자 네 조각 중 한 조각이 A라면 A의 몫은 1/4이다. 전체 압력에서도 같은 비율을 차지한다.',recall:['부분 압력의 합은 무엇과 같을까?','혼합 기체의 전체 압력과 같다.']},
    'c-liquid':{prereq:'분자 사이에도 끌어당기는 힘이 있고, 그 힘이 강할수록 분자들이 기체로 빠져나가기 어렵다.',why:'액체의 증기압·끓는점·표면 성질은 분자 사이 힘과 동적 평형으로 연결된다.',method:['극성·수소결합 가능성 확인','분자간 힘 비교','증기압과 끓는점 반대 방향 연결','온도·외부압력 확인','평형에서 증발·응축 동시 확인'],worked:'분자 사이 힘이 강할수록 같은 온도에서 증기압은 낮고, 끓는점은 높아지는 경향이 있다.',trap:'끓는점은 “증기압이 1 atm이 되는 온도”가 아니라 그 순간의 외부 압력과 같아지는 온도다.',rescue:'분자들이 서로 손을 꽉 잡고 있으면 액체 밖으로 도망가기 어렵다. 그래서 증기압은 낮고 더 뜨겁게 해야 끓는다.',recall:['분자 사이 힘이 강해지면 일반적으로 증기압은 어떻게 될까?','낮아진다. 끓는점은 반대로 높아지는 경향이 있다.']},
    'c-solid':{prereq:'고체를 구분할 때는 “무엇이 배열되어 있고 무엇이 그들을 붙잡는가”를 보면 된다.',why:'이온·금속·분자·공유결합 결정의 성질은 구성 입자와 결합 방식에서 나온다.',method:['구성입자 확인','결합 종류 확인','녹는점·단단함 비교','전도성 상태 확인','예외 그래파이트 점검'],worked:'이온 결정은 고체에서 이온이 움직이지 못해 전도하지 않지만, 용융 상태에서는 이온이 이동해 전도한다.',trap:'이온 결정이 “전하를 가진 입자로 이루어졌다”는 이유만으로 고체 상태에서도 전도한다고 판단하면 안 된다.',rescue:'전기가 흐르려면 전하를 가진 입자가 “움직일 수 있어야” 한다. 고체 이온 결정에서는 자리에 묶여 있다.',recall:['이온 결정이 용융 상태에서 전도하는 이유는?','이온이 자유롭게 이동할 수 있기 때문이다.']},
    'c-enthalpy':{prereq:'열이 계에서 주위로 나가면 발열, 주위에서 계로 들어오면 흡열이다. 상태 기호도 반응식 정보의 일부다.',why:'반응 엔탈피는 반응 전후 계의 에너지 차이를 숫자와 부호로 표현한다.',method:['반응물·생성물 상태 확인','계수 확인','ΔH 부호 확인','열화학식의 양과 ΔH 함께 배수','역반응이면 부호 반전'],worked:'ΔH=-100 kJ인 반응식을 2배 하면 ΔH=-200 kJ, 역반응으로 뒤집으면 +100 kJ가 된다.',trap:'반응식의 계수만 바꾸고 ΔH를 그대로 두면 안 된다. 상태가 바뀌어도 ΔH가 달라질 수 있다.',rescue:'ΔH는 “반응 1세트당 에너지 영수증”이다. 반응을 두 세트 하면 영수증 금액도 두 배다.',recall:['발열 반응의 ΔH 부호는?','음수(ΔH<0)다.']},
    'c-hess':{prereq:'엔탈피는 처음 상태와 끝 상태가 같으면 중간 경로와 상관없이 전체 변화량이 같다는 성질을 이용한다.',why:'직접 측정하기 어려운 반응 엔탈피도 다른 반응식을 조합해 계산할 수 있다.',method:['목표 반응식 먼저 작성','필요한 식 뒤집기','계수 맞춰 배수','중간물질 소거 확인','ΔH도 같은 연산으로 합'],worked:'A→B가 +20 kJ, B→C가 -50 kJ이면 A→C는 두 식을 더해 -30 kJ다.',trap:'반응식을 뒤집었는데 ΔH 부호를 안 바꾸거나, 식을 2배 했는데 ΔH를 그대로 두는 실수가 핵심 함정이다.',rescue:'길을 여러 구간으로 나눠 가도 출발점과 도착점의 고도 차는 같다. 헤스 법칙도 같은 생각이다.',recall:['반응식을 역반응으로 뒤집으면 ΔH는 어떻게 될까?','크기는 같고 부호가 반대로 바뀐다.']},
    'c-spontaneous':{prereq:'계와 주위를 구분하고, 입자가 더 넓게 퍼질수록 가능한 미시상태 수가 커진다는 정도만 알면 된다.',why:'자발성은 계 하나의 엔트로피가 아니라 계+주위를 합친 전체 엔트로피 변화로 판단한다.',method:['계·주위 구분','ΔH계 부호 확인','ΔS계 방향 확인','ΔS주위 방향 연결','ΔS전체 부호로 최종 판단'],worked:'발열 반응은 주위에 열을 주므로 일반적으로 ΔS주위가 증가하는 방향이다. 하지만 자발성은 ΔS전체로 판단한다.',trap:'“발열이면 무조건 자발” 또는 “ΔS계>0이면 무조건 자발”이라고 단정하면 안 된다.',rescue:'방 안만 보면 더 정돈돼도, 정리하면서 밖으로 더 큰 어지러움을 만들 수 있다. 전체를 봐야 판단할 수 있다는 뜻이다.',recall:['자발성 판단에서 최종적으로 봐야 하는 엔트로피는?','계와 주위를 합친 전체 엔트로피 변화다.']}
  };

  const progressKey = (trackId, unitId) => `${trackId}:${unitId}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const currentTrack = () => tracks.find(t => t.id === currentTrackId);
  const currentUnit = () => currentTrack()?.units?.[currentUnitIndex] || null;
  const doneCount = (track, unit) => Math.min(state[progressKey(track.id, unit.id)]?.doneSteps || 0, unit.lesson.length);
  const unitUnlocked = (track, index) => index === 0 || doneCount(track, track.units[index - 1]) >= track.units[index - 1].lesson.length;
  const mistakeCount = (track, unit, step) => state[progressKey(track.id, unit.id)]?.mistakes?.[step] || 0;
  const totalLessons = () => tracks.reduce((s,t)=>s+t.units.reduce((u,x)=>u+x.lesson.length,0),0);
  const totalDone = () => tracks.reduce((s,t)=>s+t.units.reduce((u,x)=>u+doneCount(t,x),0),0);

  function remainingMinutes(){
    let minutes=0;
    for(const track of tracks) for(const unit of track.units){
      const remain=Math.max(0,unit.lesson.length-doneCount(track,unit));
      minutes += remain * Math.max(2, Math.round((unit.minutes || unit.lesson.length*3)/unit.lesson.length));
    }
    return minutes;
  }

  function daysLeft(){
    const now=new Date();
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const exam=new Date(examDate.getFullYear(),examDate.getMonth(),examDate.getDate());
    return Math.max(0,Math.ceil((exam-today)/86400000));
  }

  function nextTarget(track=currentTrack()){
    if(!track) return null;
    for(let i=0;i<track.units.length;i++){
      const unit=track.units[i];
      if(unitUnlocked(track,i) && doneCount(track,unit)<unit.lesson.length) return {track,unit,index:i,step:doneCount(track,unit)};
    }
    return null;
  }

  function renderDashboard(){
    const total=totalLessons(); const done=totalDone(); const remain=total-done; const pct=total?Math.round(done/total*100):0;
    const d=daysLeft(); const target=Math.max(1,Math.ceil(remain/Math.max(1,d||1))); const mins=remainingMinutes();
    document.getElementById('pct').textContent=`${pct}%`;
    document.getElementById('bar').style.width=`${pct}%`;
    document.getElementById('progressText').textContent=`${done} / ${total}개 이해 완료`;
    document.getElementById('etaText').textContent=mins?`남은 순수 학습 약 ${Math.floor(mins/60)}시간 ${mins%60}분`:'개념 1회독 완료';
    document.getElementById('daysLeft').textContent=d?`D-${d}`:'시험일';
    document.getElementById('remainingSteps').textContent=`${remain}개`;
    document.getElementById('dailyTarget').textContent=remain?`${target}개`:'복습';
    const next=nextTarget();
    const label=document.getElementById('continueLabel');
    const btn=document.getElementById('continueStudy');
    if(next){label.textContent=`${next.unit.title} · ${next.step+1}번째 개념`;btn.disabled=false;btn.textContent=next.step?'이어서 공부하기 →':'이 단원 시작하기 →';}
    else {label.textContent='이 과목 1회독 완료';btn.disabled=true;btn.textContent='다른 과목 또는 실전 문제로';}
  }

  function renderTrack(){
    const track=currentTrack(); if(!track) return;
    trackEl.className=track.id==='chemistry'?'chem':'';
    const tDone=track.units.reduce((s,u)=>s+doneCount(track,u),0); const tTotal=track.units.reduce((s,u)=>s+u.lesson.length,0);
    trackEl.innerHTML=`<div class="track-head"><div><h2>${track.subject}</h2><p>${track.range}</p></div><div class="track-summary">${tDone}/${tTotal}개 완료<br>${track.sourceNote||''}</div></div><div class="unit-list">${track.units.map((unit,index)=>{
      const done=doneCount(track,unit); const unlocked=unitUnlocked(track,index); const pct=Math.round(done/unit.lesson.length*100);
      const status=done>=unit.lesson.length?'완료':unlocked?(done?'진행 중':'시작 가능'):'잠김';
      const next=done>=unit.lesson.length?'이 단원 개념 확인 완료':unlocked?`${done+1}번째 개념부터 공부`:'앞 단원을 먼저 완료';
      return `<article class="clay unit-card ${unlocked?'':'locked'}" data-unit-index="${index}" aria-disabled="${unlocked?'false':'true'}"><div class="unit-top"><div class="unit-index">${index+1}</div><span class="status ${done>=unit.lesson.length?'done':''}">${status}</span></div><h3>${unit.title}</h3><div class="unit-meta">약 ${unit.minutes}분 · ${done}/${unit.lesson.length}개 이해</div><div class="unit-progress"><div class="mini-bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div><div class="unit-next">${next}</div></article>`;
    }).join('')}</div>`;
    renderDashboard();
  }

  function renderVisual(v){
    if(!v) return '';
    if(v.type==='formula') return `<div class="visual"><div class="formula">${v.text}</div></div>`;
    if(v.type==='chain') return `<div class="visual"><div class="formula">${v.text}</div></div>`;
    if(v.type==='split') return `<div class="visual"><div class="split"><div>${v.left}</div><div>${v.right}</div></div></div>`;
    if(v.type==='chips') return `<div class="visual"><div class="chips">${(v.items||[]).map(x=>`<div class="chip">${x}</div>`).join('')}</div></div>`;
    if(v.type==='vector') return `<div class="visual"><div class="vector-stage"><div class="arrow-card">${v.a||'→'}</div><div class="arrow-card">${v.b||'←'}</div></div></div>`;
    if(v.type==='trajectory') return `<div class="visual"><svg class="trajectory-svg" viewBox="0 0 520 180" role="img" aria-label="포물선 운동 그림"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#526cff"/></marker></defs><path d="M35 150 Q260 8 485 150" fill="none" stroke="#8ea0ff" stroke-width="5"/><circle cx="260" cy="78" r="7" fill="#526cff"/><line x1="260" y1="78" x2="330" y2="78" stroke="#526cff" stroke-width="4" marker-end="url(#ah)"/><line x1="260" y1="78" x2="260" y2="135" stroke="#b64556" stroke-width="4" marker-end="url(#ah)"/><text x="260" y="48" text-anchor="middle" font-size="13" font-weight="800">${v.label||'최고점에서도 가속도는 아래쪽'}</text></svg></div>`;
    if(v.type==='circle') return `<div class="visual"><svg class="circle-svg" viewBox="0 0 420 210" role="img" aria-label="등속 원운동 그림"><defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#526cff"/></marker></defs><circle cx="200" cy="108" r="70" fill="none" stroke="#9aabff" stroke-width="5"/><circle cx="200" cy="108" r="5" fill="#667085"/><circle cx="270" cy="108" r="8" fill="#526cff"/><line x1="270" y1="108" x2="270" y2="48" stroke="#526cff" stroke-width="4" marker-end="url(#ah2)"/><line x1="270" y1="108" x2="218" y2="108" stroke="#b64556" stroke-width="4" marker-end="url(#ah2)"/><text x="285" y="52" font-size="12" font-weight="800">v 접선</text><text x="220" y="132" font-size="12" font-weight="800">a 중심</text><text x="210" y="197" text-anchor="middle" font-size="12">${v.label||''}</text></svg></div>`;
    return '';
  }

  function habitChips(track){
    const items=track.id==='physics'?['그림','주어진 값','구할 값','단위','방향·부호']:['조건','단위','상태','부호','반응식 계수'];
    return `<div class="study-rule">${items.map(x=>`<span class="rule-chip">${x}</span>`).join('')}</div>`;
  }

  function openUnit(index){
    const track=currentTrack(); if(!track||!unitUnlocked(track,index)) return;
    currentUnitIndex=index; home.classList.add('hide'); study.classList.add('show'); renderLesson(); window.scrollTo(0,0);
  }

  function renderLesson(){
    const track=currentTrack(); const unit=currentUnit(); if(!track||!unit) return;
    const done=doneCount(track,unit); if(done>=unit.lesson.length) return renderCelebrate();
    const lesson=unit.lesson[done]; const g=guides[unit.id]||{}; selected=null; mastered=false; rescueOpen=false; recallOpen=false;
    const pos=document.getElementById('lessonPosition'); if(pos) pos.textContent=`${track.subject} · ${unit.title} · ${done+1}/${unit.lesson.length}`;
    lessonEl.innerHTML=`<article class="clay lesson-card">
      <div class="lesson-kicker">${track.subject} · ${unit.title}</div>
      <h1>${lesson.title}</h1>
      <p class="lesson-lead">한 화면에서 외우지 말고, 아래 순서대로 이유를 따라가면 된다.</p>
      <div class="lesson-strip"><div class="strip-item"><span>이번 목표</span><b>${lesson.title}</b></div><div class="strip-item"><span>현재 단계</span><b>${done+1} / ${unit.lesson.length}</b></div><div class="strip-item"><span>이 개념 오답</span><b>${mistakeCount(track,unit,done)}회</b></div></div>
      <div class="learn-flow">
        <section class="learn-block tutor-section"><div class="block-head"><span class="block-num">1</span><h3>30초 선수개념</h3></div><p>${g.prereq||'이 개념에 필요한 최소 선수개념만 확인한다.'}</p></section>
        <section class="learn-block tutor-section tutor-note"><div class="block-head"><span class="block-num">2</span><h3>핵심을 한 번에 이해</h3></div><p>${lesson.body}</p>${renderVisual(lesson.visual)}</section>
        <section class="learn-block tutor-section"><div class="block-head"><span class="block-num">3</span><h3>왜 이렇게 되는가</h3></div><p>${g.why||lesson.body}</p></section>
        <section class="learn-block tutor-section worked-example"><div class="block-head"><span class="block-num">4</span><h3>아주 쉬운 예제로 연결</h3></div><p>${g.worked||'핵심 관계를 쉬운 수치로 먼저 확인한다.'}</p></section>
        <section class="learn-block tutor-section"><div class="block-head"><span class="block-num">5</span><h3>시험 문제 풀이 루틴</h3></div><p>문제에서 바로 공식부터 쓰지 말고 아래 순서를 먼저 적는다.</p>${habitChips(track)}<div class="study-rule">${(g.method||[]).map((x,i)=>`<span class="rule-chip">${i+1}. ${x}</span>`).join('')}</div></section>
        <section class="learn-block tutor-section trap"><div class="block-head"><span class="block-num">6</span><h3>내신에서 틀리게 만드는 함정</h3></div><p>${g.trap||'조건과 단위를 끝까지 확인한다.'}</p></section>
      </div>
      <section class="recall-card"><h3>10초 회상</h3><p>${g.recall?.[0]||'방금 배운 내용을 한 문장으로 말해 봐.'}</p><button class="small-btn" data-action="recall">답 확인</button><div class="recall-answer" id="recallAnswer">${g.recall?.[1]||lesson.check.explanation}</div></section>
      <button class="rescue-toggle" data-action="rescue">아직 이해 안 됨 · 다른 방식으로 설명</button>
      <div class="rescue" id="rescue"><b>더 쉽게 다시 보기</b><br>${g.rescue||lesson.check.explanation}</div>
      <section class="check"><div class="check-head"><h3>이해 확인 · 맞혀야 다음 개념으로</h3><span class="mistakes">오답 ${mistakeCount(track,unit,done)}회</span></div><div class="choices">${lesson.check.choices.map((c,i)=>`<button class="choice" data-c="${i}">${c}</button>`).join('')}</div><div class="feedback" id="feedback"></div><div class="actions"><button class="btn primary" id="grade" data-action="grade" disabled>확인하기</button></div></section>
    </article>`;
  }

  function choose(btn){
    if(mastered) return; selected=Number(btn.dataset.c); lessonEl.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected','bad')); btn.classList.add('selected'); const grade=document.getElementById('grade'); if(grade) grade.disabled=false;
  }

  function recordMistake(track,unit,step){
    const key=progressKey(track.id,unit.id); const prev=state[key]||{}; const mistakes=Array.isArray(prev.mistakes)?[...prev.mistakes]:[]; mistakes[step]=(mistakes[step]||0)+1; state[key]={...prev,mistakes}; save();
  }

  function grade(){
    if(selected===null||mastered) return; const track=currentTrack(); const unit=currentUnit(); if(!track||!unit) return; const done=doneCount(track,unit); const lesson=unit.lesson[done]; if(!lesson) return;
    const feedback=document.getElementById('feedback'); const gradeBtn=document.getElementById('grade');
    if(selected!==lesson.check.answer){
      lessonEl.querySelector(`.choice[data-c="${selected}"]`)?.classList.add('bad'); recordMistake(track,unit,done); rescueOpen=true; document.getElementById('rescue')?.classList.add('show');
      if(feedback){feedback.className='feedback show bad';feedback.innerHTML=`<b>아직 통과 아님.</b> 정답만 외우지 말고 위의 <b>다른 방식 설명</b>을 보고 다시 골라.`;}
      selected=null; if(gradeBtn) gradeBtn.disabled=true; const badge=lessonEl.querySelector('.mistakes'); if(badge) badge.textContent=`오답 ${mistakeCount(track,unit,done)}회`; return;
    }
    mastered=true; lessonEl.querySelectorAll('.choice').forEach((b,i)=>{b.classList.remove('selected','bad');if(i===lesson.check.answer)b.classList.add('good');b.disabled=true;});
    if(feedback){feedback.className='feedback show good';feedback.innerHTML=`<b>통과.</b> ${lesson.check.explanation}`;}
    const key=progressKey(track.id,unit.id); state[key]={...(state[key]||{}),doneSteps:done+1}; save(); renderDashboard();
    if(gradeBtn){gradeBtn.disabled=false;gradeBtn.dataset.action='continue';gradeBtn.textContent=done+1>=unit.lesson.length?'단원 완료 →':'다음 개념 →';}
  }

  function continueLesson(){const track=currentTrack();const unit=currentUnit();if(!track||!unit)return;if(doneCount(track,unit)>=unit.lesson.length)renderCelebrate();else renderLesson();window.scrollTo({top:0,behavior:'smooth'});}

  function renderCelebrate(){
    const track=currentTrack(); const unit=currentUnit(); if(!track||!unit)return; const nextIndex=currentUnitIndex+1; const hasNext=nextIndex<track.units.length;
    lessonEl.innerHTML=`<section class="clay celebrate"><div class="icon">✓</div><h2>${unit.title} 완료</h2><p>읽기만 한 게 아니라 각 개념을 직접 맞혀서 통과했다.${hasNext?' 다음 단원이 열렸다.':' 이 과목의 개념 1회독이 끝났다.'}</p><div class="actions completion-actions"><button class="btn" data-action="home">학습 목록</button>${hasNext?'<button class="btn primary" data-action="next-unit">다음 단원 시작 →</button>':'<a class="btn primary" href="drill.html" style="text-decoration:none;text-align:center">실전 문제로 →</a>'}</div></section>`;
    renderDashboard();
  }

  function backHome(){study.classList.remove('show');home.classList.remove('hide');currentUnitIndex=null;selected=null;mastered=false;renderTrack();window.scrollTo(0,0);}

  trackEl.addEventListener('click',e=>{const card=e.target.closest('.unit-card');if(!card||card.classList.contains('locked'))return;openUnit(Number(card.dataset.unitIndex));});
  lessonEl.addEventListener('click',e=>{
    const choice=e.target.closest('.choice'); if(choice) return choose(choice);
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='grade')grade(); else if(action==='continue')continueLesson(); else if(action==='home')backHome();
    else if(action==='next-unit'){currentUnitIndex++;renderLesson();window.scrollTo(0,0);} 
    else if(action==='rescue'){rescueOpen=!rescueOpen;document.getElementById('rescue')?.classList.toggle('show',rescueOpen);} 
    else if(action==='recall'){recallOpen=!recallOpen;document.getElementById('recallAnswer')?.classList.toggle('show',recallOpen);e.target.textContent=recallOpen?'답 숨기기':'답 확인';}
  });
  back?.addEventListener('click',backHome);
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{currentTrackId=btn.dataset.track;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));renderTrack();}));
  document.getElementById('continueStudy')?.addEventListener('click',()=>{const next=nextTarget();if(next)openUnit(next.index);});
  document.getElementById('resetStudy')?.addEventListener('click',()=>{if(confirm('학습 진도와 개념별 오답 횟수를 0%로 초기화할까? 실전 문제 기록은 지워지지 않아.')){state={};save();renderTrack();}});

  renderTrack();
})();