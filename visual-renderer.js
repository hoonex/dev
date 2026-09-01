(() => {
  const C = {
    ink: '#172033', muted: '#6f7d94', axis: '#53627a', grid: '#dfe5f0', blue: '#315ee8',
    blue2: '#7c98f7', red: '#d04d63', green: '#248a5a', amber: '#b37713', paper: '#ffffff',
    panel: '#f8fbff', gas: '#eaf2ff', gas2: '#d7e6ff', metal: '#64748b', dark: '#334155'
  };
  let seq = 0;
  const uid = p => `${p}-${++seq}`;
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = (x, d = 0) => Number.isFinite(Number(x)) ? Number(x) : d;
  const fmt = x => {
    const v = Number(x);
    if (!Number.isFinite(v)) return e(x);
    if (Math.abs(v) >= 1000 || (Math.abs(v) > 0 && Math.abs(v) < 0.01)) return v.toExponential(1);
    return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
  };
  const cap = v => v?.caption ? `<div class="visual-caption">${e(v.caption)}</div>` : '';
  const wrap = (v, svg, cls='') => `<div class="visual visual-hq ${cls}">${svg}${cap(v)}</div>`;
  const svg = (viewBox, body, label='자료 그림') => `<svg class="science-svg" viewBox="${viewBox}" role="img" aria-label="${e(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const defs = id => `<defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f4f8ff"/></linearGradient>
    <linearGradient id="${id}-gas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.gas}"/><stop offset="1" stop-color="${C.gas2}"/></linearGradient>
    <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#94a3b8"/><stop offset=".5" stop-color="#e2e8f0"/><stop offset="1" stop-color="#64748b"/></linearGradient>
    <filter id="${id}-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#22355a" flood-opacity=".13"/></filter>
    <filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
    <marker id="${id}-arrow-blue" markerWidth="10" markerHeight="10" refX="8.2" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${C.blue}"/></marker>
    <marker id="${id}-arrow-red" markerWidth="10" markerHeight="10" refX="8.2" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${C.red}"/></marker>
    <marker id="${id}-arrow-dark" markerWidth="10" markerHeight="10" refX="8.2" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${C.axis}"/></marker>
  </defs>`;

  function table(v) {
    const headers = Array.isArray(v.headers) ? v.headers : [];
    const rows = Array.isArray(v.rows) ? v.rows : [];
    return `<div class="visual visual-hq table-visual"><div class="table-scroll"><table><thead><tr>${headers.map(x=>`<th>${e(x)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,ri)=>`<tr>${r.map((x,ci)=>`<td class="${ci===0?'row-head':''}">${e(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${cap(v)}</div>`;
  }

  function niceRange(values, includeZero=false) {
    let lo = Math.min(...values), hi = Math.max(...values);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
    if (includeZero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (lo === hi) { const d = Math.abs(lo || 1) * .5; lo -= d; hi += d; }
    const pad = (hi - lo) * .08;
    return [lo - pad, hi + pad];
  }
  function ticks(lo, hi, count=5) {
    const out=[]; for(let i=0;i<=count;i++) out.push(lo+(hi-lo)*i/count); return out;
  }
  function smoothPath(points) {
    if (points.length < 2) return '';
    if (points.length === 2) return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
    let d=`M ${points[0][0]} ${points[0][1]}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[i], p1=points[i+1], mx=(p0[0]+p1[0])/2;
      d += ` C ${mx} ${p0[1]}, ${mx} ${p1[1]}, ${p1[0]} ${p1[1]}`;
    }
    return d;
  }

  function graph(v) {
    const id=uid('g');
    const rawSeries = Array.isArray(v.series) && v.series.length
      ? v.series.map((s,i)=>({label:s.label||`자료 ${i+1}`, points:s.points||[], color:s.color||[C.blue,C.red,C.green,C.amber][i%4]}))
      : [{label:v.label||'', points:v.points||[], color:C.blue}];
    const pts = rawSeries.flatMap(s=>s.points).filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1])));
    if(!pts.length) return '';
    const [xmin,xmax]=niceRange(pts.map(p=>Number(p[0])), Boolean(v.includeZeroX));
    const [ymin,ymax]=niceRange(pts.map(p=>Number(p[1])), Boolean(v.includeZeroY));
    const W=620,H=360,L=76,R=24,T=30,B=64,PW=W-L-R,PH=H-T-B;
    const X=x=>L+(x-xmin)/(xmax-xmin)*PW, Y=y=>T+PH-(y-ymin)/(ymax-ymin)*PH;
    const xt=ticks(xmin,xmax,5), yt=ticks(ymin,ymax,5);
    let grid='';
    xt.forEach(t=>{const x=X(t);grid+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${T+PH}" stroke="${C.grid}" stroke-width="1"/><line x1="${x}" y1="${T+PH}" x2="${x}" y2="${T+PH+6}" stroke="${C.axis}"/><text x="${x}" y="${T+PH+22}" text-anchor="middle" class="svg-tick">${fmt(t)}</text>`});
    yt.forEach(t=>{const y=Y(t);grid+=`<line x1="${L}" y1="${y}" x2="${L+PW}" y2="${y}" stroke="${C.grid}" stroke-width="1"/><line x1="${L-6}" y1="${y}" x2="${L}" y2="${y}" stroke="${C.axis}"/><text x="${L-11}" y="${y+4}" text-anchor="end" class="svg-tick">${fmt(t)}</text>`});
    let series='';
    rawSeries.forEach((s,si)=>{
      const mapped=s.points.filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))).map(p=>[X(Number(p[0])),Y(Number(p[1]))]);
      const path = v.smooth===false ? mapped.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ') : smoothPath(mapped);
      series += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      mapped.forEach((p,i)=>{const orig=s.points[i]||[];const label=(v.pointLabels&&v.pointLabels[i])||orig[2]||'';series+=`<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="#fff" stroke="${s.color}" stroke-width="3"/>${label?`<g transform="translate(${p[0]+9},${p[1]-10})"><rect x="-4" y="-13" rx="7" width="${Math.max(28,String(label).length*9+10)}" height="22" fill="#fff" stroke="#dce5f0"/><text x="2" y="2" class="svg-label">${e(label)}</text></g>`:''}`});
    });
    const legend=rawSeries.length>1?`<g transform="translate(${L+8},${T+8})">${rawSeries.map((s,i)=>`<g transform="translate(${i*110},0)"><line x1="0" y1="0" x2="22" y2="0" stroke="${s.color}" stroke-width="3"/><text x="29" y="4" class="svg-small">${e(s.label)}</text></g>`).join('')}</g>`:'';
    const body=`${defs(id)}<rect x="1" y="1" width="618" height="358" rx="18" fill="url(#${id}-bg)" stroke="#dce6f3"/>${grid}<line x1="${L}" y1="${T+PH}" x2="${L+PW+10}" y2="${T+PH}" stroke="${C.axis}" stroke-width="1.8" marker-end="url(#${id}-arrow-dark)"/><line x1="${L}" y1="${T+PH}" x2="${L}" y2="${T-10}" stroke="${C.axis}" stroke-width="1.8" marker-end="url(#${id}-arrow-dark)"/>${series}${legend}<text x="${L+PW/2}" y="${H-13}" text-anchor="middle" class="svg-axis">${e(v.xLabel||'x')}${v.xUnit?` (${e(v.xUnit)})`:''}</text><text x="18" y="${T+PH/2}" text-anchor="middle" class="svg-axis" transform="rotate(-90 18 ${T+PH/2})">${e(v.yLabel||'y')}${v.yUnit?` (${e(v.yUnit)})`:''}</text>`;
    return wrap(v,svg(`0 0 ${W} ${H}`,body,'그래프'),'graph-visual');
  }

  function particleDots(id, x, top, w, h, count, color=C.blue) {
    let out=''; const cols=Math.max(3,Math.ceil(Math.sqrt(count*1.35))); const rows=Math.max(2,Math.ceil(count/cols));
    for(let k=0;k<count;k++){
      const col=k%cols,row=Math.floor(k/cols); const fx=(col+.5)/cols, fy=(row+.6)/rows;
      const jitterX=((k*37)%11-5)*.8, jitterY=((k*53)%9-4)*.6;
      const cx=x+13+fx*(w-26)+jitterX, cy=top+11+fy*(h-22)+jitterY;
      out += `<g><circle cx="${cx}" cy="${cy}" r="6.2" fill="#fff" stroke="${color}" stroke-width="2.4"/><path d="M${cx-8},${cy} l-7,-2 M${cx+8},${cy} l7,2" stroke="${color}" stroke-width="1.1" stroke-linecap="round" opacity=".5"/></g>`;
    }
    return out;
  }

  function piston(v) {
    const states=Array.isArray(v.states)?v.states:[]; if(!states.length)return''; const id=uid('p');
    const cardW=238,gap=24,W=states.length*cardW+(states.length-1)*gap+28,H=350;
    const cards=states.map((s,i)=>{
      const gx=14+i*(cardW+gap), cx=gx+cardW/2, chamberX=gx+48, chamberY=64, chamberW=142, chamberH=188;
      const gasFrac=Math.max(.16,Math.min(.92,n(s.height,.6))); const gasH=chamberH*gasFrac, pistonY=chamberY+chamberH-gasH;
      const info=[s.pressure&&`P = ${s.pressure}`,s.volume&&`V = ${s.volume}`,s.temperature&&`T = ${s.temperature}`].filter(Boolean);
      const pressureArrows=s.pressure?`<g opacity=".9"><line x1="${cx-32}" y1="27" x2="${cx-32}" y2="48" stroke="${C.red}" stroke-width="2.6" marker-end="url(#${id}-arrow-red)"/><line x1="${cx}" y1="27" x2="${cx}" y2="48" stroke="${C.red}" stroke-width="2.6" marker-end="url(#${id}-arrow-red)"/><line x1="${cx+32}" y1="27" x2="${cx+32}" y2="48" stroke="${C.red}" stroke-width="2.6" marker-end="url(#${id}-arrow-red)"/></g>`:'';
      return `<g filter="url(#${id}-shadow)"><rect x="${gx+2}" y="8" width="${cardW-4}" height="326" rx="20" fill="#fff" stroke="#dce5f1"/></g>
        <g><rect x="${gx+15}" y="16" width="58" height="25" rx="12.5" fill="#eef3ff"/><text x="${gx+44}" y="33" text-anchor="middle" class="svg-chip">${e(s.label||`상태 ${i+1}`)}</text>${pressureArrows}
        <rect x="${chamberX}" y="${chamberY}" width="${chamberW}" height="${chamberH}" rx="12" fill="#fbfdff" stroke="#71809a" stroke-width="2"/>
        <path d="M${chamberX+6},${chamberY+6} V${chamberY+chamberH-8} M${chamberX+chamberW-6},${chamberY+6} V${chamberY+chamberH-8}" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
        <rect x="${chamberX+8}" y="${pistonY+8}" width="${chamberW-16}" height="${chamberY+chamberH-pistonY-16}" rx="7" fill="url(#${id}-gas)" opacity=".95"/>
        <rect x="${chamberX+6}" y="${pistonY}" width="${chamberW-12}" height="12" rx="4" fill="url(#${id}-metal)" stroke="#475569"/>
        <rect x="${cx-5}" y="${Math.max(42,pistonY-36)}" width="10" height="${Math.max(0,pistonY-Math.max(42,pistonY-36))}" rx="4" fill="url(#${id}-metal)"/>
        <rect x="${cx-32}" y="${Math.max(39,pistonY-42)}" width="64" height="9" rx="4.5" fill="#64748b"/>
        ${particleDots(id,chamberX+8,pistonY+10,chamberW-16,chamberY+chamberH-pistonY-18,Math.max(1,n(s.particles,8)),C.blue)}
        <line x1="${chamberX-12}" y1="${pistonY}" x2="${chamberX-12}" y2="${chamberY+chamberH}" stroke="#94a3b8" stroke-width="1.3"/><line x1="${chamberX-16}" y1="${pistonY}" x2="${chamberX-8}" y2="${pistonY}" stroke="#94a3b8"/><line x1="${chamberX-16}" y1="${chamberY+chamberH}" x2="${chamberX-8}" y2="${chamberY+chamberH}" stroke="#94a3b8"/>
        ${info.length?`<text x="${cx}" y="280" text-anchor="middle" class="svg-info">${info.map((t,j)=>`<tspan x="${cx}" dy="${j?18:0}">${e(t)}</tspan>`).join('')}</text>`:''}</g>`;
    }).join('');
    return wrap(v,svg(`0 0 ${W} ${H}`,`${defs(id)}<rect x="1" y="1" width="${W-2}" height="${H-2}" rx="20" fill="#f8fbff" stroke="#dce6f3"/>${cards}`,'기체 피스톤 비교 그림'),'piston-visual');
  }

  function vectors(v) {
    const id=uid('v'); const arr=Array.isArray(v.vectors)?v.vectors:[]; const res=v.resultant||null; if(!arr.length&&!res)return'';
    const W=600,H=350,cx=300,cy=180; const all=[...arr,res].filter(Boolean); const max=Math.max(1,...all.map(a=>Math.hypot(n(a.x),n(a.y)))); const scale=Math.min(1.35,128/max);
    const P=a=>[cx+n(a.x)*scale,cy-n(a.y)*scale];
    let grid='';for(let x=60;x<=540;x+=40)grid+=`<line x1="${x}" y1="30" x2="${x}" y2="310" stroke="#e7edf6"/>`;for(let y=40;y<=300;y+=40)grid+=`<line x1="60" y1="${y}" x2="540" y2="${y}" stroke="#e7edf6"/>`;
    let para=''; if(arr.length===2&&res){const a=P(arr[0]),b=P(arr[1]);para=`<path d="M${a[0]} ${a[1]} L${a[0]+(b[0]-cx)} ${a[1]+(b[1]-cy)} M${b[0]} ${b[1]} L${b[0]+(a[0]-cx)} ${b[1]+(a[1]-cy)}" stroke="#a8b6cc" stroke-width="1.7" stroke-dasharray="6 5" fill="none"/>`;}
    const arrows=arr.map((a,i)=>{const p=P(a);return `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="${C.blue}" stroke-width="4" marker-end="url(#${id}-arrow-blue)"/><circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="${C.blue}"/><g transform="translate(${p[0]+8},${p[1]-12})"><rect x="-5" y="-15" width="${Math.max(36,String(a.label||`F${i+1}`).length*10+16)}" height="24" rx="8" fill="#fff" stroke="#dce5f1"/><text x="3" y="2" class="svg-label">${e(a.label||`F${i+1}`)}</text></g>`}).join('');
    let rr='';if(res){const p=P(res);rr=`<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="${C.red}" stroke-width="4.5" stroke-dasharray="9 5" marker-end="url(#${id}-arrow-red)"/><g transform="translate(${p[0]+8},${p[1]-12})"><rect x="-5" y="-15" width="${Math.max(40,String(res.label||'R').length*10+18)}" height="24" rx="8" fill="#fff7f8" stroke="#f0b5bf"/><text x="3" y="2" class="svg-label" fill="${C.red}">${e(res.label||'R')}</text></g>`}
    const body=`${defs(id)}<rect x="1" y="1" width="598" height="348" rx="18" fill="#fbfdff" stroke="#dce6f3"/>${grid}<line x1="55" y1="${cy}" x2="545" y2="${cy}" stroke="#b4c0d2" stroke-width="1.2"/><line x1="${cx}" y1="305" x2="${cx}" y2="35" stroke="#b4c0d2" stroke-width="1.2"/>${para}<circle cx="${cx}" cy="${cy}" r="6" fill="${C.ink}"/><circle cx="${cx}" cy="${cy}" r="12" fill="none" stroke="#c7d2e3"/>${arrows}${rr}`;
    return wrap(v,svg(`0 0 ${W} ${H}`,body,'힘 벡터 그림'),'vector-visual');
  }

  function trajectory(v) {
    const id=uid('t'); const pts=(Array.isArray(v.points)&&v.points.length?v.points:[[0,0],[1,1.7],[2,2.5],[3,2.4],[4,1.5],[5,0]]).map(p=>[n(p[0]),n(p[1]),p[2]]);
    const W=620,H=340,L=52,R=30,T=34,B=54; const [xmin,xmax]=niceRange(pts.map(p=>p[0]),true), [ymin,ymax]=niceRange(pts.map(p=>p[1]),true); const PW=W-L-R,PH=H-T-B; const X=x=>L+(x-xmin)/(xmax-xmin)*PW,Y=y=>T+PH-(y-ymin)/(ymax-ymin)*PH; const mapped=pts.map(p=>[X(p[0]),Y(p[1])]);
    let grid='';ticks(xmin,xmax,6).forEach(t=>{const x=X(t);grid+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${T+PH}" stroke="#edf1f7"/>`});ticks(ymin,ymax,4).forEach(t=>{const y=Y(t);grid+=`<line x1="${L}" y1="${y}" x2="${L+PW}" y2="${y}" stroke="#edf1f7"/>`});
    const curve=smoothPath(mapped); const labels=v.labels||pts.map((p,i)=>p[2]||String.fromCharCode(65+i));
    const dots=mapped.map((p,i)=>{const hi=i===v.highlight;return `<g><circle cx="${p[0]}" cy="${p[1]}" r="${hi?13:9}" fill="${hi?'#fce8eb':'#e8efff'}" stroke="none"/><circle cx="${p[0]}" cy="${p[1]}" r="${hi?6.5:5}" fill="${hi?C.red:C.blue}"/><text x="${p[0]+10}" y="${p[1]-12}" class="svg-point-label" fill="${hi?C.red:C.ink}">${e(labels[i]||'')}</text></g>`}).join('');
    let vectorsHtml=''; if(Array.isArray(v.vectors)){vectorsHtml=v.vectors.map(a=>{const base=mapped[a.index??0]||mapped[0],vx=n(a.x),vy=n(a.y),mag=Math.max(1,Math.hypot(vx,vy)),sc=45/mag,ex=base[0]+vx*sc,ey=base[1]-vy*sc;return `<line x1="${base[0]}" y1="${base[1]}" x2="${ex}" y2="${ey}" stroke="${a.color||C.green}" stroke-width="3" marker-end="url(#${id}-arrow-blue)"/><text x="${ex+7}" y="${ey-6}" class="svg-small">${e(a.label||'')}</text>`}).join('')}
    const groundY=Y(0); const body=`${defs(id)}<rect x="1" y="1" width="618" height="338" rx="18" fill="#fbfdff" stroke="#dce6f3"/>${grid}<line x1="${L}" y1="${groundY}" x2="${L+PW}" y2="${groundY}" stroke="#728097" stroke-width="2"/><rect x="${L}" y="${groundY+2}" width="${PW}" height="${Math.max(0,T+PH-groundY)}" fill="#f2f5f8"/><path d="${curve}" fill="none" stroke="${C.blue}" stroke-width="3.3" stroke-linecap="round"/><path d="${curve}" fill="none" stroke="#aec2ff" stroke-width="10" opacity=".18"/>${dots}${vectorsHtml}<text x="${L+PW-4}" y="${groundY+25}" text-anchor="end" class="svg-small">수평면</text>`;
    return wrap(v,svg(`0 0 ${W} ${H}`,body,'포물선 운동 궤적'),'trajectory-visual');
  }

  function freebody(v){
    const id=uid('f'); const forces=Array.isArray(v.forces)?v.forces:[]; const W=560,H=340,cx=280,cy=175; const bodyW=n(v.bodyWidth,92),bodyH=n(v.bodyHeight,68);
    const arrows=forces.map((f,i)=>{const vx=n(f.x),vy=n(f.y),mag=Math.max(1,Math.hypot(vx,vy)),sc=Math.min(1,92/mag),ex=cx+vx*sc,ey=cy-vy*sc;return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${f.color||C.blue}" stroke-width="4" marker-end="url(#${id}-arrow-blue)"/><g transform="translate(${ex+8},${ey-10})"><rect x="-5" y="-14" width="${Math.max(40,String(f.label||`F${i+1}`).length*9+18)}" height="22" rx="7" fill="#fff" stroke="#dce5ef"/><text x="3" y="2" class="svg-label">${e(f.label||`F${i+1}`)}</text></g>`}).join('');
    const ground=v.ground!==false?`<line x1="85" y1="${cy+bodyH/2+1}" x2="475" y2="${cy+bodyH/2+1}" stroke="#64748b" stroke-width="2"/>${Array.from({length:14},(_,i)=>`<line x1="${95+i*27}" y1="${cy+bodyH/2+2}" x2="${83+i*27}" y2="${cy+bodyH/2+14}" stroke="#b1bdcd"/>`).join('')}`:'';
    const body=`${defs(id)}<rect x="1" y="1" width="558" height="338" rx="18" fill="#fbfdff" stroke="#dce6f3"/>${ground}<rect x="${cx-bodyW/2}" y="${cy-bodyH/2}" width="${bodyW}" height="${bodyH}" rx="10" fill="#eef3ff" stroke="#6077b5" stroke-width="2" filter="url(#${id}-shadow)"/><text x="${cx}" y="${cy+5}" text-anchor="middle" class="svg-body-label">${e(v.bodyLabel||'물체')}</text><circle cx="${cx}" cy="${cy}" r="4" fill="${C.ink}"/>${arrows}`;
    return wrap(v,svg(`0 0 ${W} ${H}`,body,'힘의 자유물체도'),'freebody-visual');
  }

  function orbit(v){
    const id=uid('o'),W=600,H=360,cx=300,cy=180,rx=n(v.rx,190),ry=n(v.ry,100); const positions=Array.isArray(v.positions)?v.positions:[];
    const points=positions.map((p,i)=>{const a=n(p.angle)*Math.PI/180,x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a);return `<g><circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${p.color||C.blue}" stroke-width="4"/><text x="${x+12}" y="${y-10}" class="svg-point-label">${e(p.label||String.fromCharCode(65+i))}</text></g>`}).join('');
    const body=`${defs(id)}<rect x="1" y="1" width="598" height="358" rx="18" fill="#fbfdff" stroke="#dce6f3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#9fb2cd" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${cx-rx*.55}" cy="${cy}" r="22" fill="#ffd86a" stroke="#d5a72f" stroke-width="3"/><circle cx="${cx-rx*.55-7}" cy="${cy-7}" r="6" fill="#fff2b4" opacity=".9"/><text x="${cx-rx*.55}" y="${cy+39}" text-anchor="middle" class="svg-small">${e(v.centerLabel||'중심 천체')}</text>${points}`;
    return wrap(v,svg(`0 0 ${W} ${H}`,body,'천체 궤도 자료'),'orbit-visual');
  }

  function energy(v){
    const id=uid('en'),W=600,H=330,left=110,right=500,top=42,bottom=270; const levels=Array.isArray(v.levels)?v.levels:[]; if(!levels.length)return'';
    const values=levels.map(l=>n(l.value)),[lo,hi]=niceRange(values,true);const Y=x=>bottom-(x-lo)/(hi-lo)*(bottom-top);
    const lines=levels.map((l,i)=>{const y=Y(n(l.value));return `<g><line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="${l.color||C.blue}" stroke-width="4" stroke-linecap="round"/><circle cx="${left}" cy="${y}" r="6" fill="${l.color||C.blue}"/><text x="${left-14}" y="${y+4}" text-anchor="end" class="svg-label">${e(l.label||`상태 ${i+1}`)}</text><text x="${right+10}" y="${y+4}" class="svg-small">${e(l.display??fmt(l.value))}</text></g>`}).join('');
    let delta='';if(v.delta&&levels.length>=2){const y1=Y(n(levels[0].value)),y2=Y(n(levels[1].value)),x=right-40;delta=`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${C.red}" stroke-width="3" marker-end="url(#${id}-arrow-red)"/><text x="${x+10}" y="${(y1+y2)/2+4}" class="svg-label" fill="${C.red}">${e(v.delta)}</text>`}
    return wrap(v,svg(`0 0 ${W} ${H}`,`${defs(id)}<rect x="1" y="1" width="598" height="328" rx="18" fill="#fbfdff" stroke="#dce6f3"/><text x="30" y="38" class="svg-axis">${e(v.yLabel||'에너지')}</text>${lines}${delta}`,'에너지 준위 자료'),'energy-visual');
  }

  function particleBox(v){
    const id=uid('pb'),states=Array.isArray(v.states)?v.states:[];if(!states.length)return'';const W=states.length*220+20,H=300;
    const items=states.map((s,i)=>{const x=20+i*220,y=58,w=180,h=170;return `<g><text x="${x+w/2}" y="34" text-anchor="middle" class="svg-chip">${e(s.label||`상태 ${i+1}`)}</text><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff" stroke="#7b8da8" stroke-width="2"/>${particleDots(id,x+4,y+4,w-8,h-8,Math.max(1,n(s.particles,8)),s.color||C.blue)}${s.note?`<text x="${x+w/2}" y="258" text-anchor="middle" class="svg-small">${e(s.note)}</text>`:''}</g>`}).join('');
    return wrap(v,svg(`0 0 ${W} ${H}`,`${defs(id)}<rect x="1" y="1" width="${W-2}" height="${H-2}" rx="18" fill="#fbfdff" stroke="#dce6f3"/>${items}`,'입자 모형'),'particle-visual');
  }

  function renderVisual(v){
    if(!v)return'';
    if(v.type==='table')return table(v);
    if(v.type==='graph')return graph(v);
    if(v.type==='piston')return piston(v);
    if(v.type==='vectors')return vectors(v);
    if(v.type==='trajectory')return trajectory(v);
    if(v.type==='freebody')return freebody(v);
    if(v.type==='orbit')return orbit(v);
    if(v.type==='energy')return energy(v);
    if(v.type==='particlebox')return particleBox(v);
    return '';
  }

  const style=document.createElement('style');
  style.textContent=`
    .visual.visual-hq{padding:12px;background:linear-gradient(180deg,#fbfdff 0%,#f5f9ff 100%);border:1px solid #d7e2f1;box-shadow:inset 0 1px 0 #fff,0 6px 22px rgba(43,72,120,.045)}
    .visual-hq .science-svg{width:100%;height:auto;min-height:0;max-height:430px;font-family:Inter,Pretendard,system-ui,-apple-system,"Noto Sans KR",sans-serif;text-rendering:geometricPrecision}
    .visual-hq .svg-tick{font-size:11px;fill:#748198;font-weight:560}.visual-hq .svg-axis{font-size:12px;fill:#46546a;font-weight:760}.visual-hq .svg-label{font-size:12px;fill:#243149;font-weight:760}.visual-hq .svg-small{font-size:11px;fill:#6f7d94;font-weight:590}.visual-hq .svg-chip{font-size:12px;fill:#38507f;font-weight:800}.visual-hq .svg-info{font-size:12px;fill:#4f5e76;font-weight:680}.visual-hq .svg-point-label{font-size:12px;font-weight:850}.visual-hq .svg-body-label{font-size:13px;fill:#263651;font-weight:850}
    .visual-hq.table-visual{padding:10px}.table-scroll{overflow:auto;border:1px solid #dce5f1;border-radius:14px;background:#fff}.visual-hq table{border-collapse:separate;border-spacing:0;min-width:420px}.visual-hq th{background:#eef3fa;color:#34435b;font-weight:820;position:sticky;top:0}.visual-hq th,.visual-hq td{border:0;border-right:1px solid #e1e7ef;border-bottom:1px solid #e1e7ef;padding:11px 12px}.visual-hq th:last-child,.visual-hq td:last-child{border-right:0}.visual-hq tbody tr:last-child td{border-bottom:0}.visual-hq td.row-head{font-weight:780;background:#f8faff;color:#3f4f69}.visual-caption{font-size:11.5px;line-height:1.45;color:#6d7a91;margin-top:9px;text-align:center}
    @media(max-width:560px){.visual.visual-hq{padding:7px;border-radius:15px}.visual-hq .science-svg{max-height:360px}.visual-hq .svg-tick{font-size:10px}.visual-hq .svg-axis,.visual-hq .svg-label,.visual-hq .svg-chip,.visual-hq .svg-info,.visual-hq .svg-point-label{font-size:11px}}
  `;
  document.head.appendChild(style);
  window.visualHtml=renderVisual;
  if(typeof window.render==='function') window.render();
})();