(() => {
  const tracks = Array.isArray(window.LEARNING_TRACKS) ? window.LEARNING_TRACKS : [];
  const home = document.getElementById('home');
  const study = document.getElementById('study');
  const trackEl = document.getElementById('track');
  const lessonEl = document.getElementById('lesson');
  const back = document.getElementById('back');
  const storageKey = 'science-step-progress-v1';

  let state = {};
  try { state = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { state = {}; }

  let currentTrackId = tracks[0]?.id || 'physics';
  let currentUnit = null;
  let selected = null;
  let mastered = false;

  const progressKey = (trackId, unitId) => `${trackId}:${unitId}`;
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const currentTrack = () => tracks.find(t => t.id === currentTrackId);
  const doneCount = (track, unit) => Math.min(state[progressKey(track.id, unit.id)]?.doneSteps || 0, unit.lesson.length);
  const unitUnlocked = (track, index) => index === 0 || doneCount(track, track.units[index - 1]) >= track.units[index - 1].lesson.length;

  function totalStats() {
    let total = 0, done = 0;
    for (const track of tracks) for (const unit of track.units) {
      total += unit.lesson.length;
      done += doneCount(track, unit);
    }
    const percent = total ? Math.round(done / total * 100) : 0;
    const pct = document.getElementById('pct');
    const bar = document.getElementById('bar');
    if (pct) pct.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  function renderTrack() {
    const track = currentTrack();
    if (!track) return;
    trackEl.className = track.id === 'chemistry' ? 'chem' : '';
    trackEl.innerHTML = `
      <div class="track-head">
        <div><h2>${track.subject}</h2><p>${track.range}</p></div>
        <div class="meta">짧게, 매번 하나씩</div>
      </div>
      <div class="unit-list">
        ${track.units.map((unit, index) => {
          const done = doneCount(track, unit);
          const unlocked = unitUnlocked(track, index);
          const stars = Math.round(3 * done / unit.lesson.length);
          return `<article class="clay unit ${unlocked ? '' : 'locked'}" data-unit-index="${index}" aria-disabled="${unlocked ? 'false' : 'true'}">
            <div class="unit-top"><div class="unit-num">${index + 1}</div>${done >= unit.lesson.length ? '<span class="badge">완료</span>' : ''}</div>
            <h3>${unit.title}</h3>
            <div class="meta">약 ${unit.minutes}분 · ${done}/${unit.lesson.length}개 이해</div>
            <div class="stars">${[0,1,2].map(i => `<span class="star ${i < stars ? 'on' : ''}">★</span>`).join('')}</div>
          </article>`;
        }).join('')}
      </div>`;
    totalStats();
  }

  function renderVisual(v) {
    if (!v) return '';
    if (v.type === 'formula') return `<div class="visual"><div class="formula">${v.text}</div></div>`;
    if (v.type === 'split') return `<div class="visual"><div class="split"><div>${v.left}</div><div>${v.right}</div></div></div>`;
    if (v.type === 'trajectory') return `<div class="visual"><div class="trajectory"><span>${v.label}</span></div></div>`;
    if (v.type === 'circle') return `<div class="visual"><div class="circle-v"><span>${v.label}</span></div></div>`;
    if (v.type === 'chips') return `<div class="visual"><div class="chips">${v.items.map(item => `<div class="chip">${item}</div>`).join('')}</div></div>`;
    if (v.type === 'chain') return `<div class="visual"><div class="formula compact-formula">${v.text}</div></div>`;
    if (v.type === 'vector') return `<div class="visual"><div class="split"><div>${v.a}</div><div>${v.b}</div></div></div>`;
    return '';
  }

  function openUnit(index) {
    const track = currentTrack();
    if (!track || !unitUnlocked(track, index)) return;
    currentUnit = track.units[index];
    home.classList.add('hide');
    study.classList.add('show');
    renderLesson();
    window.scrollTo(0, 0);
  }

  function renderLesson() {
    const track = currentTrack();
    if (!track || !currentUnit) return;
    const done = doneCount(track, currentUnit);
    if (done >= currentUnit.lesson.length) return renderCelebrate();

    const lesson = currentUnit.lesson[done];
    selected = null;
    mastered = false;
    lessonEl.innerHTML = `
      <article class="clay lesson-card">
        <div class="lesson-kicker">${currentUnit.title} · ${done + 1}/${currentUnit.lesson.length}</div>
        <h2>${lesson.title}</h2>
        <p>${lesson.body}</p>
        ${renderVisual(lesson.visual)}
        <div class="check">
          <h3>여기까지 이해했는지 딱 하나만 확인</h3>
          <div class="choices">${lesson.check.choices.map((choice, i) => `<button class="choice" data-c="${i}">${choice}</button>`).join('')}</div>
          <div class="feedback" id="feedback"></div>
          <div class="actions"><button class="btn primary" id="grade" data-action="grade" disabled>확인하기</button></div>
        </div>
      </article>`;
  }

  function choose(choiceButton) {
    if (mastered) return;
    selected = Number(choiceButton.dataset.c);
    lessonEl.querySelectorAll('.choice').forEach(button => button.classList.remove('selected', 'bad'));
    choiceButton.classList.add('selected');
    const grade = document.getElementById('grade');
    if (grade) grade.disabled = false;
  }

  function grade() {
    if (selected === null || mastered) return;
    const track = currentTrack();
    if (!track || !currentUnit) return;
    const done = doneCount(track, currentUnit);
    const lesson = currentUnit.lesson[done];
    if (!lesson) return;
    const feedback = document.getElementById('feedback');
    const gradeButton = document.getElementById('grade');

    if (selected !== lesson.check.answer) {
      const wrongButton = lessonEl.querySelector(`.choice[data-c="${selected}"]`);
      wrongButton?.classList.add('bad');
      if (feedback) {
        feedback.className = 'feedback show bad';
        feedback.innerHTML = `<b>다시 보면 바로 잡을 수 있어.</b> ${lesson.check.explanation}<br>위 설명을 한 번 다시 보고 다른 선택지를 골라봐.`;
      }
      selected = null;
      if (gradeButton) gradeButton.disabled = true;
      return;
    }

    mastered = true;
    lessonEl.querySelectorAll('.choice').forEach((button, i) => {
      button.classList.remove('selected', 'bad');
      if (i === lesson.check.answer) button.classList.add('good');
      button.disabled = true;
    });
    if (feedback) {
      feedback.className = 'feedback show good';
      feedback.innerHTML = `<b>이 개념은 통과.</b> ${lesson.check.explanation}`;
    }

    const key = progressKey(track.id, currentUnit.id);
    state[key] = { ...(state[key] || {}), doneSteps: done + 1 };
    save();
    totalStats();

    if (gradeButton) {
      gradeButton.disabled = false;
      gradeButton.dataset.action = 'continue';
      gradeButton.textContent = done + 1 >= currentUnit.lesson.length ? '단원 완료' : '다음 개념';
    }
  }

  function continueLesson() {
    const track = currentTrack();
    if (!track || !currentUnit) return;
    if (doneCount(track, currentUnit) >= currentUnit.lesson.length) renderCelebrate();
    else renderLesson();
  }

  function renderCelebrate() {
    lessonEl.innerHTML = `<div class="clay celebrate show">
      <div class="big">✓</div>
      <h2>${currentUnit.title} 완료</h2>
      <p>설명을 읽고 직접 확인까지 끝냈어. 다음 단원이 열렸어.</p>
      <span class="xp">+ ${currentUnit.lesson.length * 20} XP</span>
      <div class="actions completion-actions"><button class="btn primary" data-action="home">다음 학습 보기</button></div>
    </div>`;
    totalStats();
  }

  function backHome() {
    study.classList.remove('show');
    home.classList.remove('hide');
    currentUnit = null;
    selected = null;
    mastered = false;
    renderTrack();
    window.scrollTo(0, 0);
  }

  trackEl.addEventListener('click', event => {
    const card = event.target.closest('.unit');
    if (!card || card.classList.contains('locked')) return;
    openUnit(Number(card.dataset.unitIndex));
  });

  lessonEl.addEventListener('click', event => {
    const choice = event.target.closest('.choice');
    if (choice) return choose(choice);
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'grade') grade();
    else if (action === 'continue') continueLesson();
    else if (action === 'home') backHome();
  });

  back?.addEventListener('click', backHome);
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    currentTrackId = button.dataset.track;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderTrack();
  }));

  renderTrack();
})();