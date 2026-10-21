// The Reading Room: read and translate any passage of the Greek New Testament.
// Every word can be tapped for its dictionary form, meaning and parsing; your
// translation of each verse is saved and can be compared with the World English
// Bible. Passages from the ladder are collected as scrolls across the worlds.
(function () {
  'use strict';
  const E = KG.engine, U = KG.util, NT = E.nt, esc = U.esc;
  const S = () => E.state;
  const $ = (s, el = document) => el.querySelector(s);
  const key = (b, c, v) => `${b} ${c}:${v}`;
  const R = KG.reader = {};

  function st() {
    const s = S();
    s.scrolls = s.scrolls || {};
    s.tr = s.tr || {};
    s.reading = s.reading || { help: 'tap', last: null, free: 0 };
    return s;
  }
  R.unlockScroll = (id, quiet) => {
    const s = st();
    if (s.scrolls[id]) return false;
    s.scrolls[id] = 'found'; E.save();
    const p = KG.passages.find(x => x.id === id);
    if (!quiet && p && KG.app) { KG.app.sfx('combo'); KG.app.toast(`📜 <b>Scroll found:</b> ${esc(p.title)} <span class="muted">(${esc(p.ref)})</span>. Read it in the Library!`, 'gold'); }
    return true;
  };
  // Beating a world's guardian hands over any scrolls of that world not yet found.
  R.unitCleared = unit => KG.passages.filter(p => p.unit === unit).forEach(p => R.unlockScroll(p.id, true));

  // ── the Library section (top of the Library/Codex screen) ────
  R.section = () => {
    const s = st(), found = KG.passages.filter(p => s.scrolls[p.id]).length, done = KG.passages.filter(p => s.scrolls[p.id] === 'translated').length;
    return `<div class="card rroom"><h3>📜 Reading Room</h3>
      <p class="muted small">Read any passage of the Greek New Testament. Tap a word for its meaning and parsing, write your translation verse by verse, then compare.</p>
      <form class="rr-open" data-rr-open><input class="search" name="ref" placeholder="e.g. John 3:16-21, Mark 1, 1 Cor 13" value="${esc(s.reading.last || '')}" autocomplete="off"><button class="btn primary" type="submit">Open</button></form>
      <div class="rr-chips">${['John 1:1-5', 'John 3:16-21', 'Mark 1:1-11', 'Matthew 6:9-13', 'Philippians 2:5-11'].map(r => `<button class="chip-b" data-act="passage" data-arg="${r}">${r}</button>`).join('')}</div>
      <h3 class="rr-h">Scroll collection <span class="muted small">${found}/${KG.passages.length} found · ${done} translated</span></h3>
      <div class="scrolls">${KG.passages.map(p => {
        const v = s.scrolls[p.id];
        return v ? `<button class="scroll ${v}" data-act="passage" data-arg="${esc(p.ref)}" data-scroll="${p.id}"><span class="sc-ic">${v === 'translated' ? '✅' : '📜'}</span><b>${esc(p.title)}</b><span>${esc(p.ref)}</span></button>`
          : `<div class="scroll locked"><span class="sc-ic">❔</span><b>Unfound scroll</b><span>Hidden in ${esc(KG.units[p.unit].title)}</span></div>`;
      }).join('')}</div></div>`;
  };
  document.addEventListener('submit', e => {
    if (!e.target.matches('[data-rr-open]')) return;
    e.preventDefault();
    const ref = e.target.ref.value.trim();
    if (ref) R.open(ref);
  });

  // ── passage view ─────────────────────────────────────────────
  let cur = null; // { ref, r, verses, en, scroll }
  R.open = async (refStr, scrollId) => {
    const r = NT.parseRef(refStr);
    const app = KG.app, main = $('#main');
    if (!r) { app.toast(`I couldn't read "${esc(refStr)}". Try something like <b>John 3:16-21</b>.`); return; }
    main.innerHTML = '<div class="loading">Unrolling the scroll…</div>';
    let verses;
    try { verses = await NT.passage(r); } catch (err) { main.innerHTML = `<div class="card">Couldn't load the text (${esc(err.message)}). Are you offline? Books you've opened before work offline.</div>`; return; }
    if (!verses.length) { app.toast('That passage is not in the New Testament.'); return app.go('codex'); }
    if (verses.length > 60) { verses = verses.slice(0, 60); app.toast('Showing the first 60 verses. Open a smaller section for more.'); }
    const s = st();
    s.reading.last = refStr; E.save();
    const scroll = scrollId || (KG.passages.find(p => p.ref === refStr) || {}).id || null;
    cur = { ref: NT.refName(r), r, verses, scroll, en: null };
    app.openReader(cur.ref, r);
    render();
    NT.english(r.b).then(en => { cur && (cur.en = en); });
  };
  const known = li => { const g = NT.lex[li][0]; return !!S().vocab[g]; };
  function render() {
    const s = st(), help = s.reading.help, main = $('#main');
    const total = cur.verses.reduce((n, v) => n + v.words.length, 0);
    const kn = cur.verses.reduce((n, v) => n + v.words.filter(w => known(w.li)).length, 0);
    const doneCount = cur.verses.filter(v => (s.tr[key(cur.r.b, v.c, v.v)] || '').trim()).length;
    const wrap = $('.reader-wrap') || main;
    wrap.innerHTML = `<div class="reader">
      <div class="rd-top"><button class="x" data-act="readerClose" aria-label="Close">✕</button><div class="rd-title"><h2>${esc(cur.ref)}</h2>
        <div class="muted small">You know <b>${total ? Math.round(kn / total * 100) : 0}%</b> of these words · ${doneCount}/${cur.verses.length} verses translated</div></div></div>
      <div class="rd-tools"><label>Help: <select id="rdhelp">
        <option value="tap" ${help === 'tap' ? 'selected' : ''}>Tap words for help</option>
        <option value="unknown" ${help === 'unknown' ? 'selected' : ''}>Show meanings of new words</option>
        <option value="all" ${help === 'all' ? 'selected' : ''}>Show every meaning</option></select></label></div>
      ${cur.verses.map((v, i) => {
        const k = key(cur.r.b, v.c, v.v), mine = s.tr[k] || '';
        return `<div class="rd-verse ${mine.trim() ? 'done' : ''}" data-vi="${i}">
          <div class="rd-greek"><sup>${v.c !== cur.r.c1 || cur.r.c1 !== cur.r.c2 ? v.c + ':' : ''}${v.v}</sup>${v.words.map((w, j) => {
            const showG = help === 'all' || (help === 'unknown' && !known(w.li));
            return `<span class="rw ${known(w.li) ? 'kn' : ''}" data-act="rword" data-arg="${i}.${j}"><span class="gk">${esc(w.t)}</span>${showG ? `<em>${esc(NT.gloss(w.li))}</em>` : ''}</span>`;
          }).join(' ')}</div>
          <textarea class="rd-tr" data-k="${k}" rows="2" placeholder="Your translation of verse ${v.v}…">${esc(mine)}</textarea>
          <div class="rd-row"><button class="linkbtn" data-act="rcompare" data-arg="${i}">Compare</button><div class="rd-en" id="rden${i}"></div></div>
        </div>`;
      }).join('')}
      <div class="rd-end">${cur.verses.length > 1 || cur.scroll ? `<button class="btn primary wide" data-act="rfinish">${doneCount === cur.verses.length ? '✔ Finish passage' : `Finish passage (${doneCount}/${cur.verses.length} verses)`}</button>` : ''}
        <p class="muted small center">Greek: SBL Greek New Testament (SBLGNT) © 2010 Society of Biblical Literature and Logos Bible Software. Parsing: MorphGNT (CC BY-SA). Glosses: Dodson lexicon (public domain). Comparison: World English Bible (public domain).</p></div>
      <div class="rd-word" id="rdword" hidden></div></div>`;
    $('#rdhelp').onchange = e => { s.reading.help = e.target.value; E.save(); render(); };
    wrap.querySelectorAll('.rd-tr').forEach(t => t.addEventListener('input', () => {
      s.tr[t.dataset.k] = t.value; E.save();
      t.closest('.rd-verse').classList.toggle('done', !!t.value.trim());
    }));
  }
  R.word = arg => {
    const [i, j] = arg.split('.').map(Number), w = cur.verses[i].words[j], L = NT.lex[w.li];
    const lemma = L[0], inDeck = !!S().vocab[lemma];
    document.querySelectorAll('.rw.sel').forEach(x => x.classList.remove('sel'));
    const el = document.querySelector(`[data-arg="${arg}"]`); if (el) el.classList.add('sel');
    const box = $('#rdword');
    box.hidden = false;
    box.innerHTML = `<button class="rdw-x" data-act="rwordClose" aria-label="Close">✕</button>
      <div class="wi-top"><span class="gk big">${esc(w.t.replace(/[,.;·:’]/g, ''))}</span><button class="say" data-act="say" data-arg="${esc(w.t)}">🔊</button></div>
      <div>from <span class="gk">${esc(lemma)}</span>: <b>${esc(NT.gloss(w.li))}</b></div>
      <div class="muted">${esc(NT.decode(w.code))}</div>
      <div class="muted small">appears ${L[2]}× in the New Testament</div>
      <div class="row">${inDeck ? '<span class="muted small">✔ In your review deck</span>' : `<button class="btn ghost" data-act="raddword" data-arg="${arg}">+ Add to my review deck</button>`}</div>`;
    KG.app.speak(w.t);
  };
  R.addWord = arg => {
    const [i, j] = arg.split('.').map(Number), w = cur.verses[i].words[j], L = NT.lex[w.li];
    E.addWord(L[0], NT.gloss(w.li), L[2]);
    KG.app.toast(`<span class="gk">${esc(L[0])}</span> added to your review deck 🔁`);
    R.word(arg);
  };
  R.compare = i => {
    const v = cur.verses[+i], el = $('#rden' + i);
    if (!el) return;
    if (el.innerHTML) { el.innerHTML = ''; return; }
    const en = cur.en && cur.en[v.c - 1] && cur.en[v.c - 1][v.v - 1];
    el.innerHTML = en ? `<i>${esc(en)}</i> <span class="muted small">(WEB, which sometimes follows a different Greek text)</span>` : '<span class="muted small">No comparison available for this verse.</span>';
  };
  R.finish = () => {
    const s = st(), app = KG.app;
    const missing = cur.verses.filter(v => !(s.tr[key(cur.r.b, v.c, v.v)] || '').trim());
    if (missing.length) { app.toast(`Translate every verse first: ${missing.length} to go. Verse ${missing[0].v} is next.`); return; }
    const first = cur.scroll ? s.scrolls[cur.scroll] !== 'translated' : !s.reading['done:' + cur.ref];
    if (cur.scroll) s.scrolls[cur.scroll] = 'translated';
    else s.reading['done:' + cur.ref] = true;
    if (first) {
      E.questProgress('verses', cur.verses.length);
      s.stats.passages = (s.stats.passages || 0) + 1;
      if (!cur.scroll) s.reading.free = (s.reading.free || 0) + 1;
      E.gainXP(10 * cur.verses.length + 20, 5 + cur.verses.length);
      app.sfx('win'); app.confetti(160);
      app.toast(`📜 <b>${esc(cur.ref)}</b> translated! +${10 * cur.verses.length + 20} XP`, 'gold');
    } else app.toast('Passage re-read. Every reading makes you more fluent!');
    E.save(); E.checkAchievements();
    render();
  };
  R.close = () => { cur = null; KG.app.closeReader(); };
})();
