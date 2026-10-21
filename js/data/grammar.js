// Grammar lessons. Each lesson has:
//   notes     – short teaching text (HTML), read before practice
//   paradigms – tables the quiz engine turns into parse / produce questions
//   concepts  – understanding checks { q, a, w: [wrong answers], ex: explanation }
//   phrases   – [Greek, English] pairs, mostly drawn from NT wording
window.KG = window.KG || {};

(function () {
  const C4 = ['Nominative', 'Genitive', 'Dative', 'Accusative'];
  const C5 = C4.concat('Vocative');
  const P6 = ['1st Sg', '2nd Sg', '3rd Sg', '1st Pl', '2nd Pl', '3rd Pl'];
  const IMV = ['2nd Sg', '3rd Sg', '2nd Pl', '3rd Pl'];

  const noun = (lemma, title, sg, pl, rows = C4) =>
    ({ lemma, title, rows, cols: ['Sg', 'Pl'], forms: rows.map((_, i) => [sg[i], pl[i]]) });
  const mfn = (lemma, title, tag, m, f, n) =>
    ({ lemma, title, rows: C4, cols: ['Masc', 'Fem', 'Neut'], tag, forms: C4.map((_, i) => [m[i], f[i], n[i]]) });
  const verb = (lemma, title, forms, tag = '', rows = P6) =>
    ({ lemma, title, rows, cols: [''], tag, forms: forms.map(f => [f]) });
  const list = (lemma, title, rows, forms) =>
    ({ lemma, title, rows, cols: [''], forms: forms.map(f => [f]) });

  const gk = s => `<span class="gk">${s}</span>`;

  KG.grammar = {
    // ───────────────────────────── Unit 2
    cases: {
      title: 'How Greek Works: Cases',
      icon: '⚙',
      notes: `
<p>English shows a word's job mostly by <b>word order</b>: "the dog bites the man" ≠ "the man bites the dog".
Greek shows a word's job by its <b>ending</b>. Word order is free and used for emphasis, so the endings carry the grammar.</p>
<table class="ref"><tr><th>Case</th><th>Main job</th><th>English clue</th></tr>
<tr><td>Nominative</td><td>subject; the "X" in "X is Y"</td><td>—</td></tr>
<tr><td>Genitive</td><td>possession, description, source</td><td>"of"</td></tr>
<tr><td>Dative</td><td>indirect object, means, location</td><td>"to, for, by, in"</td></tr>
<tr><td>Accusative</td><td>direct object</td><td>—</td></tr>
<tr><td>Vocative</td><td>direct address</td><td>"O …!"</td></tr></table>
<p>Both of these mean "God loves the world":</p>
<p class="ex">${gk('ὁ θεὸς ἀγαπᾷ τὸν κόσμον.')}<br>${gk('τὸν κόσμον ἀγαπᾷ ὁ θεός.')}</p>
<p>The <b>-ος</b> ending marks the subject and <b>-ον</b> marks the object, so the order doesn't change who loves whom.</p>
<p>Every noun also has <b>number</b> (singular/plural) and <b>gender</b> (masculine/feminine/neuter).
Gender is grammatical, not biological: ${gk('λόγος')} "word" is masculine, ${gk('ἁμαρτία')} "sin" feminine, ${gk('ἔργον')} "work" neuter.</p>
<p>A noun = <b>stem</b> (meaning) + <b>ending</b> (function): ${gk('λόγ-ος, λόγ-ου, λόγ-ῳ, λόγ-ον')}.</p>
<p class="tip">💡 Learning tip: every time you meet a noun from now on, ask "what's its job?" before "what does it mean?"</p>`,
      concepts: [
        { q: 'Which case typically marks the SUBJECT of a sentence?', a: 'Nominative', w: ['Genitive', 'Dative', 'Accusative'] },
        { q: 'Which case typically marks the DIRECT OBJECT?', a: 'Accusative', w: ['Nominative', 'Genitive', 'Dative'] },
        { q: 'Which case is most often translated with "of"?', a: 'Genitive', w: ['Dative', 'Accusative', 'Vocative'] },
        { q: 'Which case marks the indirect object ("to/for someone")?', a: 'Dative', w: ['Genitive', 'Nominative', 'Accusative'] },
        { q: 'Which case is used to address someone directly ("O Lord!")?', a: 'Vocative', w: ['Nominative', 'Dative', 'Genitive'] },
        { q: 'In Greek, what mainly tells you a noun\'s job in the sentence?', a: 'its ending', w: ['its position in the sentence', 'its length', 'its accent'] },
        { q: `In ${gk('ὁ θεὸς ἀγαπᾷ τὸν κόσμον')}, which phrase is the direct object?`, a: gk('τὸν κόσμον'), w: [gk('ὁ θεός'), gk('ἀγαπᾷ'), gk('ὁ')], ex: 'The -ον ending (accusative) marks the object.' },
        { q: `Does ${gk('τὸν κόσμον ἀγαπᾷ ὁ θεός')} mean something different from ${gk('ὁ θεὸς ἀγαπᾷ τὸν κόσμον')}?`, a: 'No — same meaning, different emphasis', w: ['Yes — "the world loves God"', 'Yes — it becomes a question', 'It is ungrammatical'] },
        { q: 'The three Greek genders are…', a: 'masculine, feminine, neuter', w: ['singular, plural, dual', 'past, present, future', 'subject, object, verb'] },
        { q: 'Grammatical gender in Greek is…', a: 'a property of the word, not necessarily of the thing', w: ['always the biological sex', 'only used for people', 'chosen freely by the writer'], ex: 'ἁμαρτία (sin) is feminine, παιδίον (child) is neuter.' },
        { q: `Which part of ${gk('λόγου')} carries the meaning "word"?`, a: gk('λόγ-'), w: [gk('-ου'), gk('λ-'), gk('-όγου')] },
        { q: '"Number" in grammar means…', a: 'singular or plural', w: ['which case it is', 'the word\'s frequency', 'its position'] },
      ],
    },

    // ───────────────────────────── Unit 3
    article: {
      title: 'The Article ὁ, ἡ, τό',
      icon: 'ὁ',
      notes: `
<p>The article means <b>"the"</b> and is the most common word in the NT (about 20,000 times). Learn it well: its endings are the
<b>same endings</b> you'll see on nouns and adjectives, so this one table unlocks a lot.</p>
<p>There is <b>no word for "a/an"</b>. ${gk('λόγος')} alone can mean "a word" (or "word"); ${gk('ὁ λόγος')} is "the word".</p>
<p>The article <b>agrees</b> with its noun in gender, case and number, so it flags the noun's job even when the noun's ending is unfamiliar.</p>
<p><b>Patterns to notice</b></p>
<ul>
<li>Everything starts with τ except the four nominatives with rough breathing: ${gk('ὁ, ἡ, οἱ, αἱ')}.</li>
<li>Every dative has an ι (as iota subscript in the singular: ${gk('τῷ, τῇ')}).</li>
<li>The genitive plural is ${gk('τῶν')} for all three genders.</li>
<li>Neuter nominative = neuter accusative (${gk('τό / τό, τά / τά')}).</li>
</ul>
<p class="tip">💡 Chant it in rows across: ὁ ἡ τό · τοῦ τῆς τοῦ · τῷ τῇ τῷ · τόν τήν τό. Rhythm makes paradigms stick.</p>`,
      paradigms: [
        mfn('ὁ', 'Article — singular', 'Sg', ['ὁ', 'τοῦ', 'τῷ', 'τόν'], ['ἡ', 'τῆς', 'τῇ', 'τήν'], ['τό', 'τοῦ', 'τῷ', 'τό']),
        mfn('ὁ', 'Article — plural', 'Pl', ['οἱ', 'τῶν', 'τοῖς', 'τούς'], ['αἱ', 'τῶν', 'ταῖς', 'τάς'], ['τά', 'τῶν', 'τοῖς', 'τά']),
      ],
      concepts: [
        { q: 'Does Greek have an indefinite article ("a, an")?', a: 'No', w: ['Yes: ὁ', 'Yes: τό', 'Only in the plural'] },
        { q: 'The article agrees with its noun in…', a: 'gender, case and number', w: ['case only', 'gender only', 'nothing — it never changes'] },
        { q: `How can ${gk('λόγος')} (no article) be translated?`, a: '"a word" or "word"', w: ['only "the word"', '"words"', '"of a word"'] },
        { q: 'Which article form is the genitive plural for ALL genders?', a: gk('τῶν'), w: [gk('τοῖς'), gk('τούς'), gk('ταῖς')] },
        { q: 'In the neuter, which two cases always look identical?', a: 'nominative and accusative', w: ['genitive and dative', 'nominative and genitive', 'dative and accusative'] },
        { q: 'Which forms of the article begin with a rough breathing instead of τ?', a: gk('ὁ, ἡ, οἱ, αἱ'), w: [gk('τοῦ, τῆς, τῶν'), gk('τό, τά'), gk('τῷ, τῇ, τοῖς')] },
        { q: `With a name, as in ${gk('ὁ Ἰησοῦς')}, the article is normally…`, a: 'left untranslated', w: ['translated "the Jesus"', 'translated "a"', 'a sign of the plural'] },
        { q: 'Every dative form of the article contains which letter?', a: 'ι (iota, sometimes subscript)', w: ['ν (nu)', 'σ (sigma)', 'ω (omega)'] },
      ],
      phrases: [
        ['ὁ λόγος', 'the word'], ['ἡ ἡμέρα', 'the day'], ['τὸ ἔργον', 'the work'], ['οἱ ἄνθρωποι', 'the people'],
        ['τοῦ θεοῦ', 'of God'], ['τῷ κυρίῳ', 'to the Lord'], ['αἱ ἡμέραι', 'the days'], ['τὰ ἔργα', 'the works'],
      ],
    },

    n2m: {
      title: '2nd Declension: λόγος',
      icon: 'λ',
      notes: `
<p>The <b>second declension</b> (the "o-declension") is the most common noun pattern. Most of its nouns end in <b>-ος</b> and are masculine.</p>
<table class="ref"><tr><th></th><th>Sg ending</th><th>Pl ending</th></tr>
<tr><td>Nom</td><td>-ος</td><td>-οι</td></tr><tr><td>Gen</td><td>-ου</td><td>-ων</td></tr>
<tr><td>Dat</td><td>-ῳ</td><td>-οις</td></tr><tr><td>Acc</td><td>-ον</td><td>-ους</td></tr><tr><td>Voc</td><td>-ε</td><td>-οι</td></tr></table>
<p>Compare the masculine article: ${gk('ὁ λόγος, τοῦ λόγου, τῷ λόγῳ, τὸν λόγον · οἱ λόγοι, τῶν λόγων, τοῖς λόγοις, τοὺς λόγους')}. The noun endings echo the article.</p>
<p>A few -ος nouns are feminine, e.g. ${gk('ἡ ὁδός')} "the way". The article tells you.</p>
<p><b>Find the stem</b> by removing the genitive ending: ${gk('λόγου')} → ${gk('λογ-')}.</p>
<p class="tip">💡 Real NT: ${gk('ὁ υἱὸς τοῦ ἀνθρώπου')} "the Son of Man" puts a nominative and a genitive side by side.</p>`,
      paradigms: [
        noun('λόγος', 'λόγος, word', ['λόγος', 'λόγου', 'λόγῳ', 'λόγον', 'λόγε'], ['λόγοι', 'λόγων', 'λόγοις', 'λόγους', 'λόγοι'], C5),
        noun('ἄνθρωπος', 'ἄνθρωπος, person', ['ἄνθρωπος', 'ἀνθρώπου', 'ἀνθρώπῳ', 'ἄνθρωπον', 'ἄνθρωπε'], ['ἄνθρωποι', 'ἀνθρώπων', 'ἀνθρώποις', 'ἀνθρώπους', 'ἄνθρωποι'], C5),
      ],
      concepts: [
        { q: 'The 2nd declension genitive singular ending is…', a: '-ου', w: ['-ῳ', '-ον', '-ος'] },
        { q: 'The 2nd declension accusative plural ending is…', a: '-ους', w: ['-οις', '-οι', '-ων'] },
        { q: 'The 2nd declension dative singular ending is…', a: '-ῳ', w: ['-ου', '-οις', '-ε'] },
        { q: 'Which ending marks the nominative plural?', a: '-οι', w: ['-ους', '-ων', '-ος'] },
        { q: `What is ${gk('κύριε')}?`, a: 'vocative singular: "O Lord!"', w: ['nominative plural', 'dative singular', 'genitive singular'] },
        { q: `${gk('ἡ ὁδός')} is…`, a: 'a feminine 2nd-declension noun', w: ['masculine, like λόγος', 'neuter', 'a verb'], ex: 'The article ἡ shows it is feminine even though it ends in -ος.' },
        { q: 'To find a noun\'s stem, remove…', a: 'the genitive singular ending', w: ['the article', 'the accent', 'the first letter'] },
        { q: `Why does ${gk('ἄνθρωπος')} become ${gk('ἀνθρώπου')} (accent moves)?`, a: 'a long final syllable pulls the accent forward', w: ['it changes meaning', 'it becomes plural', 'it is a typo'] },
      ],
      phrases: [
        ['ὁ λόγος τοῦ θεοῦ', 'the word of God'], ['ὁ υἱὸς τοῦ ἀνθρώπου', 'the Son of Man'], ['οἱ ἀδελφοί', 'the brothers'],
        ['τοῖς ἀνθρώποις', 'to/for the people'], ['τὸν κύριον', 'the Lord (as object)'], ['κύριε', 'O Lord!'],
        ['τοὺς ἀδελφούς', 'the brothers (as object)'], ['τῷ θεῷ', 'to/for God'],
      ],
    },

    n2n: {
      title: '2nd Declension Neuter: ἔργον',
      icon: 'ἔ',
      notes: `
<p>Neuter nouns of the second declension end in <b>-ον</b>. They use the same endings as λόγος except in the nominative and accusative.</p>
<p><b>The neuter rules</b> (true for ALL neuter words in Greek):</p>
<ol><li>Nominative and accusative are identical.</li><li>The nominative/accusative plural ends in <b>-α</b>.</li></ol>
<p>So ${gk('τὰ τέκνα')} could be subject or object, and context decides.</p>
<p>Quirk: a neuter plural subject often takes a <b>singular</b> verb (Greek thinks of "the works" as a collective).</p>
<p class="tip">💡 Memory hook: neuters are "neutral", the same going in (subject) as coming out (object).</p>`,
      paradigms: [
        noun('ἔργον', 'ἔργον, work', ['ἔργον', 'ἔργου', 'ἔργῳ', 'ἔργον'], ['ἔργα', 'ἔργων', 'ἔργοις', 'ἔργα']),
        noun('τέκνον', 'τέκνον, child', ['τέκνον', 'τέκνου', 'τέκνῳ', 'τέκνον'], ['τέκνα', 'τέκνων', 'τέκνοις', 'τέκνα']),
      ],
      concepts: [
        { q: 'In neuter nouns, which cases are identical?', a: 'nominative and accusative', w: ['genitive and dative', 'dative and accusative', 'none'] },
        { q: 'The neuter nominative/accusative plural ends in…', a: '-α', w: ['-οι', '-ους', '-ες'] },
        { q: `${gk('τὰ τέκνα')} could be…`, a: 'nominative or accusative plural', w: ['genitive singular', 'dative plural', 'only vocative'] },
        { q: 'A neuter plural subject often takes…', a: 'a singular verb', w: ['no verb', 'a dative verb', 'a future verb'] },
        { q: 'The neuter 2nd declension dative plural is…', a: '-οις', w: ['-α', '-ων', '-ους'] },
        { q: 'The neuter genitive singular ending is the same as λόγος\'s:', a: '-ου', w: ['-ον', '-α', '-ος'] },
      ],
      phrases: [
        ['τὰ ἔργα τοῦ θεοῦ', 'the works of God'], ['τὸ εὐαγγέλιον', 'the gospel'], ['τὰ τέκνα τοῦ θεοῦ', 'the children of God'],
        ['ἐν τῷ ἱερῷ', 'in the temple'], ['τὸ ἔργον τοῦ κυρίου', 'the work of the Lord'], ['τοῖς τέκνοις', 'to/for the children'],
      ],
    },

    n1: {
      title: '1st Declension: ἡμέρα, γραφή, δόξα',
      icon: 'ἡ',
      notes: `
<p>The <b>first declension</b> (the "a-declension") is mostly <b>feminine</b>. Its plural is always the same:
${gk('-αι, -ῶν, -αις, -ας')}. The singular has three flavors:</p>
<table class="ref"><tr><th></th><th>stem ends ε, ι, ρ</th><th>after σ, λλ, ζ, ξ…</th><th>otherwise</th></tr>
<tr><td>Nom</td><td>ὥρα</td><td>δόξα</td><td>γραφή</td></tr><tr><td>Gen</td><td>ὥρας</td><td>δόξης</td><td>γραφῆς</td></tr>
<tr><td>Dat</td><td>ὥρᾳ</td><td>δόξῃ</td><td>γραφῇ</td></tr><tr><td>Acc</td><td>ὥραν</td><td>δόξαν</td><td>γραφήν</td></tr></table>
<p>Rule of thumb: <b>α stays α after ε, ι, ρ</b> (${gk('ἡμέρα, καρδία, ἁμαρτία')}); otherwise η shows up.</p>
<p>A few 1st-declension nouns are <b>masculine</b> and end in -ης: ${gk('ὁ προφήτης, ὁ μαθητής')}. Their genitive singular borrows -ου.</p>
<p>⚠ ${gk('ὥρας')} can be <b>genitive singular OR accusative plural</b>. The article settles it: ${gk('τῆς ὥρας')} vs ${gk('τὰς ὥρας')}.</p>`,
      paradigms: [
        noun('ὥρα', 'ὥρα, hour', ['ὥρα', 'ὥρας', 'ὥρᾳ', 'ὥραν'], ['ὧραι', 'ὡρῶν', 'ὥραις', 'ὥρας']),
        noun('δόξα', 'δόξα, glory', ['δόξα', 'δόξης', 'δόξῃ', 'δόξαν'], ['δόξαι', 'δοξῶν', 'δόξαις', 'δόξας']),
        noun('γραφή', 'γραφή, writing / Scripture', ['γραφή', 'γραφῆς', 'γραφῇ', 'γραφήν'], ['γραφαί', 'γραφῶν', 'γραφαῖς', 'γραφάς']),
        noun('προφήτης', 'προφήτης, prophet (masc.)', ['προφήτης', 'προφήτου', 'προφήτῃ', 'προφήτην'], ['προφῆται', 'προφητῶν', 'προφήταις', 'προφήτας']),
      ],
      concepts: [
        { q: 'Most 1st declension nouns are…', a: 'feminine', w: ['masculine', 'neuter', 'verbs'] },
        { q: `${gk('ἡμέρα')} keeps α throughout the singular because its stem ends in…`, a: 'ε, ι or ρ', w: ['σ', 'a consonant cluster', 'η'] },
        { q: 'The genitive plural of every 1st declension noun ends in…', a: '-ῶν', w: ['-ας', '-αις', '-αι'] },
        { q: `${gk('ὥρας')} can be…`, a: 'genitive singular OR accusative plural', w: ['only nominative', 'dative plural', 'vocative only'] },
        { q: `${gk('προφήτης')} and ${gk('μαθητής')} are…`, a: 'masculine 1st declension nouns', w: ['feminine', 'neuter', '2nd declension'] },
        { q: 'The 1st declension plural endings are…', a: '-αι, -ων, -αις, -ας', w: ['-οι, -ων, -οις, -ους', '-α, -ων, -οις, -α', '-ες, -ων, -σι, -ας'] },
        { q: `Why does ${gk('δόξα')} have η in the genitive (${gk('δόξης')})?`, a: 'its stem ends in σ, so α only stays in nom/acc', w: ['it is plural', 'it is masculine', 'it is irregular'] },
      ],
      phrases: [
        ['ἡ βασιλεία τοῦ θεοῦ', 'the kingdom of God'], ['ἡ ζωὴ τῶν ἀνθρώπων', 'the life of men'], ['ἐν τῇ καρδίᾳ', 'in the heart'],
        ['ἡ δόξα τοῦ κυρίου', 'the glory of the Lord'], ['αἱ γραφαί', 'the Scriptures'], ['οἱ μαθηταὶ τοῦ Ἰησοῦ', 'the disciples of Jesus'],
        ['ἡ ἀγάπη τοῦ θεοῦ', 'the love of God'],
      ],
    },

    // ───────────────────────────── Unit 4
    pai: {
      title: 'Verbs: Present Active',
      icon: 'λύ',
      notes: `
<p>A Greek verb packs the <b>subject into its ending</b>. ${gk('πιστεύομεν')} is a whole sentence: "we believe".</p>
<p>Fully describing a verb = <b>parsing</b>: <b>tense</b> (present), <b>voice</b> (active), <b>mood</b> (indicative), <b>person</b> (1st/2nd/3rd), <b>number</b> (sg/pl).</p>
<table class="ref"><tr><th></th><th>Singular</th><th>Plural</th></tr>
<tr><td>1st</td><td>λύ<b>ω</b> I loose</td><td>λύ<b>ομεν</b> we loose</td></tr>
<tr><td>2nd</td><td>λύ<b>εις</b> you loose</td><td>λύ<b>ετε</b> you (pl) loose</td></tr>
<tr><td>3rd</td><td>λύ<b>ει</b> he/she/it looses</td><td>λύ<b>ουσι(ν)</b> they loose</td></tr></table>
<p>The <b>present</b> tense presents action as <b>ongoing</b>: "I loose" or "I am loosing".</p>
<p>The <b>movable ν</b> in ${gk('λύουσιν')} is added before a vowel or at the end of a sentence. It means nothing.</p>
<p>Dictionaries list verbs by the 1st singular: ${gk('λύω')} "I loose" (glossed "to loose").</p>
<p class="tip">💡 Hook for the endings: "<b>ω</b>-<b>εις</b>-<b>ει</b>, <b>ομεν</b>-<b>ετε</b>-<b>ουσι</b>". Say it ten times while walking.</p>`,
      paradigms: [
        verb('λύω', 'λύω, I loose — present active indicative', ['λύω', 'λύεις', 'λύει', 'λύομεν', 'λύετε', 'λύουσι(ν)']),
        verb('πιστεύω', 'πιστεύω, I believe — present active indicative', ['πιστεύω', 'πιστεύεις', 'πιστεύει', 'πιστεύομεν', 'πιστεύετε', 'πιστεύουσι(ν)']),
      ],
      concepts: [
        { q: `In ${gk('λύομεν')}, the ending -ομεν means the subject is…`, a: '"we" (1st plural)', w: ['"I"', '"they"', '"you (pl)"'] },
        { q: 'The present active 3rd plural ending is…', a: '-ουσι(ν)', w: ['-ομεν', '-ετε', '-ει'] },
        { q: `What does the final ν in ${gk('λύουσιν')} add to the meaning?`, a: 'nothing; it\'s the movable ν', w: ['it makes it past', 'it makes it a question', 'it marks the plural'] },
        { q: 'Why is a subject pronoun ("I", "we") often missing in Greek?', a: 'the verb ending already shows it', w: ['Greek has no pronouns', 'it is always implied by the article', 'it is in the previous verse'] },
        { q: 'The present tense mainly portrays action as…', a: 'ongoing / in progress', w: ['completed in the past', 'a simple whole event', 'future'] },
        { q: `Translate ${gk('γινώσκεις')}.`, a: 'you (sg) know', w: ['we know', 'they know', 'I know'] },
        { q: 'The five things you identify when parsing a verb are…', a: 'tense, voice, mood, person, number', w: ['case, number, gender, stem, accent', 'subject, object, verb, article, noun', 'present, past, future, perfect, aorist'] },
        { q: 'The indicative mood presents the action as…', a: 'a statement of fact', w: ['a command', 'a wish', 'a possibility'] },
      ],
      phrases: [
        ['πιστεύομεν', 'we believe'], ['λέγει', 'he says'], ['γινώσκετε', 'you (pl) know'], ['ἔχουσιν', 'they have'],
        ['ἀκούεις', 'you (sg) hear'], ['βλέπω', 'I see'], ['ἀκούουσιν τὸν λόγον', 'they hear the word'],
        ['ὁ ἄνθρωπος βλέπει τὸν κύριον', 'the man sees the Lord'],
      ],
    },

    eimi: {
      title: 'The Verb "to be": εἰμί',
      icon: 'εἰ',
      notes: `
<p>${gk('εἰμί')} is irregular and extremely common (≈2,460×). Memorize two tenses:</p>
<p><b>Present:</b> ${gk('εἰμί, εἶ, ἐστί(ν), ἐσμέν, ἐστέ, εἰσί(ν)')}<br><b>Imperfect (past):</b> ${gk('ἤμην, ἦς, ἦν, ἦμεν, ἦτε, ἦσαν')}</p>
<p>${gk('εἰμί')} is a <b>linking verb</b>: it takes no object. What follows it is a <b>predicate nominative</b>, so both sides are nominative.</p>
<p>How do you tell subject from predicate when both are nominative? The subject usually has the <b>article</b>:</p>
<p class="ex">${gk('θεὸς ἦν ὁ λόγος')} = "the Word was God" (John 1:1), not "God was the Word".</p>
<p>${gk('ἐγώ εἰμι')} "I am" is emphatic, since the verb already says "I". Jesus uses it in the great "I am" sayings of John.</p>`,
      paradigms: [
        verb('εἰμί', 'εἰμί — present', ['εἰμί', 'εἶ', 'ἐστί(ν)', 'ἐσμέν', 'ἐστέ', 'εἰσί(ν)'], 'Present'),
        verb('εἰμί', 'εἰμί — imperfect', ['ἤμην', 'ἦς', 'ἦν', 'ἦμεν', 'ἦτε', 'ἦσαν'], 'Imperfect'),
      ],
      concepts: [
        { q: `${gk('εἰμί')} takes what instead of a direct object?`, a: 'a predicate nominative', w: ['a genitive', 'an accusative', 'a dative'] },
        { q: `In ${gk('θεὸς ἦν ὁ λόγος')}, the subject is…`, a: gk('ὁ λόγος') + ' (it has the article)', w: [gk('θεός'), gk('ἦν'), 'there is none'] },
        { q: `${gk('ἦν')} means…`, a: 'he/she/it was', w: ['he is', 'they were', 'I was'] },
        { q: `${gk('ἐσμέν')} means…`, a: 'we are', w: ['you are', 'they are', 'we were'] },
        { q: `${gk('εἰσίν')} means…`, a: 'they are', w: ['he is', 'we are', 'they were'] },
        { q: `Why is ${gk('ἐγώ εἰμι')} emphatic?`, a: 'εἰμι already means "I am", so ἐγώ adds stress', w: ['it is a question', 'ἐγώ means "truly"', 'it is plural'] },
        { q: `${gk('ἦσαν')} means…`, a: 'they were', w: ['they are', 'we were', 'you were'] },
      ],
      phrases: [
        ['ἐγώ εἰμι', 'I am'], ['σὺ εἶ ὁ Χριστός', 'you are the Christ'], ['ὁ θεὸς ἀγάπη ἐστίν', 'God is love'],
        ['ἦν ὁ λόγος', 'the Word was'], ['ἐσμέν', 'we are'], ['ὑμεῖς ἐστε τὸ φῶς τοῦ κόσμου', 'you are the light of the world'],
        ['ἦσαν', 'they were'],
      ],
    },

    // ───────────────────────────── Unit 5
    preps: {
      title: 'Prepositions',
      icon: '→',
      notes: `
<p>Prepositions are small, frequent and take their object in a specific case. Some change meaning with the case.</p>
<table class="ref"><tr><th>Prep.</th><th>+ Gen</th><th>+ Dat</th><th>+ Acc</th></tr>
<tr><td>ἐν</td><td></td><td>in, on, among</td><td></td></tr>
<tr><td>εἰς</td><td></td><td></td><td>into, to</td></tr>
<tr><td>ἐκ (ἐξ)</td><td>out of, from</td><td></td><td></td></tr>
<tr><td>ἀπό</td><td>from, away from</td><td></td><td></td></tr>
<tr><td>σύν</td><td></td><td>with</td><td></td></tr>
<tr><td>πρός</td><td></td><td></td><td>to, toward, with</td></tr>
<tr><td>διά</td><td>through</td><td></td><td>because of</td></tr>
<tr><td>μετά</td><td>with</td><td></td><td>after</td></tr>
<tr><td>κατά</td><td>against, down</td><td></td><td>according to</td></tr>
<tr><td>περί</td><td>about, concerning</td><td></td><td>around</td></tr>
<tr><td>ὑπό</td><td>by (agent)</td><td></td><td>under</td></tr>
<tr><td>ὑπέρ</td><td>on behalf of</td><td></td><td>above</td></tr>
<tr><td>παρά</td><td>from</td><td>beside</td><td>alongside</td></tr>
<tr><td>ἐπί</td><td>on, over</td><td>on, at</td><td>on, to, against</td></tr></table>
<p><b>Elision:</b> a final vowel drops before a vowel and leaves an apostrophe: ${gk('δι᾽ αὐτοῦ, ἀπ᾽ ἀρχῆς, μετ᾽ αὐτοῦ')}.
${gk('ἐκ')} becomes ${gk('ἐξ')} before a vowel.</p>
<p class="tip">💡 Picture a circle: εἰς = arrow going in, ἐκ = arrow coming out, ἐν = dot inside, ἀπό = arrow leaving the edge, πρός = arrow toward.</p>`,
      concepts: [
        { q: `${gk('ἐν')} takes which case?`, a: 'Dative ("in")', w: ['Accusative', 'Genitive', 'Nominative'] },
        { q: `${gk('εἰς')} takes which case?`, a: 'Accusative ("into")', w: ['Dative', 'Genitive', 'Vocative'] },
        { q: `${gk('ἐκ')} takes which case?`, a: 'Genitive ("out of")', w: ['Dative', 'Accusative', 'Nominative'] },
        { q: `${gk('σύν')} takes which case?`, a: 'Dative ("with")', w: ['Genitive', 'Accusative', 'Nominative'] },
        { q: `${gk('διά')} + genitive means…`, a: 'through', w: ['because of', 'after', 'under'] },
        { q: `${gk('διά')} + accusative means…`, a: 'because of', w: ['through', 'with', 'against'] },
        { q: `${gk('μετά')} + accusative means…`, a: 'after', w: ['with', 'through', 'above'] },
        { q: `${gk('μετά')} + genitive means…`, a: 'with', w: ['after', 'into', 'by'] },
        { q: `${gk('κατά')} + accusative means…`, a: 'according to', w: ['against', 'through', 'beside'] },
        { q: `${gk('ὑπό')} + genitive usually expresses…`, a: 'the agent: "by"', w: ['location: "under"', 'time: "after"', 'purpose: "for"'] },
        { q: `${gk('ὑπέρ')} + genitive means…`, a: 'on behalf of', w: ['above', 'under', 'around'] },
        { q: `Why ${gk('ἐξ ὑμῶν')} instead of ${gk('ἐκ ὑμῶν')}?`, a: 'ἐκ becomes ἐξ before a vowel', w: ['ἐξ is plural', 'ἐξ means "six"', 'it is a different word'] },
        { q: `In ${gk('δι᾽ αὐτοῦ')}, the apostrophe marks…`, a: 'elision: a dropped final vowel', w: ['a question', 'a contraction of two words', 'a rough breathing'] },
      ],
      phrases: [
        ['ἐν ἀρχῇ', 'in the beginning'], ['εἰς τὸν κόσμον', 'into the world'], ['ἐκ τοῦ οὐρανοῦ', 'out of heaven'],
        ['διὰ τοῦ προφήτου', 'through the prophet'], ['μετὰ τῶν μαθητῶν', 'with the disciples'], ['κατὰ τὸν νόμον', 'according to the law'],
        ['ὑπὸ τοῦ θεοῦ', 'by God'], ['μετὰ ταῦτα', 'after these things'], ['περὶ τοῦ Ἰησοῦ', 'about Jesus'], ['σὺν αὐτῷ', 'with him'],
      ],
    },

    adj: {
      title: 'Adjectives: ἀγαθός',
      icon: '★',
      notes: `
<p>Adjectives agree with their noun in <b>gender, case and number</b>. Most are "2-1-2": masculine like λόγος (2nd decl.), feminine like γραφή (1st), neuter like ἔργον (2nd).</p>
<p>After ε, ι, ρ the feminine uses α: ${gk('ἅγιος, ἁγία, ἅγιον')}.</p>
<p><b>Three uses, decided by the article:</b></p>
<table class="ref"><tr><th>Use</th><th>Pattern</th><th>Meaning</th></tr>
<tr><td>Attributive</td><td>${gk('ὁ ἀγαθὸς λόγος')} / ${gk('ὁ λόγος ὁ ἀγαθός')}</td><td>"the good word"</td></tr>
<tr><td>Predicate</td><td>${gk('ὁ λόγος ἀγαθός')} / ${gk('ἀγαθὸς ὁ λόγος')}</td><td>"the word <b>is</b> good"</td></tr>
<tr><td>Substantival</td><td>${gk('ὁ ἀγαθός')}, ${gk('οἱ ἅγιοι')}</td><td>"the good man", "the saints"</td></tr></table>
<p>The rule: if the article sits directly <b>before the adjective</b>, it's attributive. If the adjective is <b>outside</b> the article-noun group, it's predicate, and you supply "is".</p>`,
      paradigms: [
        mfn('ἀγαθός', 'ἀγαθός — singular', 'Sg', ['ἀγαθός', 'ἀγαθοῦ', 'ἀγαθῷ', 'ἀγαθόν'], ['ἀγαθή', 'ἀγαθῆς', 'ἀγαθῇ', 'ἀγαθήν'], ['ἀγαθόν', 'ἀγαθοῦ', 'ἀγαθῷ', 'ἀγαθόν']),
        mfn('ἀγαθός', 'ἀγαθός — plural', 'Pl', ['ἀγαθοί', 'ἀγαθῶν', 'ἀγαθοῖς', 'ἀγαθούς'], ['ἀγαθαί', 'ἀγαθῶν', 'ἀγαθαῖς', 'ἀγαθάς'], ['ἀγαθά', 'ἀγαθῶν', 'ἀγαθοῖς', 'ἀγαθά']),
      ],
      concepts: [
        { q: `${gk('ὁ ἀγαθὸς λόγος')} means…`, a: 'the good word', w: ['the word is good', 'the good one speaks', 'good words'] },
        { q: `${gk('ὁ λόγος ἀγαθός')} means…`, a: 'the word is good', w: ['the good word', 'a good word', 'the word of the good'] },
        { q: `${gk('οἱ ἅγιοι')} on its own means…`, a: 'the saints / the holy ones', w: ['holy', 'the holy word', 'he is holy'] },
        { q: 'An adjective agrees with its noun in…', a: 'gender, case and number', w: ['case only', 'tense and voice', 'nothing'] },
        { q: 'In ATTRIBUTIVE position, the adjective is…', a: 'directly preceded by the article', w: ['outside the article-noun group', 'always first in the sentence', 'never next to its noun'] },
        { q: '"2-1-2 adjective" means…', a: 'masc. & neut. follow the 2nd decl., fem. the 1st', w: ['it has 2 or 1 forms', 'it only appears in 2 cases', 'it is irregular'] },
        { q: `${gk('πιστὸς ὁ θεός')} (1 Cor 1:9) means…`, a: 'God is faithful', w: ['the faithful God', 'faith in God', 'the God of faith'] },
      ],
      phrases: [
        ['ὁ ἀγαθὸς ἄνθρωπος', 'the good man'], ['ὁ ἄνθρωπος ἀγαθός', 'the man is good'], ['τὸ πνεῦμα τὸ ἅγιον', 'the Holy Spirit'],
        ['ζωὴ αἰώνιος', 'eternal life'], ['οἱ πονηροί', 'the evil ones'], ['ἡ πρώτη ἡμέρα', 'the first day'], ['πιστὸς ὁ θεός', 'God is faithful'],
      ],
    },

    pron: {
      title: 'Personal Pronouns & αὐτός',
      icon: 'ἐγ',
      notes: `
<p><b>1st & 2nd person</b> ("I, we, you"):</p>
<p>The unaccented forms ${gk('μου, μοι, με, σου, σοι, σε')} are the everyday ones. The emphatic forms ${gk('ἐμοῦ, ἐμοί, ἐμέ')} appear after prepositions (${gk('δι᾽ ἐμοῦ')}).</p>
<p>The <b>genitive</b> shows possession and usually comes after the noun: ${gk('ὁ πατήρ μου')} "my father", ${gk('ὁ κύριος ἡμῶν')} "our Lord".</p>
<p><b>αὐτός</b> has three uses:</p>
<ol><li><b>He/she/it/they</b>: ${gk('τὸ ὄνομα αὐτοῦ')} "his name". Gender follows the thing referred to.</li>
<li><b>Intensive "-self"</b>, when it stands outside the article-noun group: ${gk('αὐτὸς ὁ θεός')} "God himself".</li>
<li><b>Identical "same"</b>, when the article directly precedes it: ${gk('ὁ αὐτὸς κύριος')} "the same Lord".</li></ol>
<p>Nominative pronouns (${gk('ἐγώ, σύ')}) are <b>emphatic</b>, because the verb ending already gives the subject.</p>`,
      paradigms: [
        noun('ἐγώ', '1st person: I / we', ['ἐγώ', 'μου', 'μοι', 'με'], ['ἡμεῖς', 'ἡμῶν', 'ἡμῖν', 'ἡμᾶς']),
        noun('σύ', '2nd person: you', ['σύ', 'σου', 'σοι', 'σε'], ['ὑμεῖς', 'ὑμῶν', 'ὑμῖν', 'ὑμᾶς']),
        mfn('αὐτός', 'αὐτός — singular', 'Sg', ['αὐτός', 'αὐτοῦ', 'αὐτῷ', 'αὐτόν'], ['αὐτή', 'αὐτῆς', 'αὐτῇ', 'αὐτήν'], ['αὐτό', 'αὐτοῦ', 'αὐτῷ', 'αὐτό']),
        mfn('αὐτός', 'αὐτός — plural', 'Pl', ['αὐτοί', 'αὐτῶν', 'αὐτοῖς', 'αὐτούς'], ['αὐταί', 'αὐτῶν', 'αὐταῖς', 'αὐτάς'], ['αὐτά', 'αὐτῶν', 'αὐτοῖς', 'αὐτά']),
      ],
      concepts: [
        { q: `${gk('ὁ λόγος μου')} means…`, a: 'my word', w: ['I speak', 'the word to me', 'the word is mine'] },
        { q: `Why is ${gk('ἐγώ')} usually emphatic?`, a: 'the verb ending already shows "I"', w: ['it is rare', 'it is always first', 'it is a title'] },
        { q: `${gk('αὐτὸς ὁ θεός')} means…`, a: 'God himself', w: ['the same God', 'his God', 'he is God'] },
        { q: `${gk('ὁ αὐτὸς κύριος')} means…`, a: 'the same Lord', w: ['the Lord himself', 'his Lord', 'he is Lord'] },
        { q: `In ${gk('τὸ ὄνομα αὐτοῦ')}, ${gk('αὐτοῦ')} means…`, a: 'his', w: ['him', 'himself', 'same'] },
        { q: `${gk('ἡμῖν')} means…`, a: 'to/for us', w: ['we', 'our', 'us (object)'] },
        { q: `${gk('ὑμᾶς')} means…`, a: 'you (plural, object)', w: ['your', 'to you', 'we'] },
        { q: 'The pronoun αὐτός agrees with the word it refers to in…', a: 'gender and number', w: ['case', 'tense', 'nothing'], ex: 'Its case comes from its own job in the sentence.' },
      ],
      phrases: [
        ['ὁ πατήρ μου', 'my father'], ['ὁ κύριος ἡμῶν', 'our Lord'], ['λέγω ὑμῖν', 'I say to you'], ['ἀγαπῶ σε', 'I love you'],
        ['αὐτὸς ὁ θεός', 'God himself'], ['ὁ αὐτὸς κύριος', 'the same Lord'], ['τὸ ὄνομα αὐτοῦ', 'his name'], ['οἱ μαθηταὶ αὐτοῦ', 'his disciples'],
      ],
    },

    demo: {
      title: 'This & That: οὗτος, ἐκεῖνος',
      icon: '☝',
      notes: `
<p>${gk('οὗτος')} "this" points to something near. ${gk('ἐκεῖνος')} "that" points to something farther off. ${gk('ἐκεῖνος')} takes the same endings as αὐτός.</p>
<p>With a noun they stand in <b>predicate position</b>, outside the article-noun group:
${gk('οὗτος ὁ ἄνθρωπος')} or ${gk('ὁ ἄνθρωπος οὗτος')} = "this man".</p>
<p>On their own they act as pronouns: ${gk('οὗτος')} "this one, he", ${gk('ταῦτα')} "these things", ${gk('μετὰ ταῦτα')} "after these things".</p>
<p><b>Spotting οὗτος:</b> it begins with τ wherever the article does, and with a rough breathing where the article does (${gk('οὗτος, αὕτη, οὗτοι, αὗται')}).
The stem diphthong is <b>ου</b> when the ending has an o-sound and <b>αυ</b> when it has an a/η-sound.</p>`,
      paradigms: [
        mfn('οὗτος', 'οὗτος — singular', 'Sg', ['οὗτος', 'τούτου', 'τούτῳ', 'τοῦτον'], ['αὕτη', 'ταύτης', 'ταύτῃ', 'ταύτην'], ['τοῦτο', 'τούτου', 'τούτῳ', 'τοῦτο']),
        mfn('οὗτος', 'οὗτος — plural', 'Pl', ['οὗτοι', 'τούτων', 'τούτοις', 'τούτους'], ['αὗται', 'τούτων', 'ταύταις', 'ταύτας'], ['ταῦτα', 'τούτων', 'τούτοις', 'ταῦτα']),
      ],
      concepts: [
        { q: `${gk('οὗτος ὁ ἄνθρωπος')} means…`, a: 'this man', w: ['this is the man', 'that man', 'the man himself'] },
        { q: `${gk('ἐκείνη ἡ ἡμέρα')} means…`, a: 'that day', w: ['this day', 'the same day', 'every day'] },
        { q: `${gk('ταῦτα')} on its own means…`, a: 'these things', w: ['this man', 'those people', 'the same'] },
        { q: 'With a noun, a demonstrative stands in…', a: 'predicate position (outside article + noun)', w: ['attributive position', 'the vocative', 'front position only'] },
        { q: 'Which demonstrative points to something farther away?', a: gk('ἐκεῖνος'), w: [gk('οὗτος'), gk('αὐτός'), gk('ὅς')] },
        { q: `${gk('μετὰ ταῦτα')} means…`, a: 'after these things', w: ['with these things', 'through this', 'because of that'] },
      ],
      phrases: [
        ['οὗτος ὁ ἄνθρωπος', 'this man'], ['ἐν ἐκείνῃ τῇ ἡμέρᾳ', 'in that day'], ['μετὰ ταῦτα', 'after these things'],
        ['οὗτός ἐστιν ὁ υἱός μου', 'this is my son'], ['ταῦτα λέγει', 'he says these things'], ['ἐκεῖνοι οἱ μαθηταί', 'those disciples'],
      ],
    },

    // ───────────────────────────── Unit 6
    impf: {
      title: 'Imperfect: ongoing past',
      icon: '⏪',
      notes: `
<p>The <b>imperfect</b> describes <b>continuous or repeated past</b> action: ${gk('ἔλυον')} "I was loosing".</p>
<p>Recipe: <b>augment + present stem + secondary endings</b>.</p>
<table class="ref"><tr><th></th><th>Sg</th><th>Pl</th></tr>
<tr><td>1st</td><td>ἔ-λυ-<b>ον</b></td><td>ἐ-λύ-<b>ομεν</b></td></tr><tr><td>2nd</td><td>ἔ-λυ-<b>ες</b></td><td>ἐ-λύ-<b>ετε</b></td></tr>
<tr><td>3rd</td><td>ἔ-λυ-<b>ε(ν)</b></td><td>ἔ-λυ-<b>ον</b></td></tr></table>
<p><b>The augment</b> (ἐ-) marks <b>past time</b>, and only in the indicative:</p>
<ul><li>Before a consonant, add ε: ${gk('λύω → ἔλυον')}</li>
<li>Before a vowel, lengthen the vowel: ${gk('ἀκούω → ἤκουον, ἐγείρω → ἤγειρον')} (${gk('ἔχω → εἶχον')} is irregular)</li>
<li>Compound verbs augment <b>after</b> the preposition: ${gk('ἐκβάλλω → ἐξέβαλλον')}</li></ul>
<p>⚠ 1st singular and 3rd plural look identical (${gk('ἔλυον')}). Context decides.</p>`,
      paradigms: [
        verb('λύω', 'λύω — imperfect active indicative', ['ἔλυον', 'ἔλυες', 'ἔλυε(ν)', 'ἐλύομεν', 'ἐλύετε', 'ἔλυον']),
        verb('ἔχω', 'ἔχω — imperfect active indicative', ['εἶχον', 'εἶχες', 'εἶχε(ν)', 'εἴχομεν', 'εἴχετε', 'εἶχον']),
      ],
      concepts: [
        { q: 'The augment ἐ- signals…', a: 'past time (in the indicative)', w: ['future time', 'a command', 'the plural'] },
        { q: `${gk('ἔλυον')} could be…`, a: '1st singular or 3rd plural', w: ['only 1st singular', '2nd plural', 'a noun'] },
        { q: `The imperfect of ${gk('ἀκούω')} begins…`, a: gk('ἤκου-') + ' (vowel lengthened)', w: [gk('ἐακου-'), gk('ἀκου-') + ' (no change)', gk('εἰκου-')] },
        { q: `The imperfect of ${gk('ἐκβάλλω')} is…`, a: gk('ἐξέβαλλον'), w: [gk('ἐεκβάλλον'), gk('ἐκβάλλον'), gk('ἤκβαλλον')] },
        { q: 'The imperfect portrays past action as…', a: 'continuous or repeated', w: ['a single complete event', 'completed with results', 'future'] },
        { q: `${gk('ἐδίδασκεν')} means…`, a: 'he was teaching', w: ['he teaches', 'he taught (once)', 'he will teach'] },
      ],
      phrases: [
        ['ἐδίδασκεν', 'he was teaching'], ['ἐλέγομεν', 'we were saying'], ['ἐπιστεύετε', 'you (pl) were believing'],
        ['ἔβλεπες', 'you (sg) were seeing'], ['ἐδίδασκεν αὐτοὺς ἐν τῷ ἱερῷ', 'he was teaching them in the temple'],
        ['ἤκουον τὸν λόγον', 'they were hearing the word'],
      ],
    },

    fut: {
      title: 'Future Tense',
      icon: '⏩',
      notes: `
<p>Future active = <b>stem + σ + present endings</b>: ${gk('λύσω')} "I will loose".</p>
<p><b>Consonant + σ</b> (the "square of stops"):</p>
<table class="ref"><tr><th>Stem ends in</th><th>+ σ =</th><th>Example</th></tr>
<tr><td>π β φ (labials)</td><td>ψ</td><td>${gk('βλέπω → βλέψω')}, ${gk('πέμπω → πέμψω')}</td></tr>
<tr><td>κ γ χ (velars)</td><td>ξ</td><td>${gk('ἄγω → ἄξω')}, ${gk('κηρύσσω → κηρύξω')}</td></tr>
<tr><td>τ δ θ ζ (dentals)</td><td>drops out</td><td>${gk('βαπτίζω → βαπτίσω')}, ${gk('σῴζω → σώσω')}</td></tr></table>
<p>Contract verbs lengthen their vowel: ${gk('ἀγαπάω → ἀγαπήσω, ποιέω → ποιήσω, πληρόω → πληρώσω')}.</p>
<p>Some verbs have <b>middle-form futures</b> with active meaning: ${gk('ἔσομαι')} (εἰμί) "I will be", ${gk('λήμψομαι')} (λαμβάνω), ${gk('γνώσομαι')} (γινώσκω), ${gk('ἐλεύσομαι')} (ἔρχομαι), ${gk('ὄψομαι')} (ὁράω).</p>
<p class="ex">${gk('αὐτὸς γὰρ σώσει τὸν λαὸν αὐτοῦ')} "for he will save his people" (Matt 1:21)</p>`,
      paradigms: [
        verb('λύω', 'λύω — future active indicative', ['λύσω', 'λύσεις', 'λύσει', 'λύσομεν', 'λύσετε', 'λύσουσι(ν)'], 'Future'),
        verb('εἰμί', 'εἰμί — future', ['ἔσομαι', 'ἔσῃ', 'ἔσται', 'ἐσόμεθα', 'ἔσεσθε', 'ἔσονται'], 'Future'),
      ],
      concepts: [
        { q: 'The sign of the future active is…', a: 'σ added to the stem', w: ['the augment ε-', 'reduplication', 'θη'] },
        { q: `${gk('βλέψω')} comes from ${gk('βλέπω')} because…`, a: 'π + σ = ψ', w: ['ψ means future', 'it is irregular', 'β + σ = ψ only'] },
        { q: `Why is ${gk('κηρύξω')} spelled with ξ?`, a: 'velar (κ/γ/χ) + σ = ξ', w: ['ξ marks the plural', 'it is a noun', 'dental + σ = ξ'] },
        { q: `${gk('ἀγαπήσω')} shows that contract verbs…`, a: 'lengthen their stem vowel before σ', w: ['lose their stem', 'take an augment', 'have no future'] },
        { q: `${gk('ἔσται')} means…`, a: 'he/she/it will be', w: ['he is', 'he was', 'they will be'] },
        { q: `${gk('σώσει')} means…`, a: 'he will save', w: ['he saves', 'he saved', 'save!'] },
      ],
      phrases: [
        ['λύσω', 'I will loose'], ['πιστεύσομεν', 'we will believe'], ['βλέψεις', 'you (sg) will see'],
        ['σώσει τὸν λαὸν αὐτοῦ', 'he will save his people'], ['ἔσονται', 'they will be'], ['ἀγαπήσεις τὸν κύριον', 'you will love the Lord'],
        ['κηρύξουσιν', 'they will preach'],
      ],
    },

    aor1: {
      title: 'First Aorist: ἔλυσα',
      icon: '⏮',
      notes: `
<p>The <b>aorist</b> is the main past tense of NT narrative. It views an action <b>as a whole</b>, a simple event ("I loosed"), without dwelling on its progress.</p>
<p>First aorist indicative = <b>augment + stem + σα + endings</b>:</p>
<table class="ref"><tr><th></th><th>Sg</th><th>Pl</th></tr>
<tr><td>1st</td><td>ἔ-λυ-<b>σα</b></td><td>ἐ-λύ-<b>σαμεν</b></td></tr><tr><td>2nd</td><td>ἔ-λυ-<b>σας</b></td><td>ἐ-λύ-<b>σατε</b></td></tr>
<tr><td>3rd</td><td>ἔ-λυ-<b>σε(ν)</b></td><td>ἔ-λυ-<b>σαν</b></td></tr></table>
<p>Same consonant changes as the future: ${gk('ἔβλεψα, ἐκήρυξα, ἐβάπτισα')}; contract verbs lengthen: ${gk('ἠγάπησα, ἐποίησα')}.</p>
<p><b>Liquid aorists</b> (stems in λ, μ, ν, ρ) drop the σ: ${gk('μένω → ἔμεινα, ἀποστέλλω → ἀπέστειλα')}.</p>
<p>⚠ Outside the indicative (subjunctive, infinitive, participle) there's <b>no augment</b>, and the aorist shows <b>aspect only</b>, not time.</p>`,
      paradigms: [
        verb('λύω', 'λύω — aorist active indicative', ['ἔλυσα', 'ἔλυσας', 'ἔλυσε(ν)', 'ἐλύσαμεν', 'ἐλύσατε', 'ἔλυσαν'], 'Aorist'),
        verb('ἀγαπάω', 'ἀγαπάω — aorist active indicative', ['ἠγάπησα', 'ἠγάπησας', 'ἠγάπησε(ν)', 'ἠγαπήσαμεν', 'ἠγαπήσατε', 'ἠγάπησαν'], 'Aorist'),
      ],
      concepts: [
        { q: 'The aorist views an action…', a: 'as a whole, simple event', w: ['as ongoing', 'as completed with lasting results', 'as future'] },
        { q: 'The key marker of the first aorist active is…', a: 'σα', w: ['θη', 'κα', 'ομεν'] },
        { q: `${gk('ἐπίστευσαν')} means…`, a: 'they believed', w: ['they believe', 'they were believing', 'they will believe'] },
        { q: `${gk('ἠγάπησεν')} means…`, a: 'he loved', w: ['he loves', 'he will love', 'love!'] },
        { q: `${gk('ἔμεινα')} has no σ because…`, a: 'μένω is a liquid verb', w: ['it is imperfect', 'it is passive', 'it is a typo'] },
        { q: 'Does the aorist have an augment outside the indicative?', a: 'No', w: ['Yes, always', 'Only in the plural', 'Only in participles'] },
      ],
      phrases: [
        ['ἐπίστευσαν', 'they believed'], ['ἠγάπησεν', 'he loved'], ['ἐκήρυξα', 'I preached'], ['ἐδοξάσαμεν', 'we glorified'],
        ['ἐβάπτισεν αὐτούς', 'he baptized them'], ['ἀπέστειλεν τὸν υἱὸν αὐτοῦ', 'he sent his son'],
      ],
    },

    aor2: {
      title: 'Second Aorist: ἔλαβον',
      icon: '⏮',
      notes: `
<p>Many common verbs form their aorist from a <b>different stem</b> with imperfect-style endings (-ον, -ες, -ε(ν)…).
The aorist ${gk('ἔλαβον')} and the imperfect ${gk('ἐλάμβανον')} differ only in the <b>stem</b>.</p>
<table class="ref"><tr><th>Present</th><th>2nd aorist</th><th></th></tr>
<tr><td>λαμβάνω</td><td>ἔλαβον</td><td>I took</td></tr>
<tr><td>βάλλω</td><td>ἔβαλον</td><td>I threw</td></tr>
<tr><td>ἔρχομαι</td><td>ἦλθον</td><td>I came</td></tr>
<tr><td>λέγω</td><td>εἶπον</td><td>I said</td></tr>
<tr><td>ὁράω</td><td>εἶδον</td><td>I saw</td></tr>
<tr><td>ἐσθίω</td><td>ἔφαγον</td><td>I ate</td></tr>
<tr><td>ἔχω</td><td>ἔσχον</td><td>I had</td></tr>
<tr><td>εὑρίσκω</td><td>εὗρον</td><td>I found</td></tr>
<tr><td>ἀποθνῄσκω</td><td>ἀπέθανον</td><td>I died</td></tr>
<tr><td>πίπτω</td><td>ἔπεσον</td><td>I fell</td></tr>
<tr><td>γίνομαι</td><td>ἐγενόμην</td><td>I became</td></tr>
<tr><td>γινώσκω</td><td>ἔγνων</td><td>I knew</td></tr></table>
<p class="tip">💡 These must simply be memorized, but they're among the most frequent forms in the Gospels (${gk('εἶπεν')} "he said" appears hundreds of times). Flash them daily.</p>`,
      paradigms: [
        verb('λαμβάνω', 'λαμβάνω — 2nd aorist active indicative', ['ἔλαβον', 'ἔλαβες', 'ἔλαβε(ν)', 'ἐλάβομεν', 'ἐλάβετε', 'ἔλαβον'], 'Aorist'),
        verb('ἔρχομαι', 'ἔρχομαι — 2nd aorist active indicative', ['ἦλθον', 'ἦλθες', 'ἦλθε(ν)', 'ἤλθομεν', 'ἤλθετε', 'ἦλθον'], 'Aorist'),
      ],
      concepts: [
        { q: `${gk('εἶπεν')} comes from…`, a: gk('λέγω'), w: [gk('εἰμί'), gk('ἔπω'), gk('πίνω')] },
        { q: `${gk('ἦλθεν')} comes from…`, a: gk('ἔρχομαι'), w: [gk('ἐλαύνω'), gk('ἔχω'), gk('ἐλπίζω')] },
        { q: `${gk('εἶδον')} comes from…`, a: gk('ὁράω'), w: [gk('οἶδα'), gk('δίδωμι'), gk('εἰμί')] },
        { q: `${gk('ἔφαγον')} comes from…`, a: gk('ἐσθίω'), w: [gk('φαίνω'), gk('φέρω'), gk('φεύγω')] },
        { q: `${gk('ἔσχον')} comes from…`, a: gk('ἔχω'), w: [gk('σῴζω'), gk('ἵστημι'), gk('σχίζω')] },
        { q: `${gk('ἀπέθανεν')} comes from…`, a: gk('ἀποθνῄσκω'), w: [gk('ἀποστέλλω'), gk('θάπτω'), gk('ἀπέρχομαι')] },
        { q: `${gk('ἐγένετο')} comes from…`, a: gk('γίνομαι'), w: [gk('γινώσκω'), gk('γεννάω'), gk('γράφω')] },
        { q: `${gk('ἔγνω')} comes from…`, a: gk('γινώσκω'), w: [gk('γίνομαι'), gk('γεννάω'), gk('ἀναγινώσκω')] },
        { q: `How do you tell aorist ${gk('ἔλαβον')} from imperfect ${gk('ἐλάμβανον')}?`, a: 'by the stem (λαβ- vs λαμβαν-)', w: ['by the ending', 'by the augment', 'you cannot'] },
        { q: `${gk('εὗρον')} comes from…`, a: gk('εὑρίσκω'), w: [gk('ῥέω'), gk('ἐρωτάω'), gk('αἴρω')] },
        { q: `${gk('ἔπεσεν')} comes from…`, a: gk('πίπτω'), w: [gk('πέμπω'), gk('πείθω'), gk('πίνω')] },
      ],
      phrases: [
        ['εἶπεν αὐτοῖς', 'he said to them'], ['ἦλθεν εἰς τὴν πόλιν', 'he came into the city'], ['εἴδομεν τὸν κύριον', 'we saw the Lord'],
        ['ἀπέθανεν', 'he died'], ['ἐγένετο', 'it happened / he became'], ['ἔλαβεν τὸν ἄρτον', 'he took the bread'],
      ],
    },

    contract: {
      title: 'Contract Verbs',
      icon: '⇄',
      notes: `
<p>Verbs whose stems end in <b>α, ε, ο</b> "contract": the stem vowel merges with the ending's vowel.
Dictionaries list them uncontracted (${gk('ποιέω')}), but the text shows contracted forms (${gk('ποιῶ')}).</p>
<table class="ref"><tr><th>Rule</th><th>Example</th></tr>
<tr><td>ε + ε → ει</td><td>ποιέ-ετε → ποιεῖτε</td></tr>
<tr><td>ε + ο → ου</td><td>ποιέ-ομεν → ποιοῦμεν</td></tr>
<tr><td>α + ο/ω → ω</td><td>ἀγαπά-ομεν → ἀγαπῶμεν</td></tr>
<tr><td>α + ε → α</td><td>ἀγαπά-ετε → ἀγαπᾶτε</td></tr>
<tr><td>α + ει → ᾳ</td><td>ἀγαπά-ει → ἀγαπᾷ</td></tr>
<tr><td>ο + ε/ο/ου → ου</td><td>πληρό-ομεν → πληροῦμεν</td></tr>
<tr><td>ο + ει → οι</td><td>πληρό-ει → πληροῖ</td></tr></table>
<p>Contracted forms usually carry a <b>circumflex</b> (ῶ, εῖ, οῦ), which is a good clue. In other tenses the vowel simply lengthens: ${gk('ἀγαπήσω, ποιήσω, πληρώσω')}.</p>`,
      paradigms: [
        verb('ἀγαπάω', 'ἀγαπάω — present active', ['ἀγαπῶ', 'ἀγαπᾷς', 'ἀγαπᾷ', 'ἀγαπῶμεν', 'ἀγαπᾶτε', 'ἀγαπῶσι(ν)']),
        verb('ποιέω', 'ποιέω — present active', ['ποιῶ', 'ποιεῖς', 'ποιεῖ', 'ποιοῦμεν', 'ποιεῖτε', 'ποιοῦσι(ν)']),
        verb('πληρόω', 'πληρόω — present active', ['πληρῶ', 'πληροῖς', 'πληροῖ', 'πληροῦμεν', 'πληροῦτε', 'πληροῦσι(ν)']),
      ],
      concepts: [
        { q: 'ε + ο contracts to…', a: 'ου', w: ['ει', 'ω', 'οι'] },
        { q: 'ε + ε contracts to…', a: 'ει', w: ['η', 'ου', 'ε'] },
        { q: 'α + ο contracts to…', a: 'ω', w: ['ου', 'α', 'οι'] },
        { q: `${gk('ποιεῖ')} means…`, a: 'he does / makes', w: ['I do', 'they do', 'do!'] },
        { q: `Why does the dictionary list ${gk('ἀγαπάω')} uncontracted?`, a: 'to show the stem vowel (α)', w: ['it is never contracted', 'it is older Greek', 'it is a noun'] },
        { q: 'A strong visual clue for a contracted form is…', a: 'a circumflex accent on the ending', w: ['an augment', 'a rough breathing', 'a σ'] },
      ],
      phrases: [
        ['ἀγαπῶμεν', 'we love'], ['ποιεῖ', 'he does'], ['λαλοῦσιν', 'they speak'], ['ζητεῖτε', 'you (pl) seek'],
        ['τηρεῖ τὸν λόγον', 'he keeps the word'], ['τί ποιεῖς;', 'what are you doing?'],
      ],
    },

    // ───────────────────────────── Unit 7
    mp: {
      title: 'Middle & Passive Voice',
      icon: '↺',
      notes: `
<p><b>Voice</b> = how the subject relates to the action:</p>
<ul><li><b>Active</b>: the subject acts. ${gk('λύω')} "I loose"</li>
<li><b>Passive</b>: the subject is acted upon. ${gk('λύομαι')} "I am loosed"</li>
<li><b>Middle</b>: the subject acts with self-involvement, for or on itself. ${gk('λύομαι')} "I loose (for myself)"</li></ul>
<p>In the present (and imperfect), middle and passive forms are <b>identical</b>. Context decides.</p>
<table class="ref"><tr><th></th><th>Sg</th><th>Pl</th></tr>
<tr><td>1st</td><td>λύ<b>ομαι</b></td><td>λυ<b>όμεθα</b></td></tr><tr><td>2nd</td><td>λύ<b>ῃ</b></td><td>λύ<b>εσθε</b></td></tr>
<tr><td>3rd</td><td>λύ<b>εται</b></td><td>λύ<b>ονται</b></td></tr></table>
<p><b>Deponent verbs</b> have middle/passive forms but <b>active meaning</b>, and their dictionary form ends in -ομαι:
${gk('ἔρχομαι')} "I come", ${gk('γίνομαι')} "I become", ${gk('πορεύομαι')} "I go", ${gk('ἀποκρίνομαι')} "I answer".</p>
<p><b>Agent</b> of a passive: ${gk('ὑπό')} + genitive for a person ("by God"); a bare dative for an instrument ("by grace").</p>`,
      paradigms: [
        verb('λύω', 'λύω — present middle/passive indicative', ['λύομαι', 'λύῃ', 'λύεται', 'λυόμεθα', 'λύεσθε', 'λύονται']),
        verb('ἔρχομαι', 'ἔρχομαι — present (deponent)', ['ἔρχομαι', 'ἔρχῃ', 'ἔρχεται', 'ἐρχόμεθα', 'ἔρχεσθε', 'ἔρχονται']),
      ],
      concepts: [
        { q: 'In the passive voice, the subject…', a: 'receives the action', w: ['does the action', 'gives a command', 'is always plural'] },
        { q: 'In the middle voice, the subject…', a: 'acts with self-involvement', w: ['receives the action', 'is absent', 'acts in the future'] },
        { q: 'In the present tense, middle and passive forms are…', a: 'identical', w: ['completely different', 'only different in the plural', 'not used'] },
        { q: 'A deponent verb is…', a: 'middle/passive in form, active in meaning', w: ['active in form, passive in meaning', 'a verb with no present tense', 'a contract verb'] },
        { q: `${gk('ὑπὸ τοῦ θεοῦ')} with a passive verb expresses…`, a: 'the personal agent: "by God"', w: ['location: "under God"', 'purpose', 'time'] },
        { q: `${gk('ἔρχεται')} means…`, a: 'he comes', w: ['he is being come', 'he came', 'they come'] },
        { q: 'The 2nd singular middle/passive ending -ῃ came from…', a: '-εσαι (σ dropped, vowels contracted)', w: ['-ει', '-ησ', 'nothing; it is irregular'] },
      ],
      phrases: [
        ['ἔρχεται', 'he comes'], ['πορευόμεθα', 'we go'], ['λύονται', 'they are being loosed'], ['γίνεται', 'it happens'],
        ['σῴζεσθε', 'you (pl) are being saved'], ['δύναμαι', 'I am able'], ['ἀποκρίνεται αὐτῷ', 'he answers him'],
      ],
    },

    aorp: {
      title: 'Aorist Passive & Middle',
      icon: '↺',
      notes: `
<p><b>Aorist passive</b> = augment + stem + <b>θη</b> + active-type endings: ${gk('ἐλύθην')} "I was loosed". The <b>θη</b> is unmistakable.</p>
<p>Some verbs drop the θ ("2nd aorist passive"): ${gk('ἐγράφη')} "it was written", ${gk('ἀπεστάλη')} "he was sent".</p>
<p>Stem changes before θ: ${gk('βαπτίζω → ἐβαπτίσθην')}, ${gk('ἐγείρω → ἠγέρθην')}.</p>
<p><b>Future passive</b> = θη + σ + middle endings: ${gk('λυθήσομαι')} "I will be loosed".</p>
<p><b>Aorist middle</b> = augment + σα + middle endings: ${gk('ἐλυσάμην')}. Many deponents are aorist middles: ${gk('ἐγενόμην')} "I became".
Some deponents take passive forms: ${gk('ἀπεκρίθη')} "he answered" (not "he was answered"!).</p>
<p class="ex">${gk('ἠγέρθη')} "he has been raised" (Matt 28:6)</p>`,
      paradigms: [
        verb('λύω', 'λύω — aorist passive indicative', ['ἐλύθην', 'ἐλύθης', 'ἐλύθη', 'ἐλύθημεν', 'ἐλύθητε', 'ἐλύθησαν'], 'Aor Pass'),
        verb('λύω', 'λύω — aorist middle indicative', ['ἐλυσάμην', 'ἐλύσω', 'ἐλύσατο', 'ἐλυσάμεθα', 'ἐλύσασθε', 'ἐλύσαντο'], 'Aor Mid'),
      ],
      concepts: [
        { q: 'The marker of the aorist passive is…', a: 'θη', w: ['σα', 'κα', 'μεν'] },
        { q: `${gk('ἠγέρθη')} means…`, a: 'he was raised', w: ['he raised', 'he will rise', 'raise!'] },
        { q: `${gk('ἐγράφη')} means…`, a: 'it was written', w: ['he wrote', 'it is written', 'write!'] },
        { q: `${gk('ἀπεκρίθη')} means…`, a: 'he answered', w: ['he was answered', 'he judged', 'he was judged'], ex: 'ἀποκρίνομαι is deponent: passive form, active meaning.' },
        { q: `${gk('λυθήσομαι')} means…`, a: 'I will be loosed', w: ['I was loosed', 'I am loosing', 'I will loose'] },
        { q: `${gk('ἐλυσάμην')} is…`, a: 'aorist middle, 1st singular', w: ['aorist passive, 1st sg', 'imperfect', 'future'] },
      ],
      phrases: [
        ['ἠγέρθη', 'he was raised'], ['ἐβαπτίσθησαν', 'they were baptized'], ['ἐσώθημεν', 'we were saved'],
        ['ἐγράφη', 'it was written'], ['ἀπεκρίθη αὐτοῖς', 'he answered them'], ['ἐδοξάσθη', 'he was glorified'],
      ],
    },

    // ───────────────────────────── Unit 8
    n3: {
      title: '3rd Declension: σάρξ, ὄνομα, πόλις',
      icon: 'σ',
      notes: `
<p>The <b>third declension</b> has stems ending in a consonant (or ι/υ). The nominative often disguises the stem, so
<b>always learn the genitive</b>: ${gk('σάρξ, σαρκός')} → stem ${gk('σαρκ-')}.</p>
<table class="ref"><tr><th></th><th>Sg</th><th>Pl</th></tr>
<tr><td>Nom</td><td>-ς / —</td><td>-ες</td></tr><tr><td>Gen</td><td><b>-ος</b></td><td>-ων</td></tr>
<tr><td>Dat</td><td>-ι</td><td>-σι(ν)</td></tr><tr><td>Acc</td><td>-α / -ν</td><td>-ας</td></tr></table>
<p>⚠ The genitive singular <b>-ος</b> looks like a 2nd declension nominative. ${gk('σαρκός')} is "of flesh", not a subject!</p>
<p><b>Square of stops again:</b> κ/γ/χ + σ → ξ (${gk('σαρκ-ς → σάρξ')}); dentals drop (${gk('ἐλπιδ-ς → ἐλπίς')}, ${gk('ὀνοματ-σι → ὀνόμασι')}).</p>
<p><b>Families to know:</b></p>
<ul><li>-μα, -ματος are <b>neuter</b>: ${gk('πνεῦμα, σῶμα, ὄνομα, θέλημα, ῥῆμα')}</li>
<li>-ις, -εως are <b>feminine</b>: ${gk('πόλις, πίστις, δύναμις, κρίσις')}</li>
<li>-ηρ: ${gk('πατήρ, πατρός')}; ${gk('μήτηρ, μητρός')}; ${gk('ἀνήρ, ἀνδρός')}</li></ul>`,
      paradigms: [
        noun('σάρξ', 'σάρξ, σαρκός, flesh', ['σάρξ', 'σαρκός', 'σαρκί', 'σάρκα'], ['σάρκες', 'σαρκῶν', 'σαρξί(ν)', 'σάρκας']),
        noun('ὄνομα', 'ὄνομα, ὀνόματος, name', ['ὄνομα', 'ὀνόματος', 'ὀνόματι', 'ὄνομα'], ['ὀνόματα', 'ὀνομάτων', 'ὀνόμασι(ν)', 'ὀνόματα']),
        noun('πόλις', 'πόλις, πόλεως, city', ['πόλις', 'πόλεως', 'πόλει', 'πόλιν'], ['πόλεις', 'πόλεων', 'πόλεσι(ν)', 'πόλεις']),
        noun('πατήρ', 'πατήρ, πατρός, father', ['πατήρ', 'πατρός', 'πατρί', 'πατέρα'], ['πατέρες', 'πατέρων', 'πατράσι(ν)', 'πατέρας']),
      ],
      concepts: [
        { q: 'Why learn the genitive singular of 3rd declension nouns?', a: 'it reveals the stem', w: ['it is the most common form', 'it shows the gender', 'it has no use'] },
        { q: `The stem of ${gk('σάρξ, σαρκός')} is…`, a: gk('σαρκ-'), w: [gk('σαρξ-'), gk('σαρ-'), gk('σάρ-')] },
        { q: 'The 3rd declension genitive singular ending is…', a: '-ος', w: ['-ου', '-ι', '-ας'] },
        { q: 'The 3rd declension dative plural ending is…', a: '-σι(ν)', w: ['-οις', '-αις', '-ες'] },
        { q: `${gk('πνεῦμα, σῶμα, ὄνομα')} are all…`, a: 'neuter', w: ['masculine', 'feminine', 'verbs'] },
        { q: `${gk('πίστεως')} is…`, a: 'genitive singular of πίστις', w: ['nominative plural', 'dative singular', 'a verb'] },
        { q: `${gk('σαρκός')} looks like a nominative but is…`, a: 'genitive singular', w: ['accusative plural', 'dative singular', 'vocative'] },
        { q: `${gk('πόλει')} is…`, a: 'dative singular', w: ['nominative plural', 'genitive singular', 'a verb "he goes"'] },
      ],
      phrases: [
        ['ἡ σὰρξ καὶ τὸ αἷμα', 'the flesh and the blood'], ['τὸ ὄνομα τοῦ κυρίου', 'the name of the Lord'], ['τῷ πατρί', 'to the father'],
        ['ἐν τῇ πόλει', 'in the city'], ['τῇ χάριτι', 'by grace'], ['τὰ ἔθνη', 'the Gentiles'], ['διὰ πίστεως', 'through faith'],
        ['πνεῦμα ἅγιον', 'Holy Spirit'],
      ],
    },

    pas: {
      title: 'All & One: πᾶς, εἷς',
      icon: '∀',
      notes: `
<p>${gk('πᾶς, πᾶσα, πᾶν')} "all, every" is a "3-1-3" adjective: masc. & neut. 3rd declension, fem. 1st.</p>
<table class="ref"><tr><th>Pattern</th><th>Meaning</th></tr>
<tr><td>${gk('πᾶς ἄνθρωπος')} (no article)</td><td>every man</td></tr>
<tr><td>${gk('πάντες οἱ ἄνθρωποι')}</td><td>all the people</td></tr>
<tr><td>${gk('πᾶσα ἡ πόλις')}</td><td>the whole city</td></tr>
<tr><td>${gk('πάντες')} / ${gk('πάντα')} alone</td><td>everyone / all things</td></tr>
<tr><td>${gk('πᾶς ὁ')} + participle</td><td>everyone who…</td></tr></table>
<p>${gk('εἷς, μία, ἕν')} "one" (gen. ${gk('ἑνός, μιᾶς, ἑνός')}). ${gk('οὐδείς')} = οὐδέ + εἷς "not even one", so "no one, nothing".</p>
<p class="ex">${gk('πάντες γὰρ ἥμαρτον')} "for all have sinned" (Rom 3:23)</p>`,
      paradigms: [
        mfn('πᾶς', 'πᾶς — singular', 'Sg', ['πᾶς', 'παντός', 'παντί', 'πάντα'], ['πᾶσα', 'πάσης', 'πάσῃ', 'πᾶσαν'], ['πᾶν', 'παντός', 'παντί', 'πᾶν']),
        mfn('πᾶς', 'πᾶς — plural', 'Pl', ['πάντες', 'πάντων', 'πᾶσι(ν)', 'πάντας'], ['πᾶσαι', 'πασῶν', 'πάσαις', 'πάσας'], ['πάντα', 'πάντων', 'πᾶσι(ν)', 'πάντα']),
        mfn('εἷς', 'εἷς — "one"', 'Sg', ['εἷς', 'ἑνός', 'ἑνί', 'ἕνα'], ['μία', 'μιᾶς', 'μιᾷ', 'μίαν'], ['ἕν', 'ἑνός', 'ἑνί', 'ἕν']),
      ],
      concepts: [
        { q: `${gk('πᾶς ἄνθρωπος')} means…`, a: 'every man', w: ['all the men', 'the whole man', 'one man'] },
        { q: `${gk('πάντες')} alone means…`, a: 'all (people), everyone', w: ['all things', 'every one thing', 'the whole'] },
        { q: `${gk('πάντα')} alone usually means…`, a: 'all things', w: ['everyone', 'one', 'nothing'] },
        { q: `${gk('πᾶς ὁ πιστεύων')} means…`, a: 'everyone who believes', w: ['all believe', 'the whole faith', 'he believes all'] },
        { q: 'πᾶς is called "3-1-3" because…', a: 'masc. & neut. are 3rd decl., fem. 1st', w: ['it has 3 meanings', 'it appears 313 times', 'it is irregular'] },
        { q: `${gk('ἕν')} means…`, a: 'one (neuter)', w: ['in', 'he', 'one (masculine)'] },
        { q: `${gk('οὐδείς')} is built from…`, a: 'οὐδέ + εἷς: "not even one"', w: ['οὐ + δέ', 'οὐρανός + εἷς', 'οὖν + δείς'] },
      ],
      phrases: [
        ['πάντες ἥμαρτον', 'all sinned'], ['πᾶς ὁ πιστεύων', 'everyone who believes'], ['πάντα δι᾽ αὐτοῦ ἐγένετο', 'all things came into being through him'],
        ['εἷς θεός', 'one God'], ['οὐδεὶς ἀγαθός', 'no one is good'], ['πᾶσα ἡ πόλις', 'the whole city'],
      ],
    },

    rel: {
      title: 'Who? Which? ὅς, τίς, τις',
      icon: '?',
      notes: `
<p>The <b>relative pronoun</b> ${gk('ὅς, ἥ, ὅ')} "who, which, that" looks like the article with rough breathing and accent.
Don't confuse ${gk('ἡ')} (article, no accent) with ${gk('ἥ')} (relative).</p>
<p><b>The golden rule:</b> it agrees with its antecedent in <b>gender and number</b>, but its <b>case comes from its job in its own clause</b>.</p>
<p class="ex">${gk('ὁ λόγος ὃν ἀκούετε')} "the word <b>which</b> you hear" (John 14:24): ὅν is masculine singular like λόγος, but accusative because it's the object of ἀκούετε.</p>
<p>${gk('τίς, τί')} (always accented on the first syllable) = <b>interrogative</b> "who? what?"; ${gk('τί')} also means "why?".<br>
${gk('τις, τι')} (enclitic, usually unaccented) = <b>indefinite</b> "someone, something, a certain": ${gk('ἄνθρωπός τις')} "a certain man".</p>`,
      paradigms: [
        mfn('ὅς', 'Relative ὅς — singular', 'Sg', ['ὅς', 'οὗ', 'ᾧ', 'ὅν'], ['ἥ', 'ἧς', 'ᾗ', 'ἥν'], ['ὅ', 'οὗ', 'ᾧ', 'ὅ']),
        mfn('ὅς', 'Relative ὅς — plural', 'Pl', ['οἵ', 'ὧν', 'οἷς', 'οὕς'], ['αἵ', 'ὧν', 'αἷς', 'ἅς'], ['ἅ', 'ὧν', 'οἷς', 'ἅ']),
      ],
      concepts: [
        { q: 'The relative pronoun agrees with its antecedent in…', a: 'gender and number', w: ['case', 'tense', 'everything'] },
        { q: 'The case of a relative pronoun comes from…', a: 'its job in its own clause', w: ['its antecedent', 'the main verb', 'the preposition before it'] },
        { q: `In ${gk('ὁ λόγος ὃν ἀκούετε')}, why is ${gk('ὅν')} accusative?`, a: 'it is the object of ἀκούετε', w: ['λόγος is accusative', 'it follows a noun', 'all relatives are accusative'] },
        { q: `${gk('ἥ')} (with accent) vs ${gk('ἡ')} (no accent):`, a: 'relative pronoun vs article', w: ['both are articles', 'both are relatives', 'plural vs singular'] },
        { q: `${gk('τίς ἐστιν;')} means…`, a: 'who is it?', w: ['someone is', 'which is it', 'it is someone'] },
        { q: `In a question, ${gk('τί')} can mean…`, a: 'what? or why?', w: ['someone', 'which (relative)', 'that'] },
        { q: `${gk('ἄνθρωπός τις')} means…`, a: 'a certain man', w: ['who is the man?', 'the man who', 'every man'] },
      ],
      phrases: [
        ['ὁ λόγος ὃν ἀκούετε', 'the word which you hear'], ['ὃ ἦν ἀπ᾽ ἀρχῆς', 'that which was from the beginning'],
        ['τίς ἐστιν;', 'who is it?'], ['τί ποιεῖτε;', 'what are you doing?'], ['ἄνθρωπός τις', 'a certain man'], ['ὃς ἔχει ὦτα', 'whoever has ears'],
      ],
    },

    // ───────────────────────────── Unit 9
    inf: {
      title: 'Infinitives',
      icon: '∞',
      notes: `
<p>The <b>infinitive</b> is a verbal noun: "to loose". It has tense (aspect) and voice, but no person or number.</p>
<p>Ending clues: <b>-ειν</b> (present active; accented -εῖν = 2nd aorist), <b>-σαι</b> (aorist active), <b>-εσθαι</b> (middle/passive),
<b>-θῆναι</b> (aorist passive), <b>-ναι</b> (εἶναι "to be").</p>
<p><b>Common uses:</b></p>
<ul><li>Complementary: ${gk('θέλω ἰδεῖν')} "I want to see"; ${gk('δύναται σῶσαι')} "he is able to save"</li>
<li>Purpose: ${gk('ἦλθεν σῶσαι')} "he came to save"; ${gk('εἰς τό / τοῦ')} + inf. "in order to"</li>
<li>With article + preposition: ${gk('ἐν τῷ')} "while", ${gk('μετὰ τό')} "after", ${gk('πρὸ τοῦ')} "before", ${gk('διὰ τό')} "because"</li></ul>
<p>The "subject" of an infinitive goes in the <b>accusative</b>: ${gk('μετὰ τὸ ἐγερθῆναί με')} "after I am raised".</p>`,
      paradigms: [
        list('λύω', 'λύω — infinitives', ['Present Active', 'Present Mid/Pass', 'Aorist Active', 'Aorist Middle', 'Aorist Passive', 'Perfect Active'],
          ['λύειν', 'λύεσθαι', 'λῦσαι', 'λύσασθαι', 'λυθῆναι', 'λελυκέναι']),
      ],
      concepts: [
        { q: 'An infinitive has no…', a: 'person or number', w: ['tense', 'voice', 'meaning'] },
        { q: `${gk('λυθῆναι')} means…`, a: 'to be loosed (aorist passive)', w: ['to loose', 'he was loosed', 'loosing'] },
        { q: `${gk('εἶναι')} means…`, a: 'to be', w: ['he is', 'one', 'to go'] },
        { q: `${gk('θέλω ἰδεῖν')} means…`, a: 'I want to see', w: ['I saw', 'I want what I see', 'see what I want'] },
        { q: `${gk('ἐν τῷ')} + infinitive means…`, a: 'while…', w: ['after…', 'before…', 'because…'] },
        { q: `${gk('μετὰ τό')} + infinitive means…`, a: 'after…', w: ['while…', 'with…', 'in order to…'] },
        { q: 'The "subject" of an infinitive is in which case?', a: 'Accusative', w: ['Nominative', 'Genitive', 'Dative'] },
        { q: `${gk('πρὸ τοῦ')} + infinitive means…`, a: 'before…', w: ['after…', 'toward…', 'because…'] },
      ],
      phrases: [
        ['θέλω ἰδεῖν', 'I want to see'], ['δύναται σῶσαι', 'he is able to save'], ['ἦλθεν σῶσαι ἁμαρτωλούς', 'he came to save sinners'],
        ['ἐν τῷ σπείρειν', 'while sowing'], ['εἶναι', 'to be'], ['μετὰ τὸ ἐγερθῆναί με', 'after I am raised'],
      ],
    },

    ptc: {
      title: 'Participles',
      icon: '≈',
      notes: `
<p>A <b>participle</b> is a verbal <b>adjective</b>, part verb (tense, voice) and part adjective (case, number, gender). The NT is full of them.</p>
<p><b>Morpheme clues:</b></p>
<table class="ref"><tr><th>Kind</th><th>Marker</th><th>Example</th></tr>
<tr><td>Present active</td><td>-οντ-</td><td>λύων, λύοντος</td></tr>
<tr><td>Present mid/pass</td><td>-μεν-</td><td>λυόμενος</td></tr>
<tr><td>Aorist active</td><td>-σαντ-</td><td>λύσας, λύσαντος</td></tr>
<tr><td>Aorist passive</td><td>-θεντ-</td><td>λυθείς, λυθέντος</td></tr>
<tr><td>Perfect mid/pass</td><td>redup. + -μεν-</td><td>λελυμένος</td></tr></table>
<p><b>Two main uses:</b></p>
<ul><li><b>Adjectival</b> (with article): ${gk('ὁ πιστεύων')} "the one who believes"</li>
<li><b>Adverbial</b> (no article): ${gk('ἀκούσαντες')} "having heard / after they heard"; ${gk('λέγων')} "saying"</li></ul>
<p><b>Time is relative:</b> a present participle = action at the same time as the main verb; an aorist participle usually = action before it.</p>
<p>⚠ ${gk('λύουσι(ν)')} can be "they loose" OR the dative plural participle "to those loosing".</p>`,
      paradigms: [
        mfn('λύω', 'Present active participle — singular', 'Sg', ['λύων', 'λύοντος', 'λύοντι', 'λύοντα'], ['λύουσα', 'λυούσης', 'λυούσῃ', 'λύουσαν'], ['λῦον', 'λύοντος', 'λύοντι', 'λῦον']),
        mfn('λύω', 'Present active participle — plural', 'Pl', ['λύοντες', 'λυόντων', 'λύουσι(ν)', 'λύοντας'], ['λύουσαι', 'λυουσῶν', 'λυούσαις', 'λυούσας'], ['λύοντα', 'λυόντων', 'λύουσι(ν)', 'λύοντα']),
      ],
      concepts: [
        { q: 'A participle is a…', a: 'verbal adjective', w: ['verbal noun', 'kind of preposition', 'past tense'] },
        { q: `${gk('ὁ πιστεύων')} means…`, a: 'the one who believes', w: ['he believed', 'believe!', 'the faith'] },
        { q: 'A present participle usually shows action that is…', a: 'simultaneous with the main verb', w: ['before the main verb', 'after the main verb', 'unrelated in time'] },
        { q: 'An aorist participle usually shows action that is…', a: 'prior to the main verb', w: ['simultaneous', 'future', 'continuous'] },
        { q: 'The marker -μεν- signals a…', a: 'middle/passive participle', w: ['future participle', 'plural noun', 'active participle'] },
        { q: `${gk('ἀκούσαντες')} means…`, a: 'having heard / after hearing', w: ['while hearing', 'they hear', 'to hear'] },
        { q: `${gk('λύουσι(ν)')} can be…`, a: '3rd pl indicative OR dative pl participle', w: ['only indicative', 'only participle', 'an infinitive'] },
        { q: 'An adverbial participle (no article) can be translated with…', a: '"while, after, because, by…"', w: ['"the one who…"', '"let us…"', '"to…"'] },
      ],
      phrases: [
        ['ὁ πιστεύων', 'the one who believes'], ['ἀκούσαντες', 'having heard'], ['ὁ ἐρχόμενος', 'the one who is coming'],
        ['λέγων', 'saying'], ['ὁ πέμψας με', 'the one who sent me'], ['ἐξελθὼν εἶδεν', 'having gone out, he saw'],
      ],
    },

    subj: {
      title: 'Subjunctive Mood',
      icon: '◇',
      notes: `
<p>The <b>subjunctive</b> is the mood of <b>possibility, purpose and exhortation</b>. Its signature is the <b>lengthened connecting vowel</b>: ο→ω, ε→η.</p>
<p>Present: ${gk('λύω, λύῃς, λύῃ, λύωμεν, λύητε, λύωσι(ν)')}<br>Aorist: ${gk('λύσω, λύσῃς, λύσῃ, λύσωμεν, λύσητε, λύσωσι(ν)')}: <b>no augment</b>!</p>
<p><b>Key uses:</b></p>
<ul><li>${gk('ἵνα')} + subj. = purpose "so that": ${gk('ἵνα πιστεύσητε')}</li>
<li>${gk('ἐάν')} + subj. = "if" (a possible condition)</li>
<li>1st plural = "let us": ${gk('ἀγαπῶμεν ἀλλήλους')} "let us love one another" (1 John 4:7)</li>
<li>${gk('οὐ μή')} + aorist subj. = "never, by no means"</li>
<li>${gk('μή')} + aorist subj. = prohibition: ${gk('μὴ φοβηθῆτε')} "do not be afraid"</li></ul>
<p>⚠ ${gk('λύσω')} can be future indicative OR aorist subjunctive. Look for ἵνα / ἐάν.</p>`,
      paradigms: [
        verb('λύω', 'λύω — present active subjunctive', ['λύω', 'λύῃς', 'λύῃ', 'λύωμεν', 'λύητε', 'λύωσι(ν)'], 'Pres Subj'),
        verb('λύω', 'λύω — aorist active subjunctive', ['λύσω', 'λύσῃς', 'λύσῃ', 'λύσωμεν', 'λύσητε', 'λύσωσι(ν)'], 'Aor Subj'),
      ],
      concepts: [
        { q: 'The sign of the subjunctive is…', a: 'lengthened connecting vowel (ω/η)', w: ['the augment', 'θη', 'reduplication'] },
        { q: `${gk('ἵνα')} + subjunctive usually expresses…`, a: 'purpose: "so that"', w: ['past time', 'a command', 'cause'] },
        { q: `${gk('ἀγαπῶμεν ἀλλήλους')} means…`, a: 'let us love one another', w: ['we loved each other', 'they love us', 'love one another!'] },
        { q: `${gk('οὐ μή')} + aorist subjunctive means…`, a: 'emphatic "never"', w: ['"if not"', '"so that"', '"let us not"'] },
        { q: 'Does the aorist subjunctive have an augment?', a: 'No', w: ['Yes', 'Only in the plural', 'Only with ἵνα'] },
        { q: `${gk('ἐάν')} + subjunctive means…`, a: '"if" (possible condition)', w: ['"because"', '"after"', '"therefore"'] },
        { q: `${gk('λύσω')} can be…`, a: 'future indicative OR aorist subjunctive', w: ['only future', 'only aorist subjunctive', 'imperfect'] },
      ],
      phrases: [
        ['ἵνα πιστεύσητε', 'so that you may believe'], ['ἀγαπῶμεν ἀλλήλους', 'let us love one another'], ['ἵνα ἔχωσιν ζωήν', 'so that they may have life'],
        ['ἐὰν ἀγαπῶμεν ἀλλήλους', 'if we love one another'], ['οὐ μὴ ἀπόληται', 'he will never perish'], ['μὴ φοβηθῆτε', 'do not be afraid'],
      ],
    },

    imv: {
      title: 'Imperative: Commands',
      icon: '!',
      notes: `
<p>The <b>imperative</b> gives commands. There's a 3rd person too: "let him…".</p>
<p><b>Aspect matters:</b> a present imperative = ongoing or general command ("keep on…"); an aorist imperative = specific or simple command.</p>
<p><b>Prohibitions:</b> ${gk('μή')} + present imperative ("stop doing / don't keep doing"); ${gk('μή')} + aorist <i>subjunctive</i> ("don't start").</p>
<p>⚠ ${gk('λύετε')} can be "you loose" (indicative) or "loose!" (imperative). Context decides.</p>
<p>Common NT commands: ${gk('μετανοεῖτε')} "repent!", ${gk('ἀκολούθει μοι')} "follow me", ${gk('ἐλθέτω ἡ βασιλεία σου')} "let your kingdom come",
${gk('δός')} "give!", ${gk('ἴδε')} "behold!", ${gk('ἐγείρου')} "get up!".</p>`,
      paradigms: [
        verb('λύω', 'λύω — present active imperative', ['λῦε', 'λυέτω', 'λύετε', 'λυέτωσαν'], 'Pres Impv', IMV),
        verb('λύω', 'λύω — aorist active imperative', ['λῦσον', 'λυσάτω', 'λύσατε', 'λυσάτωσαν'], 'Aor Impv', IMV),
      ],
      concepts: [
        { q: `${gk('λύετε')} can be…`, a: 'imperative OR indicative 2nd plural', w: ['only imperative', 'only indicative', 'an infinitive'] },
        { q: `${gk('ἐλθέτω ἡ βασιλεία σου')} means…`, a: 'let your kingdom come', w: ['your kingdom came', 'your kingdom is coming', 'come to your kingdom'] },
        { q: 'A 3rd person imperative is translated…', a: '"let him/her/it…"', w: ['"you must…"', '"he will…"', '"he did…"'] },
        { q: `${gk('μετανοεῖτε')} (Mark 1:15) means…`, a: 'repent! (you plural)', w: ['they repented', 'I repent', 'to repent'] },
        { q: 'A present imperative typically commands…', a: 'ongoing or general action', w: ['a single specific act', 'nothing; it is past', 'future plans'] },
        { q: 'The aorist imperative ending -σον is…', a: '2nd singular', w: ['3rd plural', '1st singular', '2nd plural'] },
      ],
      phrases: [
        ['μετανοεῖτε', 'repent!'], ['ἀκολούθει μοι', 'follow me'], ['ἐλθέτω ἡ βασιλεία σου', 'let your kingdom come'],
        ['δὸς ἡμῖν', 'give us'], ['ἐγείρου', 'get up!'], ['πιστεύετε ἐν τῷ εὐαγγελίῳ', 'believe in the gospel'],
      ],
    },

    perf: {
      title: 'Perfect Tense',
      icon: '✓',
      notes: `
<p>The <b>perfect</b> describes a <b>completed action with continuing results</b>. ${gk('γέγραπται')}: "it has been written (and still stands written)".</p>
<p><b>Reduplication:</b> repeat the first consonant + ε: ${gk('λύω → λέλυκα')}, ${gk('πιστεύω → πεπίστευκα')}.
Vowel-initial verbs lengthen instead: ${gk('ἀγαπάω → ἠγάπηκα')}.</p>
<p>Active marker <b>κα</b>: ${gk('λέλυκα, λέλυκας, λέλυκε(ν), λελύκαμεν, λελύκατε, λελύκασι(ν)')}.
Middle/passive has no connecting vowel: ${gk('λέλυμαι, λέλυσαι, λέλυται…')}.</p>
<p>${gk('οἶδα')} "I know" is perfect in form but present in meaning.</p>
<p class="ex">${gk('τετέλεσται')} "It is finished!" (John 19:30): the work is done, and it stays done.</p>`,
      paradigms: [
        verb('λύω', 'λύω — perfect active indicative', ['λέλυκα', 'λέλυκας', 'λέλυκε(ν)', 'λελύκαμεν', 'λελύκατε', 'λελύκασι(ν)'], 'Perf Act'),
        verb('λύω', 'λύω — perfect middle/passive indicative', ['λέλυμαι', 'λέλυσαι', 'λέλυται', 'λελύμεθα', 'λέλυσθε', 'λέλυνται'], 'Perf M/P'),
      ],
      concepts: [
        { q: 'The perfect tense conveys…', a: 'completed action with continuing results', w: ['ongoing action', 'future action', 'a simple past event'] },
        { q: `The ${gk('λε-')} at the front of ${gk('λέλυκα')} is called…`, a: 'reduplication', w: ['the augment', 'elision', 'contraction'] },
        { q: 'The active perfect marker is…', a: 'κα', w: ['σα', 'θη', 'μεν'] },
        { q: `${gk('γέγραπται')} means…`, a: 'it is written (stands written)', w: ['he wrote', 'it will be written', 'write!'] },
        { q: `${gk('τετέλεσται')} means…`, a: 'it is finished', w: ['he finished', 'finish it!', 'it will end'] },
        { q: `${gk('οἶδα')} is…`, a: 'perfect in form, present in meaning: "I know"', w: ['an aorist "I saw"', 'a noun', 'future'] },
        { q: `${gk('πεπίστευκα')} means…`, a: 'I have believed', w: ['I believed (once)', 'I will believe', 'I was believing'] },
      ],
      phrases: [
        ['γέγραπται', 'it is written'], ['τετέλεσται', 'it is finished'], ['πεπιστεύκαμεν', 'we have believed'],
        ['ἑώρακεν', 'he has seen'], ['ἐγνώκαμεν', 'we have come to know'], ['γέγονεν', 'it has come to be'],
      ],
    },
  };
})();
