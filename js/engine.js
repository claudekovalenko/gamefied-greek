// Core engine: saved state, XP/levels, streaks, spaced repetition and the
// question generators for every kind of lesson. No DOM code lives here.
window.KG = window.KG || {};

(function () {
  'use strict';

  // ── utilities ───────────────────────────────────────────────
  const U = KG.util = {
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample(a, n) { return U.shuffle(a).slice(0, n); },
    pick(a) { return a[Math.floor(Math.random() * a.length)]; },
    uniq(a) { return [...new Set(a)]; },
    esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    day(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return U.day(new Date(y, m - 1, d + n)); },
    diffDays(a, b) {
      const p = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
      return Math.round((p(b) - p(a)) / 86400000);
    },
    // strip accents/breathings for lenient matching and for speech
    bare(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').toLowerCase(); },
  };
  const { shuffle, sample, uniq } = U;
  const gk = s => `<span class="gk">${U.esc(s)}</span>`;

  // ── state ───────────────────────────────────────────────────
  const STORE = 'koine-quest-v1';
  function defaults() {
    return {
      v: 1, xp: 0, coins: 25, streak: 0, bestStreak: 0, lastDay: null, freezes: 0, boost: 0, dailyGoal: 50,
      history: {}, lessons: {}, vocab: {}, ach: {}, arcade: {}, mistakes: [],
      stats: { answered: 0, correct: 0, perfect: 0, bosses: 0, verses: 0, bestCombo: 0, lessons: 0, reviews: 0, goals: 0 },
      settings: { sound: true, speech: true, unlockAll: false },
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const d = defaults(), s = JSON.parse(raw);
        return Object.assign(d, s, { stats: Object.assign(d.stats, s.stats), settings: Object.assign(d.settings, s.settings) });
      }
    } catch (e) { /* storage unavailable: start fresh */ }
    return defaults();
  }
  const E = KG.engine = { state: load(), listeners: [] };
  E.save = () => { try { localStorage.setItem(STORE, JSON.stringify(E.state)); } catch (e) { /* ignore */ } };
  E.reset = () => { E.state = defaults(); E.save(); };
  E.importState = json => { const d = defaults(), s = JSON.parse(json); if (typeof s.xp !== 'number') throw new Error('Not a Koine Quest backup'); E.state = Object.assign(d, s); E.save(); };
  E.on = fn => E.listeners.push(fn);
  const emit = (type, data) => E.listeners.forEach(fn => fn(type, data));

  // ── curriculum index ────────────────────────────────────────
  E.nodes = [];
  KG.units.forEach((u, ui) => u.nodes.forEach(n => {
    n.unit = ui;
    if (!n.title) {
      if (n.type === 'alpha') n.title = KG.alphaGroups[n.group].title;
      else if (n.type === 'vocab') n.title = `Vocabulary ${n.set + 1}`;
      else if (n.type === 'grammar') n.title = KG.grammar[n.lesson].title;
      else if (n.type === 'reading') n.title = KG.readings[n.reading].ref;
      else if (n.type === 'boss') n.title = `Boss: ${u.title}`;
    }
    n.index = E.nodes.length;
    E.nodes.push(n);
  }));
  E.node = id => E.nodes.find(n => n.id === id);
  E.stars = id => (E.state.lessons[id] || {}).stars || 0;
  E.unlocked = n => E.state.settings.unlockAll || n.index === 0 || E.stars(E.nodes[n.index - 1].id) > 0;
  E.unitDone = uid => KG.units.find(u => u.id === uid).nodes.every(n => E.stars(n.id) > 0);
  E.nextNode = () => E.nodes.find(n => E.unlocked(n) && !E.stars(n.id)) || null;

  // ── levels ──────────────────────────────────────────────────
  E.xpFor = L => 40 * (L - 1) * L;
  E.levelInfo = (xp = E.state.xp) => {
    let L = 1; while (xp >= E.xpFor(L + 1)) L++;
    const title = KG.levelTitles.filter(t => t[0] <= L).pop()[1];
    return { level: L, title, cur: xp - E.xpFor(L), need: E.xpFor(L + 1) - E.xpFor(L) };
  };

  // ── streaks & XP ────────────────────────────────────────────
  E.checkStreak = () => {
    const S = E.state, t = U.day();
    if (!S.lastDay) return null;
    const gap = U.diffDays(S.lastDay, t);
    if (gap <= 1) return null;
    const missed = gap - 1;
    let msg;
    if (S.streak > 0 && S.freezes >= missed) {
      S.freezes -= missed; S.lastDay = U.addDays(t, -1);
      msg = `🧊 Streak freeze used. Your ${S.streak}-day streak is safe!`;
    } else if (S.streak > 0) {
      msg = `Your ${S.streak}-day streak ended. Start a new one today!`;
      S.streak = 0;
    }
    E.save();
    return msg;
  };
  E.todayXP = () => E.state.history[U.day()] || 0;

  E.gainXP = (n, coins = 0) => {
    const S = E.state, t = U.day();
    if (S.lastDay !== t) {
      S.streak = S.lastDay && U.diffDays(S.lastDay, t) === 1 ? S.streak + 1 : 1;
      S.lastDay = t;
      S.bestStreak = Math.max(S.bestStreak, S.streak);
      emit('streak', S.streak);
    }
    const lvBefore = E.levelInfo().level, goalBefore = E.todayXP() >= S.dailyGoal;
    S.xp += n; S.coins += coins;
    S.history[t] = (S.history[t] || 0) + n;
    if (!goalBefore && E.todayXP() >= S.dailyGoal) { S.coins += 10; S.stats.goals++; emit('goal'); }
    const lv = E.levelInfo();
    if (lv.level > lvBefore) { S.coins += 20; emit('level', lv); }
    E.save();
    E.checkAchievements();
  };

  // ── achievements ────────────────────────────────────────────
  const helpers = {
    unitDone: E.unitDone, level: () => E.levelInfo().level,
    wordsStudied: () => Object.keys(E.state.vocab).length,
    wordsMastered: () => Object.values(E.state.vocab).filter(v => v.box >= 4).length,
    coverage: () => E.coverage(),
  };
  E.helpers = helpers;
  E.checkAchievements = () => {
    for (const a of KG.achievements) {
      if (!E.state.ach[a.id] && a.test(E.state, helpers)) {
        E.state.ach[a.id] = U.day(); E.state.coins += 15; E.save();
        emit('achievement', a);
      }
    }
  };

  // ── spaced repetition (Leitner boxes) ───────────────────────
  // Box 1 → review tomorrow; each correct review moves the card up one box and
  // roughly doubles the gap. A miss sends it back to box 1.
  const INTERVALS = [0, 1, 2, 4, 8, 16, 35, 75];
  E.vocabByGreek = Object.fromEntries(KG.vocab.map(w => [w.g, w]));
  // Words added from the Reading Room live in state.custom and join the same deck.
  E.word = g => E.vocabByGreek[g] || ((E.state.custom || {})[g] && Object.assign({ g, lex: g }, E.state.custom[g]));
  E.addWord = (g, en, f) => {
    if (E.vocabByGreek[g]) { if (!E.state.vocab[g]) E.srsAnswer(g, true); E.save(); return; }
    (E.state.custom || (E.state.custom = {}))[g] = { en, f, set: -1 };
    if (!E.state.vocab[g]) E.srsAnswer(g, true);
    E.save();
  };
  E.srsAnswer = (g, correct) => {
    const V = E.state.vocab, t = U.day();
    let r = V[g];
    if (!r) { V[g] = { box: 1, due: U.addDays(t, 1), seen: 1, miss: correct ? 0 : 1 }; return; }
    r.seen++;
    if (!correct) { r.box = 1; r.due = U.addDays(t, 1); r.miss++; return; }
    if (r.due <= t) { r.box = Math.min(INTERVALS.length - 1, r.box + 1); r.due = U.addDays(t, INTERVALS[r.box]); }
  };
  E.dueWords = () => {
    const t = U.day();
    return Object.entries(E.state.vocab).filter(([, r]) => r.due <= t).map(([g]) => E.word(g)).filter(Boolean);
  };
  E.weakWords = (n = 12) => Object.entries(E.state.vocab)
    .sort((a, b) => (a[1].box - b[1].box) || (b[1].miss - a[1].miss))
    .slice(0, n).map(([g]) => E.word(g)).filter(Boolean);
  E.coverage = () => Object.keys(E.state.vocab).reduce((sum, g) => sum + ((E.vocabByGreek[g] || {}).f || 0), 0) / KG.NT_WORD_COUNT;
  E.masteredCoverage = () => Object.entries(E.state.vocab).filter(([, r]) => r.box >= 4)
    .reduce((sum, [g]) => sum + ((E.vocabByGreek[g] || {}).f || 0), 0) / KG.NT_WORD_COUNT;

  // ── the whole Greek NT (SBLGNT + MorphGNT), loaded book by book ──
  const NT = E.nt = { books: null, lex: null, cache: {}, en: {} };
  const getJSON = url => fetch(url).then(r => { if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`); return r.json(); });
  NT.ready = () => Promise.all([
    NT.books || getJSON('data/nt/books.json').then(d => (NT.books = d.books)),
    NT.lex || getJSON('data/nt/lexicon.json').then(d => (NT.lex = d)),
  ]);
  NT.book = b => NT.cache[b] || (NT.cache[b] = getJSON(`data/nt/${b}.json`));
  NT.english = b => NT.en[b] || (NT.en[b] = getJSON(`data/nt/en/${b}.json`).catch(() => null));
  const ALIASES = {
    mt: 'Mt', matt: 'Mt', matthew: 'Mt', mk: 'Mk', mark: 'Mk', mrk: 'Mk', lk: 'Lk', luke: 'Lk', jn: 'Jn', john: 'Jn', jhn: 'Jn',
    ac: 'Ac', acts: 'Ac', ro: 'Ro', rom: 'Ro', romans: 'Ro', '1co': '1Co', '1cor': '1Co', '1corinthians': '1Co', '2co': '2Co', '2cor': '2Co', '2corinthians': '2Co',
    ga: 'Ga', gal: 'Ga', galatians: 'Ga', eph: 'Eph', ephesians: 'Eph', php: 'Php', phil: 'Php', philippians: 'Php', col: 'Col', colossians: 'Col',
    '1th': '1Th', '1thess': '1Th', '1thessalonians': '1Th', '2th': '2Th', '2thess': '2Th', '2thessalonians': '2Th', '1ti': '1Ti', '1tim': '1Ti', '1timothy': '1Ti',
    '2ti': '2Ti', '2tim': '2Ti', '2timothy': '2Ti', tit: 'Tit', titus: 'Tit', phm: 'Phm', philem: 'Phm', philemon: 'Phm', heb: 'Heb', hebrews: 'Heb',
    jas: 'Jas', jam: 'Jas', james: 'Jas', '1pe': '1Pe', '1pet': '1Pe', '1peter': '1Pe', '2pe': '2Pe', '2pet': '2Pe', '2peter': '2Pe',
    '1jn': '1Jn', '1john': '1Jn', '2jn': '2Jn', '2john': '2Jn', '3jn': '3Jn', '3john': '3Jn', jud: 'Jud', jude: 'Jud', re: 'Re', rev: 'Re', revelation: 'Re',
  };
  // "John 3:16-18", "Jn 3", "1 Cor 13:4–7", "Rom 8:28-9:2" → { b, c1, v1, c2, v2 } (verse 0 = whole chapter)
  NT.parseRef = str => {
    const m = String(str).trim().match(/^([1-3]?\s*[A-Za-z]+)\.?\s*(\d+)(?:[:.](\d+))?(?:\s*[-–]\s*(\d+)(?:[:.](\d+))?)?$/);
    if (!m) return null;
    const b = ALIASES[m[1].replace(/\s+/g, '').toLowerCase()];
    if (!b) return null;
    const c1 = +m[2], v1 = m[3] ? +m[3] : 0;
    let c2 = c1, v2 = v1;
    if (m[4] && m[5]) { c2 = +m[4]; v2 = +m[5]; } else if (m[4]) { if (v1) v2 = +m[4]; else { c2 = +m[4]; v2 = 0; } }
    return { b, c1, v1, c2, v2 };
  };
  NT.refName = r => {
    const name = (NT.books || []).find(x => x.b === r.b)?.name || r.b;
    if (!r.v1) return `${name} ${r.c1}${r.c2 !== r.c1 ? '–' + r.c2 : ''}`;
    if (r.c1 === r.c2) return `${name} ${r.c1}:${r.v1}${r.v2 !== r.v1 ? '–' + r.v2 : ''}`;
    return `${name} ${r.c1}:${r.v1}–${r.c2}:${r.v2}`;
  };
  // Returns [{ c, v, words: [{ t, li, code }] }] for a parsed reference
  NT.passage = async r => {
    await NT.ready();
    const bk = await NT.book(r.b), out = [];
    for (let c = r.c1; c <= r.c2; c++) {
      const vs = bk.ch[c - 1]; if (!vs) continue;
      const from = c === r.c1 && r.v1 ? r.v1 : 1, to = c === r.c2 && r.v2 ? r.v2 : vs.length;
      for (let v = from; v <= Math.min(to, vs.length); v++) out.push({ c, v, words: vs[v - 1].map(([t, li, code]) => ({ t, li, code })) });
    }
    return out;
  };
  // MorphGNT codes → readable parsing, e.g. "V-AAI3S" → "Verb — aorist active indicative 3rd singular"
  const POS = { 'A-': 'Adjective', 'C-': 'Conjunction', 'D-': 'Adverb', 'I-': 'Interjection', 'N-': 'Noun', 'P-': 'Preposition', 'RA': 'Article', 'RD': 'Demonstrative pronoun', 'RI': 'Interrogative/indefinite pronoun', 'RP': 'Personal pronoun', 'RR': 'Relative pronoun', 'V-': 'Verb', 'X-': 'Particle' };
  const F = [
    { 1: '1st', 2: '2nd', 3: '3rd' }, { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', X: 'perfect', Y: 'pluperfect' },
    { A: 'active', M: 'middle', P: 'passive' }, { I: 'indicative', D: 'imperative', S: 'subjunctive', O: 'optative', N: 'infinitive', P: 'participle' },
    { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' }, { S: 'singular', P: 'plural' }, { M: 'masculine', F: 'feminine', N: 'neuter' }, { C: 'comparative', S: 'superlative' },
  ];
  NT.decode = code => {
    code = code.padEnd(10, '-');
    const pos = POS[code.slice(0, 2)] || 'Word', p = code.slice(2);
    let parts;
    if (code[0] === 'V') {
      // tense voice mood, then person+number (finite) or case number gender (participle)
      parts = [F[1][p[1]], F[2][p[2]], F[3][p[3]]];
      if (p[0] !== '-') parts.push(F[0][p[0]] + ' ' + (F[5][p[5]] || ''));
      else parts.push(F[4][p[4]], F[5][p[5]], F[6][p[6]]);
    } else parts = [F[4][p[4]], F[5][p[5]], F[6][p[6]], F[7][p[7]], p[0] !== '-' && !p[4].match(/[NGDAV]/) ? F[0][p[0]] + ' person' : ''];
    const det = parts.filter(Boolean).join(' ').trim();
    return det ? `${pos} — ${det}` : pos;
  };
  NT.gloss = li => { const L = NT.lex[li], v = E.vocabByGreek[L[0]]; return v ? v.en : (L[1] || '—'); };

  // ── mistakes notebook ───────────────────────────────────────
  E.logMistake = q => {
    if (q.type !== 'mc' || q.noLog) return;
    const M = E.state.mistakes, key = q.prompt + '|' + (q.big || '');
    if (M.some(m => m.key === key)) return;
    M.unshift({ key, prompt: q.prompt, big: q.big || '', options: q.options, answer: q.answer, greekOpts: !!q.greekOpts, explain: q.explain || '', speak: q.speak || '', vkey: q.vkey || '' });
    if (M.length > 40) M.pop();
  };
  E.clearMistake = q => { E.state.mistakes = E.state.mistakes.filter(m => m.key !== q.prompt + '|' + (q.big || '')); };

  // ── question builders ───────────────────────────────────────
  // mc(prompt, correct, wrongs, extra) → shuffled multiple choice with exactly one right answer
  function mc(prompt, correct, wrongs, extra = {}) {
    const options = shuffle(uniq([correct, ...wrongs.filter(w => w !== correct)]).slice(0, 4));
    if (!options.includes(correct)) options[0] = correct;
    const opts = shuffle(options);
    return Object.assign({ type: 'mc', prompt, options: opts, answer: opts.indexOf(correct) }, extra);
  }
  const others = (correct, pool, n = 3) => sample(uniq(pool).filter(x => x !== correct), n);
  E.mc = mc;

  // Alphabet
  function letterQs(letters, pool) {
    const qs = [];
    for (const L of letters) {
      const kinds = shuffle(['name', 'glyph', 'sound', 'upper']).slice(0, 2);
      for (const k of kinds) {
        if (k === 'name') qs.push(mc('What is this letter called?', L.name, others(L.name, pool.map(x => x.name)), { big: L.l, explain: `${L.U} ${L.l} is <b>${L.name}</b>: ${L.say}.` }));
        if (k === 'glyph') qs.push(mc(`Tap the letter <b>${L.name}</b>`, L.l, others(L.l, pool.map(x => x.l)), { greekOpts: true, explain: `${L.name} = ${L.U} ${L.l}` }));
        if (k === 'sound') qs.push(mc('What sound does this letter make?', L.tr, others(L.tr, pool.map(x => x.tr)), { big: L.l, explain: `${L.l} (${L.name}) sounds like ${L.say}.` }));
        if (k === 'upper') qs.push(mc('Which lowercase letter matches this capital?', L.l, others(L.l, pool.map(x => x.l)), { big: L.U, greekOpts: true, explain: `${L.U} is the capital of ${L.l} (${L.name}).` }));
      }
    }
    return qs;
  }
  function alphaQuestions(group) {
    const A = KG.alphabet, [a, b] = KG.alphaGroups[group].range;
    const cur = A.slice(a, b), pool = A.slice(0, b), prev = A.slice(0, a);
    let qs = sample(letterQs(cur, pool), 10);
    if (prev.length) qs = qs.concat(sample(letterQs(sample(prev, 2), pool), 2));
    qs.push({ type: 'match', prompt: 'Match each letter to its name', pairs: sample(cur, 5).map(L => [L.l, L.name]), greekLeft: true });
    return shuffle(qs);
  }
  function marksQuestions() {
    const D = KG.diphthongs, M = KG.marks, qs = [];
    for (const d of sample(D, 4)) qs.push(mc('How is this diphthong pronounced?', d.say, others(d.say, D.map(x => x.say)), { big: d.g }));
    for (const m of sample(M, 4)) qs.push(mc('What is this mark called?', m.name, others(m.name, M.map(x => x.name)), { big: m.g, explain: m.say }));
    for (const c of sample(KG.alphaConcepts, 4)) qs.push(mc(c.q, c.a, c.w, { explain: c.ex || '' }));
    return shuffle(qs);
  }
  function readWordQuestions() {
    const W = KG.readWords, qs = [];
    for (const w of sample(W, 8)) qs.push(mc('How do you read this word?', w[1], others(w[1], W.map(x => x[1])), { big: w[0], speak: w[0], explain: `${w[0]} = <b>${w[1]}</b>, ${w[2]}` }));
    for (const w of sample(W, 4)) qs.push(mc('Sound it out. What does it mean?', w[2], others(w[2], W.map(x => x[2])), { big: w[0], speak: w[0] }));
    qs.push({ type: 'match', prompt: 'Match each word to its sound', pairs: sample(W, 5).map(w => [w[0], w[1]]), greekLeft: true });
    return shuffle(qs);
  }

  // Vocabulary
  E.vocabSet = i => KG.vocab.filter(w => w.set === i);
  function vocabQ(w, pool, dir) {
    const explain = `${gk(w.lex)}: <b>${U.esc(w.en)}</b> <span class="muted">(≈${w.f}× in the NT)</span>`;
    if (dir === 'e2g') return mc(`Which word means "<b>${U.esc(w.en)}</b>"?`, w.g, others(w.g, pool.map(x => x.g)), { greekOpts: true, vkey: w.g, explain, speak: w.g });
    return mc('What does this word mean?', w.en, others(w.en, pool.map(x => x.en)), { big: w.g, sub: w.lex !== w.g ? w.lex : '', vkey: w.g, speak: w.g, explain });
  }
  E.vocabQuestions = (words, pool = KG.vocab, n = 12) => {
    const near = pool.length > 20 ? pool : KG.vocab;
    let qs = [];
    for (const w of shuffle(words)) qs.push(vocabQ(w, near, 'g2e'));
    for (const w of sample(words, Math.max(0, n - words.length - 1))) qs.push(vocabQ(w, near, 'e2g'));
    const hasMatch = words.length >= 4;
    qs = shuffle(qs).slice(0, hasMatch ? n - 1 : n);
    if (hasMatch) qs.splice(Math.floor(qs.length / 2), 0, { type: 'match', prompt: 'Match the pairs', pairs: sample(words, Math.min(5, words.length)).map(w => [w.g, w.en]), greekLeft: true });
    return qs;
  };
  function vocabLessonQuestions(set) {
    const words = E.vocabSet(set);
    const pool = KG.vocab.slice(Math.max(0, set * 10 - 30), set * 10 + 20);
    const qs = E.vocabQuestions(words, pool, 12);
    // interleave two earlier words for spaced retrieval
    if (set > 0) for (const w of sample(KG.vocab.slice(0, set * 10), 2)) qs.push(vocabQ(w, pool, 'g2e'));
    return qs;
  }

  // Paradigms → parse / produce questions
  function cells(lesson) {
    const out = [];
    for (const p of lesson.paradigms || []) {
      p.rows.forEach((r, ri) => p.cols.forEach((c, ci) => {
        const form = p.forms[ri][ci];
        if (form) out.push({ form, label: [r, c, p.tag].filter(Boolean).join(' '), lemma: p.lemma, title: p.title });
      }));
    }
    return out;
  }
  E.cells = cells;
  E.parseQ = (cell, all) => {
    const correctLabels = all.filter(c => c.form === cell.form).map(c => c.label);
    const wrong = uniq(all.map(c => c.label)).filter(l => !correctLabels.includes(l));
    const also = correctLabels.length > 1 ? `<br><span class="muted">Also possible: ${correctLabels.filter(l => l !== cell.label).join('; ')}. Context decides!</span>` : '';
    return mc(`Parse this form <span class="muted">(${U.esc(cell.lemma)})</span>`, cell.label, sample(wrong, 3),
      { big: cell.form, explain: `${gk(cell.form)} = <b>${cell.label}</b> of ${gk(cell.lemma)}${also}` });
  };
  E.produceQ = (cell, all) => {
    const same = all.filter(c => c.lemma === cell.lemma && c.title === cell.title);
    const wrong = uniq(same.concat(all).map(c => c.form)).filter(f => f !== cell.form && !all.some(c => c.form === f && c.label === cell.label && c.lemma === cell.lemma));
    return mc(`Which form is the <b>${cell.label}</b> of ${gk(cell.lemma)}?`, cell.form, sample(wrong.slice(0, 12), 3),
      { greekOpts: true, explain: `${cell.label} of ${gk(cell.lemma)} = ${gk(cell.form)} <span class="muted">(${U.esc(cell.title)})</span>` });
  };
  function grammarQuestions(key, n = 12) {
    const L = KG.grammar[key], all = cells(L), qs = [];
    const phrases = L.phrases || [], concepts = L.concepts || [];
    const nPar = all.length ? 6 : 0, nPh = Math.min(phrases.length, all.length ? 3 : 5);
    const nCon = Math.max(3, n - nPar - nPh);
    for (const c of sample(concepts, nCon)) qs.push(mc(c.q, c.a, c.w, { explain: c.ex || '' }));
    const picks = sample(all, nPar);
    picks.forEach((c, i) => qs.push(i % 2 ? E.produceQ(c, all) : E.parseQ(c, all)));
    for (const [g, en] of sample(phrases, nPh)) qs.push(mc('Translate:', en, others(en, phrases.map(p => p[1])), { big: g, speak: g, explain: `${gk(g)} = <b>${U.esc(en)}</b>` }));
    if (phrases.length >= 4) {
      const [g, en] = U.pick(phrases);
      qs.push(mc(`How do you say "<b>${U.esc(en)}</b>"?`, g, others(g, phrases.map(p => p[0])), { greekOpts: true, speak: g }));
    }
    return shuffle(qs).slice(0, n);
  }

  // Readings
  const allReadingWords = () => Object.values(KG.readings).flatMap(r => r.words);
  function readingQuestions(id) {
    const R = KG.readings[id], words = R.words, pool = allReadingWords(), qs = [];
    const content = uniq(words.filter(w => !['Article', 'Conjunction', 'Particle'].includes(w.pos)).map(w => w.w))
      .map(s => words.find(w => w.w === s));
    for (const w of sample(content, Math.min(5, content.length))) {
      qs.push(mc(`In <b>${R.ref}</b>, what does this word mean?`, w.gloss, others(w.gloss, pool.map(x => x.gloss)),
        { big: w.w, speak: w.w, explain: `${gk(w.w)} (from ${gk(w.lemma)}): <b>${U.esc(w.gloss)}</b><br><span class="muted">${U.esc(w.parse)}</span>` }));
    }
    const infl = uniq(words.filter(w => w.inflected && w.pos !== 'Article').map(w => w.w)).map(s => words.find(w => w.w === s));
    for (const w of sample(infl, Math.min(3, infl.length))) {
      const same = pool.filter(x => x.pos === w.pos && x.parse !== w.parse).map(x => x.parse);
      qs.push(mc('Parse this word', w.parse, others(w.parse, same), { big: w.w, explain: `${gk(w.w)} from ${gk(w.lemma)} "${U.esc(w.gloss)}"` }));
    }
    const out = shuffle(qs);
    out.push({ type: 'order', prompt: 'Build the translation', reading: id, chunks: R.chunks, extras: R.extras || [] });
    out.push({ type: 'free', prompt: 'Now translate it in your own words', reading: id });
    return out;
  }

  // Boss: an interleaved mix of everything in the unit, with 3 hearts
  function bossQuestions(unitIndex) {
    const nodes = KG.units[unitIndex].nodes.filter(n => n.type !== 'boss');
    let qs = [];
    for (const n of nodes) qs = qs.concat(sample(E.questionsFor(n).filter(q => q.type === 'mc'), 3));
    return sample(qs, 15);
  }

  E.questionsFor = node => {
    switch (node.type) {
      case 'alpha': return alphaQuestions(node.group);
      case 'marks': return marksQuestions();
      case 'readwords': return readWordQuestions();
      case 'vocab': return vocabLessonQuestions(node.set);
      case 'grammar': return grammarQuestions(node.lesson);
      case 'reading': return readingQuestions(node.reading);
      case 'boss': return bossQuestions(node.unit);
    }
    return [];
  };

  // ── lesson plans: teach → guided try → trial ────────────────
  // First play of a lesson interleaves short teaching beats with a guided
  // question each (a miss just retries, no penalty), then a short trial
  // against a challenger. Replays go straight to a slightly longer trial.
  const FOES = [
    ['dummy', 'The Training Dummy', 'Knock the stuffing out of it with right answers!'],
    ['imp', 'A Living Book', 'A spellbook has come alive and flaps at you!'],
    ['rival', 'Kleon, the Rival Apprentice', '"You call that Greek?" Prove him wrong!'],
    ['shade', 'A Shade of Forgetting', 'It feeds on forgotten words. Remember them!'],
  ];
  const teach = o => Object.assign({ type: 'teach' }, o);
  const guided = q => Object.assign(q, { guided: true, noLog: true });
  function trial(node, kindHint) {
    const f = kindHint ? FOES.find(x => x[0] === kindHint) : FOES[node.index % FOES.length];
    return { type: 'trial', foe: f[0], title: f[1], say: f[2] };
  }
  const chunks = (a, sizes) => { const out = []; let i = 0; for (const n of sizes) { if (i < a.length) out.push(a.slice(i, i + n)); i += n; } if (i < a.length) out.push(a.slice(i)); return out; };
  E.planFor = node => {
    const first = !E.stars(node.id);
    const plan = [];
    if (node.type === 'grammar') {
      const T = KG.teach[node.lesson];
      if (first && T) T.beats.forEach((b, i) => {
        plan.push(teach({ say: b.say, demo: b.demo, spell: i === 0 ? T.spell : null }));
        plan.push(guided(mc(b.check.q, b.check.a, b.check.w, { explain: b.check.ex || '' })));
      });
      plan.push(trial(node));
      return plan.concat(grammarQuestions(node.lesson, first ? 8 : 10));
    }
    if (node.type === 'vocab') {
      const words = E.vocabSet(node.set), pool = KG.vocab.slice(Math.max(0, node.set * 10 - 30), node.set * 10 + 20);
      if (!first) return [trial(node)].concat(vocabLessonQuestions(node.set));
      for (const c of chunks(U.shuffle(words), [3, 3, 4])) {
        plan.push(teach({ words: c.map(w => ({ g: w.g, lex: w.lex, en: w.en, f: w.f })) }));
        for (const w of c) plan.push(guided(vocabQ(w, pool, 'g2e')));
      }
      plan.push(trial(node));
      plan.push({ type: 'match', prompt: 'Match the pairs', pairs: sample(words, 5).map(w => [w.g, w.en]), greekLeft: true });
      for (const w of sample(words, 5)) plan.push(vocabQ(w, pool, 'e2g'));
      if (node.set > 0) for (const w of sample(KG.vocab.slice(0, node.set * 10), 2)) plan.push(vocabQ(w, pool, 'g2e'));
      return plan;
    }
    if (node.type === 'alpha') {
      const A = KG.alphabet, [a, b] = KG.alphaGroups[node.group].range, cur = A.slice(a, b), pool = A.slice(0, b);
      if (!first) return [trial(node)].concat(alphaQuestions(node.group));
      for (const c of chunks(cur, [3, 3, 2])) {
        plan.push(teach({ letters: c.map(L => ({ U: L.U, l: L.l, name: L.name, say: L.say })) }));
        for (const L of c) plan.push(guided(mc('What is this letter called?', L.name, sample(pool.filter(x => x !== L), 3).map(x => x.name), { big: L.l, explain: `${L.U} ${L.l} is <b>${L.name}</b>: ${L.say}.` })));
      }
      plan.push(trial(node, 'dummy'));
      return plan.concat(sample(letterQs(cur, pool), 6), [{ type: 'match', prompt: 'Match each letter to its name', pairs: sample(cur, 5).map(L => [L.l, L.name]), greekLeft: true }]);
    }
    if (node.type === 'marks') {
      if (first) {
        plan.push(teach({ items: KG.diphthongs.map(d => ({ big: d.g, name: d.tr, say: d.say })), say: 'Two vowels, one sound: these are <b>diphthongs</b>.' }));
        for (const d of sample(KG.diphthongs, 2)) plan.push(guided(mc('How is this diphthong pronounced?', d.say, KG.diphthongs.filter(x => x !== d).slice(0, 3).map(x => x.say), { big: d.g })));
        plan.push(teach({ items: KG.marks.map(m => ({ big: m.g, name: m.name, say: m.say })), say: 'Small marks with big jobs: breathings, accents and punctuation.' }));
        for (const m of sample(KG.marks, 2)) plan.push(guided(mc('What is this mark called?', m.name, KG.marks.filter(x => x !== m).slice(0, 3).map(x => x.name), { big: m.g, explain: m.say })));
      }
      plan.push(trial(node));
      return plan.concat(marksQuestions().slice(0, first ? 6 : 10));
    }
    if (node.type === 'readwords') {
      if (first) plan.push(teach({ say: 'Put the letters together and sound each word out. Many of them gave us English words!', items: KG.readWords.slice(0, 6).map(w => ({ big: w[0], name: w[1], say: w[2] })) }));
      plan.push(trial(node));
      return plan.concat(readWordQuestions().slice(0, first ? 8 : 12));
    }
    if (node.type === 'reading') {
      if (first) plan.push(teach({ reading: node.reading, say: 'Read the verse aloud first. Tap any word you don\'t know.' }));
      plan.push(trial(node, 'imp'));
      return plan.concat(readingQuestions(node.reading));
    }
    return E.questionsFor(node);
  };

  // Questions drawn from everything the learner has unlocked (arcade "Parse Rush")
  E.unlockedCells = () => {
    const keys = E.nodes.filter(n => n.type === 'grammar' && E.stars(n.id) > 0).map(n => n.lesson);
    const ks = keys.length ? keys : ['article', 'n2m'];
    return ks.flatMap(k => cells(KG.grammar[k]));
  };

  // ── finishing a lesson ──────────────────────────────────────
  // Returns a summary used by the results screen.
  E.finishLesson = (node, res) => {
    const S = E.state, rec = S.lessons[node.id] || (S.lessons[node.id] = { stars: 0, best: 0, plays: 0 });
    const graded = res.correct + res.wrong, acc = graded ? res.correct / graded : 1;
    const perfect = res.wrong === 0;
    const passed = node.type === 'boss' ? res.hearts > 0 : acc >= 0.7;
    const firstClear = passed && rec.stars === 0;
    rec.plays++; rec.best = Math.max(rec.best, acc);
    if (passed) rec.stars = Math.min(3, rec.stars + (perfect && rec.stars === 0 ? 2 : 1));
    let bonus = passed ? 20 : 5;
    if (perfect && passed) { bonus += 20; S.stats.perfect++; }
    if (node.type === 'boss' && passed) { bonus += 50; if (firstClear) S.stats.bosses++; }
    if (node.type === 'reading' && firstClear) S.stats.verses++;
    if (node.type === 'vocab') for (const w of E.vocabSet(node.set)) if (!S.vocab[w.g]) E.srsAnswer(w.g, true);
    let spell = null;
    if (node.type === 'grammar' && passed && KG.teach && KG.teach[node.lesson]) {
      S.spells = S.spells || {};
      if (!S.spells[node.lesson]) { S.spells[node.lesson] = U.day(); spell = KG.teach[node.lesson].spell; }
    }
    let xp = res.xp + bonus;
    const boosted = S.boost > 0;
    if (boosted) { xp *= 2; S.boost--; }
    const coins = (passed ? 5 : 1) + (perfect && passed ? 5 : 0) + (node.type === 'boss' && passed ? 20 : 0);
    S.stats.lessons++;
    S.stats.bestCombo = Math.max(S.stats.bestCombo, res.maxCombo);
    E.gainXP(xp, coins);
    return { xp, coins, acc, perfect, passed, stars: rec.stars, firstClear, boosted, spell };
  };

  E.recordAnswer = (q, correct, isReview) => {
    const S = E.state;
    S.stats.answered++; if (correct) S.stats.correct++;
    if (isReview) S.stats.reviews++;
    if (q.vkey) E.srsAnswer(q.vkey, correct);
    if (!correct) E.logMistake(q); else if (isReview) E.clearMistake(q);
    E.save();
  };

  E.buy = item => {
    const S = E.state, price = { freeze: 50, boost: 80 }[item];
    if (S.coins < price) return false;
    if (item === 'freeze' && S.freezes >= 2) return false;
    S.coins -= price;
    if (item === 'freeze') S.freezes++;
    if (item === 'boost') S.boost += 3;
    E.save();
    return true;
  };
})();
