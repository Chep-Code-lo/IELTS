(function () {
  'use strict';
  const data = window.IELTS_A1_B1;
  const core = window.VocabCore;
  const $ = id => document.getElementById(id);
  const key = 'ielts_a1_b1_progress_v1';
  const labels = { new: 'Chưa học', learned: 'Đã học', review: 'Cần ôn tập' };
  const posLabels = { 'n.': 'danh từ', 'v.': 'động từ', 'adj.': 'tính từ', 'adv.': 'trạng từ' };
  let progress = {};
  let filtered = [];
  let session = null;
  let page = 0;
  const pageSize = 12;
  try { progress = core.readProgress(localStorage.getItem(key), data.entries); }
  catch { storageWarning(); }

  function storageWarning() {
    $('v-storage').hidden = false;
    $('v-storage').textContent = 'Không thể lưu trên trình duyệt này. Tiến độ chỉ được giữ trong phiên hiện tại.';
  }
  function save(id, status) {
    progress[id] = status;
    try { localStorage.setItem(key, JSON.stringify(progress)); }
    catch { storageWarning(); }
    render();
  }
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function button(text, action, className = 'v-button') {
    const el = node('button', text, className);
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
  }
  function option(value, text) {
    const el = node('option', text);
    el.value = value;
    return el;
  }
  function filters() {
    return { query: $('v-search').value, topic: $('v-topic').value, cefr: $('v-cefr').value, skill: $('v-skill').value, status: $('v-status').value };
  }
  data.topics.forEach(t => $('v-topic').append(option(t.id, `${t.name} · ${t.nameVi}`)));
  function statusSelect(word) {
    const label = node('label', 'Trạng thái ', 'v-status-label');
    const select = node('select');
    select.setAttribute('aria-label', `Trạng thái của ${word.word}`);
    Object.entries(labels).forEach(([id, text]) => select.append(option(id, text)));
    select.value = progress[word.id] || 'new';
    select.addEventListener('change', () => save(word.id, select.value));
    label.append(select);
    return label;
  }
  function details(word) {
    const box = node('div', undefined, 'v-details');
    const en = node('p', word.exampleEn, 'v-example');
    en.lang = 'en';
    box.append(node('p', word.meaningVi, 'v-meaning'), en, node('p', word.exampleVi, 'v-muted'), node('p', `Cụm từ: ${word.collocations.join(' · ')}`));
    const skills = node('p', `Kỹ năng: ${word.skills.join(' · ')}`, 'v-muted');
    const source = data.sources.find(s => s.id === word.cefrSource.id);
    const link = node('a', `CEFR: Oxford 3000, trang ${word.cefrSource.page}`);
    link.href = source.url + '#page=' + word.cefrSource.page;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    box.append(skills, link);
    return box;
  }
  function render() {
    filtered = core.filter(data.entries, filters(), progress);
    page = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
    const all = core.counts(data.entries, progress);
    const count = core.counts(filtered, progress);
    $('v-progress').textContent = `Toàn bộ: ${all.learned}/${all.total} đã học · ${all.review} cần ôn · ${all.new} chưa học`;
    $('v-meter').max = all.total;
    $('v-meter').value = all.learned;
    $('v-count').textContent = `${filtered.length} từ phù hợp · ${count.learned} đã học · ${count.review} cần ôn`;
    $('v-flash-start').disabled = !filtered.length;
    $('v-quiz-start').disabled = !filtered.length;
    $('v-json').disabled = !filtered.length;
    $('v-csv').disabled = !filtered.length;
    const list = $('v-list');
    list.replaceChildren();
    if (!filtered.length) list.append(node('p', 'Không tìm thấy từ phù hợp. Hãy đổi từ khóa hoặc xóa bộ lọc.', 'v-empty'));
    filtered.slice(page * pageSize, (page + 1) * pageSize).forEach(word => {
      const article = node('article', undefined, 'v-card');
      const heading = node('h3', word.word);
      heading.lang = 'en';
      article.append(node('span', word.cefr, `v-badge v-${word.cefr.toLowerCase()}`), heading,
        node('p', `${word.ipa} · ${posLabels[word.pos]}`, 'v-muted'),
        node('p', word.topics.map(id => data.topics.find(t => t.id === id).nameVi).join(' · '), 'v-muted'), details(word), statusSelect(word));
      list.append(article);
    });
    $('v-page').textContent = filtered.length ? `Trang ${page + 1}/${Math.ceil(filtered.length / pageSize)}` : '0 trang';
    $('v-prev').disabled = page === 0;
    $('v-next').disabled = (page + 1) * pageSize >= filtered.length;
  }
  ['v-search', 'v-topic', 'v-cefr', 'v-skill', 'v-status'].forEach(id => $(id).addEventListener(id === 'v-search' ? 'input' : 'change', () => { page = 0; render(); }));
  $('v-clear').onclick = () => {
    ['v-search', 'v-topic', 'v-cefr', 'v-skill', 'v-status'].forEach(id => { $(id).value = ''; });
    page = 0;
    render();
  };
  $('v-prev').onclick = () => { page--; render(); };
  $('v-next').onclick = () => { page++; render(); };

  function start(mode) {
    if (!filtered.length) return;
    session = { mode, words: core.shuffle(filtered).slice(0, mode === 'quiz' ? 10 : filtered.length), index: 0, correct: 0, answered: false, revealed: false };
    $('v-session').showModal();
    renderSession();
  }
  function renderSession() {
    const area = $('v-session-content');
    area.replaceChildren();
    if (!session) return;
    const { mode, words, index } = session;
    $('v-session-title').textContent = mode === 'quiz' ? 'Quiz Anh → Việt' : 'Flashcards Anh → Việt';
    if (index >= words.length) {
      area.append(node('h3', 'Hoàn thành!'), node('p', mode === 'quiz' ? `Đúng ${session.correct}/${words.length} câu. Từ trả lời sai được đánh dấu cần ôn tập.` : `Bạn đã xem ${words.length} thẻ.`));
      area.append(button('Học lại lượt này', () => { session.index = 0; session.correct = 0; session.answered = false; session.revealed = false; renderSession(); }));
      return;
    }
    const word = words[index];
    area.append(node('p', `${index + 1}/${words.length} · ${word.cefr} · ${posLabels[word.pos]}`, 'v-muted'));
    const title = node('h3', word.word, 'v-prompt');
    title.lang = 'en';
    area.append(title, node('p', word.ipa, 'v-muted'));
    if (mode === 'flash') {
      const answer = details(word);
      answer.hidden = !session.revealed;
      const flip = button(session.revealed ? 'Ẩn nghĩa' : 'Hiện nghĩa và ví dụ', () => {
        session.revealed = !session.revealed;
        answer.hidden = !session.revealed;
        flip.textContent = session.revealed ? 'Ẩn nghĩa' : 'Hiện nghĩa và ví dụ';
        flip.setAttribute('aria-expanded', String(session.revealed));
      });
      flip.setAttribute('aria-expanded', String(session.revealed));
      area.append(flip, answer);
      const actions = node('div', undefined, 'v-actions');
      Object.entries(labels).forEach(([id, text]) => actions.append(button(text + ' →', () => {
        save(word.id, id);
        session.index++;
        session.revealed = false;
        renderSession();
      })));
      area.append(actions, button('Bỏ qua →', () => { session.index++; session.revealed = false; renderSession(); }));
    } else {
      area.append(node('p', 'Chọn nghĩa tiếng Việt đúng:'));
      const answers = node('div', undefined, 'v-answers');
      const feedback = node('div', undefined, 'v-feedback');
      feedback.setAttribute('role', 'status');
      const next = button('Câu tiếp theo →', () => { session.index++; session.answered = false; renderSession(); });
      next.hidden = true;
      // Distractors use the full library so a one-word filter remains usable.
      core.choices(word, data.entries).forEach(meaning => {
        const choice = button(meaning, () => {
          if (session.answered) return;
          session.answered = true;
          const correct = meaning === word.meaningVi;
          if (correct) session.correct++;
          else save(word.id, 'review');
          Array.from(answers.children).forEach(el => { el.disabled = true; if (el.textContent === word.meaningVi) el.classList.add('v-correct'); });
          if (!correct) choice.classList.add('v-incorrect');
          feedback.append(node('p', correct ? 'Chính xác!' : `Chưa đúng. Đáp án: ${word.meaningVi}`), details(word));
          next.hidden = false;
          next.focus();
        });
        answers.append(choice);
      });
      area.append(answers, feedback, next);
    }
  }
  $('v-flash-start').onclick = () => start('flash');
  $('v-quiz-start').onclick = () => start('quiz');
  $('v-session-close').onclick = () => $('v-session').close();
  $('v-session').addEventListener('close', () => { session = null; render(); });
  function download(type) {
    if (!filtered.length) return;
    const content = type === 'csv' ? core.csv(filtered) : JSON.stringify({ ...data, entries: filtered }, null, 2);
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = node('a');
    link.href = url;
    link.download = `ielts-a1-b1.${type}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('v-json').onclick = () => download('json');
  $('v-csv').onclick = () => download('csv');
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { progress = core.readProgress(event.newValue, data.entries); render(); }
  });
  render();
})();
