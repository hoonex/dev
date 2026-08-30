import { createRepository } from "./data/repository.js";
import { escapeHtml, formatClock, formatDuration, initials, localDateKey, normalizeRoomCode, relativeTime } from "./utils.js";

const app = document.querySelector("#app");
const toastEl = document.querySelector("#toast");

const state = {
  repository: null,
  demo: false,
  session: null,
  profile: null,
  rooms: [],
  activeRoomId: null,
  roomState: null,
  stats: [],
  tab: "room",
  unsubscribeRoom: null,
  timer: { running: false, startedAt: null, elapsed: 0, interval: null, taskId: null }
};

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function statusLabel(status) {
  return status === "studying" ? "공부 중" : status === "resting" ? "쉬는 중" : "잠시 비움";
}

function avatar(member) {
  return `<div class="avatar" data-seed="${escapeHtml(member.avatar_seed || "forest")}">${escapeHtml(initials(member.display_name))}</div>`;
}

function topbar() {
  return `
    <header class="topbar">
      <div class="brand"><img src="./assets/mark.svg" alt="" /> Sideby</div>
      <button class="icon-button" id="profileButton" aria-label="프로필 설정">${escapeHtml(initials(state.profile?.display_name || "나"))}</button>
    </header>`;
}

function nav() {
  return `
    <nav class="bottom-nav" aria-label="주요 메뉴">
      <button class="nav-button ${state.tab === "room" ? "active" : ""}" data-tab="room">같이</button>
      <button class="nav-button ${state.tab === "focus" ? "active" : ""}" data-tab="focus">집중</button>
      <button class="nav-button ${state.tab === "stats" ? "active" : ""}" data-tab="stats">기록</button>
    </nav>`;
}

function demoBanner() {
  return state.demo ? `
    <div class="demo-banner">
      <span><strong>미리보기 모드</strong> · Supabase 연결 전 로컬 데이터로 동작 중</span>
      <button class="quiet-button" id="setupInfoButton">연결 방법</button>
    </div>` : "";
}

function renderAuth() {
  app.innerHTML = `
    <main class="app-shell auth-shell">
      <section class="auth-card">
        <img class="auth-mark" src="./assets/mark.svg" alt="" />
        <p class="eyebrow">같이 공부하되, 서로를 재촉하지 않게.</p>
        <h1>오늘도 같은 방에<br>자리만 잡아둘게.</h1>
        <p>친구들의 공부 상태와 오늘 할 일을 가볍게 보고, 내 집중 시간은 조용히 쌓아두는 공간입니다.</p>
        <div class="auth-actions">
          <button class="primary-button" id="googleLogin">Google로 계속</button>
          <div class="divider">또는</div>
          <form class="email-form" id="emailLoginForm">
            <input class="text-input" id="emailInput" type="email" autocomplete="email" placeholder="이메일 주소" required />
            <button class="quiet-button" type="submit">링크 받기</button>
          </form>
        </div>
      </section>
    </main>`;

  document.querySelector("#googleLogin").addEventListener("click", () => run(() => state.repository.signInWithGoogle()));
  document.querySelector("#emailLoginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#emailInput").value.trim();
    run(async () => {
      await state.repository.signInWithEmail(email);
      toast("로그인 링크를 보냈어요. 메일함을 확인해 주세요.");
    });
  });
}

function renderRoomGate() {
  app.innerHTML = `
    <main class="app-shell room-gate">
      ${topbar()}
      ${demoBanner()}
      <section class="hero">
        <p class="eyebrow">첫 방 만들기</p>
        <h1>어디에서 같이<br>공부할까요?</h1>
        <p>방은 계속 유지됩니다. 내일 다시 들어와도 같은 친구들과 새 오늘 할 일을 시작할 수 있어요.</p>
      </section>
      <section class="room-gate-grid">
        <button class="choice-card" id="createRoomButton"><strong>새 공부방 만들기</strong><span>친구에게 6자리 코드를 공유해 초대합니다.</span></button>
        <button class="choice-card" id="joinRoomButton"><strong>코드로 들어가기</strong><span>친구가 알려준 방 코드가 있다면 바로 합류합니다.</span></button>
      </section>
    </main>`;
  bindGlobalButtons();
  document.querySelector("#createRoomButton").addEventListener("click", () => openRoomModal("create"));
  document.querySelector("#joinRoomButton").addEventListener("click", () => openRoomModal("join"));
}

function renderRoom() {
  const data = state.roomState;
  if (!data?.room) return renderRoomGate();
  const myId = state.profile.id;
  const myTasks = data.tasks.filter((task) => task.user_id === myId);
  const done = myTasks.filter((task) => task.completed).length;
  const myStatus = data.statuses.find((item) => item.user_id === myId) || { status: "offline", status_message: "" };
  const members = data.members.map((member) => {
    const status = data.statuses.find((item) => item.user_id === member.user_id) || { status: "offline", status_message: "아직 오늘 상태를 정하지 않았어요", since_at: null };
    const memberTasks = data.tasks.filter((task) => task.user_id === member.user_id);
    const remainingTasks = memberTasks.filter((task) => !task.completed);
    return { ...member, ...status, memberTasks, remainingTasks };
  });

  app.innerHTML = `
    <main class="app-shell">
      ${topbar()}
      ${demoBanner()}
      <div class="room-switcher" aria-label="공부방 선택">
        ${state.rooms.map((room) => `<button class="room-chip" data-room-id="${room.id}" aria-current="${room.id === state.activeRoomId}">${escapeHtml(room.name)}</button>`).join("")}
        <button class="room-chip" id="addRoomChip">+ 방</button>
      </div>
      <section class="hero">
        <p class="eyebrow">${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</p>
        <h1>${done === myTasks.length && myTasks.length ? "오늘 할 일,<br>다 해냈네요." : "같이 있지만,<br>각자 자기 속도로."}</h1>
      </section>

      <section class="room-card">
        <div class="room-title-row">
          <div><h2 class="room-title">${escapeHtml(data.room.name)}</h2><div class="room-code">ROOM ${escapeHtml(data.room.code)}</div></div>
          <div class="member-stack">${members.slice(0, 4).map(avatar).join("")}</div>
        </div>
        <div class="presence-list">
          ${members.map((member) => `
            <button class="presence-row presence-button" type="button" data-member-id="${member.user_id}">
              ${avatar(member)}
              <div class="presence-copy">
                <div class="presence-name">${escapeHtml(member.display_name)}${member.user_id === myId ? " <span aria-label=\"나\">· 나</span>" : ""}</div>
                <div class="presence-message">${escapeHtml(member.status_message || statusLabel(member.status))}</div>
                <div class="presence-tasks">${member.memberTasks.length ? `오늘 ${member.memberTasks.length}개 · ${member.remainingTasks.length ? `${member.remainingTasks.length}개 남음` : "모두 완료"}` : "오늘 할 일 없음"}</div>
              </div>
              <div class="presence-state"><span class="dot ${member.status}"></span>${statusLabel(member.status)}${member.since_at ? ` · ${relativeTime(member.since_at)}` : ""}</div>
            </button>`).join("")}
        </div>
      </section>

      <section class="status-panel" aria-label="내 상태">
        <button class="status-button ${myStatus.status === "studying" ? "active" : ""}" data-status="studying">공부 시작</button>
        <button class="status-button ${myStatus.status === "resting" ? "active" : ""}" data-status="resting">잠깐 쉬기</button>
        <input class="text-input status-message" id="statusMessage" maxlength="42" value="${escapeHtml(myStatus.status_message || "")}" placeholder="지금 뭐 하는 중인지 한 줄로" />
      </section>

      <section class="desk">
        <div class="section-head"><h2>내 오늘 할 일</h2><span>${done}/${myTasks.length} 완료</span></div>
        <div class="task-list">
          ${myTasks.length ? myTasks.map((task) => `
            <div class="task-row">
              <button class="task-check ${task.completed ? "done" : ""}" data-task-check="${task.id}" aria-label="완료 상태 변경">${task.completed ? "✓" : ""}</button>
              <div class="task-title ${task.completed ? "done" : ""}">${escapeHtml(task.title)}</div>
              <button class="task-delete" data-task-delete="${task.id}" aria-label="할 일 삭제">×</button>
            </div>`).join("") : `<div class="empty-state"><strong>오늘은 아직 비어 있어요.</strong>작은 것 하나부터 적어도 충분해요.</div>`}
        </div>
        <form class="add-task" id="addTaskForm">
          <input class="text-input" id="taskInput" maxlength="80" placeholder="예: 수학 문제 20개" required />
          <button class="primary-button" type="submit">추가</button>
        </form>
      </section>
      ${nav()}
    </main>`;

  bindGlobalButtons();
  bindNav();
  document.querySelectorAll("[data-room-id]").forEach((button) => button.addEventListener("click", () => selectRoom(button.dataset.roomId)));
  document.querySelectorAll("[data-member-id]").forEach((button) => button.addEventListener("click", () => openMemberTasks(button.dataset.memberId)));
  document.querySelector("#addRoomChip").addEventListener("click", () => openRoomModal("create-or-join"));
  document.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => setMyStatus(button.dataset.status)));
  document.querySelector("#statusMessage").addEventListener("change", () => setMyStatus(myStatus.status === "offline" ? "resting" : myStatus.status));
  document.querySelector("#addTaskForm").addEventListener("submit", addTask);
  document.querySelectorAll("[data-task-check]").forEach((button) => button.addEventListener("click", () => toggleTask(button.dataset.taskCheck)));
  document.querySelectorAll("[data-task-delete]").forEach((button) => button.addEventListener("click", () => deleteTask(button.dataset.taskDelete)));
}

function renderFocus() {
  const myTasks = state.roomState?.tasks.filter((task) => task.user_id === state.profile.id && !task.completed) || [];
  const selected = myTasks.find((task) => task.id === state.timer.taskId);
  app.innerHTML = `
    <main class="app-shell">
      ${topbar()}
      ${demoBanner()}
      <section class="focus-stage">
        <div class="timer-orbit ${state.timer.running ? "running" : ""}">
          <div>
            <div class="timer-label">${state.timer.running ? "집중 중" : "내 집중 시간"}</div>
            <div class="timer-time" id="timerTime">${formatClock(state.timer.elapsed)}</div>
            <div class="timer-task">${escapeHtml(selected?.title || "할 일을 고르지 않아도 괜찮아요")}</div>
          </div>
        </div>
        <div class="timer-actions">
          ${state.timer.running
            ? `<button class="primary-button" id="stopTimer">마치기</button><button class="quiet-button" id="pauseToRest">쉬기</button>`
            : `<button class="primary-button" id="startTimer">집중 시작</button><button class="quiet-button" id="pickTask">할 일 선택</button>`}
        </div>
      </section>
      ${nav()}
    </main>`;
  bindGlobalButtons();
  bindNav();
  document.querySelector("#startTimer")?.addEventListener("click", startTimer);
  document.querySelector("#stopTimer")?.addEventListener("click", () => stopTimer(false));
  document.querySelector("#pauseToRest")?.addEventListener("click", () => stopTimer(true));
  document.querySelector("#pickTask")?.addEventListener("click", openTaskPicker);
}

function renderStats() {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    const seconds = state.stats.filter((session) => localDateKey(new Date(session.started_at)) === key).reduce((sum, session) => sum + Number(session.duration_seconds || 0), 0);
    return { key, label: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date), seconds };
  });
  const today = days.at(-1)?.seconds || 0;
  const total = days.reduce((sum, day) => sum + day.seconds, 0);
  const max = Math.max(...days.map((day) => day.seconds), 1);

  app.innerHTML = `
    <main class="app-shell">
      ${topbar()}
      ${demoBanner()}
      <section class="stats-hero">
        <p class="eyebrow">오늘의 집중</p>
        <div class="big-stat">${formatDuration(today)}</div>
        <p>이번 주에는 총 ${formatDuration(total)} 함께 자리해 있었어요.</p>
      </section>
      <section class="desk">
        <div class="section-head"><h2>최근 7일</h2><span>집중 세션 기준</span></div>
        <div class="week-chart" aria-label="최근 7일 집중 시간">
          ${days.map((day) => `
            <div class="day-column" title="${day.label} ${formatDuration(day.seconds)}">
              <div class="day-bar-wrap"><div class="day-bar" style="height:${Math.max(5, Math.round(day.seconds / max * 100))}%"></div></div>
              <div class="day-label">${day.label}</div>
            </div>`).join("")}
        </div>
      </section>
      <section class="desk">
        <div class="section-head"><h2>기록 방식</h2></div>
        <p style="color:var(--ink-soft);line-height:1.65;margin:0">타이머를 5초 이상 사용해 마치면 한 세션으로 저장합니다. 랭킹은 만들지 않습니다. 이 기록은 친구와 경쟁하기보다 내가 얼마나 자주 다시 앉았는지 확인하는 용도예요.</p>
      </section>
      ${nav()}
    </main>`;
  bindGlobalButtons();
  bindNav();
}

function render() {
  if (!state.session) return renderAuth();
  if (!state.rooms.length) return renderRoomGate();
  if (state.tab === "focus") return renderFocus();
  if (state.tab === "stats") return renderStats();
  return renderRoom();
}

function bindGlobalButtons() {
  document.querySelector("#profileButton")?.addEventListener("click", openProfileModal);
  document.querySelector("#setupInfoButton")?.addEventListener("click", () => toast("config.example.js를 config.js로 복사하고 Supabase URL과 publishable key를 넣으면 실서버 모드로 전환돼요."));
}

function bindNav() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", async () => {
    state.tab = button.dataset.tab;
    if (state.tab === "stats") await refreshStats();
    render();
  }));
}

async function run(task) {
  try { return await task(); }
  catch (error) { console.error(error); toast(error?.message || "요청을 처리하지 못했어요."); }
}

async function loadHome() {
  state.profile = await state.repository.getProfile();
  state.rooms = await state.repository.listRooms();
  if (!state.activeRoomId && state.rooms[0]) state.activeRoomId = state.rooms[0].id;
  if (state.activeRoomId) await loadRoom(state.activeRoomId);
  render();
}

async function loadRoom(roomId) {
  state.activeRoomId = roomId;
  state.roomState = await state.repository.getRoomState(roomId);
  state.unsubscribeRoom?.();
  state.unsubscribeRoom = state.repository.subscribeRoom(roomId, () => {
    clearTimeout(loadRoom._timer);
    loadRoom._timer = setTimeout(() => run(async () => { state.roomState = await state.repository.getRoomState(roomId); render(); }), 120);
  });
}

async function selectRoom(roomId) {
  await run(async () => { await loadRoom(roomId); state.tab = "room"; render(); });
}

function openModal(content) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal-backdrop";
  wrapper.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${content}</div>`;
  wrapper.addEventListener("click", (event) => { if (event.target === wrapper) wrapper.remove(); });
  document.body.append(wrapper);
  return wrapper;
}

function openRoomModal(mode) {
  const wrapper = openModal(`
    <h2>${mode === "join" ? "방 코드로 들어가기" : mode === "create" ? "새 공부방 만들기" : "방 추가하기"}</h2>
    ${mode !== "join" ? `<form id="createRoomForm"><input class="text-input" id="roomName" maxlength="30" placeholder="예: 야간 자습실" required /><div class="modal-actions"><button type="button" class="quiet-button" data-close>취소</button><button class="primary-button" type="submit">만들기</button></div></form>` : ""}
    ${mode === "create-or-join" ? `<div class="divider" style="margin:16px 0">또는</div>` : ""}
    ${mode !== "create" ? `<form id="joinRoomForm"><input class="text-input" id="roomCode" maxlength="6" placeholder="6자리 방 코드" required /><div class="modal-actions"><button type="button" class="quiet-button" data-close>취소</button><button class="primary-button" type="submit">들어가기</button></div></form>` : ""}`);
  wrapper.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => wrapper.remove()));
  wrapper.querySelector("#roomCode")?.addEventListener("input", (event) => { event.target.value = normalizeRoomCode(event.target.value); });
  wrapper.querySelector("#createRoomForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    run(async () => {
      const room = await state.repository.createRoom(wrapper.querySelector("#roomName").value);
      state.rooms = await state.repository.listRooms();
      wrapper.remove();
      await selectRoom(room.id);
      toast(`방 코드 ${room.code}로 친구를 초대할 수 있어요.`);
    });
  });
  wrapper.querySelector("#joinRoomForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    run(async () => {
      const room = await state.repository.joinRoom(normalizeRoomCode(wrapper.querySelector("#roomCode").value));
      state.rooms = await state.repository.listRooms();
      wrapper.remove();
      await selectRoom(room.id);
    });
  });
}

function openProfileModal() {
  const wrapper = openModal(`
    <h2>내 자리 이름</h2>
    <form id="profileForm">
      <input class="text-input" id="displayName" maxlength="24" value="${escapeHtml(state.profile?.display_name || "")}" required />
      <div class="modal-actions"><button type="button" class="quiet-button" id="logoutButton">로그아웃</button><button class="primary-button" type="submit">저장</button></div>
    </form>`);
  wrapper.querySelector("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    run(async () => { state.profile = await state.repository.updateProfile(wrapper.querySelector("#displayName").value); wrapper.remove(); await loadHome(); });
  });
  wrapper.querySelector("#logoutButton").addEventListener("click", () => run(async () => { await state.repository.signOut(); wrapper.remove(); if (!state.demo) location.reload(); else toast("미리보기 모드에서는 로그인 상태가 유지돼요."); }));
}

function openMemberTasks(userId) {
  const member = state.roomState?.members.find((item) => item.user_id === userId);
  if (!member) return;
  const tasks = state.roomState.tasks.filter((task) => task.user_id === userId);
  const wrapper = openModal(`
    <h2>${escapeHtml(member.display_name)}의 오늘</h2>
    ${tasks.length ? `<div class="task-list">${tasks.map((task) => `
      <div class="task-row" style="grid-template-columns:32px 1fr">
        <div class="task-check ${task.completed ? "done" : ""}" aria-hidden="true">${task.completed ? "✓" : ""}</div>
        <div class="task-title ${task.completed ? "done" : ""}">${escapeHtml(task.title)}</div>
      </div>`).join("")}</div>` : `<div class="empty-state"><strong>오늘 적어둔 할 일이 없어요.</strong>각자 자기 속도로 시작하면 됩니다.</div>`}
    <div class="modal-actions"><button class="quiet-button" type="button" data-close>닫기</button></div>`);
  wrapper.querySelector("[data-close]").addEventListener("click", () => wrapper.remove());
}

function openTaskPicker() {
  const tasks = state.roomState?.tasks.filter((task) => task.user_id === state.profile.id && !task.completed) || [];
  const wrapper = openModal(`<h2>이번 집중에서 할 일</h2>${tasks.length ? tasks.map((task) => `<button class="choice-card" data-pick-task="${task.id}"><strong>${escapeHtml(task.title)}</strong><span>이 할 일에 집중 시간을 연결합니다.</span></button>`).join("") : `<div class="empty-state"><strong>남은 할 일이 없어요.</strong>그냥 타이머만 켜도 됩니다.</div>`}`);
  wrapper.querySelectorAll("[data-pick-task]").forEach((button) => button.addEventListener("click", () => { state.timer.taskId = button.dataset.pickTask; wrapper.remove(); renderFocus(); }));
}

async function setMyStatus(status) {
  await run(async () => {
    const message = document.querySelector("#statusMessage")?.value || "";
    await state.repository.setStatus(state.activeRoomId, status, message);
    state.roomState = await state.repository.getRoomState(state.activeRoomId);
    render();
  });
}

async function addTask(event) {
  event.preventDefault();
  const input = document.querySelector("#taskInput");
  const title = input.value.trim();
  if (!title) return;
  await run(async () => { await state.repository.addTask(state.activeRoomId, title); input.value = ""; state.roomState = await state.repository.getRoomState(state.activeRoomId); render(); });
}

async function toggleTask(taskId) {
  const task = state.roomState.tasks.find((item) => item.id === taskId);
  if (!task) return;
  await run(async () => { await state.repository.setTaskCompleted(taskId, !task.completed); state.roomState = await state.repository.getRoomState(state.activeRoomId); render(); });
}

async function deleteTask(taskId) {
  await run(async () => { await state.repository.deleteTask(taskId); state.roomState = await state.repository.getRoomState(state.activeRoomId); render(); });
}

async function startTimer() {
  state.timer.running = true;
  state.timer.startedAt = new Date().toISOString();
  state.timer.elapsed = 0;
  await run(() => state.repository.setStatus(state.activeRoomId, "studying", selectedTimerTaskTitle() || "집중 중"));
  clearInterval(state.timer.interval);
  state.timer.interval = setInterval(() => {
    state.timer.elapsed = Math.floor((Date.now() - new Date(state.timer.startedAt).getTime()) / 1000);
    const timerEl = document.querySelector("#timerTime");
    if (timerEl) timerEl.textContent = formatClock(state.timer.elapsed);
  }, 1000);
  renderFocus();
}

function selectedTimerTaskTitle() {
  return state.roomState?.tasks.find((task) => task.id === state.timer.taskId)?.title || "";
}

async function stopTimer(restAfter) {
  const startedAt = state.timer.startedAt;
  const elapsed = Math.max(state.timer.elapsed, startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0);
  clearInterval(state.timer.interval);
  state.timer.interval = null;
  state.timer.running = false;
  state.timer.elapsed = 0;
  state.timer.startedAt = null;
  await run(async () => {
    await state.repository.recordFocus(state.activeRoomId, startedAt, elapsed, state.timer.taskId);
    await state.repository.setStatus(state.activeRoomId, restAfter ? "resting" : "resting", restAfter ? "잠깐 쉬는 중" : "집중 마침");
    state.roomState = await state.repository.getRoomState(state.activeRoomId);
    await refreshStats();
    toast(`${formatDuration(elapsed)} 집중을 기록했어요.`);
  });
  renderFocus();
}

async function refreshStats() {
  if (!state.activeRoomId) return;
  state.stats = await state.repository.getStats(state.activeRoomId);
}

async function bootstrap() {
  const { repository, demo } = await createRepository();
  state.repository = repository;
  state.demo = demo;
  state.session = await repository.getSession();
  if (demo) {
    await loadHome();
    return;
  }
  repository.onAuthChange(async (session) => {
    state.session = session;
    if (session) await loadHome(); else renderAuth();
  });
  if (state.session) await loadHome(); else renderAuth();
}

bootstrap().catch((error) => {
  console.error(error);
  app.innerHTML = `<main class="app-shell"><section class="empty-state"><strong>앱을 시작하지 못했어요.</strong>${escapeHtml(error?.message || "설정을 확인해 주세요.")}</section></main>`;
});
