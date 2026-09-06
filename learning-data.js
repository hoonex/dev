window.LEARNING_TRACKS = [
  {
    id:'physics', subject:'역학과 에너지', accent:'blue', range:'시험범위 p.10~97',
    units:[
      {id:'p-vector',title:'벡터부터 시작',minutes:7,lesson:[
        {title:'숫자만 있으면 충분한가?',body:'질량 5 kg처럼 크기만 필요한 양은 스칼라다. 하지만 “5 m/s로 움직인다”만으로는 속도를 완전히 말한 게 아니다. 어느 방향인지까지 있어야 한다. 속도·가속도·힘·변위는 크기와 방향을 함께 가지는 벡터다.',visual:{type:'vector',a:'5 N →',b:'← 3 N'},check:{prompt:'다음 중 벡터량은?',choices:['질량','시간','힘','온도'],answer:2,explanation:'힘은 크기와 방향을 함께 가져야 완전히 표현된다.'}},
        {title:'같은 직선 위 힘 합치기',body:'같은 방향이면 크기를 더한다. 반대 방향이면 큰 힘에서 작은 힘을 빼고, 방향은 큰 힘 쪽이다. 오른쪽을 +로 정해 5 N과 -3 N처럼 부호를 붙이면 실수가 줄어든다.',visual:{type:'formula',text:'(+5 N) + (-3 N) = +2 N'},check:{prompt:'오른쪽 8 N, 왼쪽 3 N이 동시에 작용한다. 합력은?',choices:['오른쪽 5 N','왼쪽 5 N','오른쪽 11 N','0 N'],answer:0,explanation:'반대 방향이므로 8-3=5 N, 더 큰 힘이 오른쪽이다.'}},
        {title:'수직인 힘은 피타고라스',body:'오른쪽 3 N과 위쪽 4 N처럼 서로 수직이면 단순히 7 N이라고 더하면 안 된다. 두 성분을 직각삼각형의 두 변으로 보고 합력은 빗변으로 구한다.',visual:{type:'formula',text:'R = √(3²+4²) = 5 N'},check:{prompt:'서로 수직인 6 N과 8 N의 합력 크기는?',choices:['2 N','10 N','14 N','48 N'],answer:1,explanation:'√(6²+8²)=10 N이다.'}}
      ]},
      {id:'p-projectile',title:'포물선 운동',minutes:9,lesson:[
        {title:'대각선 운동을 둘로 쪼개기',body:'포물선 운동은 복잡해 보여도 수평과 수직을 따로 보면 된다. 공기 저항을 무시하면 수평방향에는 가속도가 없어서 수평 속도는 일정하고, 수직방향에는 중력가속도가 계속 작용한다.',visual:{type:'split',left:'x방향: vₓ 일정',right:'y방향: aᵧ = -g'},check:{prompt:'공기 저항을 무시한 포물선 운동에서 일정한 것은?',choices:['전체 속도','수평 속도 성분','수직 속도 성분','가속도 크기와 방향이 모두 0'],answer:1,explanation:'수평방향 가속도가 0이므로 vₓ가 일정하다.'}},
        {title:'최고점에서 멈추는 게 아니다',body:'최고점에서는 위로 가던 수직 속도 성분 vᵧ만 순간적으로 0이 된다. 수평 속도 vₓ는 그대로 남는다. 따라서 물체 전체 속도는 0이 아니다. 중력가속도도 사라지지 않고 계속 아래쪽이다.',visual:{type:'trajectory',label:'최고점: vᵧ=0, vₓ≠0, a↓'},check:{prompt:'포물선의 최고점에서 옳은 것은?',choices:['속도 전체가 0','가속도가 0','수직 속도만 0','중력이 위로 작용'],answer:2,explanation:'최고점에서는 vᵧ만 0이고 vₓ와 아래쪽 중력가속도는 남는다.'}},
        {title:'수평투사는 낙하시간부터',body:'높이에서 수평으로 던졌다면 바닥에 닿는 시간은 수직 운동만으로 정한다. 높이 h에 대해 h=½gt²를 먼저 풀고, 그다음 수평거리 x=vₓt를 계산한다.',visual:{type:'formula',text:'h = ½gt²  →  t  →  x = vₓt'},check:{prompt:'같은 높이에서 두 공을 서로 다른 수평속도로 동시에 던졌다. 공기 저항을 무시하면?',choices:['빠른 공이 먼저 낙하','느린 공이 먼저 낙하','동시에 낙하','질량이 큰 공만 먼저 낙하'],answer:2,explanation:'낙하 시간은 수직 운동으로만 결정되어 수평 속도와 무관하다.'}}
      ]},
      {id:'p-circle',title:'등속 원운동',minutes:8,lesson:[
        {title:'속력은 일정, 속도는 계속 변함',body:'원운동에서는 속력이 일정해도 진행 방향이 매 순간 바뀐다. 속도는 방향을 포함하는 벡터이므로 속도가 변하고, 따라서 가속도가 존재한다.',visual:{type:'circle',label:'v: 접선 / a: 중심'},check:{prompt:'등속 원운동에 가속도가 있는 이유는?',choices:['질량이 변해서','속력의 크기가 계속 증가해서','속도의 방향이 계속 변해서','중력이 항상 0이라서'],answer:2,explanation:'속도 벡터의 방향이 계속 변하므로 가속도가 있다.'}},
        {title:'속도는 접선, 가속도는 중심',body:'원의 어느 위치에서도 순간 속도는 궤도의 접선 방향이고, 구심가속도는 원의 중심을 향한다. 문제 그림이 나오면 계산 전에 중심부터 표시하자.',visual:{type:'circle',label:'접선 방향 v →   중심 방향 a ↙'},check:{prompt:'원 위 물체의 구심가속도 방향은?',choices:['접선 방향','원의 중심 방향','항상 위쪽','운동 반대 방향'],answer:1,explanation:'구심가속도는 항상 원의 중심을 향한다.'}},
        {title:'구심가속도 배수 계산',body:'구심가속도는 a=v²/r이다. 속력이 2배가 되면 제곱 때문에 4배, 반지름이 2배가 되면 1/2배가 된다.',visual:{type:'formula',text:'a = v² / r'},check:{prompt:'반지름이 같을 때 속력이 3배가 되면 구심가속도는?',choices:['3배','6배','9배','1/3배'],answer:2,explanation:'a∝v²이므로 3²=9배다.'}}
      ]},
      {id:'p-pendulum',title:'단진자',minutes:6,lesson:[
        {title:'주기를 바꾸는 건 길이와 g',body:'작은 진폭에서 단진자 주기는 T=2π√(L/g)이다. 추의 질량은 식에 없으므로 이상적인 단진자에서는 질량을 바꿔도 주기가 변하지 않는다.',visual:{type:'formula',text:'T = 2π√(L/g)'},check:{prompt:'같은 장소에서 단진자의 추 질량만 2배로 바꾸면 주기는?',choices:['2배','√2배','1/2배','변하지 않음'],answer:3,explanation:'주기 식에 질량이 없으므로 변하지 않는다.'}},
        {title:'길이는 제곱근으로 영향',body:'T∝√L이다. 길이 4배면 주기 2배, 길이 9배면 주기 3배다. 배수 문제는 식 전체를 계산하지 말고 비례관계만 쓰면 빠르다.',visual:{type:'formula',text:'L ×4  →  T ×2'},check:{prompt:'진자 길이를 9배로 하면 주기는?',choices:['3배','9배','1/3배','81배'],answer:0,explanation:'T∝√L이므로 √9=3배다.'}}
      ]}
    ]
  },
  {
    id:'chemistry',subject:'물질과 에너지',accent:'mint',range:'시험범위 p.10~71, p.108~151',
    units:[
      {id:'c-gas',title:'기체 법칙 연결',minutes:9,lesson:[
        {title:'아보가드로 법칙',body:'온도와 압력이 같다면 기체의 부피는 기체의 양 n에 비례한다. 즉 몰수가 2배면 부피도 2배다. “같은 온도·같은 압력” 조건이 핵심이다.',visual:{type:'split',left:'n ↑',right:'V ↑ (T,P 일정)'},check:{prompt:'온도와 압력이 일정할 때 기체 몰수가 3배가 되면 부피는?',choices:['1/3배','같음','3배','9배'],answer:2,explanation:'아보가드로 법칙에 따라 V∝n이다.'}},
        {title:'이상 기체 방정식',body:'보일·샤를·아보가드로 관계를 한 식으로 묶은 것이 PV=nRT다. 계산 전에는 온도를 반드시 K로 바꾸고, 문제에서 사용한 R에 맞게 압력·부피 단위를 맞춘다.',visual:{type:'formula',text:'PV = nRT   /   K = ℃ + 273'},check:{prompt:'27 ℃를 이상 기체 방정식에 넣을 때 온도는?',choices:['27 K','246 K','273 K','300 K'],answer:3,explanation:'27+273=300 K이다.'}},
        {title:'분자량과 밀도',body:'기체 질량이 w라면 n=w/M이므로 PV=(w/M)RT에서 M=wRT/PV를 얻는다. 밀도 d=w/V를 이용하면 M=dRT/P가 된다. 같은 T,P에서 밀도가 큰 기체는 분자량도 크다.',visual:{type:'formula',text:'M = dRT / P'},check:{prompt:'같은 온도와 압력에서 기체 A의 밀도가 B의 2배라면 분자량은?',choices:['A가 B의 1/2배','A가 B의 2배','서로 같다','판단 불가'],answer:1,explanation:'같은 T,P에서는 M∝d이다.'}}
      ]},
      {id:'c-mixture',title:'혼합 기체',minutes:7,lesson:[
        {title:'부분 압력은 각 기체의 몫',body:'혼합 기체의 전체 압력은 각 기체가 혼자 그 용기를 차지한다고 생각했을 때의 부분 압력을 모두 더한 값이다.',visual:{type:'formula',text:'P전체 = P₁ + P₂ + ···'},check:{prompt:'A의 부분 압력이 1 atm, B가 2 atm이면 전체 압력은?',choices:['1 atm','2 atm','3 atm','1/2 atm'],answer:2,explanation:'달톤의 부분 압력 법칙에 따라 합하면 3 atm이다.'}},
        {title:'몰분율이 압력 비율이 된다',body:'같은 T,V에서 이상 기체 압력은 몰수에 비례한다. 그래서 A의 몰분율 xA=nA/n전체는 압력에서도 같은 비율이 되어 PA=xA·P전체가 된다.',visual:{type:'formula',text:'xA = nA/n전체   →   PA = xA·P전체'},check:{prompt:'전체 5 mol 중 A가 2 mol이고 전체 압력이 10 atm이다. A의 부분 압력은?',choices:['2 atm','4 atm','5 atm','8 atm'],answer:1,explanation:'xA=2/5, PA=(2/5)×10=4 atm이다.'}},
        {title:'수상 치환은 수증기압 빼기',body:'물 위에서 모은 기체에는 목표 기체뿐 아니라 수증기도 섞여 있다. 따라서 전체 압력에서 그 온도의 수증기압을 빼야 목표 기체의 압력이 나온다.',visual:{type:'formula',text:'P기체 = P전체 - P수증기'},check:{prompt:'전체 압력 760 mmHg, 수증기압 20 mmHg라면 기체 압력은?',choices:['20','740','760','780'],answer:1,explanation:'760-20=740 mmHg이다.'}}
      ]},
      {id:'c-liquid',title:'액체와 분자 사이 힘',minutes:10,lesson:[
        {title:'분자 사이 힘이 물성을 바꾼다',body:'분자 사이 인력이 강할수록 분자가 액체 표면을 빠져나가기 어렵다. 따라서 같은 온도에서 증기 압력은 낮아지고, 끓이려면 더 높은 온도가 필요해 끓는점은 높아진다.',visual:{type:'chain',text:'분자 사이 힘 ↑ → 증발 어려움 → 증기압 ↓ → 끓는점 ↑'},check:{prompt:'같은 온도에서 분자 사이 힘이 더 강한 액체의 일반적 특징은?',choices:['증기압이 더 큼','끓는점이 더 낮음','증기압이 더 작음','항상 밀도가 0'],answer:2,explanation:'분자 사이 힘이 강할수록 증발이 어려워 증기압이 낮다.'}},
        {title:'수소 결합',body:'H가 N, O, F에 결합한 분자들 사이에서는 강한 수소 결합이 나타날 수 있다. 그래서 NH₃, H₂O, HF 같은 물질은 비슷한 분자량의 물질보다 끓는점이 유난히 높게 나타난다.',visual:{type:'chips',items:['N–H','O–H','F–H']},check:{prompt:'수소 결합 때문에 끓는점이 크게 높아지는 대표 물질은?',choices:['CH₄','H₂O','CO₂','Cl₂'],answer:1,explanation:'물 분자 사이에는 강한 수소 결합이 작용한다.'}},
        {title:'동적 평형과 증기 압력',body:'밀폐 용기에서 시간이 지나면 증발 속도와 응축 속도가 같아진다. 이것이 동적 평형이다. 분자 운동이 멈춘 것이 아니라 두 과정이 같은 속도로 계속 일어난다. 이때 기체가 나타내는 압력이 증기 압력이다.',visual:{type:'split',left:'증발 ↑',right:'응축 ↓  (속도 같음)'},check:{prompt:'동적 평형 상태에서 옳은 것은?',choices:['증발이 완전히 멈춘다','응축만 일어난다','증발과 응축 속도가 같다','분자가 모두 고체가 된다'],answer:2,explanation:'두 과정이 같은 속도로 계속 일어난다.'}},
        {title:'끓는 조건',body:'액체의 증기 압력이 외부 압력과 같아지는 순간 액체 내부에서도 기포가 안정적으로 생겨 끓기 시작한다. 외부 압력이 높으면 더 높은 온도까지 가야 같은 증기 압력에 도달한다.',visual:{type:'formula',text:'끓기 시작: P증기 = P외부'},check:{prompt:'외부 압력이 커지면 일반적으로 액체의 끓는점은?',choices:['낮아진다','높아진다','항상 0 ℃','변화를 판단할 수 없다'],answer:1,explanation:'더 큰 증기 압력에 도달하려면 더 높은 온도가 필요하다.'}}
      ]}
    ]
  }
];