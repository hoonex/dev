window.QUIZ_SETS = [
  {
    id:'test-chem-2026-09-01-v2',date:'2026-09-01',test:true,sync:false,required:false,subject:'물질과 에너지',range:'TEST · 기체 단원 문제 형식 미리보기',title:'화학 테스트 · 기체 법칙',note:'오늘은 기능과 문제 형식을 확인하는 테스트용이다. 점수와 진도는 반영하지 않는다. 내일부터 완자 실제 진도에 맞춰 정식 문제를 낸다.',
    questions:[
      {type:'그림·개념',prompt:'같은 온도에서 같은 양의 기체가 다음과 같이 A에서 B로 압축되었다. 옳은 설명은?',visual:{type:'piston',states:[{label:'A',height:.82,particles:8,pressure:'P₁'},{label:'B',height:.42,particles:8,pressure:'P₂'}],caption:'피스톤 내부의 기체 입자 수와 온도는 일정하다.'},choices:['P₂<P₁이고 충돌 횟수도 감소한다','P₂>P₁이고 벽과의 충돌 횟수가 증가한다','P₂=P₁이고 부피만 감소한다','기체 분자 수가 자동으로 감소한다'],answer:1,explanation:'온도와 기체량이 일정할 때 부피가 감소하면 벽과의 충돌 빈도가 증가해 압력이 커진다.',tip:'보일 법칙은 P↑, V↓.',remediation:[
        {prompt:'같은 온도에서 기체 부피를 처음의 1/3로 줄였다. 압력은 처음의 몇 배인가?',choices:['1/3배','같음','3배','9배'],answer:2,explanation:'PV가 일정하므로 부피가 1/3이면 압력은 3배가 된다.',tip:'배수 관계는 역수로 본다.'},
        {prompt:'그림의 두 상태는 온도와 기체량이 같다. 어느 상태의 압력이 더 큰가?',visual:{type:'piston',states:[{label:'C',height:.68,particles:8,pressure:'?'},{label:'D',height:.34,particles:8,pressure:'?'}],caption:'같은 실린더에서 기체가 차지하는 높이만 다르다.'},choices:['C','D','같다','판단할 수 없다'],answer:1,explanation:'D의 부피가 더 작으므로 같은 온도에서 압력은 D가 더 크다.',tip:'그림에서는 먼저 부피를 비교한다.'}
      ]},
      {type:'계산',prompt:'온도와 기체량이 일정하다. 1.2 atm에서 500 mL인 기체를 2.0 atm으로 압축하면 최종 부피는?',choices:['200 mL','300 mL','500 mL','833 mL'],answer:1,explanation:'P₁V₁=P₂V₂에서 1.2×500=2.0×V₂, V₂=300 mL.',tip:'압력이 커졌으므로 답은 500 mL보다 작아야 한다.',remediation:[
        {prompt:'0.8 atm에서 750 mL인 기체를 같은 온도에서 1.5 atm으로 압축했다. 최종 부피는?',choices:['300 mL','400 mL','500 mL','625 mL'],answer:1,explanation:'0.8×750=1.5×V₂이므로 V₂=400 mL.',tip:'단위를 같게 둔 뒤 PV 일정.'},
        {prompt:'같은 온도에서 2.4 L인 기체의 압력을 처음의 3배로 만들었다. 최종 부피는?',choices:['0.8 L','1.2 L','3.2 L','7.2 L'],answer:0,explanation:'압력이 3배이면 부피는 1/3배이므로 0.8 L이다.',tip:'계산 전에 증감 방향부터 확인한다.'}
      ]},
      {type:'그래프·자료해석',prompt:'다음 P-V 자료는 같은 온도, 같은 기체량에서 측정한 것이다. 그래프의 관계를 가장 잘 설명한 것은?',visual:{type:'graph',xLabel:'P',xUnit:'상대값',yLabel:'V',yUnit:'상대값',points:[[1,4],[2,2],[4,1]],includeZeroX:true,includeZeroY:true,relation:'inverse',caption:'점들은 동일한 기체의 서로 다른 상태를 나타낸다.'},choices:['P와 V는 정비례한다','P와 V는 반비례한다','P+V가 일정하다','온도가 증가할수록 P와 V가 동시에 감소한다'],answer:1,explanation:'P가 2배가 될 때 V가 1/2배가 되어 PV가 일정한 보일 관계이다.',tip:'그래프에서도 배수 관계를 먼저 본다.',remediation:[
        {prompt:'P=2일 때 V=3인 상태가 보일 법칙을 따른다. P=6일 때 V는?',choices:['1','2','6','9'],answer:0,explanation:'2×3=6×V이므로 V=1이다.',tip:'그래프 문제도 PV 일정으로 환원한다.'},
        {prompt:'다음 자료 중 같은 온도에서 하나의 기체가 보일 법칙을 따르는 조합은?',visual:{type:'table',headers:['상태','P','V','PV'],rows:[['A','1','6','6'],['B','2','3','6'],['C','3','3','9']],caption:'P와 V는 상대값이다.'},choices:['A와 B','A와 C','B와 C','A, B, C 모두'],answer:0,explanation:'A와 B는 PV가 모두 6이므로 같은 보일 관계에 놓일 수 있다.',tip:'표에서는 곱 PV를 빠르게 확인한다.'}
      ]},
      {type:'계산',prompt:'압력과 기체량이 일정한 기체가 27 ℃에서 150 mL이다. 327 ℃에서는 부피가 얼마인가?',choices:['75 mL','150 mL','225 mL','300 mL'],answer:3,explanation:'27 ℃=300 K, 327 ℃=600 K. 절대온도가 2배이므로 부피도 2배.',tip:'샤를 법칙에서는 반드시 K로 변환한다.',remediation:[
        {prompt:'압력이 일정한 기체가 127 ℃에서 200 mL이다. 327 ℃에서 부피는?',choices:['250 mL','300 mL','400 mL','600 mL'],answer:1,explanation:'127 ℃=400 K, 327 ℃=600 K이므로 부피는 200×600/400=300 mL.',tip:'섭씨를 먼저 K로 바꾼다.'},
        {prompt:'압력이 일정하다. 300 K에서 480 mL인 기체를 450 K로 가열했다. 최종 부피는?',choices:['320 mL','480 mL','600 mL','720 mL'],answer:3,explanation:'V/T 일정이므로 480×450/300=720 mL이다.',tip:'절대온도 비가 1.5배면 부피도 1.5배.'}
      ]},
      {type:'표·자료해석',prompt:'표의 A와 B는 같은 양의 기체이다. A→B에서 압력이 일정하다고 할 때 ?에 들어갈 값은?',visual:{type:'table',headers:['상태','온도(K)','부피(mL)','압력'],rows:[['A','300','240','일정'],['B','450','?','일정']],caption:'기체량과 압력은 일정하다.'},choices:['160 mL','240 mL','360 mL','450 mL'],answer:2,explanation:'V/T 일정이므로 240/300=V/450, V=360 mL.',tip:'표를 보면 먼저 무엇이 고정인지 표시.',remediation:[
        {prompt:'다음 표에서 압력이 일정할 때 B의 온도는?',visual:{type:'table',headers:['상태','T(K)','V(mL)'],rows:[['A','250','200'],['B','?','320']]},choices:['300 K','350 K','400 K','500 K'],answer:2,explanation:'200/250=320/T이므로 T=400 K이다.',tip:'V/T 일정.'},
        {prompt:'압력이 일정한 기체의 V-T 자료로 옳은 것은?',choices:['T가 2배면 V도 2배','T가 2배면 V는 1/2배','T가 증가해도 V는 일정','V와 T는 항상 반비례'],answer:0,explanation:'압력과 기체량이 일정하면 부피는 절대온도에 정비례한다.',tip:'샤를 = V∝T(K).'}
      ]},
      {type:'개념·함정',prompt:'27 ℃에서 54 ℃로 가열하면 섭씨온도가 2배가 된다. 압력이 일정할 때 기체 부피도 정확히 2배가 되는가?',choices:['그렇다. 섭씨가 2배이기 때문이다','아니다. 300 K→327 K이므로 조금 증가한다','아니다. 부피는 감소한다','온도와 부피는 관계없다'],answer:1,explanation:'샤를 법칙은 섭씨가 아니라 절대온도에 대한 비례 관계이다.',tip:'℃ 숫자만 보고 배수 판단 금지.',remediation:[
        {prompt:'0 ℃에서 100 ℃로 가열하면 절대온도는 몇 배가 되는가?',choices:['정확히 2배','약 1.37배','약 3.73배','변하지 않는다'],answer:1,explanation:'273 K→373 K이므로 약 373/273≈1.37배이다.',tip:'온도 배수는 K 기준.'},
        {prompt:'압력이 일정할 때 27 ℃의 기체를 327 ℃로 가열하면 부피가 정확히 2배가 되는 이유는?',choices:['섭씨온도가 12배여서','300 K가 600 K가 되어 절대온도가 2배라서','압력이 2배라서','분자 수가 2배라서'],answer:1,explanation:'샤를 법칙은 절대온도에 대한 정비례 관계이므로 300 K→600 K에서 부피가 2배가 된다.',tip:'섭씨가 아니라 K를 비교한다.'}
      ]}
    ]
  },
  {
    id:'test-physics-2026-09-01-v2',date:'2026-09-01',test:true,sync:false,required:false,subject:'역학과 에너지',range:'TEST · 힘의 합성 / 운동 자료 형식 미리보기',title:'물리 테스트 · 벡터와 운동',note:'아직 배우지 않은 내용이 섞여 있어 정답을 몰라도 된다. 실제 정식 진도는 내일부터 완자 순서대로 진행한다. 오늘은 그림·그래프 문제와 오답보강이 어떻게 나오는지 확인하는 용도다.',
    questions:[
      {type:'그림·벡터',prompt:'한 물체에 서로 수직인 3 N과 4 N의 힘이 동시에 작용한다. 합력의 크기는?',visual:{type:'vectors',vectors:[{x:90,y:0,label:'3 N'},{x:0,y:120,label:'4 N'}],resultant:{x:90,y:120,label:'R'},caption:'두 힘은 서로 수직이다.'},choices:['1 N','5 N','7 N','12 N'],answer:1,explanation:'서로 수직인 벡터의 합력은 피타고라스 관계로 √(3²+4²)=5 N.',tip:'수직이면 직각삼각형부터 본다.',remediation:[
        {prompt:'서로 수직인 5 N과 12 N의 힘이 동시에 작용한다. 합력의 크기는?',choices:['7 N','13 N','17 N','60 N'],answer:1,explanation:'√(5²+12²)=13 N이다.',tip:'5-12-13 삼각형.'},
        {prompt:'그림처럼 서로 수직인 두 힘이 작용한다. 합력의 크기는?',visual:{type:'vectors',vectors:[{x:120,y:0,label:'6 N'},{x:0,y:160,label:'8 N'}],resultant:{x:120,y:160,label:'R'}},choices:['2 N','10 N','14 N','48 N'],answer:1,explanation:'√(6²+8²)=10 N이다.',tip:'그림의 방향이 수직인지 먼저 확인한다.'}
      ]},
      {type:'개념',prompt:'다음 중 방향까지 함께 나타내야 완전히 표현되는 물리량은?',choices:['질량','시간','속력','힘'],answer:3,explanation:'힘은 크기와 방향을 가지는 벡터량이다.',tip:'힘·속도·가속도는 방향을 확인한다.',remediation:[
        {prompt:'다음 중 스칼라량만으로 묶인 것은?',choices:['질량, 시간','힘, 속도','가속도, 변위','힘, 가속도'],answer:0,explanation:'질량과 시간은 크기만으로 표현되는 스칼라량이다.',tip:'방향이 필요하면 벡터.'},
        {prompt:'크기는 같지만 방향이 반대라면 서로 다른 값으로 취급해야 하는 물리량은?',choices:['온도','질량','속도','시간'],answer:2,explanation:'속도는 방향을 포함하는 벡터량이므로 방향이 다르면 다른 속도이다.',tip:'속력과 속도를 구분한다.'}
      ]},
      {type:'그림·합성',prompt:'그림에서 두 힘 F₁, F₂가 같은 방향으로 작용한다. 합력의 방향과 크기에 대한 설명으로 옳은 것은?',visual:{type:'vectors',vectors:[{x:80,y:0,label:'F₁=2 N'},{x:130,y:0,label:'F₂=3 N'}],caption:'두 화살표는 같은 방향을 가리킨다.'},choices:['반대 방향 1 N','같은 방향 1 N','같은 방향 5 N','합력은 0 N'],answer:2,explanation:'같은 방향의 벡터는 크기를 더하므로 2+3=5 N.',tip:'같은 방향 더하기, 반대 방향 빼기.',remediation:[
        {prompt:'오른쪽으로 7 N, 오른쪽으로 5 N의 힘이 작용한다. 합력은?',choices:['오른쪽 2 N','왼쪽 2 N','오른쪽 12 N','왼쪽 12 N'],answer:2,explanation:'같은 방향이므로 7+5=12 N, 방향은 오른쪽이다.',tip:'방향을 먼저 보고 연산을 정한다.'},
        {prompt:'오른쪽으로 9 N, 왼쪽으로 4 N의 힘이 동시에 작용한다. 합력은?',choices:['오른쪽 5 N','왼쪽 5 N','오른쪽 13 N','0 N'],answer:0,explanation:'반대 방향이므로 9-4=5 N이며 큰 힘의 방향인 오른쪽이다.',tip:'반대 방향은 큰 값에서 작은 값을 뺀다.'}
      ]},
      {type:'궤적·개념',prompt:'공기 저항을 무시한 포물선 운동에서 빨간 점이 최고점이라고 하자. 최고점에서 옳은 것은?',visual:{type:'trajectory',highlight:3,points:[[0,0],[1,1.5],[2,2.35],[3,2.7],[4,2.35],[5,1.5],[6,0]],caption:'수평 오른쪽으로 진행하는 물체의 궤적'},choices:['속도가 완전히 0이다','수직 속도 성분은 0이지만 수평 속도 성분은 남아 있다','가속도가 0이다','중력이 순간적으로 사라진다'],answer:1,explanation:'최고점에서는 수직 속도만 0이고 수평 속도는 유지된다. 중력가속도는 계속 아래 방향이다.',tip:'최고점에서 v_y=0이지 v 전체=0은 아니다.',remediation:[
        {prompt:'포물선 운동의 최고점에서도 계속 존재하는 것은?',choices:['아래 방향 중력가속도','위 방향 중력가속도','0인 수평속도','0인 중력'],answer:0,explanation:'중력가속도는 운동 내내 아래 방향으로 작용한다.',tip:'가속도와 속도를 구분한다.'},
        {prompt:'공기 저항이 없을 때 포물선 운동의 최고점에서 수평 속도 성분은 어떻게 되는가?',choices:['0이 된다','운동 중 계속 일정하다','방향이 반대로 바뀐다','중력가속도와 같아진다'],answer:1,explanation:'수평 방향 힘이 없으므로 수평 속도 성분은 일정하다.',tip:'중력은 수직 방향에만 작용한다.'}
      ]},
      {type:'그림·판단',prompt:'다음 벡터 그림에서 빨간 점선 R이 두 파란 힘의 합력이라면 R의 방향은?',visual:{type:'vectors',vectors:[{x:95,y:0,label:'F₁'},{x:0,y:75,label:'F₂'}],resultant:{x:95,y:75,label:'R'},caption:'평행사변형법으로 합력을 나타낸 모습'},choices:['오른쪽 아래','왼쪽 위','오른쪽 위','왼쪽 아래'],answer:2,explanation:'오른쪽 힘과 위쪽 힘을 합치면 합력은 오른쪽 위 방향이다.',tip:'벡터 합성은 화살표 끝점의 대각선 방향.',remediation:[
        {prompt:'오른쪽 방향 힘과 아래쪽 방향 힘을 합성하면 합력은 어느 방향인가?',choices:['오른쪽 위','오른쪽 아래','왼쪽 위','왼쪽 아래'],answer:1,explanation:'오른쪽 성분과 아래쪽 성분을 모두 가지므로 오른쪽 아래이다.',tip:'각 벡터의 방향 성분을 그대로 합친다.'},
        {prompt:'그림에서 합력 R의 방향으로 옳은 것은?',visual:{type:'vectors',vectors:[{x:-85,y:0,label:'F₁'},{x:0,y:95,label:'F₂'}],resultant:{x:-85,y:95,label:'R'}},choices:['오른쪽 위','오른쪽 아래','왼쪽 위','왼쪽 아래'],answer:2,explanation:'왼쪽 성분과 위쪽 성분을 합치면 왼쪽 위 방향이다.',tip:'그림에서 x, y 방향을 따로 본다.'}
      ]},
      {type:'응용',prompt:'물체에 작용하는 합력이 0일 때 반드시 옳은 것은?',choices:['물체는 반드시 정지한다','물체의 속도는 반드시 증가한다','가속도는 0이다','운동 방향이 매 순간 바뀐다'],answer:2,explanation:'합력이 0이면 뉴턴의 제2법칙에 따라 가속도가 0이다. 정지해 있을 수도, 일정한 속도로 움직일 수도 있다.',tip:'합력 0 = 가속도 0, 반드시 정지는 아님.',remediation:[
        {prompt:'일정한 속도로 직선 운동하는 물체에 작용하는 합력은?',choices:['0 N','항상 운동 방향으로 존재','항상 반대 방향으로 존재','속도와 같은 크기'],answer:0,explanation:'속도가 일정하면 가속도가 0이므로 합력도 0이다.',tip:'등속 직선 운동 → a=0 → F합=0.'},
        {prompt:'정지해 있는 물체에 서로 같은 크기의 반대 방향 힘 두 개가 작용한다. 이후 운동 상태에 대한 설명으로 옳은 것은?',choices:['반드시 가속한다','합력이 0이므로 정지 상태를 유지할 수 있다','한쪽 방향으로 속력이 계속 증가한다','힘이 있으므로 합력도 반드시 0이 아니다'],answer:1,explanation:'두 힘이 상쇄되어 합력이 0이면 가속도가 0이므로 정지 상태를 유지할 수 있다.',tip:'힘이 여러 개 있어도 합력이 0일 수 있다.'}
      ]}
    ]
  }
];
