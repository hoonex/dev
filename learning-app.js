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
    'p-vector':{icon:'↗',prereq:'숫자만 있는 값과 방향까지 필요한 값을 구분하면 된다. 오른쪽·위쪽을 +로 잡듯 기준 방향을 하나 정한다.',why:'힘은 방향이 있는 양이다. 복잡한 힘 문제도 결국 화살표를 x, y축 숫자로 바꾸면 단순해진다.',method:['힘 화살표 그리기','+방향 정하기','x·y 성분 분해','같은 축끼리 부호 포함 합','크기+방향으로 답 쓰기'],worked:'오른쪽 8 N, 왼쪽 3 N이면 +8+(-3)=+5 N. 답은 “5 N”만이 아니라 “오른쪽 5 N”이다.',trap:'반대 방향을 그냥 더하거나, 수직인 3 N과 4 N을 7 N으로 더하지 않는다.',rescue:'벡터는 “얼마나?”와 “어디로?”가 한 세트다. 지도에서 5 km만 말하면 목적지를 못 찾는 것과 같다.',recall:['힘 5 N이라고만 쓰면 무엇이 빠졌을까?','방향. 힘은 크기와 방향이 모두 있어야 완전히 정해진다.']},
    'p-projectile':{icon:'⌒',prereq:'한 물체의 움직임을 가로와 세로로 따로 볼 수 있으면 된다. 두 운동은 같은 시간 동안 동시에 일어난다.',why:'공기 저항을 무시하면 중력은 아래쪽으로만 작용한다. 그래서 가로 운동과 세로 운동을 분리하면 포물선이 단순해진다.',method:['궤적·축 그리기','v를 vₓ·vᵧ로 분해','aₓ=0, aᵧ=-g 표시','같은 t로 두 방향 계산','결과를 다시 합쳐 해석'],worked:'수평투사에서는 세로가 자유낙하다. h=½gt²로 시간을 먼저 구하고 x=vₓt로 가로 거리를 구한다.',trap:'최고점에서 vᵧ=0일 뿐, v 전체와 가속도까지 0이 되는 것은 아니다.',rescue:'동영상을 가로 영상과 세로 영상 두 장으로 나눠 본다고 생각하자. 가로는 일정하게, 세로는 떨어진다.',recall:['포물선 최고점에서 정확히 0이 되는 것은?','수직 속도 성분 vᵧ만 0이다. vₓ와 아래쪽 가속도는 남는다.']},
    'p-circle':{icon:'◉',prereq:'속력은 숫자만, 속도는 방향까지 포함한다. 속력이 일정해도 방향이 바뀌면 속도는 변한다.',why:'원을 따라가려면 진행 방향을 계속 중심 쪽으로 꺾어야 한다. 그 변화가 구심가속도다.',method:['원의 중심 표시','v는 접선으로','a·합력은 중심으로','a=v²/r 또는 v=2πr/T 선택','비례관계로 검산'],worked:'r이 같고 v가 2배면 a=v²/r이므로 구심가속도는 4배다.',trap:'구심력은 새로운 힘의 종류가 아니다. 실제 힘들의 합력이 중심 방향일 때 그 합력을 구심력이라 부른다.',rescue:'원형 트랙에서 핸들을 놓으면 차가 접선 방향으로 나간다. 계속 안쪽으로 꺾는 정도가 구심가속도다.',recall:['등속 원운동에 가속도가 있는 이유는?','속력은 일정하지만 속도 방향이 계속 바뀌기 때문이다.']},
    'p-gravity':{icon:'◎',prereq:'제곱에 반비례는 거리가 2배면 1/4, 3배면 1/9이 되는 관계다.',why:'케플러 법칙은 천체가 어떻게 움직이는지, 만유인력은 왜 그렇게 움직이는지 연결한다.',method:['중심천체·궤도 그리기','r와 긴반지름 a 구분','힘이면 1/r², 주기면 T²∝a³','비율로 계산','같은 중심천체인지 확인'],worked:'같은 별에서 a가 4배면 T²은 64배, 따라서 T는 8배다.',trap:'케플러 제3법칙의 a는 “현재 별과의 거리”가 아니라 타원 궤도의 긴반지름이다.',rescue:'중력은 멀어질수록 빠르게 약해지고, 더 큰 궤도를 돌수록 한 바퀴 시간이 훨씬 길어진다.',recall:['거리 r가 2배가 되면 중력은?','1/r² 관계이므로 1/4배가 된다.']},
    'p-escape':{icon:'↑',prereq:'운동에너지 ½mv²와, 천체에서 멀어질수록 중력 퍼텐셜 에너지가 0에 가까워진다는 감각만 있으면 된다.',why:'탈출 속도는 추가 추진 없이도 다시 끌려오지 않을 최소 초기 속력을 에너지 보존으로 찾은 값이다.',method:['출발 중심거리 R 확인','천체 질량 M 확인','vₑ=√(2GM/R)','M/R 비부터 비교','마지막에 제곱근'],worked:'같은 반지름에서 천체 질량이 4배면 M/R이 4배이므로 탈출 속도는 2배다.',trap:'발사체 질량 m은 최종 식에서 사라진다. 무거운 물체라고 탈출 속도가 더 큰 것이 아니다.',rescue:'언덕 위로 공을 더 세게 던질수록 더 멀리 간다. 결국 다시 내려오지 않는 경계의 시작 속력이 탈출 속도다.',recall:['탈출 속도 식에 발사체 질량 m이 없는 이유는?','에너지식 양쪽의 m이 약분되기 때문이다.']},
    'p-relativity':{icon:'◌',prereq:'가속은 속도의 크기나 방향이 변하는 것이고, 중력은 질량 주변에서 나타나는 현상이라는 정도만 필요하다.',why:'일반 상대성 이론은 중력을 단순한 당기는 힘이 아니라 질량·에너지가 시공간 구조를 바꾸는 현상으로 설명한다.',method:['중력 세기 비교','등가 원리 상황 확인','빛의 경로 판단','시간 흐름 비교','렌즈·시간지연 자료 연결'],worked:'강한 중력장에 있는 시계는 멀리 떨어진 곳의 시계보다 더 느리게 간다.',trap:'등가 원리를 모든 상황에서 중력과 가속이 완전히 같다는 뜻으로 확대하면 안 된다.',rescue:'팽팽한 천 위의 무거운 공처럼, 질량이 주변의 “길”을 바꾼다고 생각하면 시공간 휘어짐의 첫 감을 잡기 쉽다.',recall:['중력이 더 강한 곳의 시간은?','멀리 떨어진 곳과 비교하면 더 느리게 흐른다.']},
    'c-gas':{icon:'▣',prereq:'기체 입자는 계속 움직이며 용기 벽과 충돌해 압력을 만든다. 기체 법칙의 온도는 절대온도 K를 쓴다.',why:'압력 P, 부피 V, 온도 T, 몰수 n은 따로 움직이는 값이 아니라 PV=nRT로 연결된다.',method:['일정한 조건 표시','단위 확인','P·V·T·n 정리','알맞은 법칙 선택','증가·감소 방향 검산'],worked:'T와 n이 일정한데 V가 절반이면 PV가 일정하므로 P는 2배가 된다.',trap:'샤를 법칙이나 이상기체식에서 섭씨온도를 그대로 비례식에 넣지 않는다.',rescue:'피스톤 안 작은 공들이 벽을 두드린다고 생각하자. 공간을 줄이면 벽을 더 자주 때려 압력이 커진다.',recall:['기체 법칙 계산에서 섭씨온도 대신 무엇을 써야 할까?','절대온도 K를 써야 한다.']},
    'c-mixture':{icon:'●',prereq:'몰수는 입자 수를 세는 단위다. 혼합되어도 각 기체는 자기 몫의 압력을 만든다.',why:'전체 압력은 각 성분의 부분 압력 합이고, 같은 온도·부피에서는 부분 압력이 몰분율에 비례한다.',method:['전체 몰수 계산','몰분율 Xᵢ=nᵢ/nₜ','Pᵢ=XᵢPₜ','부분압력 합 검산','물 위 포집이면 수증기압 제외'],worked:'A 1 mol, B 3 mol이 전체 8 atm이면 A의 몰분율은 1/4, 부분압력은 2 atm이다.',trap:'물 위 포집 기체의 측정 압력에는 수증기 압력이 포함된다.',rescue:'피자 네 조각 중 한 조각이 A라면 A의 몫은 1/4이다. 전체 압력에서도 같은 비율을 차지한다.',recall:['부분 압력의 합은 무엇과 같을까?','혼합 기체의 전체 압력과 같다.']},
    'c-liquid':{icon:'≈',prereq:'분자 사이에도 끌어당기는 힘이 있고, 그 힘이 강할수록 분자들이 기체로 빠져나가기 어렵다.',why:'액체의 증기압·끓는점·표면 성질은 분자 사이 힘과 동적 평형으로 연결된다.',method:['극성·수소결합 확인','분자간 힘 비교','증기압↔끓는점 반대 연결','온도·외부압력 확인','증발·응축 동시 확인'],worked:'분자 사이 힘이 강할수록 같은 온도에서 증기압은 낮고, 끓는점은 높아지는 경향이 있다.',trap:'끓는점은 증기압이 “그 순간의 외부 압력”과 같아지는 온도다.',rescue:'분자들이 서로 손을 꽉 잡고 있으면 액체 밖으로 도망가기 어렵다. 그래서 더 뜨겁게 해야 끓는다.',recall:['분자 사이 힘이 강해지면 증기압은?','낮아진다. 끓는점은 반대로 높아지는 경향이 있다.']},
    'c-solid':{icon:'◆',prereq:'고체는 “무엇이 배열되어 있고 무엇이 붙잡는가”를 보면 종류를 구분할 수 있다.',why:'결정 종류가 달라지면 녹는점·전기 전도성·단단함이 달라진다.',method:['구성 입자 확인','결합/힘 확인','고체 상태 전도성 확인','용융·수용액 상태 확인','대표 성질과 연결'],worked:'이온 결정은 고체에서 이온이 고정되어 전도하지 않지만, 녹거나 물에 녹으면 이온이 움직여 전도한다.',trap:'이온 결정은 “이온이 있으니 항상 전도”가 아니다. 고체 상태에서는 이동할 수 없어 전도하지 않는다.',rescue:'전류를 “움직일 수 있는 전하”라고 생각하자. 전하가 있어도 꼼짝 못 하면 전류가 흐르지 않는다.',recall:['이온 결정이 고체일 때 전기가 잘 흐를까?','아니다. 이온이 자리에 고정되어 이동할 수 없다.']},
    'c-enthalpy':{icon:'Δ',prereq:'에너지가 계에서 주위로 나가면 발열, 주위에서 계로 들어오면 흡열이다.',why:'반응 엔탈피 ΔH는 반응 전후 에너지 차이를 한 숫자로 나타낸다.',method:['반응식 계수 확인','물질 상태 확인','발열·흡열 방향 판단','ΔH 부호 결정','계수 변화 시 ΔH도 같은 배수'],worked:'생성물 에너지가 반응물보다 100 kJ 낮다면 ΔH=-100 kJ로 발열 반응이다.',trap:'반응식 계수를 2배로 하면 ΔH도 2배이며, 역반응은 ΔH 부호가 반대로 바뀐다.',rescue:'ΔH를 계좌 잔액 변화처럼 생각하자. 최종 에너지-처음 에너지가 음수면 에너지를 밖으로 내보낸 것이다.',recall:['발열 반응의 ΔH 부호는?','음수(ΔH<0)다.']},
    'c-hess':{icon:'Σ',prereq:'반응식을 뒤집으면 ΔH 부호가 바뀌고, 반응식 계수를 k배 하면 ΔH도 k배가 된다.',why:'엔탈피는 경로가 아니라 처음과 끝 상태에 의해 결정되므로 여러 반응을 더해 목표 반응의 ΔH를 구할 수 있다.',method:['목표 반응식 적기','주어진 식 방향 맞추기','계수 배수 맞추기','중간물질 소거','ΔH도 같은 조작 후 합'],worked:'A→B가 +20, B→C가 -50 kJ라면 A→C는 -30 kJ다. B가 중간에서 사라지는지 확인한다.',trap:'식만 뒤집고 ΔH 부호를 안 바꾸거나, 계수만 배수 조정하고 ΔH를 그대로 두지 않는다.',rescue:'길 찾기처럼 생각하자. A→B와 B→C 경로를 이어 붙이면 A→C가 되고, 에너지 변화도 그대로 더한다.',recall:['헤스 법칙에서 반응식을 뒤집으면 ΔH는?','크기는 같고 부호가 반대로 바뀐다.']},
    'c-spontaneous':{icon:'↝',prereq:'계는 우리가 보는 부분, 주위는 그 밖의 환경이다. 엔트로피는 에너지와 입자가 퍼질 수 있는 정도와 연결된다.',why:'자발성은 계 하나가 아니라 계+주위 전체 엔트로피 변화로 판단한다.',method:['계·주위 구분','ΔS계 방향','발열/흡열로 ΔS주위 방향','두 변화 합치기','전체 ΔS 부호로 판단'],worked:'계의 엔트로피가 조금 줄어도 주위 엔트로피가 더 크게 늘면 전체 엔트로피는 증가해 자발적일 수 있다.',trap:'자발적이라는 말은 반응이 빠르다는 뜻이 아니다. 속도와 자발성은 다른 문제다.',rescue:'방 하나만 보지 말고 집 전체를 본다고 생각하자. 계에서 정돈되어도 주위에서 더 크게 퍼지면 전체는 더 퍼질 수 있다.',recall:['자발성 판단에서 봐야 하는 엔트로피는?','계와 주위를 합한 전체 엔트로피다.']}
  };

  const style = document.createElement('style');
  style.id = 'science-step-rich-visuals';
  style.textContent = `
    .concept-stage{position:relative;margin:4px 0 16px;padding:18px;border-radius:24px;background:linear-gradient(145deg,#f9fbff,#e9eef9);border:1px solid #dfe6f2;overflow:hidden;min-height:250px;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(210px,.8fr);gap:16px;align-items:center}
    .concept-stage:before{content:"";position:absolute;width:230px;height:230px;border-radius:50%;right:-85px;top:-95px;background:radial-gradient(circle,rgba(82,108,255,.16),transparent 68%);pointer-events:none}
    .scene-copy{position:relative;z-index:2}.scene-kicker{font-size:10px;font-weight:950;letter-spacing:.12em;color:#526cff;text-transform:uppercase}.scene-copy h2{font-size:clamp(22px,3.5vw,34px);line-height:1.12;margin:7px 0 9px;letter-spacing:-.045em}.scene-copy p{margin:0;color:#667085;line-height:1.65;font-size:13px}.scene-badge{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:8px 10px;border-radius:12px;background:#fff;border:1px solid #e2e7f0;font-size:11px;font-weight:900}.scene-icon{width:30px;height:30px;border-radius:11px;display:grid;place-items:center;background:#e4e9ff;color:#526cff;font-size:17px}
    .scene-art{position:relative;z-index:2;min-height:205px;display:grid;place-items:center}.scene-svg{width:100%;max-width:360px;height:auto;overflow:visible}.scene-formula{font-size:clamp(18px,3vw,27px);font-weight:950;fill:#172033}.scene-label{font-size:12px;font-weight:900;fill:#42506a}.scene-muted{font-size:10px;font-weight:800;fill:#7b879c}.scene-blue{stroke:#526cff;fill:#526cff}.scene-red{stroke:#b64556;fill:#b64556}.scene-mint{stroke:#1ea67a;fill:#1ea67a}.scene-amber{stroke:#b87817;fill:#b87817}.dash{stroke-dasharray:7 7}.floaty{animation:floaty 2.8s ease-in-out infinite}.pulse{animation:pulse 2.2s ease-in-out infinite}.orbit-dot{transform-origin:center;animation:orbitPulse 2.8s ease-in-out infinite}@keyframes floaty{50%{transform:translateY(-6px)}}@keyframes pulse{50%{opacity:.55}}@keyframes orbitPulse{50%{transform:scale(1.12)}}
    .visual-lesson{padding:0;border:0;background:transparent;box-shadow:none;min-height:0;margin:0}.visual-lesson .formula,.visual-lesson .split,.visual-lesson .chips,.visual-lesson .vector-stage{margin-top:10px}
    .learn-flow{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.learn-block{min-height:100%}.learn-block.visual-block{grid-column:1/-1;padding:0;border:0;background:transparent}.learn-block details{height:100%}.learn-block summary{cursor:pointer;font-weight:900;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px}.learn-block summary::-webkit-details-marker{display:none}.learn-block summary:after{content:'＋';color:#526cff;font-size:16px}.learn-block details[open] summary:after{content:'−'}.learn-block details p{margin-top:10px}.core-card{grid-column:1/-1;background:linear-gradient(145deg,#eef2ff,#f9faff);border-color:#dce3ff}.core-card p{font-size:15px;line-height:1.78}.method-card{grid-column:1/-1}.recall-card{margin-top:13px;position:relative;overflow:hidden}.recall-card:before{content:'RECALL';position:absolute;right:14px;top:12px;font-size:9px;font-weight:950;letter-spacing:.15em;color:#86ae9f}.recall-question{font-size:16px!important;font-weight:850;color:#213c34!important;max-width:85%}.recall-answer{border-left:4px solid #1ea67a}.rescue-toggle{width:100%;text-align:left;padding:12px 14px}.check{margin-top:13px;border-width:2px}.check-head{align-items:center}.check-prompt{margin:13px 0 0;padding:16px 17px;border-radius:16px;background:#fff;border:1px solid #e1e7f1;font-size:17px!important;line-height:1.55!important;font-weight:900!important;color:#1c2638!important}.check-prompt:before{content:'Q';display:inline-grid;place-items:center;width:26px;height:26px;margin-right:9px;border-radius:9px;background:#526cff;color:#fff;font-size:11px;vertical-align:2px}.choice{display:flex;align-items:center;gap:11px;min-height:52px}.choice:before{content:attr(data-letter);flex:0 0 28px;width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:#fff;border:1px solid #dfe5ef;color:#667085;font-size:11px;font-weight:950}.choice.selected:before{background:#526cff;color:#fff;border-color:#526cff}.choice.good:before{background:#1ea67a;color:#fff;border-color:#1ea67a}.choice.bad:before{background:#b64556;color:#fff;border-color:#b64556}.lesson-card{position:relative}.lesson-kicker{display:inline-flex;padding:6px 9px;border-radius:10px;background:#e8ecff}.lesson-lead{display:none}.lesson-strip{margin:13px 0 15px}.strip-item{background:#fff}.block-head .block-num{box-shadow:none}.reading-hint{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;background:#f3f6fb;color:#667085;font-size:11px}.reading-hint b{color:#26324a}.question-divider{height:1px;background:linear-gradient(90deg,transparent,#ccd5e6,transparent);margin:15px 0}
    @media(max-width:760px){.concept-stage{grid-template-columns:1fr;min-height:0;padding:16px}.scene-art{min-height:180px}.learn-flow{grid-template-columns:1fr}.core-card,.method-card,.learn-block.visual-block{grid-column:auto}.recall-question{max-width:100%}.check-prompt{font-size:16px!important}.scene-copy h2{font-size:25px}}
    @media(max-width:430px){.concept-stage{border-radius:19px}.scene-art{min-height:160px}.lesson-strip{grid-template-columns:repeat(3,1fr)!important}.strip-item{padding:9px 8px!important}.strip-item b{font-size:11px!important}.strip-item span{font-size:8px!important}.check-prompt{padding:14px}.choice{padding:12px}.learn-block{padding:14px 15px}}
  `;
  document.head.appendChild(style);

  const progressKey = (trackId, unitId) => `${trackId}:${unitId}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const currentTrack = () => tracks.find(t => t.id === currentTrackId);
  const currentUnit = () => currentTrack()?.units?.[currentUnitIndex] || null;
  const doneCount = (track, unit) => Math.min(state[progressKey(track.id, unit.id)]?.doneSteps || 0, unit.lesson.length);
  const mistakeCount = (track, unit, step) => state[progressKey(track.id, unit.id)]?.mistakes?.[step] || 0;
  const unitUnlocked = (track, index) => index === 0 || doneCount(track, track.units[index - 1]) >= track.units[index - 1].lesson.length;
  const totalCount = () => tracks.reduce((s,t)=>s+t.units.reduce((a,u)=>a+u.lesson.length,0),0);
  const completedCount = () => tracks.reduce((s,t)=>s+t.units.reduce((a,u)=>a+doneCount(t,u),0),0);

  function daysLeft(){
    const now = new Date();
    return Math.max(0, Math.ceil((examDate - now) / 86400000));
  }

  function nextTarget(){
    for(const track of tracks){
      for(let i=0;i<track.units.length;i++){
        const unit=track.units[i];
        if(unitUnlocked(track,i) && doneCount(track,unit)<unit.lesson.length) return {track,index:i,unit};
      }
    }
    return null;
  }

  function renderDashboard(){
    const total=totalCount(), done=completedCount(), remain=Math.max(0,total-done), pct=total?Math.round(done/total*100):0, d=Math.max(1,daysLeft());
    const el=id=>document.getElementById(id);
    if(el('pct')) el('pct').textContent=`${pct}%`;
    if(el('bar')) el('bar').style.width=`${pct}%`;
    if(el('progressText')) el('progressText').textContent=`${done} / ${total}개 실제 통과`;
    if(el('remainingSteps')) el('remainingSteps').textContent=remain;
    if(el('dailyTarget')) el('dailyTarget').textContent=remain?Math.max(1,Math.ceil(remain/d)):0;
    if(el('daysLeft')) el('daysLeft').textContent=`D-${Math.max(0,daysLeft())}`;
    if(el('etaText')) el('etaText').textContent=remain?`남은 개념 약 ${Math.ceil(remain*3.5/60*10)/10}시간`:'개념 1회독 완료';
    const next=nextTarget();
    if(el('continueLabel')) el('continueLabel').textContent=next?`${next.track.subject} · ${next.unit.title}`:'개념 1회독 완료';
    if(el('continueStudy')){el('continueStudy').disabled=!next;el('continueStudy').textContent=next?'이어서 공부하기 →':'개념 1회독 완료';}
  }

  function renderTrack(){
    const track=currentTrack(); if(!track) return;
    trackEl.className=track.id==='chemistry'?'chem':'';
    const tDone=track.units.reduce((s,u)=>s+doneCount(track,u),0), tTotal=track.units.reduce((s,u)=>s+u.lesson.length,0);
    trackEl.innerHTML=`<div class="track-head"><div><h2>${track.subject}</h2><p>${track.range}</p></div><div class="track-summary">${tDone}/${tTotal}개 완료<br>${track.sourceNote||''}</div></div><div class="unit-list">${track.units.map((unit,index)=>{
      const done=doneCount(track,unit), unlocked=unitUnlocked(track,index), pct=Math.round(done/unit.lesson.length*100), g=guides[unit.id]||{};
      const status=done>=unit.lesson.length?'완료':unlocked?(done?'진행 중':'시작 가능'):'잠김';
      const next=done>=unit.lesson.length?'이 단원 개념 확인 완료':unlocked?`${done+1}번째 개념부터 공부`:'앞 단원을 먼저 완료';
      return `<article class="clay unit-card ${unlocked?'':'locked'}" data-unit-index="${index}" aria-disabled="${unlocked?'false':'true'}"><div class="unit-top"><div class="unit-index">${g.icon||index+1}</div><span class="status ${done>=unit.lesson.length?'done':''}">${status}</span></div><h3>${unit.title}</h3><div class="unit-meta">약 ${unit.minutes}분 · ${done}/${unit.lesson.length}개 이해</div><div class="unit-progress"><div class="mini-bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div><div class="unit-next">${next}</div></article>`;
    }).join('')}</div>`;
    renderDashboard();
  }

  function marker(id,color){return `<defs><marker id="${id}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="${color}"/></marker></defs>`;}

  function renderScene(unitId, lesson, step){
    const g=guides[unitId]||{};
    let art='';
    if(unitId==='p-vector') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('vA','#526cff')}${marker('vB','#b64556')}<line x1="54" y1="110" x2="288" y2="110" stroke="#d5ddea" stroke-width="3"/><circle cx="180" cy="110" r="15" fill="#fff" stroke="#cdd6e5" stroke-width="3"/><line x1="180" y1="88" x2="300" y2="88" stroke="#526cff" stroke-width="6" marker-end="url(#vA)"/><line x1="180" y1="132" x2="95" y2="132" stroke="#b64556" stroke-width="6" marker-end="url(#vB)"/><text x="240" y="72" class="scene-label">8 N →</text><text x="95" y="158" class="scene-label">← 3 N</text><line x1="180" y1="186" x2="255" y2="186" stroke="#1ea67a" stroke-width="7" marker-end="url(#vA)"/><text x="180" y="211" class="scene-label">합력: 오른쪽 5 N</text></svg>`;
    else if(unitId==='p-projectile') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('pA','#526cff')}${marker('pB','#b64556')}<path d="M35 185 Q175 25 325 185" fill="none" stroke="#8fa0ff" stroke-width="5"/><circle cx="175" cy="76" r="8" fill="#526cff" class="floaty"/><line x1="175" y1="76" x2="260" y2="76" stroke="#526cff" stroke-width="5" marker-end="url(#pA)"/><line x1="175" y1="76" x2="175" y2="145" stroke="#b64556" stroke-width="5" marker-end="url(#pB)"/><text x="250" y="62" class="scene-label">vₓ ≠ 0</text><text x="190" y="125" class="scene-label">a = g ↓</text><text x="175" y="42" text-anchor="middle" class="scene-label">최고점: vᵧ = 0</text></svg>`;
    else if(unitId==='p-circle') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('cA','#526cff')}${marker('cB','#b64556')}<circle cx="180" cy="112" r="75" fill="none" stroke="#9cafff" stroke-width="5"/><circle cx="180" cy="112" r="6" fill="#667085"/><circle cx="255" cy="112" r="10" fill="#526cff" class="orbit-dot"/><line x1="255" y1="112" x2="255" y2="42" stroke="#526cff" stroke-width="5" marker-end="url(#cA)"/><line x1="255" y1="112" x2="198" y2="112" stroke="#b64556" stroke-width="5" marker-end="url(#cB)"/><text x="268" y="48" class="scene-label">속도 v</text><text x="205" y="139" class="scene-label">가속도 a</text><text x="180" y="207" text-anchor="middle" class="scene-muted">속도는 접선 · 가속도는 중심</text></svg>`;
    else if(unitId==='p-gravity') art=`<svg class="scene-svg" viewBox="0 0 360 220"><ellipse cx="180" cy="110" rx="138" ry="72" fill="none" stroke="#9cafff" stroke-width="4"/><circle cx="116" cy="110" r="24" fill="#ffd36b"/><circle cx="300" cy="110" r="10" fill="#526cff" class="orbit-dot"/><line x1="286" y1="110" x2="145" y2="110" stroke="#b64556" stroke-width="4" class="dash"/><text x="116" y="114" text-anchor="middle" class="scene-label">별</text><text x="225" y="92" class="scene-label">F ∝ 1/r²</text><text x="180" y="203" text-anchor="middle" class="scene-label">T² ∝ a³</text></svg>`;
    else if(unitId==='p-escape') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('eA','#526cff')}<circle cx="180" cy="155" r="66" fill="#8ea0ff" opacity=".28"/><circle cx="180" cy="155" r="47" fill="#526cff" opacity=".72"/><line x1="180" y1="118" x2="180" y2="36" stroke="#526cff" stroke-width="6" marker-end="url(#eA)"/><path d="M125 90 Q180 58 235 90" fill="none" stroke="#b64556" stroke-width="3" class="dash"/><text x="198" y="56" class="scene-label">vₑ</text><text x="180" y="210" text-anchor="middle" class="scene-formula">vₑ = √(2GM/R)</text></svg>`;
    else if(unitId==='p-relativity') art=`<svg class="scene-svg" viewBox="0 0 360 220"><path d="M20 54 Q180 94 340 54 M20 90 Q180 130 340 90 M20 126 Q180 166 340 126 M20 162 Q180 202 340 162" fill="none" stroke="#c7cfdf" stroke-width="2"/><path d="M70 20 Q110 110 70 205 M120 20 Q145 110 120 205 M180 20 Q180 110 180 205 M240 20 Q215 110 240 205 M290 20 Q250 110 290 205" fill="none" stroke="#c7cfdf" stroke-width="2"/><circle cx="180" cy="112" r="42" fill="#172033"/><circle cx="82" cy="58" r="20" fill="#fff" stroke="#526cff" stroke-width="3"/><circle cx="282" cy="58" r="20" fill="#fff" stroke="#1ea67a" stroke-width="3"/><text x="82" y="62" text-anchor="middle" class="scene-label">느림</text><text x="282" y="62" text-anchor="middle" class="scene-label">빠름</text><text x="180" y="202" text-anchor="middle" class="scene-label">강한 중력 → 시간 더 느림</text></svg>`;
    else if(unitId==='c-gas') art=`<svg class="scene-svg" viewBox="0 0 360 220"><rect x="88" y="42" width="184" height="145" rx="9" fill="#fff" stroke="#9eabc1" stroke-width="4"/><rect x="78" y="66" width="204" height="18" rx="8" fill="#526cff" opacity=".72"/><line x1="180" y1="25" x2="180" y2="66" stroke="#526cff" stroke-width="8"/><g fill="#1ea67a">${[[120,110],[155,135],[205,105],[235,145],[132,160],[220,170],[180,155],[246,118]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g><text x="180" y="211" text-anchor="middle" class="scene-formula">PV = nRT</text></svg>`;
    else if(unitId==='c-mixture') art=`<svg class="scene-svg" viewBox="0 0 360 220"><rect x="54" y="38" width="252" height="150" rx="20" fill="#fff" stroke="#d2dae7" stroke-width="3"/><g fill="#526cff">${[[90,72],[155,95],[240,78],[120,145]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</g><g fill="#1ea67a">${[[120,95],[195,72],[265,120],[178,142],[235,158],[90,125]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</g><text x="180" y="211" text-anchor="middle" class="scene-formula">P전체 = P₁ + P₂ + …</text></svg>`;
    else if(unitId==='c-liquid') art=`<svg class="scene-svg" viewBox="0 0 360 220"><rect x="62" y="42" width="236" height="145" rx="14" fill="#fff" stroke="#d5deea" stroke-width="3"/><path d="M64 122 Q110 112 155 122 T250 122 T296 122 V185 H64Z" fill="#bfe8ff"/><g fill="#526cff">${[[94,150],[130,170],[170,145],[215,165],[258,145],[150,126],[235,128]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8"/>`).join('')}</g><g fill="#1ea67a">${[[110,84],[178,72],[244,92]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" class="floaty"/>`).join('')}</g><text x="180" y="31" text-anchor="middle" class="scene-label">증발 ⇄ 응축</text><text x="180" y="211" text-anchor="middle" class="scene-label">동적 평형</text></svg>`;
    else if(unitId==='c-solid') art=`<svg class="scene-svg" viewBox="0 0 360 220"><g transform="translate(40 42)">${[0,1,2,3].map(r=>[0,1,2,3].map(c=>`<circle cx="${c*34}" cy="${r*34}" r="11" fill="${(r+c)%2?'#526cff':'#b64556'}"/>`).join('')).join('')}</g><g transform="translate(205 42)">${[0,1,2,3].map(r=>[0,1,2].map(c=>`<circle cx="${c*36+(r%2)*8}" cy="${r*34}" r="10" fill="#aab6c8"/>`).join('')).join('')}</g><text x="92" y="196" text-anchor="middle" class="scene-label">이온 결정</text><text x="250" y="196" text-anchor="middle" class="scene-label">금속 결정</text></svg>`;
    else if(unitId==='c-enthalpy') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('hA','#b64556')}<line x1="70" y1="68" x2="280" y2="68" stroke="#526cff" stroke-width="6"/><line x1="70" y1="155" x2="280" y2="155" stroke="#1ea67a" stroke-width="6"/><line x1="302" y1="75" x2="302" y2="148" stroke="#b64556" stroke-width="5" marker-end="url(#hA)"/><text x="70" y="52" class="scene-label">반응물</text><text x="70" y="181" class="scene-label">생성물</text><text x="315" y="116" class="scene-label">ΔH&lt;0</text></svg>`;
    else if(unitId==='c-hess') art=`<svg class="scene-svg" viewBox="0 0 360 220">${marker('hsA','#526cff')}<circle cx="60" cy="110" r="24" fill="#e4e9ff"/><circle cx="180" cy="55" r="24" fill="#fff3d8"/><circle cx="300" cy="110" r="24" fill="#dff7ef"/><line x1="84" y1="101" x2="153" y2="69" stroke="#526cff" stroke-width="4" marker-end="url(#hsA)"/><line x1="204" y1="69" x2="274" y2="101" stroke="#526cff" stroke-width="4" marker-end="url(#hsA)"/><path d="M84 124 Q180 186 274 124" fill="none" stroke="#b64556" stroke-width="4" stroke-dasharray="7 7"/><text x="60" y="114" text-anchor="middle" class="scene-label">A</text><text x="180" y="59" text-anchor="middle" class="scene-label">B</text><text x="300" y="114" text-anchor="middle" class="scene-label">C</text><text x="180" y="205" text-anchor="middle" class="scene-label">경로가 달라도 A→C의 ΔH는 같다</text></svg>`;
    else if(unitId==='c-spontaneous') art=`<svg class="scene-svg" viewBox="0 0 360 220"><rect x="42" y="45" width="112" height="120" rx="16" fill="#fff" stroke="#d5deea" stroke-width="3"/><rect x="206" y="45" width="112" height="120" rx="16" fill="#fff" stroke="#d5deea" stroke-width="3"/><g fill="#526cff">${[[70,80],[90,82],[80,105],[105,100],[92,125],[112,130]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g><g fill="#1ea67a">${[[225,70],[270,82],[245,110],[295,115],[230,145],[280,145]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g><text x="98" y="190" text-anchor="middle" class="scene-label">덜 퍼짐</text><text x="262" y="190" text-anchor="middle" class="scene-label">더 퍼짐</text><text x="180" y="214" text-anchor="middle" class="scene-label">ΔS전체 &gt; 0 → 자발적</text></svg>`;
    else art=`<div class="scene-badge"><span class="scene-icon">${g.icon||'•'}</span>${lesson.title}</div>`;
    return `<section class="concept-stage"><div class="scene-copy"><div class="scene-kicker">visual first · ${step+1}번째 개념</div><h2>${lesson.title}</h2><p>${g.why||lesson.body}</p><div class="scene-badge"><span class="scene-icon">${g.icon||'•'}</span>${lesson.title}</div></div><div class="scene-art">${art}</div></section>`;
  }

  function renderDataVisual(v){
    if(!v) return '';
    if(v.type==='formula'||v.type==='chain') return `<div class="visual visual-lesson"><div class="formula">${v.text}</div></div>`;
    if(v.type==='split') return `<div class="visual visual-lesson"><div class="split"><div>${v.left}</div><div>${v.right}</div></div></div>`;
    if(v.type==='chips') return `<div class="visual visual-lesson"><div class="chips">${(v.items||[]).map(x=>`<div class="chip">${x}</div>`).join('')}</div></div>`;
    if(v.type==='vector') return `<div class="visual visual-lesson"><div class="vector-stage"><div class="arrow-card">${v.a||'→'}</div><div class="arrow-card">${v.b||'←'}</div></div></div>`;
    if(v.type==='trajectory') return `<div class="visual visual-lesson"><div class="formula">${v.label||'포물선 운동'}</div></div>`;
    if(v.type==='circle') return `<div class="visual visual-lesson"><div class="formula">${v.label||'등속 원운동'}</div></div>`;
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
    const track=currentTrack(), unit=currentUnit(); if(!track||!unit) return;
    const done=doneCount(track,unit); if(done>=unit.lesson.length) return renderCelebrate();
    const lesson=unit.lesson[done], g=guides[unit.id]||{}; selected=null; mastered=false; rescueOpen=false; recallOpen=false;
    const pos=document.getElementById('lessonPosition'); if(pos) pos.textContent=`${track.subject} · ${unit.title} · ${done+1}/${unit.lesson.length}`;
    lessonEl.innerHTML=`<article class="clay lesson-card">
      <div class="lesson-kicker">${track.subject} · ${unit.title}</div>
      ${renderScene(unit.id,lesson,done)}
      <div class="lesson-strip"><div class="strip-item"><span>현재 단계</span><b>${done+1} / ${unit.lesson.length}</b></div><div class="strip-item"><span>오답 횟수</span><b>${mistakeCount(track,unit,done)}회</b></div><div class="strip-item"><span>통과 조건</span><b>확인문제 정답</b></div></div>
      <div class="learn-flow">
        <section class="learn-block tutor-section core-card"><div class="block-head"><span class="block-num">1</span><h3>핵심 설명</h3></div><p>${lesson.body}</p>${renderDataVisual(lesson.visual)}</section>
        <section class="learn-block tutor-section"><details open><summary>30초 선수개념</summary><p>${g.prereq||'이 개념에 필요한 최소 선수개념만 확인한다.'}</p></details></section>
        <section class="learn-block tutor-section worked-example"><details open><summary>숫자로 바로 연결</summary><p>${g.worked||'핵심 관계를 쉬운 수치로 먼저 확인한다.'}</p></details></section>
        <section class="learn-block tutor-section method-card"><div class="block-head"><span class="block-num">4</span><h3>시험 문제 풀이 순서</h3></div>${habitChips(track)}<div class="study-rule">${(g.method||[]).map((x,i)=>`<span class="rule-chip">${i+1}. ${x}</span>`).join('')}</div></section>
        <section class="learn-block tutor-section trap"><details><summary>내신 함정 보기</summary><p>${g.trap||'조건과 단위를 끝까지 확인한다.'}</p></details></section>
        <div class="reading-hint"><span>글을 전부 외울 필요 없음</span><b>그림 → 핵심 → 예제 → 문제 순서로 보면 됨</b></div>
      </div>
      <section class="recall-card" aria-label="10초 회상"><h3>10초 회상 · 객관식 아님</h3><p class="recall-question">${g.recall?.[0]||'방금 배운 내용을 한 문장으로 말해 봐.'}</p><button class="small-btn" data-action="recall">말해 본 뒤 답 보기</button><div class="recall-answer" id="recallAnswer">${g.recall?.[1]||lesson.check.explanation}</div></section>
      <button class="rescue-toggle" data-action="rescue">아직 이해 안 됨 · 더 쉬운 비유로 다시 보기</button>
      <div class="rescue" id="rescue"><b>다른 방식으로 다시 설명</b><br>${g.rescue||lesson.check.explanation}</div>
      <div class="question-divider"></div>
      <section class="check"><div class="check-head"><h3>이해 확인 문제</h3><span class="mistakes">오답 ${mistakeCount(track,unit,done)}회</span></div><p class="check-prompt">${lesson.check.prompt}</p><div class="choices">${lesson.check.choices.map((c,i)=>`<button class="choice" data-c="${i}" data-letter="${'ABCD'[i]}"><span>${c}</span></button>`).join('')}</div><div class="feedback" id="feedback"></div><div class="actions"><button class="btn primary" id="grade" data-action="grade" disabled>선택 후 확인하기</button></div></section>
    </article>`;
  }

  function choose(btn){
    if(mastered) return;
    selected=Number(btn.dataset.c);
    lessonEl.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected','bad'));
    btn.classList.add('selected');
    const grade=document.getElementById('grade'); if(grade){grade.disabled=false;grade.textContent='정답 확인하기';}
  }

  function recordMistake(track,unit,step){
    const key=progressKey(track.id,unit.id), prev=state[key]||{}, mistakes=Array.isArray(prev.mistakes)?[...prev.mistakes]:[];
    mistakes[step]=(mistakes[step]||0)+1; state[key]={...prev,mistakes}; save();
  }

  function grade(){
    if(selected===null||mastered) return;
    const track=currentTrack(), unit=currentUnit(); if(!track||!unit) return;
    const done=doneCount(track,unit), lesson=unit.lesson[done]; if(!lesson) return;
    const feedback=document.getElementById('feedback'), gradeBtn=document.getElementById('grade');
    if(selected!==lesson.check.answer){
      lessonEl.querySelector(`.choice[data-c="${selected}"]`)?.classList.add('bad');
      recordMistake(track,unit,done); rescueOpen=true; document.getElementById('rescue')?.classList.add('show');
      if(feedback){feedback.className='feedback show bad';feedback.innerHTML=`<b>아직 통과 아님.</b> 문제 문장을 다시 읽고, 바로 위의 <b>더 쉬운 비유</b>를 본 뒤 다른 선택지를 골라.`;}
      selected=null; if(gradeBtn){gradeBtn.disabled=true;gradeBtn.textContent='다시 선택하기';}
      const badge=lessonEl.querySelector('.mistakes'); if(badge) badge.textContent=`오답 ${mistakeCount(track,unit,done)}회`;
      return;
    }
    mastered=true;
    lessonEl.querySelectorAll('.choice').forEach((b,i)=>{b.classList.remove('selected','bad');if(i===lesson.check.answer)b.classList.add('good');b.disabled=true;});
    if(feedback){feedback.className='feedback show good';feedback.innerHTML=`<b>통과.</b> ${lesson.check.explanation}`;}
    const key=progressKey(track.id,unit.id); state[key]={...(state[key]||{}),doneSteps:done+1}; save(); renderDashboard();
    if(gradeBtn){gradeBtn.disabled=false;gradeBtn.dataset.action='continue';gradeBtn.textContent=done+1>=unit.lesson.length?'단원 완료 →':'다음 개념 →';}
  }

  function continueLesson(){
    const track=currentTrack(),unit=currentUnit(); if(!track||!unit)return;
    if(doneCount(track,unit)>=unit.lesson.length) renderCelebrate(); else renderLesson();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderCelebrate(){
    const track=currentTrack(), unit=currentUnit(); if(!track||!unit)return;
    const nextIndex=currentUnitIndex+1, hasNext=nextIndex<track.units.length;
    lessonEl.innerHTML=`<section class="clay celebrate"><div class="icon">✓</div><h2>${unit.title} 완료</h2><p>설명만 읽은 게 아니라 각 개념 확인 문제까지 직접 통과했다.${hasNext?' 다음 단원이 열렸다.':' 이 과목의 개념 1회독이 끝났다.'}</p><div class="actions completion-actions"><button class="btn" data-action="home">학습 목록</button>${hasNext?'<button class="btn primary" data-action="next-unit">다음 단원 시작 →</button>':'<a class="btn primary" href="drill.html" style="text-decoration:none;text-align:center">실전 문제로 →</a>'}</div></section>`;
    renderDashboard();
  }

  function backHome(){
    study.classList.remove('show'); home.classList.remove('hide'); currentUnitIndex=null; selected=null; mastered=false; renderTrack(); window.scrollTo(0,0);
  }

  trackEl.addEventListener('click',e=>{const card=e.target.closest('.unit-card');if(!card||card.classList.contains('locked'))return;openUnit(Number(card.dataset.unitIndex));});
  lessonEl.addEventListener('click',e=>{
    const choice=e.target.closest('.choice'); if(choice) return choose(choice);
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='grade')grade();
    else if(action==='continue')continueLesson();
    else if(action==='home')backHome();
    else if(action==='next-unit'){currentUnitIndex++;renderLesson();window.scrollTo(0,0);}
    else if(action==='rescue'){rescueOpen=!rescueOpen;document.getElementById('rescue')?.classList.toggle('show',rescueOpen);}
    else if(action==='recall'){recallOpen=!recallOpen;document.getElementById('recallAnswer')?.classList.toggle('show',recallOpen);e.target.textContent=recallOpen?'답 숨기기':'말해 본 뒤 답 보기';}
  });
  back?.addEventListener('click',backHome);
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{currentTrackId=btn.dataset.track;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));renderTrack();}));
  document.getElementById('continueStudy')?.addEventListener('click',()=>{const next=nextTarget();if(next){currentTrackId=next.track.id;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.track===currentTrackId));renderTrack();openUnit(next.index);}});
  document.getElementById('resetStudy')?.addEventListener('click',()=>{if(confirm('학습 진도와 개념별 오답 횟수를 0%로 초기화할까? 실전 문제 기록은 지워지지 않아.')){state={};save();renderTrack();}});

  renderTrack();
})();