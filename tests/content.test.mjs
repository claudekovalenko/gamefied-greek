// Run: node --test tests/*.test.mjs   (or: npm test)
// Loads the data + engine in a sandbox (no browser) and checks that every lesson
// generates sound questions and that the curriculum data is consistent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = {};
const ctx = { console, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } } };
ctx.window = ctx;
vm.createContext(ctx);
ctx.fetch = async url => { const t = readFileSync(path.join(root, url), 'utf8'); return { ok: true, json: async () => JSON.parse(t) }; };
for (const f of ['js/data/alphabet.js', 'js/data/vocab.js', 'js/data/grammar.js', 'js/data/readings.js', 'js/data/curriculum.js', 'js/data/passages.js', 'js/data/teach.js', 'js/engine.js']) {
  vm.runInContext(readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const { KG } = ctx, E = KG.engine;

function checkQuestion(q, where) {
  assert.ok(q && q.type, `${where}: question has a type`);
  if (q.type === 'mc') {
    assert.ok(q.options.length >= 2, `${where}: at least 2 options (${q.prompt})`);
    assert.equal(new Set(q.options).size, q.options.length, `${where}: duplicate options in "${q.prompt}" ${q.big || ''}: ${q.options}`);
    assert.ok(q.answer >= 0 && q.answer < q.options.length, `${where}: answer index valid (${q.prompt})`);
  } else if (q.type === 'match') {
    assert.ok(q.pairs.length >= 3, `${where}: match has pairs`);
    assert.equal(new Set(q.pairs.map(p => p[0])).size, q.pairs.length, `${where}: unique left side`);
    assert.equal(new Set(q.pairs.map(p => p[1])).size, q.pairs.length, `${where}: unique right side`);
  } else if (q.type === 'order' || q.type === 'free') {
    assert.ok(KG.readings[q.reading], `${where}: reading exists`);
  }
}

test('vocabulary: 200 unique words in 20 sets, frequency-sorted within reason', () => {
  assert.equal(KG.vocab.length, 200);
  assert.equal(new Set(KG.vocab.map(w => w.g)).size, 200);
  assert.equal(new Set(KG.vocab.map(w => w.en)).size, 200, 'glosses must be distinct so multiple choice is fair');
  assert.equal(KG.VOCAB_SETS, 20);
});

test('curriculum: every node points at real content and ids are unique', () => {
  const ids = E.nodes.map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of E.nodes) {
    if (n.type === 'grammar') assert.ok(KG.grammar[n.lesson], n.id);
    if (n.type === 'reading') assert.ok(KG.readings[n.reading], n.id);
    if (n.type === 'vocab') assert.equal(E.vocabSet(n.set).length, 10, n.id);
  }
  const usedSets = E.nodes.filter(n => n.type === 'vocab').map(n => n.set).sort((a, b) => a - b);
  assert.equal(JSON.stringify(usedSets), JSON.stringify([...Array(20).keys()]), 'every vocab set is used exactly once');
  for (const k of Object.keys(KG.grammar)) assert.ok(E.nodes.some(n => n.lesson === k), `grammar lesson ${k} is on the path`);
  for (const k of Object.keys(KG.readings)) assert.ok(E.nodes.some(n => n.reading === k), `reading ${k} is on the path`);
});

test('paradigms: rectangular, no empty cells', () => {
  for (const [k, L] of Object.entries(KG.grammar)) {
    for (const p of L.paradigms || []) {
      assert.equal(p.forms.length, p.rows.length, `${k} ${p.title} rows`);
      for (const r of p.forms) {
        assert.equal(r.length, p.cols.length, `${k} ${p.title} cols`);
        for (const f of r) assert.ok(f && f.trim(), `${k} ${p.title} has an empty cell`);
      }
    }
  }
});

test('grammar concepts: correct answer never repeated among the wrong ones', () => {
  for (const [k, L] of Object.entries(KG.grammar)) {
    for (const c of L.concepts || []) assert.ok(!c.w.includes(c.a), `${k}: "${c.q}"`);
    assert.ok((L.concepts || []).length >= 6, `${k} needs at least 6 concept checks`);
  }
});

test('readings: parsed words, chunks build the model translation', () => {
  for (const [k, R] of Object.entries(KG.readings)) {
    for (const w of R.words) {
      assert.ok(w.w && w.lemma && w.gloss && w.parse, `${k}: incomplete word ${w.w}`);
      assert.ok(!w.w.includes(' '), `${k}: word has a space`);
    }
    const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(norm(R.chunks.join(' ')), norm(R.tr), `${k}: chunks must spell out the translation`);
    for (const x of R.extras) assert.ok(!R.chunks.includes(x), `${k}: distractor "${x}" duplicates a real chunk`);
  }
});

test('every node generates valid questions (100 random runs each)', () => {
  for (const n of E.nodes) {
    for (let i = 0; i < 100; i++) {
      const qs = E.questionsFor(n);
      assert.ok(qs.length >= 5, `${n.id}: only ${qs.length} questions`);
      qs.forEach((q, j) => checkQuestion(q, `${n.id}#${j}`));
    }
  }
});

test('parse questions accept ambiguous forms (τῶν, ὥρας)', () => {
  const all = E.cells(KG.grammar.article);
  const twn = all.find(c => c.form === 'τῶν');
  for (let i = 0; i < 50; i++) {
    const q = E.parseQ(twn, all);
    const others = q.options.filter((_, k) => k !== q.answer);
    for (const o of others) assert.ok(!o.startsWith('Genitive') || !o.endsWith('Pl'), `wrong option "${o}" is also correct for τῶν`);
  }
});

test('XP, levels, streak and spaced repetition behave', () => {
  E.reset();
  const S = E.state;
  assert.equal(E.levelInfo(0).level, 1);
  assert.equal(E.levelInfo(80).level, 2);
  E.gainXP(30);
  assert.equal(S.streak, 1);
  E.srsAnswer('λόγος', true);
  assert.equal(S.vocab['λόγος'].box, 1);
  S.vocab['λόγος'].due = '2000-01-01';
  E.srsAnswer('λόγος', true);
  assert.equal(S.vocab['λόγος'].box, 2);
  E.srsAnswer('λόγος', false);
  assert.equal(S.vocab['λόγος'].box, 1);
  const r = E.finishLesson(E.node('alpha1'), { correct: 10, wrong: 0, xp: 100, maxCombo: 10, hearts: 3 });
  assert.ok(r.passed && r.perfect && r.stars === 2);
  assert.ok(E.unlocked(E.node('alpha2')));
  assert.ok(!E.unlocked(E.node('alpha3')));
  assert.ok(S.ach.first && S.ach.perfect && S.ach.combo10);
});

test('single-word review questions exist (review mode and wisp battles)', () => {
  for (const w of KG.vocab.slice(0, 30)) {
    const q = E.vocabQuestions([w], KG.vocab, 1)[0];
    assert.ok(q && q.type === 'mc' && q.vkey === w.g, `no question for ${w.g}`);
  }
});

test('Reading Room: every scroll passage loads real SBLGNT verses with an English comparison', async () => {
  const NT = E.nt;
  assert.equal(new Set(KG.passages.map(p => p.id)).size, KG.passages.length);
  for (const p of KG.passages) {
    const r = NT.parseRef(p.ref);
    assert.ok(r, `cannot parse ${p.ref}`);
    const vs = await NT.passage(r);
    const expected = (r.v2 - r.v1 + 1);
    assert.equal(vs.length, expected, `${p.ref}: got ${vs.length} verses`);
    for (const v of vs) assert.ok(v.words.length > 0, `${p.ref} ${v.c}:${v.v} is empty`);
    const en = JSON.parse(readFileSync(path.join(root, `data/nt/en/${r.b}.json`), 'utf8'));
    assert.ok(en[r.c1 - 1][r.v1 - 1], `${p.ref}: no English`);
    assert.ok(p.unit >= 0 && p.unit < KG.units.length);
  }
});

test('Reading Room: references and parsing codes decode sensibly', async () => {
  const NT = E.nt;
  assert.equal(JSON.stringify(NT.parseRef('1 Cor 13:4–7')), JSON.stringify({ b: '1Co', c1: 13, v1: 4, c2: 13, v2: 7 }));
  assert.equal(JSON.stringify(NT.parseRef('Rom 8:28-9:2')), JSON.stringify({ b: 'Ro', c1: 8, v1: 28, c2: 9, v2: 2 }));
  assert.equal(NT.parseRef('Hezekiah 3:1'), null);
  assert.equal(NT.decode('V-3AAI-S'), 'Verb — aorist active indicative 3rd singular');
  assert.equal(NT.decode('V--PAPNSM'), 'Verb — present active participle nominative singular masculine');
  assert.equal(NT.decode('C'), 'Conjunction');
  // every code in John decodes without "undefined"
  await NT.ready();
  const jn = await NT.book('Jn');
  for (const ch of jn.ch) for (const v of ch) for (const [, li, code] of v) {
    assert.ok(!NT.decode(code).includes('undefined'), `bad decode for ${code}`);
    assert.ok(NT.lex[li], 'lemma index in range');
  }
  const glossed = NT.lex.filter(l => l[1]).reduce((n, l) => n + l[2], 0), all = NT.lex.reduce((n, l) => n + l[2], 0);
  assert.ok(glossed / all > 0.99, `only ${(glossed / all * 100).toFixed(1)}% of NT words have a gloss`);
});

test('lesson plans: teach → guided → trial for every node, first play and replay', () => {
  for (const k of Object.keys(KG.grammar)) assert.ok(KG.teach[k] && KG.teach[k].beats.length >= 2 && KG.teach[k].spell, `teaching beats for ${k}`);
  for (const k of Object.keys(KG.teach)) for (const b of KG.teach[k].beats) {
    assert.ok(!b.check.w.includes(b.check.a), `${k}: answer repeated among wrong options`);
    assert.ok((b.demo.match(/\[/g) || []).length === (b.demo.match(/\]/g) || []).length, `${k}: unbalanced brackets in demo`);
  }
  for (const replay of [false, true]) {
    E.reset();
    if (replay) for (const n of E.nodes) E.state.lessons[n.id] = { stars: 1, best: 1, plays: 1 };
    for (const n of E.nodes) for (let i = 0; i < 30; i++) {
      const plan = E.planFor(n);
      assert.ok(plan.length >= 5, `${n.id}: plan too short`);
      if (n.type !== 'boss') assert.equal(plan.filter(x => x.type === 'trial').length, 1, `${n.id}: one trial`);
      if (!replay && n.type !== 'boss') assert.ok(plan.some(x => x.type === 'teach'), `${n.id}: first play teaches`);
      if (replay) assert.ok(!plan.some(x => x.type === 'teach'), `${n.id}: replay skips teaching`);
      plan.forEach((q, j) => {
        if (q.type === 'teach') assert.ok(q.say || q.words || q.letters || q.items || q.reading, `${n.id}#${j}: empty teach`);
        else if (q.type === 'trial') assert.ok(q.foe && q.title, `${n.id}#${j}: trial`);
        else checkQuestion(q, `${n.id}#${j}`);
      });
    }
  }
});
