const { test } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data/vocabulary.json');
const core = require('../vocab-core.js');

test('curated data has valid references, unique stable IDs and complete bilingual fields', () => {
  assert.ok(data.topics.length >= 25);
  const ids = new Set();
  const senses = new Set();
  const topics = new Set(data.topics.map(t => t.id));
  const levels = new Set();
  const skills = new Set();
  const covered = new Set();
  data.entries.forEach(w => {
    assert.ok(!ids.has(w.id), w.id);
    ids.add(w.id);
    const sense = core.normalize(w.word) + ':' + w.pos;
    assert.ok(!senses.has(sense), sense);
    senses.add(sense);
    ['word', 'ipa', 'pos', 'meaningVi', 'exampleEn', 'exampleVi'].forEach(k => assert.ok(typeof w[k] === 'string' && w[k].trim(), `${w.id}.${k}`));
    assert.match(w.ipa, /^\/[^?]+\/$/);
    assert.ok(!w.meaningVi.includes('?') && !w.meaningVi.includes('\uFFFD'));
    assert.ok(['A1', 'A2', 'B1'].includes(w.cefr));
    assert.ok(['n.', 'v.', 'adj.', 'adv.'].includes(w.pos));
    levels.add(w.cefr);
    assert.ok(w.collocations.length >= 2);
    assert.equal(new Set(w.collocations).size, w.collocations.length);
    w.collocations.forEach(c => assert.ok(c.includes(w.word), `${w.id}: ${c}`));
    assert.ok(w.skills.length && w.topics.length);
    w.skills.forEach(s => { assert.ok(['Listening', 'Speaking', 'Reading', 'Writing'].includes(s)); skills.add(s); });
    w.topics.forEach(t => { assert.ok(topics.has(t)); covered.add(t); });
    assert.equal(w.cefrSource.headword, w.word);
    assert.equal(w.cefrSource.pos, w.pos);
    assert.ok(data.sources.some(s => s.id === w.cefrSource.id && s.url.startsWith('https://')));
    assert.ok(Number.isInteger(w.cefrSource.page));
    const bounds = { A1: [1, 4], A2: [4, 7], B1: [7, 10] }[w.cefr];
    assert.ok(w.cefrSource.page >= bounds[0] && w.cefrSource.page <= bounds[1]);
  });
  assert.equal(covered.size, topics.size);
  assert.equal(levels.size, 3);
  assert.equal(skills.size, 4);
});
test('search ignores case and Vietnamese accents while combining all filters', () => {
  assert.equal(core.normalize(' ĐỜI sống '), 'doi song');
  assert.equal(core.filter(data.entries, { query: 'HANH TRINH' }, {})[0].word, 'journey');
  const progress = { 'assignment-n': 'review' };
  const matches = core.filter(data.entries, { query: 'bai tap', topic: 'education', cefr: 'B1', skill: 'Writing', status: 'review' }, progress);
  assert.deepEqual(matches.map(w => w.word), ['assignment']);
  assert.equal(core.filter(data.entries, { query: 'xyz-no-match' }, {}).length, 0);
});
test('progress rejects malformed values and counts only current IDs', () => {
  for (const raw of ['null', '[]', '{bad', '42']) assert.deepEqual(core.readProgress(raw, data.entries), {});
  const saved = core.readProgress('{"student-n":"learned","degree-n":"review","job-n":true,"deleted":"learned"}', data.entries);
  assert.deepEqual(saved, { 'student-n': 'learned', 'degree-n': 'review' });
  assert.deepEqual(core.counts(data.entries, saved), { total: 78, learned: 1, review: 1, new: 76 });
});
test('quiz has exactly one answer, unique distractors and no mutation', () => {
  const original = JSON.stringify(data.entries);
  data.entries.forEach(w => {
    const choices = core.choices(w, data.entries);
    assert.equal(choices.length, 4);
    assert.equal(new Set(choices).size, 4);
    assert.equal(choices.filter(c => c === w.meaningVi).length, 1);
  });
  assert.equal(JSON.stringify(data.entries), original);
  assert.deepEqual(core.choices(data.entries[0], [data.entries[0]]), [data.entries[0].meaningVi]);
});
test('CSV retains Unicode, escapes multiline quotes, protects spreadsheet formulas and keeps metadata', () => {
  const csv = core.csv([{ ...data.entries[0], word: '=1+1', exampleEn: 'A "quoted",\nexample.' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"A ""quoted"",\nexample."'));
  assert.ok(csv.includes('học sinh; sinh viên'));
  assert.ok(csv.includes('oxford3000'));
});
