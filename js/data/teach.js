// Teaching beats for each grammar lesson: the master explains one small idea,
// shows it on real Greek (the part in [brackets] glows), and you try it at once.
// Each lesson is a "spell" in the apprentice wizard's spellbook.
window.KG = window.KG || {};

KG.teach = {
  cases: {
    spell: { name: 'Case Sight', icon: '👁', desc: 'See the job of every noun from its ending.' },
    beats: [
      { say: 'In English, word order shows who does what. In Greek, the <b>ending</b> does.', demo: 'ὁ θε[ὸς] ἀγαπᾷ τὸν κόσμ[ον]',
        check: { q: 'Which word is doing the loving?', a: 'θεός (ending -ος)', w: ['κόσμον (ending -ον)', 'ἀγαπᾷ', 'whichever comes first'] } },
      { say: 'Swap the order and the meaning stays the same, because the endings stay the same.', demo: 'τὸν κόσμ[ον] ἀγαπᾷ ὁ θε[ός]',
        check: { q: 'τὸν κόσμον ἀγαπᾷ ὁ θεός means…', a: 'God loves the world', w: ['The world loves God', 'God is the world', 'The world is loved by no one'] } },
      { say: 'Five cases: <b>nominative</b> = subject, <b>genitive</b> = "of", <b>dative</b> = "to/for", <b>accusative</b> = object, <b>vocative</b> = "O …!"', demo: 'λόγ[ος] · λόγ[ου] · λόγ[ῳ] · λόγ[ον] · λόγ[ε]',
        check: { q: 'The genitive case is usually translated with…', a: '"of"', w: ['"to"', '"O …!"', 'nothing'] } },
    ],
  },
  article: {
    spell: { name: 'The Pointing Word', icon: '☝', desc: 'Greek\'s word for "the": ὁ, ἡ, τό.' },
    beats: [
      { say: 'Greek has a word for "the" (ὁ, ἡ, τό) but <b>no word for "a"</b>.', demo: '[ὁ] λόγος = the word · λόγος = a word',
        check: { q: 'How do you say "a word" in Greek?', a: 'λόγος (no article)', w: ['ὁ λόγος', 'τὸ λόγος', 'ἡ λόγος'] } },
      { say: 'The article changes to match its noun, so it shows the noun\'s job before you even reach the noun.', demo: '[τοῦ] θεοῦ = of God · [τῷ] θεῷ = to God',
        check: { q: 'τῷ κυρίῳ means…', a: 'to/for the Lord', w: ['of the Lord', 'the Lord (as subject)', 'O Lord!'] } },
      { say: 'Two patterns to spot: every dative has an ι, and the genitive plural is always τῶν.', demo: 'τ[ῷ] τ[ῇ] τ[ῷ] · τ[ῶν] τ[ῶν] τ[ῶν]',
        check: { q: 'Which form is genitive plural?', a: 'τῶν', w: ['τοῖς', 'τούς', 'ταῖς'] } },
    ],
  },
  n2m: {
    spell: { name: 'Logos Form', icon: 'λ', desc: 'Decline the most common nouns: -ος, -ου, -ῳ, -ον.' },
    beats: [
      { say: 'Most masculine nouns end in -ος. Swap the ending to change the job.', demo: 'λόγ[ος] → λόγ[ου] → λόγ[ῳ] → λόγ[ον]',
        check: { q: 'Which ending says "of"?', a: '-ου', w: ['-ῳ', '-ον', '-ος'] } },
      { say: 'Plural: -οι (subject), -ων (of), -οις (to/for), -ους (object).', demo: 'λόγ[οι] · λόγ[ων] · λόγ[οις] · λόγ[ους]',
        check: { q: 'ἀδελφούς is…', a: 'accusative plural: "brothers" as the object', w: ['nominative plural', 'genitive singular', 'dative plural'] } },
      { say: 'Put a nominative and a genitive together and you get phrases like "the Son of Man".', demo: 'ὁ υἱὸς τοῦ ἀνθρώπ[ου]',
        check: { q: 'In ὁ υἱὸς τοῦ ἀνθρώπου, which words mean "of man"?', a: 'τοῦ ἀνθρώπου', w: ['ὁ υἱός', 'υἱός', 'ὁ'] } },
    ],
  },
  n2n: {
    spell: { name: 'Neutral Ground', icon: '⚖', desc: 'Neuter nouns: subject and object look alike; plural in -α.' },
    beats: [
      { say: 'Neuter nouns end in -ον, and the subject and object forms are the same.', demo: 'τὸ ἔργ[ον] (subject) = τὸ ἔργ[ον] (object)',
        check: { q: 'In neuter nouns, nominative and accusative are…', a: 'identical', w: ['different', 'always plural', 'never used'] } },
      { say: 'Neuter plurals end in -α.', demo: 'τὸ ἔργ[ον] → τὰ ἔργ[α] · τὸ τέκν[ον] → τὰ τέκν[α]',
        check: { q: 'τὰ τέκνα means…', a: 'the children', w: ['the child', 'of the child', 'to the children'] } },
    ],
  },
  n1: {
    spell: { name: 'Glory Form', icon: '✦', desc: 'Feminine nouns of the first declension.' },
    beats: [
      { say: 'Most feminine nouns end in -η or -α. The genitive adds -ς.', demo: 'ζω[ή] → ζω[ῆς] · ἡμέρ[α] → ἡμέρ[ας]',
        check: { q: 'ζωῆς means…', a: 'of life', w: ['life (as subject)', 'to life', 'lives'] } },
      { say: 'After ε, ι or ρ the α stays all the way through; otherwise η appears.', demo: 'καρδί[α], καρδί[ας] · δόξ[α], δόξ[ης]',
        check: { q: 'Why does ἡμέρα keep its α (ἡμέρας)?', a: 'its stem ends in ρ', w: ['it is plural', 'it is masculine', 'it is irregular'] } },
      { say: 'The plural is the same for all of them: -αι, -ῶν, -αις, -ας.', demo: 'γραφ[αί] · γραφ[ῶν] · γραφ[αῖς] · γραφ[άς]',
        check: { q: 'αἱ γραφαί means…', a: 'the Scriptures', w: ['of the Scripture', 'the Scripture', 'to the Scriptures'] } },
    ],
  },
  pai: {
    spell: { name: 'Verb Fire', icon: '🔥', desc: 'Make verbs act now: -ω, -εις, -ει, -ομεν, -ετε, -ουσι.' },
    beats: [
      { say: 'A Greek verb carries its subject in its ending.', demo: 'πιστεύ[ω] = I believe · πιστεύ[ομεν] = we believe',
        check: { q: 'πιστεύομεν means…', a: 'we believe', w: ['I believe', 'they believe', 'you believe'] } },
      { say: 'Singular: -ω (I), -εις (you), -ει (he/she/it).', demo: 'λέγ[ω] · λέγ[εις] · λέγ[ει]',
        check: { q: 'λέγει means…', a: 'he/she/it says', w: ['I say', 'you say', 'they say'] } },
      { say: 'Plural: -ομεν (we), -ετε (you all), -ουσι(ν) (they).', demo: 'ἔχ[ομεν] · ἔχ[ετε] · ἔχ[ουσιν]',
        check: { q: 'ἔχουσιν means…', a: 'they have', w: ['we have', 'you all have', 'he has'] } },
    ],
  },
  eimi: {
    spell: { name: 'Word of Being', icon: '✧', desc: 'εἰμί "I am" and ἦν "was".' },
    beats: [
      { say: 'εἰμί "I am" is irregular. Learn it like a chant.', demo: 'εἰμί · εἶ · ἐστί(ν) · ἐσμέν · ἐστέ · εἰσί(ν)',
        check: { q: 'ἐστίν means…', a: 'he/she/it is', w: ['I am', 'they are', 'we are'] } },
      { say: 'The past form ἦν "was" is everywhere in John.', demo: 'Ἐν ἀρχῇ [ἦν] ὁ λόγος',
        check: { q: 'ἦν means…', a: 'was', w: ['is', 'will be', 'were (plural)'] } },
      { say: 'εἰμί links two nominatives. The one with the article is the subject.', demo: 'θεὸς ἦν [ὁ λόγος] = the Word was God',
        check: { q: 'In θεὸς ἦν ὁ λόγος, the subject is…', a: 'ὁ λόγος', w: ['θεός', 'ἦν', 'there is none'] } },
    ],
  },
  preps: {
    spell: { name: 'Pathfinder', icon: '🧭', desc: 'Prepositions: in, into, out of, through…' },
    beats: [
      { say: 'ἐν = in (+ dative) · εἰς = into (+ accusative) · ἐκ = out of (+ genitive).', demo: '[ἐν] ἀρχῇ · [εἰς] τὸν κόσμον · [ἐκ] τοῦ οὐρανοῦ',
        check: { q: 'εἰς τὸν κόσμον means…', a: 'into the world', w: ['in the world', 'out of the world', 'of the world'] } },
      { say: 'Some change meaning with the case: διά + gen = through, + acc = because of; μετά + gen = with, + acc = after.', demo: '[διὰ] τοῦ προφήτου = through the prophet · [μετὰ] ταῦτα = after these things',
        check: { q: 'μετὰ ταῦτα means…', a: 'after these things', w: ['with these things', 'through these things', 'because of these things'] } },
      { say: 'Before a vowel, a final vowel often drops and leaves an apostrophe.', demo: 'δι[ὰ] αὐτοῦ → δι[᾽] αὐτοῦ',
        check: { q: 'The apostrophe in δι᾽ αὐτοῦ marks…', a: 'a dropped vowel (elision)', w: ['a question', 'possession', 'a breathing mark'] } },
    ],
  },
  adj: {
    spell: { name: 'Shape-shifter', icon: '★', desc: 'Adjectives take the shape of their nouns.' },
    beats: [
      { say: 'Adjectives match their noun in gender, case and number.', demo: 'ὁ ἀγαθ[ὸς] λόγος · ἡ ἀγαθ[ὴ] ἡμέρα · τὸ ἀγαθ[ὸν] ἔργον',
        check: { q: 'Which form goes with ἡ ἡμέρα?', a: 'ἀγαθή', w: ['ἀγαθός', 'ἀγαθόν', 'ἀγαθοῦ'] } },
      { say: 'Article right before the adjective = "the good …". Adjective outside the article = "… is good".', demo: '[ὁ ἀγαθὸς] λόγος = the good word · ὁ λόγος [ἀγαθός] = the word is good',
        check: { q: 'ὁ λόγος ἀγαθός means…', a: 'the word is good', w: ['the good word', 'a good word', 'good words'] } },
    ],
  },
  pron: {
    spell: { name: 'Name Weaving', icon: '🧵', desc: 'I, you, he; my, your, his.' },
    beats: [
      { say: 'μου = my, σου = your, αὐτοῦ = his. They come after the noun.', demo: 'ὁ πατήρ [μου] = my father · τὸ ὄνομα [αὐτοῦ] = his name',
        check: { q: 'ὁ κύριος ἡμῶν means…', a: 'our Lord', w: ['my Lord', 'your Lord', 'their Lord'] } },
      { say: 'ἐγώ and σύ add emphasis, because the verb already says "I" or "you".', demo: '[ἐγώ] εἰμι = I (myself) am',
        check: { q: 'Why add ἐγώ to εἰμι?', a: 'for emphasis', w: ['to make it plural', 'to make it past', 'Greek requires it'] } },
      { say: 'αὐτός can also mean "-self" (outside the article) or "same" (right after the article).', demo: '[αὐτὸς] ὁ θεός = God himself · ὁ [αὐτὸς] κύριος = the same Lord',
        check: { q: 'ὁ αὐτὸς κύριος means…', a: 'the same Lord', w: ['the Lord himself', 'his Lord', 'he is Lord'] } },
    ],
  },
  demo: {
    spell: { name: 'Near & Far', icon: '🔭', desc: 'This and that: οὗτος, ἐκεῖνος.' },
    beats: [
      { say: 'οὗτος = this (near); ἐκεῖνος = that (far).', demo: '[οὗτος] ὁ ἄνθρωπος = this man · [ἐκεῖνος] ὁ ἄνθρωπος = that man',
        check: { q: 'ἐκείνη ἡ ἡμέρα means…', a: 'that day', w: ['this day', 'the same day', 'every day'] } },
      { say: 'On its own, ταῦτα means "these things".', demo: 'μετὰ [ταῦτα] = after these things',
        check: { q: 'ταῦτα λέγει means…', a: 'he says these things', w: ['these men speak', 'he said that', 'this is said'] } },
    ],
  },
  impf: {
    spell: { name: 'Echo of the Past', icon: '⏪', desc: 'The imperfect: "was doing".' },
    beats: [
      { say: 'Past time is marked by the augment ἐ- on the front of the verb.', demo: 'λύω → [ἔ]λυον',
        check: { q: 'The ἐ- at the start of ἔλυον shows…', a: 'past time', w: ['plural', 'future time', 'a question'] } },
      { say: 'The imperfect pictures an ongoing past action: "was doing".', demo: 'ἐδίδασκ[εν] = he was teaching',
        check: { q: 'ἐλέγομεν means…', a: 'we were saying', w: ['we say', 'we will say', 'let us say'] } },
      { say: 'If the verb starts with a vowel, the vowel just gets longer instead.', demo: '[ἀ]κούω → [ἤ]κουον',
        check: { q: 'ἤκουον comes from…', a: 'ἀκούω', w: ['ἔχω', 'ἄγω', 'ἐκ'] } },
    ],
  },
  fut: {
    spell: { name: 'Seer\'s Sigma', icon: '⏩', desc: 'The future: add σ.' },
    beats: [
      { say: 'Future = stem + σ + the present endings.', demo: 'λύ[σ]ω = I will loose · πιστεύ[σ]ομεν = we will believe',
        check: { q: 'πιστεύσομεν means…', a: 'we will believe', w: ['we believe', 'we believed', 'let us believe'] } },
      { say: 'π/β/φ + σ makes ψ; κ/γ/χ + σ makes ξ.', demo: 'βλεπ-σω → βλέ[ψ]ω · κηρυγ-σω → κηρύ[ξ]ω',
        check: { q: 'βλέψεις comes from…', a: 'βλέπω', w: ['βάλλω', 'λείπω', 'πέμπω'] } },
    ],
  },
  aor1: {
    spell: { name: 'Lightning Past', icon: '⚡', desc: 'The aorist: a simple past, ἐ- … σα.' },
    beats: [
      { say: 'The aorist tells a past event simply: augment + stem + σα.', demo: '[ἐ]πίστευ[σα] = I believed',
        check: { q: 'ἐπίστευσαν means…', a: 'they believed', w: ['they believe', 'they were believing', 'they will believe'] } },
      { say: 'Its endings: -σα, -σας, -σε(ν), -σαμεν, -σατε, -σαν.', demo: 'ἠγάπη[σεν] = he loved',
        check: { q: 'ἠγάπησεν means…', a: 'he loved', w: ['he loves', 'we loved', 'love!'] } },
    ],
  },
  aor2: {
    spell: { name: 'Hidden Roots', icon: '🌿', desc: 'Second aorists hide new stems.' },
    beats: [
      { say: 'Some very common verbs use a different stem in the aorist. These you simply learn.', demo: 'λέγω → [εἶπ]ον · ἔρχομαι → [ἦλθ]ον',
        check: { q: 'εἶπεν means…', a: 'he said', w: ['he says', 'he came', 'he saw'] } },
      { say: 'More: ὁράω → εἶδον (I saw), λαμβάνω → ἔλαβον (I took), γίνομαι → ἐγενόμην (I became).', demo: '[εἶδ]ον · [ἔλαβ]ον · [ἐγεν]όμην',
        check: { q: 'ἦλθεν means…', a: 'he came', w: ['he said', 'he took', 'he saw'] } },
    ],
  },
  contract: {
    spell: { name: 'Merging', icon: '⇄', desc: 'Vowels that melt together.' },
    beats: [
      { say: 'Verbs ending in -άω, -έω, -όω merge their last vowel with the ending.', demo: 'ποιέ + ει → ποι[εῖ] · ἀγαπά + ομεν → ἀγαπ[ῶ]μεν',
        check: { q: 'ποιεῖ means…', a: 'he does', w: ['I do', 'they do', 'do!'] } },
      { say: 'A circumflex on the ending (ῶ, εῖ, οῦ) is a good clue.', demo: 'λαλ[οῦ]σιν = they speak',
        check: { q: 'ζητεῖτε means…', a: 'you (plural) seek', w: ['we seek', 'they seek', 'I seek'] } },
    ],
  },
  mp: {
    spell: { name: 'Mirror Voice', icon: '↺', desc: 'Middle and passive voice.' },
    beats: [
      { say: 'Passive: the subject receives the action. Endings -ομαι, -ῃ, -εται, -όμεθα, -εσθε, -ονται.', demo: 'λύ[ομαι] = I am loosed',
        check: { q: 'λύονται means…', a: 'they are being loosed', w: ['they loose', 'we are loosed', 'they loosed'] } },
      { say: 'Some verbs look passive but mean something active. Their dictionary form ends in -ομαι.', demo: 'ἔρχ[εται] = he comes',
        check: { q: 'πορευόμεθα means…', a: 'we go', w: ['we are being gone', 'they go', 'we went'] } },
    ],
  },
  aorp: {
    spell: { name: 'Thunder Voice', icon: '⛈', desc: 'θη: it was done.' },
    beats: [
      { say: 'θη marks the aorist passive: "was …ed".', demo: 'ἐλύ[θη]ν = I was loosed · ἠγέρ[θη] = he was raised',
        check: { q: 'ἐβαπτίσθησαν means…', a: 'they were baptized', w: ['they baptized', 'they will be baptized', 'they are baptizing'] } },
      { say: 'A few aorist passives have no θ.', demo: 'ἐγράφ[η] = it was written',
        check: { q: 'ἐγράφη means…', a: 'it was written', w: ['he wrote', 'write!', 'he is writing'] } },
    ],
  },
  n3: {
    spell: { name: 'Stone Stems', icon: '🪨', desc: 'Third declension: the genitive reveals the stem.' },
    beats: [
      { say: 'Third-declension nouns hide their stem in the nominative. Look at the genitive.', demo: 'σάρξ, [σαρκ]ός · ὄνομα, [ὀνόματ]ος',
        check: { q: 'The stem of χάρις, χάριτος is…', a: 'χαριτ-', w: ['χαρ-', 'χαρις-', 'χάρι-'] } },
      { say: 'Its endings: genitive -ος, dative -ι, accusative -α.', demo: 'πατρ[ός] · πατρ[ί] · πατέρ[α]',
        check: { q: 'τῷ πατρί means…', a: 'to the father', w: ['of the father', 'the father (as subject)', 'fathers'] } },
      { say: 'Nouns in -μα are neuter; nouns in -ις with genitive -εως are feminine.', demo: 'τὸ πνεῦ[μα] · ἡ πίστ[ις], πίστ[εως]',
        check: { q: 'διὰ πίστεως means…', a: 'through faith', w: ['because of faith', 'faith is', 'in faith'] } },
    ],
  },
  pas: {
    spell: { name: 'All-Seeing', icon: '∀', desc: 'πᾶς "all, every" and εἷς "one".' },
    beats: [
      { say: 'πᾶς without the article = every; with the article = all, the whole.', demo: '[πᾶς] ἄνθρωπος = every man · [πᾶσα] ἡ πόλις = the whole city',
        check: { q: 'πάντες on its own means…', a: 'all (people), everyone', w: ['all things', 'everything', 'the whole'] } },
      { say: 'πᾶς ὁ + a participle = "everyone who…".', demo: '[πᾶς ὁ] πιστεύων = everyone who believes',
        check: { q: 'πᾶς ὁ πιστεύων means…', a: 'everyone who believes', w: ['all believe', 'he believes everything', 'the whole faith'] } },
    ],
  },
  rel: {
    spell: { name: 'Binding Words', icon: '🔗', desc: 'Who, which, that.' },
    beats: [
      { say: 'ὅς, ἥ, ὅ = who/which. It looks like the article but has an accent.', demo: 'ὁ λόγος [ὃν] ἀκούετε = the word which you hear',
        check: { q: 'ὃ ἦν ἀπ᾽ ἀρχῆς means…', a: 'that which was from the beginning', w: ['he was from the beginning', 'the beginning was', 'which beginning?'] } },
      { say: 'τίς = who? τί = what? or why? And unaccented τις = someone, a certain.', demo: '[τίς] ἐστιν; = who is it? · ἄνθρωπός [τις] = a certain man',
        check: { q: 'τί ποιεῖς; means…', a: 'what are you doing?', w: ['someone is doing it', 'who does it?', 'do something!'] } },
    ],
  },
  inf: {
    spell: { name: 'Open Gate', icon: '∞', desc: 'Infinitives: "to …".' },
    beats: [
      { say: 'Endings like -ειν, -σαι, -ναι, -εσθαι mark infinitives: "to …".', demo: 'λύ[ειν] = to loose · σῶ[σαι] = to save · εἶ[ναι] = to be',
        check: { q: 'θέλω ἰδεῖν means…', a: 'I want to see', w: ['I saw', 'I want what I see', 'see what you want'] } },
      { say: 'With the article and a preposition, an infinitive tells time or reason.', demo: '[ἐν τῷ] σπείρειν = while sowing · [μετὰ τὸ] ἐγερθῆναι = after being raised',
        check: { q: 'ἐν τῷ + infinitive means…', a: 'while …', w: ['after …', 'before …', 'because …'] } },
    ],
  },
  ptc: {
    spell: { name: 'Twin Nature', icon: '≈', desc: 'Participles: half verb, half adjective.' },
    beats: [
      { say: 'A participle is a verb used like an adjective. With the article it means "the one who…".', demo: '[ὁ] πιστεύ[ων] = the one who believes',
        check: { q: 'ὁ ἐρχόμενος means…', a: 'the one who is coming', w: ['he came', 'come!', 'to come'] } },
      { say: 'Without the article it means "while …ing" or "after …ing".', demo: 'ἀκού[σαντ]ες = having heard · λέγ[ων] = saying',
        check: { q: 'ἀκούσαντες means…', a: 'having heard', w: ['while hearing', 'they hear', 'to hear'] } },
      { say: 'Look for ντ (active) or μεν (middle/passive) inside the word.', demo: 'λύο[ντ]ος · λυό[μεν]ος',
        check: { q: 'Which marker shows a middle/passive participle?', a: 'μεν', w: ['ντ', 'σα', 'θη'] } },
    ],
  },
  subj: {
    spell: { name: 'Maybe Magic', icon: '◇', desc: 'The subjunctive: may, might, let us.' },
    beats: [
      { say: 'The subjunctive lengthens the vowel: ο → ω, ε → η.', demo: 'λύ[ο]μεν → λύ[ω]μεν · λύ[ε]τε → λύ[η]τε',
        check: { q: 'The subjunctive is marked by…', a: 'a lengthened vowel (ω/η)', w: ['the augment', 'θη', 'a doubled first letter'] } },
      { say: 'ἵνα + subjunctive = "so that". The "we" form often means "let us".', demo: '[ἵνα] πιστεύσητε = so that you may believe · ἀγαπ[ῶ]μεν = let us love',
        check: { q: 'ἀγαπῶμεν ἀλλήλους means…', a: 'let us love one another', w: ['we loved each other', 'love one another!', 'they love us'] } },
    ],
  },
  imv: {
    spell: { name: 'Command Word', icon: '!', desc: 'Imperatives: do it!' },
    beats: [
      { say: 'Commands: -ε (you), -ετε (you all), -έτω (let him/her/it).', demo: 'λῦ[ε] = loose! · ἐλθ[έτω] = let it come',
        check: { q: 'ἐλθέτω ἡ βασιλεία σου means…', a: 'let your kingdom come', w: ['your kingdom came', 'come to your kingdom', 'your kingdom is coming'] } },
      { say: '-ετε can mean "you do" or "do!". Context decides, as in "repent!" (Mark 1:15).', demo: 'μετανοεῖ[τε] = repent!',
        check: { q: 'ἀκολούθει μοι means…', a: 'follow me', w: ['he follows me', 'I follow', 'to follow me'] } },
    ],
  },
  perf: {
    spell: { name: 'Seal of Completion', icon: '✓', desc: 'The perfect: done, and it stays done.' },
    beats: [
      { say: 'The perfect doubles the first sound and adds κα: an action completed with lasting results.', demo: '[λέ]λυ[κα] = I have loosed · [πε]πίστευ[κα] = I have believed',
        check: { q: 'πεπιστεύκαμεν means…', a: 'we have believed', w: ['we believed once', 'we will believe', 'we were believing'] } },
      { say: 'γέγραπται = "it stands written"; τετέλεσται = "it is finished".', demo: '[γέ]γραπ[ται] · [τε]τέλεσ[ται]',
        check: { q: 'τετέλεσται means…', a: 'it is finished', w: ['he finished', 'finish it!', 'it will end'] } },
    ],
  },
};
