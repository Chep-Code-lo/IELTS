/* Shared, dependency-free helpers for the A1–B1 library. */
(function (root) {
  'use strict';
  const statuses = ['new', 'learned', 'review'];
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  function filter(entries, filters, progress) {
    const q = normalize(filters.query || '');
    return entries.filter(w => (!q || normalize(`${w.word} ${w.meaningVi}`).includes(q)) &&
      (!filters.topic || w.topics.includes(filters.topic)) &&
      (!filters.cefr || w.cefr === filters.cefr) &&
      (!filters.skill || w.skills.includes(filters.skill)) &&
      (!filters.status || (progress[w.id] || 'new') === filters.status));
  }
  function readProgress(raw, entries) {
    try {
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(entries.filter(w => Object.hasOwn(value, w.id) && statuses.includes(value[w.id])).map(w => [w.id, value[w.id]]));
    } catch { return {}; }
  }
  function counts(entries, progress) {
    const result = { new: 0, learned: 0, review: 0, total: entries.length };
    entries.forEach(w => result[progress[w.id] || 'new']++);
    return result;
  }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function choices(word, pool, random = Math.random) {
    const meanings = [...new Set(pool.map(w => w.meaningVi))].filter(m => m !== word.meaningVi);
    return shuffle([word.meaningVi, ...shuffle(meanings, random).slice(0, 3)], random);
  }
  function csv(entries) {
    const fields = ['id', 'word', 'ipa', 'pos', 'meaningVi', 'cefr', 'exampleEn', 'exampleVi', 'collocations', 'topics', 'skills', 'cefrSource'];
    const cell = value => {
      let text = Array.isArray(value) ? value.join('; ') : typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (/^[=+@\-\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    return '\uFEFF' + [fields, ...entries.map(w => fields.map(f => w[f]))].map(row => row.map(cell).join(',')).join('\r\n');
  }
  const api = { statuses, normalize, filter, readProgress, counts, shuffle, choices, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VocabCore = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
