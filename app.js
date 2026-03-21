// === IELTS Vocab Master - Main Application ===
(function(){
  // State
  let currentSection = 'home';
  let currentTopic = null;
  let currentWords = [];
  let cardIndex = 0;
  let typeIndex = 0;
  let typeCorrect = 0;
  let typeWrong = 0;
  let progress = JSON.parse(localStorage.getItem('ielts_progress') || '{}');
  let streak = parseInt(localStorage.getItem('ielts_streak') || '0');
  let lastDate = localStorage.getItem('ielts_last_date') || '';

  // Check streak
  const today = new Date().toDateString();
  if (lastDate && lastDate !== today) {
    const diff = (new Date(today) - new Date(lastDate)) / 86400000;
    if (diff > 1) streak = 0;
  }

  // DOM refs
  const $ = id => document.getElementById(id);
  const sections = document.querySelectorAll('.section');
  const navBtns = document.querySelectorAll('.nav-btn');

  // === Navigation ===
  function showSection(name) {
    currentSection = name;
    sections.forEach(s => { s.classList.remove('active'); });
    const el = $(name);
    if (el) { el.classList.add('active'); }
    navBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.section === name);
    });
    if (name === 'home') { updateHomeStats(); renderTopics(); }
    if (name === 'progress') renderProgress();
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section;
      if (sec === 'flashcard' || sec === 'typing') {
        if (!currentTopic) { showSection('home'); return; }
      }
      showSection(sec);
    });
  });

  // === Home Stats ===
  function getLearnedCount() {
    let c = 0;
    for (const k in progress) c += Object.keys(progress[k] || {}).length;
    return c;
  }
  function getTotalWords() {
    return VOCAB_DATA.reduce((s, t) => s + t.words.length, 0);
  }
  function updateHomeStats() {
    $('stat-total').textContent = getTotalWords();
    $('stat-learned').textContent = getLearnedCount();
    $('stat-streak').textContent = streak;
  }

  // === Topics ===
  function renderTopics() {
    const grid = $('topic-grid');
    grid.innerHTML = '';
    VOCAB_DATA.forEach((topic, i) => {
      const learned = progress[i] ? Object.keys(progress[i]).length : 0;
      const pct = Math.round((learned / topic.words.length) * 100);
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <span class="topic-emoji">${topic.emoji}</span>
        <div class="topic-name">${topic.name}</div>
        <div class="topic-count">${topic.words.length} từ · ${learned} đã thuộc</div>
        <div class="topic-prog"><div class="topic-prog-bar" style="width:${pct}%"></div></div>
      `;
      card.addEventListener('click', () => selectTopic(i));
      grid.appendChild(card);
    });
  }

  function selectTopic(idx) {
    currentTopic = idx;
    currentWords = [...VOCAB_DATA[idx].words];
    // Show choice: flashcard or typing
    showModeChoice(idx);
  }

  function showModeChoice(idx) {
    const topic = VOCAB_DATA[idx];
    // Create a temporary modal
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeUp .3s ease';
    overlay.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:40px;text-align:center;max-width:400px;width:90%">
        <div style="font-size:3rem;margin-bottom:12px">${topic.emoji}</div>
        <h3 style="font-size:1.3rem;margin-bottom:8px">${topic.name}</h3>
        <p style="color:var(--text2);margin-bottom:28px">${topic.words.length} từ vựng</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button id="mode-flash" style="padding:14px 28px;border-radius:12px;border:1px solid var(--border);background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(124,58,237,.15));color:var(--accent);font-weight:600;cursor:pointer;font-family:inherit;font-size:1rem;transition:all .2s">🃏 Flashcard</button>
          <button id="mode-type" style="padding:14px 28px;border-radius:12px;border:1px solid var(--border);background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(244,114,182,.15));color:#f472b6;font-weight:600;cursor:pointer;font-family:inherit;font-size:1rem;transition:all .2s">⌨️ Gõ từ</button>
        </div>
        <button id="mode-cancel" style="margin-top:16px;background:none;border:none;color:var(--text2);cursor:pointer;font-family:inherit;font-size:.85rem;padding:8px">Hủy</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#mode-flash').onclick = () => { document.body.removeChild(overlay); startFlashcard(); };
    overlay.querySelector('#mode-type').onclick = () => { document.body.removeChild(overlay); startTyping(); };
    overlay.querySelector('#mode-cancel').onclick = () => { document.body.removeChild(overlay); };
  }

  // === Flashcard ===
  function startFlashcard() {
    cardIndex = 0;
    shuffleArray(currentWords);
    showSection('flashcard');
    $('flash-topic-title').textContent = VOCAB_DATA[currentTopic].name;
    renderFlashcard();
  }

  function renderFlashcard() {
    if (cardIndex >= currentWords.length) {
      finishMode('flashcard');
      return;
    }
    const w = currentWords[cardIndex];
    $('fc-word').textContent = w.word;
    $('fc-phonetic').textContent = '';
    $('fc-meaning').textContent = w.meaning;
    $('fc-example').textContent = `Từ: "${w.word}"`;
    $('flash-counter').textContent = `${cardIndex + 1}/${currentWords.length}`;
    const card = $('flashcard-el');
    card.classList.remove('flipped');
  }

  $('flashcard-el').addEventListener('click', () => {
    $('flashcard-el').classList.toggle('flipped');
  });

  $('fc-speak').addEventListener('click', (e) => {
    e.stopPropagation();
    speak(currentWords[cardIndex]?.word);
  });

  $('fc-known').addEventListener('click', () => {
    markLearned(currentTopic, currentWords[cardIndex].word);
    cardIndex++;
    renderFlashcard();
  });

  $('fc-unknown').addEventListener('click', () => {
    cardIndex++;
    renderFlashcard();
  });

  $('flash-back').addEventListener('click', () => showSection('home'));

  // === Typing Mode ===
  function startTyping() {
    typeIndex = 0;
    typeCorrect = 0;
    typeWrong = 0;
    shuffleArray(currentWords);
    showSection('typing');
    $('type-topic-title').textContent = VOCAB_DATA[currentTopic].name;
    $('type-correct').textContent = '0';
    $('type-wrong').textContent = '0';
    renderTypingWord();
  }

  function renderTypingWord() {
    if (typeIndex >= currentWords.length) {
      finishMode('typing');
      return;
    }
    const w = currentWords[typeIndex];
    $('type-meaning').textContent = w.meaning;
    $('type-phonetic').textContent = '';
    $('type-counter').textContent = `${typeIndex + 1}/${currentWords.length}`;
    $('type-input').value = '';
    $('type-input').className = '';
    $('type-input').disabled = false;
    $('type-feedback').className = 'typing-feedback hidden';
    $('type-hint').className = 'typing-hint hidden';
    $('type-next').classList.add('hidden');
    $('type-input').focus();
  }

  function checkTyping() {
    const w = currentWords[typeIndex];
    const input = $('type-input').value.trim().toLowerCase();
    const correct = w.word.toLowerCase();
    const fb = $('type-feedback');
    const hint = $('type-hint');

    if (!input) return;

    $('type-input').disabled = true;

    if (input === correct) {
      $('type-input').className = 'correct';
      fb.className = 'typing-feedback correct-fb';
      fb.textContent = '✅ Chính xác!';
      typeCorrect++;
      markLearned(currentTopic, w.word);
      speak(w.word);
    } else {
      $('type-input').className = 'wrong';
      fb.className = 'typing-feedback wrong-fb';
      fb.textContent = '❌ Sai rồi!';
      hint.className = 'typing-hint';
      hint.innerHTML = `Đáp án đúng: <span class="answer-word">${w.word}</span>`;
      typeWrong++;
    }
    $('type-correct').textContent = typeCorrect;
    $('type-wrong').textContent = typeWrong;
    $('type-next').classList.remove('hidden');
  }

  $('type-check').addEventListener('click', checkTyping);
  $('type-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if ($('type-input').disabled) {
        typeIndex++;
        renderTypingWord();
      } else {
        checkTyping();
      }
    }
  });
  $('type-next').addEventListener('click', () => {
    typeIndex++;
    renderTypingWord();
  });
  $('type-back').addEventListener('click', () => showSection('home'));

  // === Finish Mode ===
  function finishMode(mode) {
    updateStreak();
    showConfetti();
    const topic = VOCAB_DATA[currentTopic];
    const learned = progress[currentTopic] ? Object.keys(progress[currentTopic]).length : 0;
    const pct = Math.round((learned / topic.words.length) * 100);

    const section = $(mode === 'flashcard' ? 'flashcard' : 'typing');
    const msg = mode === 'typing'
      ? `<p style="margin-bottom:8px">✅ Đúng: <strong>${typeCorrect}</strong> · ❌ Sai: <strong>${typeWrong}</strong></p>`
      : '';

    section.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:4rem;margin-bottom:16px">🎉</div>
        <h2 style="margin-bottom:12px">Hoàn thành!</h2>
        <p style="color:var(--text2);margin-bottom:8px">${topic.name}</p>
        ${msg}
        <p style="margin-bottom:24px">Tiến độ: <strong style="color:var(--accent)">${pct}%</strong> (${learned}/${topic.words.length} từ)</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button onclick="location.reload()" style="padding:14px 28px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-weight:600;cursor:pointer;font-family:inherit;font-size:1rem">🏠 Trang chủ</button>
        </div>
      </div>
    `;
  }

  // === Progress ===
  function renderProgress() {
    const overview = $('progress-overview');
    const total = getTotalWords();
    const learned = getLearnedCount();
    const pct = total ? Math.round((learned / total) * 100) : 0;
    overview.innerHTML = `
      <div class="po-card"><span class="po-num" style="color:var(--accent)">${total}</span><span class="po-label">Tổng từ vựng</span></div>
      <div class="po-card"><span class="po-num" style="color:var(--green)">${learned}</span><span class="po-label">Đã thuộc</span></div>
      <div class="po-card"><span class="po-num" style="color:#f472b6">${pct}%</span><span class="po-label">Hoàn thành</span></div>
      <div class="po-card"><span class="po-num" style="color:#fbbf24">${streak}</span><span class="po-label">Chuỗi ngày</span></div>
    `;
    const grid = $('progress-grid');
    grid.innerHTML = '';
    VOCAB_DATA.forEach((topic, i) => {
      const l = progress[i] ? Object.keys(progress[i]).length : 0;
      const p = Math.round((l / topic.words.length) * 100);
      grid.innerHTML += `
        <div class="pg-item">
          <span class="pg-emoji">${topic.emoji}</span>
          <div class="pg-info">
            <div class="pg-name">${topic.name}</div>
            <div class="pg-bar"><div class="pg-bar-fill" style="width:${p}%"></div></div>
          </div>
          <span class="pg-pct">${p}%</span>
        </div>
      `;
    });
  }

  $('reset-progress').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ tiến độ?')) {
      progress = {};
      streak = 0;
      localStorage.removeItem('ielts_progress');
      localStorage.removeItem('ielts_streak');
      localStorage.removeItem('ielts_last_date');
      renderProgress();
    }
  });

  // === Search ===
  const searchInput = $('search-input');
  const searchResults = $('search-results');
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.classList.add('hidden'); return; }
    const results = [];
    VOCAB_DATA.forEach(topic => {
      topic.words.forEach(w => {
        if (w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)) {
          results.push(w);
        }
      });
    });
    if (results.length === 0) { searchResults.classList.add('hidden'); return; }
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = results.slice(0, 15).map(w =>
      `<div class="search-item"><span class="sw">${w.word}</span><span class="sm">${w.meaning}</span></div>`
    ).join('');
  });
  document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
      searchResults.classList.add('hidden');
  });

  // === Helpers ===
  function markLearned(topicIdx, word) {
    if (!progress[topicIdx]) progress[topicIdx] = {};
    progress[topicIdx][word] = true;
    localStorage.setItem('ielts_progress', JSON.stringify(progress));
  }

  function updateStreak() {
    const t = new Date().toDateString();
    if (lastDate !== t) {
      const diff = lastDate ? (new Date(t) - new Date(lastDate)) / 86400000 : 0;
      streak = diff <= 1 ? streak + 1 : 1;
      lastDate = t;
      localStorage.setItem('ielts_streak', streak);
      localStorage.setItem('ielts_last_date', t);
    }
  }

  function speak(text) {
    if (!text || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function showConfetti() {
    const c = document.createElement('div');
    c.className = 'confetti-container';
    const colors = ['#00d4ff','#7c3aed','#f472b6','#22c55e','#fbbf24','#ef4444'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = Math.random() * 1.5 + 's';
      p.style.width = (Math.random() * 8 + 5) + 'px';
      p.style.height = (Math.random() * 8 + 5) + 'px';
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(() => document.body.removeChild(c), 3000);
  }

  // Init
  updateHomeStats();
  renderTopics();
})();
