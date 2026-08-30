const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const cfg = window.__FLICK_CONFIG__ || {};
const ROOM_STORAGE = 'flick-room-key';
let supabase;
let currentKey = localStorage.getItem(ROOM_STORAGE) || '';
let channel;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function relative(ts) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (sec < 60) return '방금';
  const min = Math.floor(sec/60); if (min < 60) return `${min}분 전`;
  const h = Math.floor(min/60); return `${h}시간 전`;
}
function cleanKey(v='') { return v.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,12); }
function formatKey(v='') { const c=cleanKey(v); return c.match(/.{1,4}/g)?.join('-') || ''; }

async function getClient() {
  if (supabase) return supabase;
  const mod = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  supabase = mod.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, { auth: { persistSession:false } });
  return supabase;
}

function shell(inner) {
  return `<div class="shell"><header class="topbar"><div class="brand"><span class="brand-mark"></span>Flick</div><span class="pill">ephemeral · realtime</span></header>${inner}</div>`;
}

function renderLanding() {
  currentKey = '';
  localStorage.removeItem(ROOM_STORAGE);
  if (channel && supabase) { supabase.removeChannel(channel); channel = null; }
  app.innerHTML = shell(`
    <section class="hero">
      <div class="eyebrow">Instant shared clipboard</div>
      <h1>복붙을<br>기기 밖으로.</h1>
      <p>폰에서 본 링크를 PC로, PC에서 쓴 문장을 태블릿으로. 로그인 없이 방 키 하나로 실시간 전송합니다.</p>
    </section>
    <section class="panel landing-panel">
      <div class="action-grid">
        <button class="primary-action" id="createRoom"><span class="action-label">NEW ROOM</span><span class="action-title">새 Flick 만들기 ↗</span></button>
        <button class="secondary-action" id="pasteJoin"><span class="action-label">QUICK JOIN</span><span class="action-title">초대 키 붙여넣기</span></button>
      </div>
      <form class="join-box" id="joinForm">
        <input class="input" id="joinKey" autocomplete="off" inputmode="text" maxlength="14" placeholder="예: K7QP-4MC8-X2LA" />
        <button class="button primary">들어가기</button>
      </form>
    </section>`);
  document.querySelector('#createRoom').onclick = createRoom;
  document.querySelector('#pasteJoin').onclick = async () => {
    try { document.querySelector('#joinKey').value = formatKey(await navigator.clipboard.readText()); } catch { toast('클립보드 권한이 필요해요'); }
  };
  document.querySelector('#joinKey').addEventListener('input', e => e.target.value = formatKey(e.target.value));
  document.querySelector('#joinForm').onsubmit = e => { e.preventDefault(); joinRoom(document.querySelector('#joinKey').value); };
}

function renderLoading(label='연결하는 중') { app.innerHTML = shell(`<div class="loading"><div><div class="spinner"></div>${label}</div></div>`); }

async function createRoom() {
  renderLoading('새 Flick 만드는 중');
  try {
    const client = await getClient();
    const { data, error } = await client.rpc('flick_create_room');
    if (error) throw error;
    const key = Array.isArray(data) ? data[0]?.room_key : data?.room_key;
    if (!key) throw new Error('방 키 생성 실패');
    await joinRoom(key, true);
  } catch (e) { console.error(e); toast('방을 만들지 못했어요'); renderLanding(); }
}

async function joinRoom(key, silent=false) {
  const cleaned = cleanKey(key);
  if (cleaned.length !== 12) { toast('12자리 방 키를 확인해 주세요'); return; }
  renderLoading('Flick에 들어가는 중');
  try {
    const client = await getClient();
    const { data, error } = await client.rpc('flick_list_items', { room_key: cleaned });
    if (error) throw error;
    currentKey = cleaned;
    localStorage.setItem(ROOM_STORAGE, cleaned);
    renderRoom(data || []);
    subscribe();
    if (!silent) toast('연결됨');
  } catch (e) {
    console.error(e); toast('방 키가 틀렸거나 만료됐어요'); renderLanding();
  }
}

function renderRoom(items=[]) {
  const formatted = formatKey(currentKey);
  app.innerHTML = shell(`
    <section class="room-head">
      <div><div class="eyebrow">Shared clipboard</div><h1>지금 던지면,<br>바로 뜹니다.</h1><p>방은 6시간 뒤 자동 만료됩니다. 비밀번호 같은 민감정보는 올리지 마세요.</p></div>
      <div class="toolbar">
        <button class="pill room-key" id="copyKey">ROOM <strong>${formatted}</strong></button>
        <button class="button ghost" id="shareRoom">공유</button>
        <button class="button ghost" id="leaveRoom">나가기</button>
      </div>
    </section>
    <div class="workspace">
      <section>
        <div class="section-label">Live feed</div>
        <div class="feed" id="feed">${items.length ? items.map(itemCard).join('') : `<div class="panel empty">아직 아무것도 없습니다.<br>오른쪽에서 첫 내용을 던져보세요.</div>`}</div>
      </section>
      <aside class="panel composer">
        <div class="section-label">Drop something</div>
        <textarea id="composer" maxlength="4000" placeholder="텍스트나 링크를 붙여넣으세요"></textarea>
        <div class="composer-foot">
          <button class="button lime" id="sendItem">던지기</button>
          <button class="button" id="pasteText">붙여넣기</button>
        </div>
        <div class="hint">Ctrl/⌘ + Enter로 빠르게 전송</div>
      </aside>
    </div>`);
  bindRoom();
}

function itemCard(item) {
  return `<article class="panel item" data-id="${item.id}">
    <div class="item-top"><span>${relative(item.created_at)}</span><span>${item.kind === 'link' ? 'LINK' : 'TEXT'}</span></div>
    <div class="item-content">${linkify(item.content)}</div>
    <div class="item-actions"><button class="mini" data-copy="${item.id}">복사</button><button class="mini danger" data-delete="${item.id}">삭제</button></div>
  </article>`;
}

function bindRoom() {
  document.querySelector('#copyKey').onclick = async () => { await navigator.clipboard.writeText(formatKey(currentKey)); toast('방 키 복사됨'); };
  document.querySelector('#shareRoom').onclick = async () => {
    const text = `Flick 방 키: ${formatKey(currentKey)}`;
    if (navigator.share) { try { await navigator.share({ title:'Flick', text }); } catch {} }
    else { await navigator.clipboard.writeText(text); toast('공유 문구 복사됨'); }
  };
  document.querySelector('#leaveRoom').onclick = renderLanding;
  document.querySelector('#sendItem').onclick = sendItem;
  document.querySelector('#pasteText').onclick = async () => {
    try { document.querySelector('#composer').value = await navigator.clipboard.readText(); } catch { toast('클립보드 권한이 필요해요'); }
  };
  document.querySelector('#composer').onkeydown = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendItem(); };
  bindItemActions();
}

function bindItemActions() {
  document.querySelectorAll('[data-copy]').forEach(btn => btn.onclick = async () => {
    const card = btn.closest('.item'); const text = card.querySelector('.item-content').innerText;
    await navigator.clipboard.writeText(text); toast('복사됨');
  });
  document.querySelectorAll('[data-delete]').forEach(btn => btn.onclick = () => deleteItem(btn.dataset.delete));
}

async function refreshItems() {
  if (!currentKey) return;
  const client = await getClient();
  const { data, error } = await client.rpc('flick_list_items', { room_key: currentKey });
  if (error) return;
  const feed = document.querySelector('#feed');
  if (!feed) return;
  feed.innerHTML = data?.length ? data.map(itemCard).join('') : `<div class="panel empty">아직 아무것도 없습니다.<br>오른쪽에서 첫 내용을 던져보세요.</div>`;
  bindItemActions();
}

async function sendItem() {
  const textarea = document.querySelector('#composer');
  const content = textarea.value.trim();
  if (!content) return;
  const client = await getClient();
  const { error } = await client.rpc('flick_add_item', { room_key: currentKey, item_content: content });
  if (error) { console.error(error); toast('전송 실패'); return; }
  textarea.value = '';
  await refreshItems();
  await channel?.send({ type: 'broadcast', event: 'changed', payload: {} });
}

async function deleteItem(id) {
  const client = await getClient();
  const { error } = await client.rpc('flick_delete_item', { room_key: currentKey, item_id: id });
  if (error) { toast('삭제 실패'); return; }
  await refreshItems();
  await channel?.send({ type: 'broadcast', event: 'changed', payload: {} });
}

function subscribe() {
  if (channel) supabase.removeChannel(channel);
  channel = supabase.channel(`flick:${currentKey}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event:'changed' }, () => refreshItems())
    .subscribe();
}

window.addEventListener('pointermove', (e) => {
  document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
  document.documentElement.style.setProperty('--my', `${e.clientY}px`);
});

if (currentKey) joinRoom(currentKey, true); else renderLanding();
