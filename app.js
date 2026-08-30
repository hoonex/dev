import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cfg = window.__ONE_CONFIG__ || {};
const supabase = cfg.supabaseUrl && cfg.supabasePublishableKey ? createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;
const $ = (s) => document.querySelector(s);
const canvas = $("#field");
const ctx = canvas.getContext("2d");
const state = {
  dayKey: null, questionId: null, prompt: "오늘, 가장 놓치고 싶지 않은 것은?", total: 0,
  words: [], ripples: [], flashes: [], channel: null, online: 1, demo: !supabase,
  pointer: { x: .5, y: .5 }, lastRippleSent: 0,
};
const demoWords = [
  ["사람",18],["시간",14],["건강",11],["나",9],["기억",8],["용기",7],["잠",5],["평온",5],["친구",4],["가능성",4],["사랑",4],["집",3]
];

function deviceToken(){
  let token = localStorage.getItem("one-device-token");
  if(!token){ token = crypto.randomUUID(); localStorage.setItem("one-device-token", token); }
  return token;
}
function toast(message){ const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(el.t); el.t=setTimeout(()=>el.classList.remove("show"),1800); }
function escapeWord(value){ return String(value||"").trim().replace(/\s+/g, ""); }
function seeded(text){ let h=2166136261; for(const c of text){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return ()=>((h=Math.imul(h^h>>>15,2246822507))>>>0)/4294967296; }
function formatDate(dayKey){
  const d = dayKey ? new Date(`${dayKey}T12:00:00+09:00`) : new Date();
  return new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"long",timeZone:"Asia/Seoul"}).format(d).toUpperCase();
}

function resize(){
  const dpr=Math.min(devicePixelRatio||1,2); canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr; canvas.style.width=`${innerWidth}px`; canvas.style.height=`${innerHeight}px`; ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize); resize();

function makeWord(item, index){
  const rnd=seeded(`${item.answer}:${index}`); const count=Number(item.count||1);
  const size=Math.min(64, 16 + Math.log2(count+1)*8 + rnd()*6);
  return { text:item.answer, count, x:.08+rnd()*.84, y:.22+rnd()*.56, vx:(rnd()-.5)*.000045, vy:(rnd()-.5)*.000032, size, phase:rnd()*Math.PI*2, depth:.55+rnd()*.65, hit:null };
}
function setWords(rows){ state.words=(rows||[]).slice(0,90).map(makeWord); }
function spawnFlash(word, remote=false){ state.flashes.push({word, age:0, remote, x:.18+Math.random()*.64, y:.28+Math.random()*.42}); if(state.flashes.length>8) state.flashes.shift(); }
function addRipple(nx,ny,remote=false){ state.ripples.push({x:nx,y:ny,age:0,remote}); if(state.ripples.length>22)state.ripples.shift(); }

function draw(){
  const w=innerWidth,h=innerHeight; ctx.clearRect(0,0,w,h);
  const grad=ctx.createRadialGradient(w*(.25+state.pointer.x*.18),h*(.2+state.pointer.y*.12),0,w*.5,h*.45,Math.max(w,h)*.8);
  grad.addColorStop(0,"rgba(35,38,32,.55)"); grad.addColorStop(.42,"rgba(9,10,10,.25)"); grad.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);

  ctx.textAlign="center";ctx.textBaseline="middle";
  for(const word of state.words){
    word.phase+=.0025; word.x+=word.vx; word.y+=word.vy;
    if(word.x<.03||word.x>.97)word.vx*=-1;if(word.y<.18||word.y>.82)word.vy*=-1;
    const px=word.x*w + (state.pointer.x-.5)*18*word.depth + Math.sin(word.phase)*5;
    const py=word.y*h + (state.pointer.y-.5)*12*word.depth + Math.cos(word.phase*.8)*3;
    const alpha=Math.min(.78,.22+Math.log2(word.count+1)*.11)*word.depth;
    ctx.font=`${Math.round(word.size*word.depth)}px Inter, Pretendard, sans-serif`;
    ctx.fillStyle=`rgba(246,244,238,${alpha})`;
    if(word.count>=8){ctx.shadowBlur=24;ctx.shadowColor="rgba(215,255,68,.12)";}else ctx.shadowBlur=0;
    ctx.fillText(word.text,px,py); ctx.shadowBlur=0;
    const metrics=ctx.measureText(word.text); word.hit={x:px-metrics.width/2-10,y:py-word.size/2-8,w:metrics.width+20,h:word.size+16};
  }

  for(const r of state.ripples){
    r.age+=.018; const radius=(24+r.age*250); const a=Math.max(0,.28-r.age*.25);
    ctx.beginPath();ctx.arc(r.x*w,r.y*h,radius,0,Math.PI*2);ctx.strokeStyle=r.remote?`rgba(118,231,255,${a})`:`rgba(215,255,68,${a})`;ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.arc(r.x*w,r.y*h,radius*.62,0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${a*.35})`;ctx.stroke();
  }
  state.ripples=state.ripples.filter(r=>r.age<1.2);

  for(const f of state.flashes){
    f.age+=.012; const t=f.age; const a=Math.max(0,1-t); const scale=.75+Math.sin(Math.min(1,t)*Math.PI)*.45;
    ctx.font=`700 ${Math.round(Math.min(92,w*.15)*scale)}px Inter, Pretendard, sans-serif`;
    ctx.fillStyle=f.remote?`rgba(118,231,255,${a*.82})`:`rgba(215,255,68,${a*.92})`;
    ctx.shadowBlur=40;ctx.shadowColor=ctx.fillStyle;ctx.fillText(f.word,f.x*w,f.y*h);ctx.shadowBlur=0;
  }
  state.flashes=state.flashes.filter(f=>f.age<1);
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

function pickWordAt(x,y){ return [...state.words].sort((a,b)=>b.count-a.count).find(word=>word.hit&&x>=word.hit.x&&x<=word.hit.x+word.hit.w&&y>=word.hit.y&&y<=word.hit.y+word.hit.h); }
canvas.addEventListener("pointermove",e=>{state.pointer.x=e.clientX/innerWidth;state.pointer.y=e.clientY/innerHeight;});
canvas.addEventListener("pointerdown",e=>{
  const hit=pickWordAt(e.clientX,e.clientY); if(hit){ showWordInfo(hit); return; }
  const nx=e.clientX/innerWidth,ny=e.clientY/innerHeight; addRipple(nx,ny,false);
  const now=Date.now(); if(state.channel&&now-state.lastRippleSent>400){state.lastRippleSent=now;state.channel.send({type:"broadcast",event:"ripple",payload:{x:nx,y:ny}});}
});

function showWordInfo(word){ $("#wordInfoWord").textContent=word.text; $("#wordInfoCount").textContent=`${word.count.toLocaleString("ko-KR")}명`; $("#wordInfo").hidden=false; }
$("#wordInfoClose").onclick=()=>$("#wordInfo").hidden=true;

async function rpc(name,args={}){ const {data,error}=await supabase.rpc(name,args); if(error)throw error; return data; }
async function loadToday(){
  if(!supabase){
    state.dayKey=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul"}).format(new Date()); state.total=92; setWords(demoWords.map(([answer,count])=>({answer,count}))); renderMeta(); return;
  }
  const today=(await rpc("one_get_today"))?.[0]; if(!today)throw new Error("오늘의 질문을 불러오지 못했어요.");
  state.dayKey=today.day_key;state.questionId=today.question_id;state.prompt=today.prompt;state.total=Number(today.answer_count||0);
  const rows=await rpc("one_list_words",{p_limit:90}); setWords(rows); renderMeta(); setupRealtime();
}
function renderMeta(){
  $("#question").textContent=state.prompt; $("#dateLabel").textContent=formatDate(state.dayKey); $("#totalCount").textContent=`${state.total.toLocaleString("en-US")} answers today`;
  const saved=JSON.parse(localStorage.getItem(`one-answer:${state.dayKey}`)||"null"); if(saved?.answer) showAfter(saved.answer); else showComposer();
}
function showComposer(){ $("#composer").hidden=false; $("#afterPanel").hidden=true; }
function showAfter(answer){ $("#composer").hidden=true; $("#afterPanel").hidden=false; $("#myWord").textContent=answer; }

async function refreshWords(){ if(!supabase)return; const [today,rows]=await Promise.all([rpc("one_get_today"),rpc("one_list_words",{p_limit:90})]); if(today?.[0])state.total=Number(today[0].answer_count||0); setWords(rows); $("#totalCount").textContent=`${state.total.toLocaleString("en-US")} answers today`; }
function setupRealtime(){
  if(state.channel) supabase.removeChannel(state.channel);
  const topic=`one:${state.dayKey}`;
  state.channel=supabase.channel(topic,{config:{broadcast:{self:false},presence:{key:deviceToken()}}});
  state.channel
    .on("broadcast",{event:"answer"},({payload})=>{ if(payload?.word){spawnFlash(payload.word,true);setTimeout(refreshWords,220);} })
    .on("broadcast",{event:"ripple"},({payload})=>{if(Number.isFinite(payload?.x)&&Number.isFinite(payload?.y))addRipple(payload.x,payload.y,true);})
    .on("presence",{event:"sync"},()=>{ const presence=state.channel.presenceState(); state.online=Math.max(1,Object.keys(presence).length); $("#onlineCount").textContent=state.online; })
    .subscribe(status=>{ if(status==="SUBSCRIBED") state.channel.track({at:Date.now()}); });
}

$("#answerForm").addEventListener("submit",async e=>{
  e.preventDefault(); const input=$("#answerInput"); const raw=input.value.trim(); const word=escapeWord(raw);
  if(!word){toast("한 단어를 입력해 주세요.");return;} if(/\s/.test(raw)){toast("공백 없이 한 단어만 남길 수 있어요.");return;} if([...word].length>16){toast("16자 안으로 줄여주세요.");return;}
  const button=e.currentTarget.querySelector("button");button.disabled=true;
  try{
    if(supabase){ await rpc("one_submit_answer",{p_answer:word,p_device_token:deviceToken()}); }
    localStorage.setItem(`one-answer:${state.dayKey}`,JSON.stringify({answer:word,at:Date.now()}));
    state.total+=1; showAfter(word); spawnFlash(word,false); addRipple(.5,.62,false); $("#questionWrap").classList.add("dim");
    if(state.channel) await state.channel.send({type:"broadcast",event:"answer",payload:{word}});
    setTimeout(async()=>{await refreshWords();$("#questionWrap").classList.remove("dim");},500);
  }catch(err){console.error(err);toast("답을 남기지 못했어요.");}
  finally{button.disabled=false;}
});

$("#myWordButton").onclick=()=>{const word=state.words.find(w=>w.text===$("#myWord").textContent);if(word)showWordInfo(word);};
$("#shareButton").onclick=async()=>{
  const text=`ONE — 오늘의 질문\n${state.prompt}\n\n나의 한 단어: ${$("#myWord").textContent}`;
  try{ if(navigator.share)await navigator.share({title:"ONE",text,url:location.href}); else {await navigator.clipboard.writeText(`${text}\n${location.href}`);toast("공유 문구를 복사했어요.");} }catch{}
};
$("#aboutButton").onclick=()=>$("#aboutDialog").showModal();$("#aboutClose").onclick=()=>$("#aboutDialog").close();

loadToday().catch(err=>{console.error(err);state.demo=true;state.total=92;setWords(demoWords.map(([answer,count])=>({answer,count})));renderMeta();toast("라이브 연결 대신 미리보기를 열었어요.");});
