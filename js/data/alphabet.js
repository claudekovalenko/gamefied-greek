// The Greek alphabet, diphthongs, marks and first reading words.
// Pronunciation follows the conventional "Erasmian" academic system used in most
// seminary and university Koine courses.
window.KG = window.KG || {};

KG.alphabet = [
  { U: 'Α', l: 'α', name: 'alpha',   tr: 'a',  say: 'a as in "father"' },
  { U: 'Β', l: 'β', name: 'beta',    tr: 'b',  say: 'b as in "bible"' },
  { U: 'Γ', l: 'γ', name: 'gamma',   tr: 'g',  say: 'hard g as in "gone" (γγ, γκ, γχ = ng)' },
  { U: 'Δ', l: 'δ', name: 'delta',   tr: 'd',  say: 'd as in "dog"' },
  { U: 'Ε', l: 'ε', name: 'epsilon', tr: 'e',  say: 'short e as in "met"' },
  { U: 'Ζ', l: 'ζ', name: 'zeta',    tr: 'z',  say: 'dz as in "adze" (or z)' },
  { U: 'Η', l: 'η', name: 'eta',     tr: 'ē',  say: 'long a as in "obey"' },
  { U: 'Θ', l: 'θ', name: 'theta',   tr: 'th', say: 'th as in "thing"' },
  { U: 'Ι', l: 'ι', name: 'iota',    tr: 'i',  say: 'i as in "machine" or "sit"' },
  { U: 'Κ', l: 'κ', name: 'kappa',   tr: 'k',  say: 'k as in "kite"' },
  { U: 'Λ', l: 'λ', name: 'lambda',  tr: 'l',  say: 'l as in "lamb"' },
  { U: 'Μ', l: 'μ', name: 'mu',      tr: 'm',  say: 'm as in "mother"' },
  { U: 'Ν', l: 'ν', name: 'nu',      tr: 'n',  say: 'n as in "new"' },
  { U: 'Ξ', l: 'ξ', name: 'xi',      tr: 'x',  say: 'x (ks) as in "axe"' },
  { U: 'Ο', l: 'ο', name: 'omicron', tr: 'o',  say: 'short o as in "dog"' },
  { U: 'Π', l: 'π', name: 'pi',      tr: 'p',  say: 'p as in "pray"' },
  { U: 'Ρ', l: 'ρ', name: 'rho',     tr: 'r',  say: 'r (lightly rolled)' },
  { U: 'Σ', l: 'σ', name: 'sigma',   tr: 's',  say: 's as in "sing" (written ς at the end of a word)' },
  { U: 'Τ', l: 'τ', name: 'tau',     tr: 't',  say: 't as in "talk"' },
  { U: 'Υ', l: 'υ', name: 'upsilon', tr: 'y',  say: 'u as in French "tu" / German "ü"' },
  { U: 'Φ', l: 'φ', name: 'phi',     tr: 'ph', say: 'ph as in "phone"' },
  { U: 'Χ', l: 'χ', name: 'chi',     tr: 'ch', say: 'ch as in Scottish "loch" or German "Bach"' },
  { U: 'Ψ', l: 'ψ', name: 'psi',     tr: 'ps', say: 'ps as in "lips"' },
  { U: 'Ω', l: 'ω', name: 'omega',   tr: 'ō',  say: 'long o as in "tone"' },
];

KG.alphaGroups = [
  { title: 'Letters Α – Θ', range: [0, 8] },
  { title: 'Letters Ι – Π', range: [8, 16] },
  { title: 'Letters Ρ – Ω', range: [16, 24] },
];

KG.diphthongs = [
  { g: 'αι', tr: 'ai', say: 'ai as in "aisle"' },
  { g: 'ει', tr: 'ei', say: 'ei as in "eight"' },
  { g: 'οι', tr: 'oi', say: 'oi as in "oil"' },
  { g: 'αυ', tr: 'au', say: 'ow as in "how"' },
  { g: 'ευ', tr: 'eu', say: 'eu as in "feud"' },
  { g: 'ου', tr: 'ou', say: 'oo as in "soup"' },
  { g: 'υι', tr: 'ui', say: 'wee as in "suite"' },
];

KG.marks = [
  { g: 'ἁ', name: 'rough breathing', say: 'adds an h-sound before the vowel: ἁ = ha' },
  { g: 'ἀ', name: 'smooth breathing', say: 'no sound; every word starting with a vowel needs a breathing mark' },
  { g: 'ά', name: 'acute accent', say: 'marks stress; can stand on any of the last three syllables' },
  { g: 'ὰ', name: 'grave accent', say: 'replaces an acute on the last syllable when another word follows' },
  { g: 'ᾶ', name: 'circumflex accent', say: 'stands only on long vowels/diphthongs, last two syllables' },
  { g: 'ᾳ', name: 'iota subscript', say: 'a small ι written under α, η or ω; silent, but grammatically important' },
  { g: ';', name: 'question mark', say: 'the Greek ; is an English question mark' },
  { g: '·', name: 'raised dot', say: 'the raised dot works like an English colon or semicolon' },
];

KG.alphaConcepts = [
  { q: 'How is γγ pronounced (as in ἄγγελος)?', a: 'ng — angelos', w: ['gg — aggelos', 'gy — agyelos', 'j — anjelos'] },
  { q: 'Which mark adds an "h" sound to a word that begins with a vowel?', a: 'rough breathing ( ῾ )', w: ['smooth breathing ( ᾿ )', 'acute accent ( ´ )', 'circumflex ( ῀ )'] },
  { q: 'What does the Greek ; mean?', a: 'a question mark', w: ['a semicolon', 'a full stop', 'a comma'] },
  { q: 'Sigma is written ς when it…', a: 'is the last letter of a word', w: ['is the first letter of a word', 'is capitalized', 'follows a vowel'] },
  { q: 'Which two letters are the LONG versions of ε and ο?', a: 'η and ω', w: ['ι and υ', 'α and ο', 'ξ and ψ'] },
  { q: 'A word beginning with ρ or υ always has…', a: 'a rough breathing (ῥ, ὑ)', w: ['a smooth breathing', 'no breathing', 'an iota subscript'] },
  { q: 'The small ι written under a vowel (ᾳ ῃ ῳ) is called…', a: 'iota subscript', w: ['diaeresis', 'breathing', 'circumflex'] },
  { q: 'Which letter looks like an English "p" but sounds like "r"?', a: 'ρ (rho)', w: ['π (pi)', 'φ (phi)', 'ψ (psi)'] },
  { q: 'Which letter looks like an English "n" but sounds like "ē"?', a: 'η (eta)', w: ['ν (nu)', 'μ (mu)', 'π (pi)'] },
  { q: 'Which letter looks like an English "v" but is a vowel?', a: 'υ (upsilon)', w: ['ν (nu)', 'γ (gamma)', 'β (beta)'] },
  { q: 'Which letter looks like an English "w" but is a vowel?', a: 'ω (omega)', w: ['ψ (psi)', 'μ (mu)', 'υ (upsilon)'] },
  { q: 'Which letter looks like an English "x" but sounds like "ch" (Bach)?', a: 'χ (chi)', w: ['ξ (xi)', 'κ (kappa)', 'ψ (psi)'] },
];

// Words to practise reading: [greek, transliteration, English meaning / cognate]
KG.readWords = [
  ['λόγος', 'logos', 'word (cf. "logic")'],
  ['θεός', 'theos', 'God (cf. "theology")'],
  ['κόσμος', 'kosmos', 'world (cf. "cosmos")'],
  ['ἄγγελος', 'angelos', 'angel, messenger'],
  ['ἀπόστολος', 'apostolos', 'apostle, one sent'],
  ['Χριστός', 'Christos', 'Christ, Anointed One'],
  ['Ἰησοῦς', 'Iēsous', 'Jesus'],
  ['ἄνθρωπος', 'anthrōpos', 'human being (cf. "anthropology")'],
  ['καρδία', 'kardia', 'heart (cf. "cardiac")'],
  ['ψυχή', 'psychē', 'soul, life (cf. "psyche")'],
  ['προφήτης', 'prophētēs', 'prophet'],
  ['φωνή', 'phōnē', 'voice, sound (cf. "phonics")'],
  ['ἐκκλησία', 'ekklēsia', 'church, assembly (cf. "ecclesiastical")'],
  ['δόξα', 'doxa', 'glory (cf. "doxology")'],
  ['ζωή', 'zōē', 'life (cf. "zoology")'],
  ['βίβλος', 'biblos', 'book (cf. "Bible")'],
  ['ἁμαρτία', 'hamartia', 'sin'],
  ['ὕδωρ', 'hydōr', 'water (cf. "hydrate")'],
  ['εὐαγγέλιον', 'euangelion', 'gospel, good news (cf. "evangelism")'],
  ['πνεῦμα', 'pneuma', 'spirit, wind (cf. "pneumatic")'],
  ['ἡμέρα', 'hēmera', 'day'],
  ['υἱός', 'huios', 'son'],
  ['ἅγιος', 'hagios', 'holy (cf. "hagiography")'],
  ['σάββατον', 'sabbaton', 'Sabbath'],
  ['Πέτρος', 'Petros', 'Peter'],
  ['Παῦλος', 'Paulos', 'Paul'],
  ['γῆ', 'gē', 'earth (cf. "geology")'],
  ['μαθητής', 'mathētēs', 'disciple (cf. "mathematics" = learning)'],
];
