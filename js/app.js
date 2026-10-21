// UI: screens, lesson player, arcade and effects.
(function () {
  'use strict';
  const E = KG.engine, U = KG.util;
  const { esc, shuffle, sample } = U;
  const $ = (s, el = document) => el.querySelector(s);
  const S = () => E.state;
  const gk = s => `<span class="gk">${esc(s)}</span>`;
  const main = $('#main');

  // ── effects ─────────────────────────────────────────────────
  let actx;
  function tone(freq, start, dur, type = 'sine', vol = 0.12) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(g).connect(actx.destination);
    o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.05);
  }
  function sfx(kind) {
    if (!S().settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (kind === 'good') { tone(660, 0, 0.12); tone(990, 0.08, 0.18); }
      else if (kind === 'bad') { tone(180, 0, 0.25, 'sawtooth', 0.06); }
      else if (kind === 'combo') { tone(880, 0, 0.1); tone(1175, 0.07, 0.1); tone(1568, 0.14, 0.2); }
      else if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle'));
      else if (kind === 'tap') tone(440, 0, 0.05, 'triangle', 0.05);
      else if (kind === 'level') [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle'));
    } catch (e) { /* audio unavailable */ }
  }
  // Greek voices read modern monotonic Greek, so strip breathings/extra accents first.
  function monotonic(s) {
    return s.normalize('NFD').replace(/[̓̔̈ͅ]/g, '').replace(/[̀͂]/g, '́')
      .replace(/́(?=.*́)/g, '').normalize('NFC').replace(/[’᾽]/g, '');
  }
  function speak(text) {
    if (!S().settings.speech || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text.split(' ').map(monotonic).join(' '));
      u.lang = 'el-GR'; u.rate = 0.8;
      const v = speechSynthesis.getVoices().find(v => /^el/i.test(v.lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  function toast(html, cls = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + cls; t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  function confetti(n = 120) {
    const c = document.createElement('canvas'); c.className = 'confetti';
    document.body.appendChild(c);
    const ctx = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['#e0a526', '#2f5f8f', '#3f7d5a', '#c9452b', '#8f3f9f', '#ffd166'];
    const ps = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 3, c: U.pick(cols), a: Math.random() * 6 }));
    let f = 0;
    (function step() {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.a += 0.2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
      if (++f < 110) requestAnimationFrame(step); else c.remove();
    })();
  }
  function floatXP(text, el) {
    const r = (el || main).getBoundingClientRect(), d = document.createElement('div');
    d.className = 'floatxp'; d.textContent = text;
    d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + 10) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1000);
  }

  E.on((type, data) => {
    if (type === 'level') { sfx('level'); confetti(180); toast(`⬆ <b>Level ${data.level}!</b> You are now a <b>${data.title}</b> (+20 🪙)`, 'gold'); }
    if (type === 'goal') toast('🎯 <b>Daily goal reached!</b> +10 🪙', 'gold');
    if (type === 'achievement') { toast(`${data.icon} <b>Achievement:</b> ${esc(data.name)} (+15 🪙)`, 'gold'); }
    if (type === 'streak' && data > 1) toast(`🔥 <b>${data}-day streak!</b>`);
    renderTop();
  });

  // ── top bar & nav ───────────────────────────────────────────
  function renderTop() {
    const s = S(), lv = E.levelInfo(), pct = Math.min(1, E.todayXP() / s.dailyGoal);
    $('#topbar').innerHTML = `
      <button class="chip" data-act="go" data-arg="profile" title="Daily streak">🔥 <b>${s.streak}</b></button>
      <button class="chip goal" data-act="go" data-arg="profile" title="Today's XP goal" style="--p:${pct * 360}deg"><span>${E.todayXP()}/${s.dailyGoal}</span></button>
      <button class="chip lvl" data-act="go" data-arg="profile" title="Level"><span class="lvnum">${lv.level}</span><span class="bar"><i style="width:${(lv.cur / lv.need) * 100}%"></i></span></button>
      <button class="chip" data-act="go" data-arg="profile" title="Drachmas (coins)">🪙 <b>${s.coins}</b></button>`;
  }
  let view = 'path';
  let home = 'path'; // where lessons return to: the 3D world or the path map
  const hasWorld = () => !!(KG.world && KG.world.ok);
  function go(v) {
    if (v === 'world' && !hasWorld()) v = 'path';
    view = v; location.hash = v;
    if (v === 'world' || v === 'path') home = v;
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.arg === v));
    document.body.classList.remove('playing');
    document.body.classList.toggle('in-world', v === 'world');
    if (v === 'world') { closeSheet(); main.innerHTML = ''; KG.world.show(); renderTop(); return; }
    if (hasWorld()) KG.world.hide();
    ({ path: renderPath, review: renderReview, arcade: renderArcade, codex: renderCodex, profile: renderProfile }[v] || renderPath)();
    main.scrollTop = 0; window.scrollTo(0, 0);
    renderTop();
  }

  // ── path ────────────────────────────────────────────────────
  const typeLabel = { alpha: 'Alphabet', marks: 'Alphabet', readwords: 'Reading practice', vocab: 'Vocabulary', grammar: 'Grammar', reading: 'NT Reading', boss: 'Boss battle' };
  function nodeIcon(n) {
    if (n.type === 'alpha') return KG.alphabet[KG.alphaGroups[n.group].range[0]].U;
    if (n.type === 'marks') return 'ἁ';
    if (n.type === 'readwords') return 'Aa';
    if (n.type === 'vocab') return '📜';
    if (n.type === 'grammar') return KG.grammar[n.lesson].icon;
    if (n.type === 'reading') return '✝';
    if (n.type === 'boss') return '⚔';
    return '•';
  }
  const starStr = k => '★'.repeat(k) + '☆'.repeat(3 - k);
  function renderPath() {
    const next = E.nextNode();
    let html = '';
    if (next) {
      html += `<button class="hero" data-act="open" data-arg="${next.id}">
        <div class="hero-k">${E.stars(E.nodes[0].id) ? 'Continue your journey' : 'Begin your journey'}</div>
        <div class="hero-t">${esc(next.title)}</div><div class="hero-s">${typeLabel[next.type]} · Unit ${next.unit + 1}</div><span class="hero-go">▶</span></button>`;
    } else html += `<div class="hero done"><div class="hero-t">🏆 Path complete!</div><div class="hero-s">Keep your words fresh in Review and keep reading.</div></div>`;
    KG.units.forEach((u, ui) => {
      const done = u.nodes.filter(n => E.stars(n.id) > 0).length;
      html += `<section class="unit" style="--uc:${u.color}">
        <header class="unit-h"><div><div class="unit-n">Unit ${ui + 1}</div><h2>${esc(u.title)}</h2><p>${esc(u.sub)}</p></div>
        <div class="unit-p">${done}/${u.nodes.length}</div></header><div class="trail">`;
      u.nodes.forEach((n, i) => {
        const lock = !E.unlocked(n), st = E.stars(n.id), cur = next && next.id === n.id;
        const off = Math.round(Math.sin(i * 0.9) * 70);
        html += `<div class="stop" style="--off:${off}px">
          <button class="node ${n.type} ${lock ? 'locked' : ''} ${st ? 'done' : ''} ${cur ? 'current' : ''}" data-act="open" data-arg="${n.id}" aria-label="${esc(n.title)}">
            <span class="ic">${lock ? '🔒' : nodeIcon(n)}</span></button>
          <div class="node-l">${esc(n.title)}</div>${st ? `<div class="stars">${starStr(st)}</div>` : ''}${cur ? '<div class="bubble">START</div>' : ''}</div>`;
      });
      html += '</div></section>';
    });
    main.innerHTML = html;
    const cur = $('.node.current');
    if (cur && E.stars(E.nodes[0].id)) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  }

  function describe(n) {
    if (n.type === 'vocab') { const w = E.vocabSet(n.set); return `10 high-frequency words: ${w.slice(0, 5).map(x => gk(x.g)).join(', ')}…`; }
    if (n.type === 'grammar') return `Learn the concept, then drill it with parsing, recognition and translation.`;
    if (n.type === 'reading') return `Read ${esc(KG.readings[n.reading].ref)} in the original Greek: every word explained, then translate it yourself.`;
    if (n.type === 'boss') return `15 mixed questions from this whole unit. You have 3 hearts ❤❤❤. Lose them all and the boss wins!`;
    if (n.type === 'alpha') { const [a, b] = KG.alphaGroups[n.group].range; return `Letters: ${KG.alphabet.slice(a, b).map(L => gk(L.U + L.l)).join(' ')}`; }
    if (n.type === 'marks') return 'Diphthongs, breathing marks, accents and punctuation.';
    if (n.type === 'readwords') return 'Put the letters together and sound out real NT words, many of which you already know through English!';
    return '';
  }
  function openNode(id) {
    const n = E.node(id); if (!n) return;
    const lock = !E.unlocked(n), rec = S().lessons[id];
    sheet(`<div class="sheet-ic ${n.type}">${lock ? '🔒' : nodeIcon(n)}</div>
      <div class="sheet-k">${typeLabel[n.type]} · Unit ${n.unit + 1}</div><h2>${esc(n.title)}</h2>
      <p>${describe(n)}</p>
      ${rec ? `<p class="muted">${starStr(rec.stars)} · best ${Math.round(rec.best * 100)}% · played ${rec.plays}×</p>` : ''}
      ${lock ? '<p class="lockmsg">Earn a star on the previous lesson to unlock this one.</p>' :
        `<div class="row">${n.type !== 'boss' ? `<button class="btn ghost" data-act="learn" data-arg="${id}">📖 Learn</button>` : ''}
        <button class="btn primary" data-act="start" data-arg="${id}">${rec && rec.stars ? 'Practice again' : 'Start'} ▶</button></div>`}`);
  }
  function sheet(html) {
    closeSheet();
    const d = document.createElement('div'); d.className = 'sheet-wrap';
    d.innerHTML = `<div class="sheet" role="dialog">${html}<button class="sheet-x" data-act="closeSheet" aria-label="Close">✕</button></div>`;
    d.addEventListener('click', e => { if (e.target === d) closeSheet(); });
    document.body.appendChild(d);
    requestAnimationFrame(() => d.classList.add('in'));
  }
  function closeSheet() { document.querySelectorAll('.sheet-wrap').forEach(s => s.remove()); }

  // ── learn screens ───────────────────────────────────────────
  function paradigmTable(p) {
    return `<table class="para"><caption>${esc(p.title)}</caption><tr><th></th>${p.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
      ${p.rows.map((r, i) => `<tr><th>${esc(r)}</th>${p.forms[i].map(f => `<td class="gk" data-act="say" data-arg="${esc(f)}">${esc(f)}</td>`).join('')}</tr>`).join('')}</table>`;
  }
  function verseHTML(R, cls = '') {
    return `<p class="verse ${cls}">${R.words.map((w, i) => `<span class="w" data-act="word" data-arg="${i}">${esc(w.w)}</span>${esc(w.p)}`).join(' ')}</p>`;
  }
  function learnHTML(n) {
    if (n.type === 'alpha') {
      const [a, b] = KG.alphaGroups[n.group].range;
      return `<p>Tap each card. Say the name and the sound aloud: speaking aids memory. Look for letters that resemble English ones but sound different!</p>
        <div class="letters">${KG.alphabet.slice(a, b).map(L => `<div class="letter"><div class="gk big">${L.U} ${L.l}</div><b>${L.name}</b><div class="muted">${esc(L.say)}</div></div>`).join('')}</div>`;
    }
    if (n.type === 'marks') {
      return `<h3>Diphthongs: two vowels, one sound</h3><div class="letters">${KG.diphthongs.map(d => `<div class="letter"><div class="gk big">${d.g}</div><div class="muted">${esc(d.say)}</div></div>`).join('')}</div>
        <h3>Marks</h3><div class="letters">${KG.marks.map(m => `<div class="letter"><div class="gk big">${m.g}</div><b>${esc(m.name)}</b><div class="muted">${esc(m.say)}</div></div>`).join('')}</div>
        <p class="tip">💡 Transliteration: rough breathing = h (ἁμαρτία = hamartia), γγ = ng (ἄγγελος = angelos), υ = y/u.</p>`;
    }
    if (n.type === 'readwords') return `<p>Read each word aloud before looking at the transliteration. Tap a word to hear it.</p>
      <div class="wordlist">${KG.readWords.map(w => `<div class="wl" data-act="say" data-arg="${esc(w[0])}"><span class="gk">${esc(w[0])}</span><span>${esc(w[1])}</span><span class="muted">${esc(w[2])}</span></div>`).join('')}</div>`;
    if (n.type === 'vocab') return `<p>Ten words, ordered by frequency. Read each aloud, picture its meaning, and notice English words that share its root.</p>
      <div class="cards">${E.vocabSet(n.set).map(w => `<div class="vcard" data-act="say" data-arg="${esc(w.g)}"><div class="gk big">${esc(w.g)}</div><div class="gk muted">${esc(w.lex)}</div><div class="en">${esc(w.en)}</div><div class="freq">≈${w.f}× in NT</div></div>`).join('')}</div>`;
    if (n.type === 'grammar') { const L = KG.grammar[n.lesson]; return `<div class="notes">${L.notes}</div>${(L.paradigms || []).map(paradigmTable).join('')}`; }
    if (n.type === 'reading') {
      const R = KG.readings[n.reading];
      return `<p>Tap every word to see its dictionary form, meaning and parsing. Try to understand the verse <i>before</i> you check the translation.</p>
        ${verseHTML(R, 'big')}<div id="wordinfo" class="wordinfo muted">Tap a word…</div>
        <details><summary>Show translation</summary><p>${esc(R.tr)}</p></details>
        <p class="tip">💡 ${esc(R.note)}</p>`;
    }
    return '';
  }
  let readerReading = null;
  function showLearn(id, thenStart) {
    const n = E.node(id); closeSheet();
    readerReading = n.type === 'reading' ? KG.readings[n.reading] : null;
    if (hasWorld()) KG.world.hide();
    document.body.classList.remove('in-world');
    document.body.classList.add('playing');
    main.innerHTML = `<div class="learn"><div class="learn-h"><button class="x" data-act="go" data-arg="${home}" aria-label="Close">✕</button><h2>${esc(n.title)}</h2></div>
      ${learnHTML(n)}<div class="learn-f"><button class="btn primary wide" data-act="start" data-arg="${id}">${thenStart ? 'Start practice ▶' : 'Practice now ▶'}</button></div></div>`;
    window.scrollTo(0, 0);
  }
  function wordInfo(i, box) {
    if (!readerReading) return;
    const w = readerReading.words[i], el = box || $('#wordinfo');
    document.querySelectorAll('.verse .w').forEach((x, j) => x.classList.toggle('sel', j === +i));
    if (el) el.innerHTML = `<div class="wi-top"><span class="gk big">${esc(w.w)}</span><button class="say" data-act="say" data-arg="${esc(w.w)}">🔊</button></div>
      <div>from ${gk(w.lemma)}: <b>${esc(w.gloss)}</b></div><div class="muted">${esc(w.parse)}</div>`;
    speak(w.w);
  }

  // ── lesson player ───────────────────────────────────────────
  let P = null; // current session
  let learnSeen = null; // first play of a lesson shows its Learn screen first
  function startNode(id) {
    const n = E.node(id);
    if (!E.unlocked(n)) return openNode(id);
    const rec = S().lessons[id];
    if (!rec && n.type !== 'boss' && learnSeen !== id) { learnSeen = id; return showLearn(id, true); }
    closeSheet();
    begin({ node: n, qs: E.questionsFor(n), mode: n.type === 'boss' ? 'boss' : 'lesson' });
  }
  function begin(opts) {
    if (!opts.qs.length) { toast('Nothing to practice here yet!'); return go(view); }
    P = Object.assign({ i: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, xp: 0, hearts: 3, answered: false }, opts);
    readerReading = null;
    if (hasWorld()) KG.world.hide();
    document.body.classList.remove('in-world');
    document.body.classList.add('playing');
    renderQ();
  }
  function header() {
    const pct = (P.i / P.qs.length) * 100;
    return `<div class="ph"><button class="x" data-act="quit" aria-label="Quit">✕</button>
      <div class="prog"><i style="width:${pct}%"></i></div>
      ${P.mode === 'boss' ? `<div class="hearts">${'❤'.repeat(P.hearts)}<span class="lost">${'❤'.repeat(3 - P.hearts)}</span></div>` : ''}
      <div class="combo ${P.combo >= 3 ? 'hot' : ''}">${P.combo >= 2 ? `🔥${P.combo}` : ''}</div></div>`;
  }
  function renderQ() {
    const q = P.qs[P.i]; P.answered = false; P.q = q;
    let body = '';
    if (q.type === 'mc') {
      body = `<div class="prompt">${q.prompt}</div>
        ${q.big ? `<div class="bigword"><span class="gk">${esc(q.big)}</span>${q.speak ? `<button class="say" data-act="say" data-arg="${esc(q.speak)}" aria-label="Listen">🔊</button>` : ''}</div>` : ''}
        ${q.sub ? `<div class="subword gk">${esc(q.sub)}</div>` : ''}
        <div class="opts">${q.options.map((o, i) => `<button class="opt ${q.greekOpts ? 'gk' : ''}" data-act="pick" data-arg="${i}"><span class="k">${i + 1}</span>${q.greekOpts ? esc(o) : o}</button>`).join('')}</div>`;
    } else if (q.type === 'match') {
      const L = shuffle(q.pairs.map((p, i) => ({ t: p[0], i }))), R = shuffle(q.pairs.map((p, i) => ({ t: p[1], i })));
      P.match = { sel: null, done: 0, miss: 0 };
      body = `<div class="prompt">${q.prompt}</div><div class="match">
        <div class="col">${L.map(x => `<button class="mt ${q.greekLeft ? 'gk' : ''}" data-act="mt" data-arg="L${x.i}">${esc(x.t)}</button>`).join('')}</div>
        <div class="col">${R.map(x => `<button class="mt" data-act="mt" data-arg="R${x.i}">${esc(x.t)}</button>`).join('')}</div></div>`;
    } else if (q.type === 'order') {
      const R = KG.readings[q.reading]; readerReading = R;
      P.order = { bank: shuffle(q.chunks.concat(q.extras).map((t, i) => ({ t, i }))), line: [] };
      body = `<div class="prompt">${q.prompt} <span class="muted">(${esc(R.ref)})</span></div>${verseHTML(R)}
        <div id="wordinfo" class="wordinfo small muted">Stuck? Tap a Greek word for help.</div>
        <div class="line" id="line"></div><div class="bank" id="bank"></div>`;
    } else if (q.type === 'free') {
      const R = KG.readings[q.reading]; readerReading = R;
      body = `<div class="prompt">${q.prompt} <span class="muted">(${esc(R.ref)})</span></div>${verseHTML(R, 'big')}
        <div id="wordinfo" class="wordinfo small muted">Tap a word if you need a hint.</div>
        <textarea id="freetr" rows="4" placeholder="Type your translation…"></textarea>`;
    }
    main.innerHTML = `<div class="player">${header()}<div class="qbody">${body}</div><div class="foot" id="foot">${footFor(q)}</div></div>`;
    if (q.type === 'order') renderOrder();
    if (q.type === 'mc' && q.speak && q.big && S().settings.speech) speak(q.speak);
  }
  function footFor(q) {
    if (q.type === 'order') return `<button class="btn primary wide" data-act="checkOrder" id="checkbtn" disabled>Check</button>`;
    if (q.type === 'free') return `<button class="btn primary wide" data-act="compare">Compare with a model translation</button>`;
    if (q.type === 'match') return `<div class="muted center">Tap a pair to match them</div>`;
    return `<div class="muted center">Choose an answer</div>`;
  }
  function renderOrder() {
    const o = P.order;
    $('#line').innerHTML = o.line.length ? o.line.map((c, k) => `<button class="tile" data-act="unplace" data-arg="${k}">${esc(c.t)}</button>`).join('') : '<span class="muted">Tap the pieces in order…</span>';
    $('#bank').innerHTML = o.bank.map((c, k) => `<button class="tile" data-act="place" data-arg="${k}">${esc(c.t)}</button>`).join('');
    const b = $('#checkbtn'); if (b) b.disabled = !o.line.length;
  }

  function answer(ok, q) {
    P.answered = true;
    const graded = !q.ungraded;
    if (graded) {
      E.recordAnswer(q, ok, P.mode === 'review' || P.mode === 'mistakes');
      if (ok) {
        P.correct++; P.combo++; P.maxCombo = Math.max(P.maxCombo, P.combo);
        const base = P.mode === 'review' || P.mode === 'mistakes' ? 5 : 10;
        const bonus = P.combo >= 10 ? 10 : P.combo >= 5 ? 5 : 0;
        P.xp += base + bonus;
        floatXP(`+${base + bonus} XP`, $('.prompt'));
        sfx(P.combo > 0 && P.combo % 5 === 0 ? 'combo' : 'good');
        if (P.combo > 0 && P.combo % 5 === 0) toast(`⚡ ${P.combo}× combo! Bonus XP`);
      } else {
        P.wrong++; P.combo = 0; sfx('bad');
        if (P.mode === 'boss') P.hearts--;
        // Ask a missed question once more at the end of the lesson (retrieval after a delay).
        if (P.mode !== 'boss' && !q.retry) {
          const again = Object.assign({}, P.qs[P.i], { retry: true });
          if (again.type === 'mc') { again.options = shuffle(again.options); again.answer = again.options.indexOf(q.options[q.answer]); }
          P.qs.push(again);
        }
      }
    }
    const head = ok ? U.pick(['Excellent!', 'Correct!', 'Well done!', 'Καλῶς!', 'Nice!', 'Great!']) : (q.type === 'mc' ? 'Not quite' : 'Keep practicing');
    let detail = q.explain || '';
    if (!ok && q.type === 'mc') detail = `Answer: <b class="${q.greekOpts ? 'gk' : ''}">${q.greekOpts ? esc(q.options[q.answer]) : q.options[q.answer]}</b>${detail ? '<br>' + detail : ''}`;
    const foot = $('#foot');
    foot.className = 'foot ' + (ok ? 'ok' : 'no');
    foot.innerHTML = `<div class="fb"><div class="fb-h">${ok ? '✔' : '✘'} ${head}</div>${detail ? `<div class="fb-d">${detail}</div>` : ''}</div>
      <button class="btn ${ok ? 'good' : 'bad'} wide" data-act="next" id="nextbtn">Continue</button>`;
    $('.prog i').style.width = ((P.i + 1) / P.qs.length) * 100 + '%';
    const c = $('.combo'); if (c) { c.textContent = P.combo >= 2 ? `🔥${P.combo}` : ''; c.classList.toggle('hot', P.combo >= 3); }
    const h = $('.hearts'); if (h) h.innerHTML = `${'❤'.repeat(Math.max(0, P.hearts))}<span class="lost">${'❤'.repeat(3 - Math.max(0, P.hearts))}</span>`;
    setTimeout(() => { const b = $('#nextbtn'); if (b) b.focus(); }, 30);
  }
  function next() {
    if (P.mode === 'boss' && P.hearts <= 0) return finish();
    P.i++;
    if (P.i >= P.qs.length) return finish();
    renderQ();
  }
  function finish() {
    const res = { correct: P.correct, wrong: P.wrong, xp: P.xp, maxCombo: P.maxCombo, hearts: P.hearts };
    let r, title, extra = '';
    if (P.node) {
      r = E.finishLesson(P.node, res);
      if (P.mode === 'boss') title = r.passed ? '⚔ Boss defeated!' : '💀 The boss won this time';
      else title = r.passed ? (r.perfect ? '💎 Flawless!' : 'Lesson complete!') : 'Almost there!';
      if (!r.passed) extra = `<p>${P.mode === 'boss' ? 'Review the unit\'s lessons and try again.' : 'Score 70% or more to earn a star and unlock the next lesson.'}</p>`;
      if (r.passed && r.firstClear) { const nx = E.nodes[P.node.index + 1]; if (nx) extra = `<p>🔓 Unlocked: <b>${esc(nx.title)}</b></p>`; }
    } else {
      const xp = res.xp; E.state.stats.bestCombo = Math.max(E.state.stats.bestCombo, res.maxCombo);
      E.gainXP(xp, Math.floor(res.correct / 4));
      const graded = res.correct + res.wrong;
      r = { xp, coins: Math.floor(res.correct / 4), acc: graded ? res.correct / graded : 1, passed: true, perfect: !res.wrong };
      title = P.mode === 'mistakes' ? '📝 Mistakes reviewed' : '🔁 Review complete!';
    }
    if (r.passed) { sfx('win'); confetti(r.perfect ? 200 : 110); }
    const node = P.node;
    main.innerHTML = `<div class="results">
      <h1>${title}</h1>
      ${node && r.passed ? `<div class="bigstars">${starStr(r.stars)}</div>` : ''}
      <div class="rstats">
        <div><b>+${r.xp}</b><span>XP${r.boosted ? ' (2× boost!)' : ''}</span></div>
        <div><b>${Math.round(r.acc * 100)}%</b><span>accuracy</span></div>
        <div><b>${P.maxCombo}</b><span>best combo</span></div>
        <div><b>+${r.coins}</b><span>🪙</span></div></div>
      ${extra}
      <div class="col-btns">
        ${home === 'world' ? `<button class="btn primary wide" data-act="go" data-arg="world">🏞 Return to the adventure</button>` :
          node && r.passed && E.nodes[node.index + 1] ? `<button class="btn primary wide" data-act="start" data-arg="${E.nodes[node.index + 1].id}">Next lesson ▶</button>` : ''}
        ${node ? `<button class="btn ghost wide" data-act="start" data-arg="${node.id}">${r.passed ? 'Practice again' : 'Try again'}</button>` : ''}
        ${home === 'world' ? '' : `<button class="btn ghost wide" data-act="go" data-arg="${node ? 'path' : 'review'}">Back</button>`}</div></div>`;
    if (node && KG.world && KG.world.ok) KG.world.onLessonDone(node, r);
    P = null;
    renderTop();
  }

  // ── review ──────────────────────────────────────────────────
  function renderReview() {
    const due = E.dueWords(), M = S().mistakes, studied = Object.keys(S().vocab).length;
    const boxes = [1, 2, 3, 4, 5, 6, 7].map(b => Object.values(S().vocab).filter(r => r.box === b).length);
    const maxB = Math.max(1, ...boxes);
    main.innerHTML = `<h1 class="vh">Review</h1>
      <p class="muted">Spaced repetition shows you each word just before you would forget it. A few minutes a day keeps every word alive.</p>
      <div class="card big-cta ${due.length ? 'hot' : ''}">
        <div><h3>🔁 Daily review</h3><p>${due.length ? `<b>${due.length}</b> word${due.length > 1 ? 's' : ''} ready for review` : studied ? 'All caught up! Come back tomorrow.' : 'Finish a vocabulary lesson to start your deck.'}</p></div>
        <button class="btn primary" data-act="review" ${due.length ? '' : 'disabled'}>Start</button></div>
      <div class="card big-cta"><div><h3>📝 Mistake notebook</h3><p>${M.length ? `<b>${M.length}</b> question${M.length > 1 ? 's' : ''} you missed recently` : 'No mistakes saved. Nice!'}</p></div>
        <button class="btn primary" data-act="mistakes" ${M.length ? '' : 'disabled'}>Fix</button></div>
      <div class="card big-cta"><div><h3>🎯 Weakest words</h3><p>Extra practice on the words you miss most.</p></div>
        <button class="btn primary" data-act="weak" ${studied >= 4 ? '' : 'disabled'}>Drill</button></div>
      <div class="card"><h3>Your memory boxes</h3><p class="muted">Each correct review moves a word up a box and doubles the wait. Box 4+ = mastered.</p>
        <div class="boxes">${boxes.map((c, i) => `<div class="bx"><div class="bxbar"><i style="height:${(c / maxB) * 100}%"></i></div><b>${c}</b><span>Box ${i + 1}</span></div>`).join('')}</div></div>`;
  }
  function startReview(kind) {
    let words, qs;
    if (kind === 'mistakes') {
      qs = S().mistakes.slice(0, 15).map(m => Object.assign({ type: 'mc' }, m, { options: m.options.slice() }));
      return begin({ qs: shuffle(qs), mode: 'mistakes' });
    }
    words = kind === 'review' ? sample(E.dueWords(), 15) : E.weakWords(10);
    const studied = Object.keys(S().vocab).map(g => E.vocabByGreek[g]).filter(Boolean);
    qs = words.map(w => E.vocabQuestions([w], studied.length > 8 ? studied : KG.vocab, 1)[0]);
    begin({ qs, mode: 'review' });
  }

  // ── arcade ──────────────────────────────────────────────────
  const GAMES = {
    blitz: { name: 'Alphabet Blitz', icon: 'Ω', desc: 'Name as many letters as you can in 60 seconds.' },
    lightning: { name: 'Vocab Lightning', icon: '⚡', desc: 'Rapid-fire meanings from the words you have studied.' },
    parse: { name: 'Parse Rush', icon: '🧩', desc: 'Parse forms from the grammar you have unlocked.' },
  };
  function renderArcade() {
    main.innerHTML = `<h1 class="vh">Arcade</h1><p class="muted">60-second speed rounds. Wrong answers cost 3 seconds. Beat your high score!</p>
      ${Object.entries(GAMES).map(([k, g]) => `<div class="card game"><div class="gic">${g.icon}</div><div class="gtx"><h3>${g.name}</h3><p>${g.desc}</p>
      <p class="muted">High score: <b>${S().arcade[k] || 0}</b></p></div><button class="btn primary" data-act="arcade" data-arg="${k}">Play</button></div>`).join('')}`;
  }
  function arcadeQ(kind) {
    if (kind === 'blitz') {
      const L = U.pick(KG.alphabet), up = Math.random() < 0.3;
      return E.mc('Name this letter', L.name, sample(KG.alphabet.filter(x => x !== L), 3).map(x => x.name), { big: up ? L.U : L.l });
    }
    if (kind === 'lightning') {
      let pool = Object.keys(S().vocab).map(g => E.vocabByGreek[g]).filter(Boolean);
      if (pool.length < 8) pool = KG.vocab.slice(0, 20);
      const w = U.pick(pool);
      return E.mc('Meaning?', w.en, sample(pool.filter(x => x !== w), 3).map(x => x.en), { big: w.g });
    }
    const all = E.unlockedCells(), c = U.pick(all);
    return E.parseQ(c, all);
  }
  let A = null;
  function startArcade(kind) {
    A = { kind, score: 0, end: Date.now() + 60000, timer: null };
    document.body.classList.add('playing');
    A.timer = setInterval(tickArcade, 200);
    arcadeNext();
  }
  function tickArcade() {
    if (!A) return;
    const left = Math.max(0, A.end - Date.now());
    const t = $('#atime'); if (t) { t.textContent = Math.ceil(left / 1000); t.parentElement.style.setProperty('--t', left / 60000); }
    if (left <= 0) endArcade();
  }
  function arcadeNext() {
    A.q = arcadeQ(A.kind);
    const q = A.q;
    main.innerHTML = `<div class="player arcade"><div class="ph"><button class="x" data-act="quitArcade" aria-label="Quit">✕</button>
      <div class="atimer"><span id="atime">60</span>s</div><div class="ascore">⭐ ${A.score}</div></div>
      <div class="qbody"><div class="prompt">${q.prompt}</div><div class="bigword"><span class="gk">${esc(q.big)}</span></div>
      <div class="opts">${q.options.map((o, i) => `<button class="opt" data-act="apick" data-arg="${i}"><span class="k">${i + 1}</span>${esc(o)}</button>`).join('')}</div></div></div>`;
    tickArcade();
  }
  function arcadePick(i, el) {
    if (!A || A.lock) return;
    const ok = +i === A.q.answer;
    A.lock = true;
    el.classList.add(ok ? 'right' : 'wrong');
    if (!ok) { document.querySelectorAll('.opt')[A.q.answer].classList.add('right'); A.end -= 3000; sfx('bad'); }
    else { A.score++; sfx('good'); }
    setTimeout(() => { if (A) { A.lock = false; arcadeNext(); } }, ok ? 250 : 700);
  }
  function endArcade() {
    if (!A) return;
    clearInterval(A.timer);
    const { kind, score } = A; A = null;
    const best = S().arcade[kind] || 0, record = score > best;
    if (record) S().arcade[kind] = score;
    const xp = score * 3, coins = Math.floor(score / 4);
    if (xp) E.gainXP(xp, coins); else E.save();
    E.checkAchievements();
    if (record && score) { sfx('win'); confetti(); }
    main.innerHTML = `<div class="results"><h1>${record && score ? '🏅 New high score!' : '⏱ Time!'}</h1>
      <div class="rstats"><div><b>${score}</b><span>score</span></div><div><b>${Math.max(best, score)}</b><span>best</span></div><div><b>+${xp}</b><span>XP</span></div><div><b>+${coins}</b><span>🪙</span></div></div>
      <div class="col-btns"><button class="btn primary wide" data-act="arcade" data-arg="${kind}">Play again</button><button class="btn ghost wide" data-act="go" data-arg="arcade">Back</button></div></div>`;
    renderTop();
  }

  // ── codex ───────────────────────────────────────────────────
  function readiness() {
    const cov = E.coverage(), gDone = E.nodes.filter(n => n.type === 'grammar' && E.stars(n.id)).length;
    const gAll = E.nodes.filter(n => n.type === 'grammar').length, vDone = S().stats.verses;
    const score = (cov / 0.7) * 0.4 + (gDone / gAll) * 0.4 + Math.min(1, vDone / 22) * 0.2;
    const stages = [[0, 'Alphabet Apprentice'], [0.1, 'Word Gatherer'], [0.3, 'Phrase Reader'], [0.5, 'Verse Reader'], [0.75, 'Passage Translator'], [0.95, 'NT Reader']];
    return { score: Math.min(1, score), stage: stages.filter(s => s[0] <= score).pop()[1], cov, gDone, gAll, vDone };
  }
  let lexFilter = '';
  function renderCodex() {
    const r = readiness(), readings = E.nodes.filter(n => n.type === 'reading');
    main.innerHTML = `<h1 class="vh">Codex</h1>
      <div class="card prof"><div class="ring" style="--p:${r.score * 360}deg"><span>${Math.round(r.score * 100)}%</span></div>
        <div><div class="muted">NT reading readiness</div><h3>${r.stage}</h3>
        <p>📖 The words you've studied cover <b>${(r.cov * 100).toFixed(1)}%</b> of the words in the NT (mastered: ${(E.masteredCoverage() * 100).toFixed(1)}%)</p>
        <p>⚙ Grammar lessons: <b>${r.gDone}/${r.gAll}</b> · ✝ Verses translated: <b>${r.vDone}/${readings.length}</b></p></div></div>
      <h2>Verse collection</h2><div class="verses">${readings.map(n => {
        const R = KG.readings[n.reading], have = E.stars(n.id) > 0;
        return `<button class="vtile ${have ? '' : 'locked'}" data-act="${have ? 'readVerse' : 'open'}" data-arg="${have ? n.reading : n.id}">
          <b>${esc(R.ref)}</b><span class="gk">${have ? esc(R.words.slice(0, 6).map(w => w.w).join(' ')) + '…' : '? ? ?'}</span></button>`;
      }).join('')}</div>
      <h2>Grammar reference</h2><div class="refs">${E.nodes.filter(n => n.type === 'grammar').map(n => `<button class="reftile ${E.unlocked(n) ? '' : 'locked'}" data-act="${E.unlocked(n) ? 'learn' : 'open'}" data-arg="${n.id}">${KG.grammar[n.lesson].icon} ${esc(n.title)}</button>`).join('')}</div>
      <details class="lexbox" ${lexFilter ? 'open' : ''}><summary>Lexicon <span class="muted small">${Object.keys(S().vocab).length}/${KG.vocab.length} studied</span></summary>
      <input id="lexq" class="search" placeholder="Search Greek or English…" value="${esc(lexFilter)}">
      <div id="lex" class="lex"></div></details>`;
    renderLex();
    $('#lexq').addEventListener('input', e => { lexFilter = e.target.value; renderLex(); });
  }
  function renderLex() {
    const q = U.bare(lexFilter.trim());
    const rows = KG.vocab.filter(w => !q || U.bare(w.g).includes(q) || w.en.toLowerCase().includes(q));
    $('#lex').innerHTML = rows.map(w => {
      const r = S().vocab[w.g], box = r ? r.box : 0;
      return `<div class="lexrow ${r ? '' : 'unseen'}" data-act="say" data-arg="${esc(w.g)}"><span class="gk">${esc(w.lex)}</span><span>${esc(w.en)}</span>
        <span class="dots" title="${r ? 'Box ' + box : 'Not studied yet'}">${[1, 2, 3, 4, 5, 6, 7].map(b => `<i class="${b <= box ? 'on' : ''}"></i>`).join('')}</span><span class="muted small">${w.f}×</span></div>`;
    }).join('') || '<p class="muted">No matches.</p>';
  }
  function readVerse(id) {
    const R = KG.readings[id]; readerReading = R;
    sheet(`<div class="sheet-k">Verse collection</div><h2>${esc(R.ref)}</h2>${verseHTML(R, 'big')}
      <div id="wordinfo" class="wordinfo muted">Tap a word…</div><p><i>${esc(R.tr)}</i></p><p class="tip">💡 ${esc(R.note)}</p>`);
  }

  // ── profile ─────────────────────────────────────────────────
  function renderProfile() {
    const s = S(), lv = E.levelInfo(), st = s.stats;
    const days = Array.from({ length: 7 }, (_, i) => U.addDays(U.day(), i - 6));
    const maxD = Math.max(s.dailyGoal, ...days.map(d => s.history[d] || 0));
    main.innerHTML = `<h1 class="vh">Profile</h1>
      <div class="card lvcard"><div class="lvbig">${lv.level}</div><div class="grow"><div class="muted">Level ${lv.level}</div><h3>${lv.title}</h3>
        <div class="xpbar"><i style="width:${(lv.cur / lv.need) * 100}%"></i></div><div class="muted small">${lv.cur} / ${lv.need} XP to level ${lv.level + 1} · ${s.xp} XP total</div></div></div>
      <div class="statgrid">
        <div><b>🔥 ${s.streak}</b><span>day streak</span></div><div><b>🏅 ${s.bestStreak}</b><span>best streak</span></div>
        <div><b>🧊 ${s.freezes}</b><span>streak freezes</span></div><div><b>✅ ${st.answered ? Math.round(st.correct / st.answered * 100) : 0}%</b><span>accuracy</span></div>
        <div><b>📚 ${st.lessons}</b><span>lessons</span></div><div><b>⚡ ${st.bestCombo}</b><span>best combo</span></div></div>
      <div class="card"><h3>This week</h3><div class="week">${days.map(d => {
        const v = s.history[d] || 0, dn = new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' });
        return `<div class="wd"><div class="wbar"><i class="${v >= s.dailyGoal ? 'hit' : ''}" style="height:${(v / maxD) * 100}%"></i><em style="bottom:${(s.dailyGoal / maxD) * 100}%"></em></div><b>${v}</b><span>${dn}</span></div>`;
      }).join('')}</div></div>
      <div class="card"><h3>Shop <span class="muted small">you have ${s.coins} 🪙</span></h3>
        <div class="shop"><div><b>🧊 Streak freeze</b><p class="muted small">Protects your streak for one missed day (max 2).</p><button class="btn primary" data-act="buy" data-arg="freeze">50 🪙</button></div>
        <div><b>🚀 XP boost</b><p class="muted small">Double XP on your next 3 lessons${s.boost ? ` (${s.boost} left)` : ''}.</p><button class="btn primary" data-act="buy" data-arg="boost">80 🪙</button></div></div></div>
      <div class="card"><h3>Achievements <span class="muted small">${Object.keys(s.ach).length}/${KG.achievements.length}</span></h3>
        <div class="achs">${KG.achievements.map(a => `<div class="ach ${s.ach[a.id] ? 'got' : ''}" title="${esc(a.desc)}"><div class="ai">${a.icon}</div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join('')}</div></div>
      <div class="card settings"><h3>Settings</h3>
        <label>Daily goal <select id="goalsel">${[20, 50, 100, 200].map(g => `<option value="${g}" ${g === s.dailyGoal ? 'selected' : ''}>${g} XP · ${{ 20: 'Casual', 50: 'Regular', 100: 'Serious', 200: 'Intense' }[g]}</option>`).join('')}</select></label>
        <label class="tg"><input type="checkbox" id="setsound" ${s.settings.sound ? 'checked' : ''}><span>Sound effects</span></label>
        <label class="tg"><input type="checkbox" id="setspeech" ${s.settings.speech ? 'checked' : ''}><span>Read Greek aloud <span class="muted small">(uses your device's Greek voice, modern pronunciation)</span></span></label>
        <label class="tg"><input type="checkbox" id="setunlock" ${s.settings.unlockAll ? 'checked' : ''}><span>Unlock all lessons <span class="muted small">(if you already know some Greek)</span></span></label>
        <div class="row"><button class="btn ghost" data-act="export">⬇ Export progress</button><button class="btn ghost" data-act="import">⬆ Import</button><button class="btn danger" data-act="reset">Reset</button></div>
        <input type="file" id="importfile" accept="application/json" hidden></div>
      <p class="muted small center">Greek text: SBL Greek New Testament (SBLGNT). Progress is saved on this device only. Export it to move between devices.</p>`;
    $('#goalsel').onchange = e => { s.dailyGoal = +e.target.value; E.save(); renderTop(); };
    $('#setsound').onchange = e => { s.settings.sound = e.target.checked; E.save(); };
    $('#setspeech').onchange = e => { s.settings.speech = e.target.checked; E.save(); if (e.target.checked) speak('Ἐν ἀρχῇ ἦν ὁ λόγος'); };
    $('#setunlock').onchange = e => { s.settings.unlockAll = e.target.checked; E.save(); };
    $('#importfile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { E.importState(t); toast('Progress imported ✔'); go('profile'); }).catch(err => toast('Import failed: ' + esc(err.message)));
    };
  }

  // ── actions (event delegation) ──────────────────────────────
  const ACT = {
    go, open: openNode, closeSheet, learn: id => showLearn(id, false), start: startNode,
    say: t => speak(t), word: i => wordInfo(i),
    quit: () => { if (P && P.i > 0 && !confirm('Quit this lesson? Your progress in it will be lost.')) return; P = null; go(view === 'review' ? 'review' : home); },
    pick(i, el) {
      if (!P || P.answered) return;
      const q = P.q, ok = +i === q.answer;
      document.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; if (k === q.answer) b.classList.add('right'); });
      if (!ok) el.classList.add('wrong');
      answer(ok, q);
    },
    mt(arg, el) {
      if (!P || P.answered || el.classList.contains('matched')) return;
      const m = P.match, side = arg[0], idx = arg.slice(1);
      sfx('tap');
      if (!m.sel || m.sel.side === side) {
        if (m.sel) m.sel.el.classList.remove('sel');
        m.sel = { side, idx, el }; el.classList.add('sel'); return;
      }
      if (m.sel.idx === idx) {
        el.classList.add('matched'); m.sel.el.classList.add('matched'); m.sel.el.classList.remove('sel');
        m.sel = null; m.done++;
        if (m.done === P.q.pairs.length) answer(m.miss === 0, Object.assign({}, P.q, { explain: m.miss ? `${m.miss} mismatch${m.miss > 1 ? 'es' : ''}. Keep at it!` : 'All pairs matched perfectly!' }));
      } else {
        m.miss++; sfx('bad');
        const a = m.sel.el; a.classList.add('shake'); el.classList.add('shake');
        setTimeout(() => { a.classList.remove('shake', 'sel'); el.classList.remove('shake'); }, 400);
        m.sel = null;
      }
    },
    place(k) { if (P.answered) return; const o = P.order; o.line.push(o.bank.splice(+k, 1)[0]); sfx('tap'); renderOrder(); },
    unplace(k) { if (P.answered) return; const o = P.order; o.bank.push(o.line.splice(+k, 1)[0]); renderOrder(); },
    checkOrder() {
      if (P.answered) return;
      const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      const got = norm(P.order.line.map(c => c.t).join(' ')), want = norm(P.q.chunks.join(' '));
      const R = KG.readings[P.q.reading];
      answer(got === want, Object.assign({}, P.q, { explain: `${got === want ? '' : 'Correct order: '}<i>${esc(R.tr)}</i>` }));
      document.querySelectorAll('.tile').forEach(t => t.disabled = true);
    },
    compare() {
      const R = KG.readings[P.q.reading], mine = ($('#freetr').value || '').trim();
      $('#foot').innerHTML = `<div class="fb"><div class="fb-h">Model translation</div><div class="fb-d"><i>${esc(R.tr)}</i><br><span class="muted">💡 ${esc(R.note)}</span></div></div>
        <div class="muted small center">${mine ? 'How did yours compare? Be honest. Translations can differ in wording and still be right.' : 'Try writing your own next time: producing a translation builds real fluency.'}</div>
        <div class="row"><button class="btn bad" data-act="selfgrade" data-arg="0">Missed the meaning</button><button class="btn good" data-act="selfgrade" data-arg="1">Got the meaning ✔</button></div>`;
    },
    selfgrade(v) {
      if (v === '1') { P.xp += 15; floatXP('+15 XP', $('.prompt')); sfx('good'); }
      next();
    },
    next: () => next(),
    review: () => startReview('review'), mistakes: () => startReview('mistakes'), weak: () => startReview('weak'),
    arcade: k => startArcade(k), apick: (i, el) => arcadePick(i, el),
    quitArcade: () => { if (A) clearInterval(A.timer); A = null; go('arcade'); },
    readVerse,
    buy(item) {
      if (E.buy(item)) { sfx('win'); toast(item === 'freeze' ? '🧊 Streak freeze equipped!' : '🚀 XP boost active for 3 lessons!'); renderProfile(); renderTop(); }
      else toast(item === 'freeze' && S().freezes >= 2 ? 'You can hold at most 2 freezes.' : 'Not enough 🪙 yet. Keep learning!');
    },
    export() {
      const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `koine-quest-${U.day()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    import: () => $('#importfile').click(),
    reset() { if (confirm('Erase ALL progress? This cannot be undone.')) { E.reset(); toast('Progress reset.'); go('path'); } },
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset.arg, el); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (/^[1-4]$/.test(e.key)) {
      const opt = document.querySelectorAll(A ? '.opt' : '.opt:not(:disabled)')[+e.key - 1];
      if (opt) opt.click();
    } else if (e.key === 'Enter') { const b = $('#nextbtn') || $('#checkbtn:not(:disabled)'); if (b) { e.preventDefault(); b.click(); } }
    else if (e.key === 'Escape') closeSheet();
  });

  // ── boot ────────────────────────────────────────────────────
  const msg = E.checkStreak();
  renderTop();
  KG.app = { go, startNode, openNode, sfx, speak, toast, confetti, floatXP, renderTop, showLearn, readVerse: id => readVerse(id) };
  // The 3D world loads as a module after this script; open it once it reports ready,
  // and fall back to the path map if WebGL is unavailable.
  const worldIncluded = !!document.querySelector('script[data-world]');
  const first = location.hash.slice(1) || (worldIncluded ? 'world' : 'path');
  if (first === 'world' && worldIncluded) {
    main.innerHTML = '<div class="loading">Loading the world…</div>';
    document.addEventListener('world-ready', () => { if (main.querySelector('.loading')) go('world'); });
    document.addEventListener('world-failed', () => go('path'));
    setTimeout(() => { if (main.querySelector('.loading')) go('path'); }, 8000);
  } else go(first);
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (A) { clearInterval(A.timer); A = null; }
    if (h && (h !== view || P || document.body.classList.contains('playing'))) { P = null; go(h); }
  });
  if (msg) setTimeout(() => toast(msg), 400);
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
