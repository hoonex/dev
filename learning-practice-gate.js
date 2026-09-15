(() => {
  const tracks=Array.isArray(window.LEARNING_TRACKS)?window.LEARNING_TRACKS:[];
  const learningKey='science-step-progress-v2';
  const getLearning=()=>{try{return JSON.parse(localStorage.getItem(learningKey)||'{}')||{};}catch{return{};}};
  const done=(track,unit)=>Math.min(getLearning()[`${track.id}:${unit.id}`]?.doneSteps||0,unit.lesson.length)>=unit.lesson.length;
  const practicePassed=unitId=>{try{return Boolean(JSON.parse(localStorage.getItem(`science-unit-practice-v1:${unitId}`)||'{}')?.completed);}catch{return false;}};
  const activeTrack=()=>tracks.find(t=>t.id===document.querySelector('.tab.active')?.dataset.track)||tracks[0];
  const firstPendingPractice=(track=activeTrack())=>{
    if(!track)return null;
    for(const unit of track.units||[]){if(done(track,unit)&&!practicePassed(unit.id))return unit; if(!done(track,unit))break;}
    return null;
  };

  function patchTool(){
    const link=document.querySelector('.tool-row .tool-link');
    if(link){link.href='unit-practice.html';link.innerHTML='<strong>배운 단원 문제</strong> · 개념 완료한 단원만';}
  }

  function patchCards(){
    const track=activeTrack(); if(!track)return;
    const cards=[...document.querySelectorAll('#track .unit-card')];
    cards.forEach((card,index)=>{
      const unit=track.units[index]; if(!unit)return;
      card.classList.remove('practice-locked');
      const status=card.querySelector('.status'),next=card.querySelector('.unit-next');
      const isDone=done(track,unit),passed=practicePassed(unit.id);
      if(isDone&&!passed){if(status){status.textContent='문제 풀이 필요';status.classList.remove('done');}if(next)next.textContent='단원 문제를 완료해야 다음 단원이 열림';}
      if(index>0){const prev=track.units[index-1];if(done(track,prev)&&!practicePassed(prev.id)){card.classList.add('locked','practice-locked');card.setAttribute('aria-disabled','true');if(status){status.textContent='잠김';status.classList.remove('done');}if(next)next.textContent=`${prev.title} 단원 문제를 먼저 완료`;}}
      if(isDone&&passed){if(status){status.textContent='개념+문제 완료';status.classList.add('done');}if(next)next.textContent='이 단원 학습 완료';}
    });
  }

  function currentCelebrationMeta(){
    if(!document.querySelector('.celebrate'))return null;
    const track=activeTrack(); if(!track)return null;
    const text=document.getElementById('lessonPosition')?.textContent||'';
    const unit=(track.units||[]).find(u=>text.includes(u.title));
    return unit?{track,unit,index:track.units.indexOf(unit)}:null;
  }

  function patchCelebrate(){
    const meta=currentCelebrationMeta(); if(!meta)return;
    const actions=document.querySelector('.celebrate .completion-actions'); if(!actions)return;
    const {track,unit,index}=meta; const passed=practicePassed(unit.id); const hasNext=index+1<track.units.length;
    if(!passed){
      actions.innerHTML=`<button class="btn" data-action="home">학습 목록</button><a class="btn primary" href="unit-practice.html?unit=${encodeURIComponent(unit.id)}" style="text-decoration:none;text-align:center">이 단원 문제 풀기 →</a>`;
      const p=document.querySelector('.celebrate p'); if(p)p.textContent='개념 확인은 끝났습니다. 이제 이 단원 문제를 풀고 오답 보강까지 완료해야 다음 단원이 열립니다.';
    }else if(hasNext){
      actions.innerHTML='<button class="btn" data-action="home">학습 목록</button><button class="btn primary" data-action="next-unit">다음 단원 시작 →</button>';
      const p=document.querySelector('.celebrate p'); if(p)p.textContent='개념 확인과 단원 문제까지 완료했습니다. 다음 단원으로 넘어가도 됩니다.';
    }else{
      actions.innerHTML='<button class="btn" data-action="home">학습 목록</button><a class="btn primary" href="drill.html" style="text-decoration:none;text-align:center">전범위 실전 문제 →</a>';
      const p=document.querySelector('.celebrate p'); if(p)p.textContent='이 과목의 개념과 단원 문제를 모두 완료했습니다. 이제 전범위 실전 문제로 넘어갑니다.';
    }
  }

  function patchContinue(){
    const unit=firstPendingPractice(); if(!unit)return;
    const label=document.getElementById('continueLabel'),btn=document.getElementById('continueStudy');
    if(label)label.textContent=`${unit.title} · 단원 문제 필요`;
    if(btn){btn.disabled=false;btn.textContent='이 단원 문제 풀기 →';btn.dataset.practiceUnit=unit.id;}
  }

  function patch(){patchTool();patchCards();patchCelebrate();patchContinue();}
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#continueStudy'); if(!btn)return;
    const unit=firstPendingPractice(); if(!unit)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();location.href=`unit-practice.html?unit=${encodeURIComponent(unit.id)}`;
  },true);
  const observer=new MutationObserver(()=>queueMicrotask(patch));
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('pageshow',patch);
  patch();
})();