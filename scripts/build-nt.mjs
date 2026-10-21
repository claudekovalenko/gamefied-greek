// Builds the Reading Room data from public sources:
//   MorphGNT SBLGNT  https://github.com/morphgnt/sblgnt   (text: SBLGNT license; parsing: CC BY-SA)
//   Dodson lexicon   https://github.com/biblicalhumanities/Dodson-Greek-Lexicon  (public domain)
//   World English Bible (public domain), JSON from https://github.com/TehShrike/world-english-bible
// Usage: node scripts/build-nt.mjs <morphgnt-sblgnt-dir> <dodson-dir> <web-dir>
// Output: data/nt/books.json, data/nt/lexicon.json, data/nt/<Book>.json, data/nt/en/<Book>.json
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , srcDir, dodDir, webDir] = process.argv;
if (!srcDir || !dodDir) { console.error('usage: node scripts/build-nt.mjs <sblgnt-dir> <dodson-dir>'); process.exit(1); }
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'nt');
mkdirSync(path.join(out, 'en'), { recursive: true });

// model translations: World English Bible, one array of verse strings per chapter
function englishFor(name) {
  if (!webDir) return null;
  const file = path.join(webDir, 'json', name.toLowerCase().replace(/\s+/g, '') + '.json');
  const ch = [];
  for (const it of JSON.parse(readFileSync(file, 'utf8'))) {
    if (!it.chapterNumber || !it.verseNumber || typeof it.value !== 'string') continue;
    const c = (ch[it.chapterNumber - 1] ||= []);
    c[it.verseNumber - 1] = ((c[it.verseNumber - 1] || '') + ' ' + it.value).replace(/\s+/g, ' ').trim();
  }
  for (let i = 0; i < ch.length; i++) { ch[i] ||= []; for (let k = 0; k < ch[i].length; k++) ch[i][k] ||= ''; }
  return ch;
}

const NAMES = {
  Mt: 'Matthew', Mk: 'Mark', Lk: 'Luke', Jn: 'John', Ac: 'Acts', Ro: 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians',
  Ga: 'Galatians', Eph: 'Ephesians', Php: 'Philippians', Col: 'Colossians', '1Th': '1 Thessalonians', '2Th': '2 Thessalonians',
  '1Ti': '1 Timothy', '2Ti': '2 Timothy', Tit: 'Titus', Phm: 'Philemon', Heb: 'Hebrews', Jas: 'James', '1Pe': '1 Peter',
  '2Pe': '2 Peter', '1Jn': '1 John', '2Jn': '2 John', '3Jn': '3 John', Jud: 'Jude', Re: 'Revelation',
};

// lexicon: lemma → brief English definition
const nfc = s => s.normalize('NFC');
const bare = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dod = readFileSync(path.join(dodDir, 'dodson.xml'), 'utf8');
const exact = new Map(), loose = new Map();
for (const m of dod.matchAll(/<entry n="([^"|]+?)\s*\|[^"]*">[\s\S]*?<def role="brief">([\s\S]*?)<\/def>/g)) {
  const lemma = nfc(m[1].trim()), gloss = m[2].replace(/\s+/g, ' ').trim();
  if (!exact.has(lemma)) exact.set(lemma, gloss);
  if (!loose.has(bare(lemma))) loose.set(bare(lemma), gloss);
}

const lemmas = [], lemmaIdx = new Map(), freq = [];
const books = [];
let words = 0;
for (const f of readdirSync(srcDir).filter(f => f.endsWith('-morphgnt.txt')).sort()) {
  const abbr = f.split('-')[1];
  const chapters = [];
  for (const line of readFileSync(path.join(srcDir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const [bcv, pos, parse, text, , , lemmaRaw] = line.split(' ');
    const c = +bcv.slice(2, 4), v = +bcv.slice(4, 6), lemma = nfc(lemmaRaw);
    let li = lemmaIdx.get(lemma);
    if (li === undefined) { li = lemmas.length; lemmaIdx.set(lemma, li); lemmas.push(lemma); freq.push(0); }
    freq[li]++;
    // drop the SBLGNT's text-critical sigla (⸀ ⸂ ⸃ …), which point to its apparatus
    ((chapters[c - 1] ||= [])[v - 1] ||= []).push([nfc(text).replace(/[\u2E00-\u2E0F]/g, ''), li, (pos + parse).replace(/-+$/, '')]);
    words++;
  }
  // fill any gaps (verses absent from the SBLGNT, e.g. Mt 17:21) with empty arrays
  for (let i = 0; i < chapters.length; i++) { chapters[i] ||= []; for (let k = 0; k < chapters[i].length; k++) chapters[i][k] ||= []; }
  writeFileSync(path.join(out, `${abbr}.json`), JSON.stringify({ b: abbr, name: NAMES[abbr], ch: chapters }));
  books.push({ b: abbr, name: NAMES[abbr], verses: chapters.map(c => c.length) });
  const en = englishFor(NAMES[abbr]);
  if (en) writeFileSync(path.join(out, 'en', `${abbr}.json`), JSON.stringify(en));
}

// Spelling differences between MorphGNT lemmas and Dodson headwords.
const MANUAL = {
  'Μωϋσῆς': 'Moses', 'Μαριάμ': 'Mary, Miriam', 'Καφαρναούμ': 'Capernaum', 'ἐλεάω': 'I have mercy on', 'τεσσεράκοντα': 'forty',
  'Σαμαρίτης': 'a Samaritan', 'Ναζαρέθ': 'Nazareth', 'Μαθθαῖος': 'Matthew', 'ἱνατί': 'why?', 'κύκλῳ': 'around, in a circle',
  'ὀψία': 'evening', 'εἴκοσι(ν)': 'twenty', 'σπλάγχνον': 'inner parts; compassion, affection', 'μέχρι(ς)': 'until, as far as',
  'ἔξεστι(ν)': 'it is lawful, it is permitted', 'οὕτω(ς)': 'thus, so, in this way', 'στάδιος': 'stade (about 600 feet)',
  'εἰδωλόθυτον': 'meat offered to idols', 'εὐκοπώτερος': 'easier', 'περισσοτέρως': 'more abundantly, especially',
  'πίμπλημι': 'I fill', 'ἐμπίμπλημι': 'I fill, satisfy', 'ἕλκω': 'I drag, draw', 'γαμίζω': 'I give in marriage', 'στρώννυμι': 'I spread, furnish',
  'ἐγκακέω': 'I lose heart, grow weary', 'ἐραυνάω': 'I search, examine', 'διαρρήγνυμι': 'I tear apart', 'ἕνεκα': 'because of, for the sake of',
};
function variants(l) {
  const v = [l, l.replace(/\((.)\)$/, '$1'), l.replace(/\(.\)$/, '')];
  for (const [a, b] of [['έομαι', 'έω'], ['άομαι', 'άω'], ['όομαι', 'όω'], ['ομαι', 'ω'], ['αμαι', 'ημι'], ['υμαι', 'υμι'], ['άω', 'έω']])
    if (l.endsWith(a)) v.push(l.slice(0, -a.length) + b);
  return v;
}
let unmatched = 0;
const lex = lemmas.map((l, i) => {
  let g = MANUAL[l] || '';
  for (const x of variants(l)) { if (g) break; g = exact.get(x) ?? loose.get(bare(x)) ?? ''; }
  if (!g) unmatched++;
  return [l, g, freq[i]];
});
writeFileSync(path.join(out, 'lexicon.json'), JSON.stringify(lex));
writeFileSync(path.join(out, 'books.json'), JSON.stringify({ words, books }));
console.log(`${words} words, ${books.length} books, ${lemmas.length} lemmas, ${unmatched} without a gloss`);
