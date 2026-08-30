import { getSupabase } from "./lib/supabase.js";

const guestCss = document.createElement("style");
guestCss.textContent = `
  .guest-form { display: grid; gap: 12px; margin-top: 28px; }
  .guest-note { margin: 14px 0 0; color: var(--ink-soft); font-size: 13px; line-height: 1.55; }
  #logoutButton { display: none !important; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
`;
document.head.append(guestCss);

function guestMarkup() {
  return `
    <img class="auth-mark" src="./assets/mark.svg" alt="" />
    <p class="eyebrow">같이 공부하되, 서로를 재촉하지 않게.</p>
    <h1>이름 하나만 정하고<br>바로 들어가요.</h1>
    <p>회원가입은 없습니다. 이 브라우저에 게스트 자리가 저장되고, 친구들과 할 일과 공부 상태를 바로 공유할 수 있어요.</p>
    <form class="guest-form" id="guestStartForm">
      <label class="sr-only" for="guestName">닉네임</label>
      <input class="text-input" id="guestName" maxlength="24" autocomplete="nickname" placeholder="닉네임" required autofocus />
      <button class="primary-button" type="submit">시작하기</button>
    </form>
    <p class="guest-note">브라우저 데이터를 지우거나 시크릿 모드를 종료하면 이 게스트 자리를 다시 찾을 수 없어요.</p>`;
}

async function turnAuthCardIntoGuestStart(card) {
  if (card.dataset.guestMode === "true") return;

  const client = await getSupabase();
  if (!client) return;

  const { data } = await client.auth.getSession();
  if (data.session) return;

  card.dataset.guestMode = "true";
  card.innerHTML = guestMarkup();

  card.querySelector("#guestStartForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const nameInput = card.querySelector("#guestName");
    const submitButton = card.querySelector('button[type="submit"]');
    const displayName = nameInput.value.trim();
    if (!displayName) return;

    submitButton.disabled = true;
    submitButton.textContent = "자리 만드는 중…";

    const { error } = await client.auth.signInAnonymously({
      options: { data: { full_name: displayName } }
    });

    if (error) {
      submitButton.disabled = false;
      submitButton.textContent = "시작하기";
      const toast = document.querySelector("#toast");
      if (toast) {
        toast.textContent = error.message || "게스트 자리를 만들지 못했어요.";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2600);
      }
      return;
    }

    location.reload();
  });
}

function syncGuestUi() {
  const card = document.querySelector(".auth-card");
  if (card) turnAuthCardIntoGuestStart(card).catch(console.error);
}

const observer = new MutationObserver(syncGuestUi);
observer.observe(document.body, { childList: true, subtree: true });
syncGuestUi();
