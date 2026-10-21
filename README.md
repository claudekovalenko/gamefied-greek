# Koine Quest

A game that teaches you **Biblical (Koine) Greek** from the alphabet up and ends with you
reading and translating the **New Testament** in the original.

It is an installable web app (PWA): add it to your phone's home screen and it works offline.
No account, no server, no build step. Your progress is saved on your device.

## How it plays

| | |
|---|---|
| 🗺 **Path** | 9 units, 82 lessons (including 9 bosses and 22 NT readings). Each lesson unlocks the next. Earn up to ★★★ per lesson. |
| ⚔ **Boss battles** | Every unit ends with a boss: 15 mixed questions from the whole unit, 3 hearts. |
| ⭐ **XP & levels** | Every answer earns XP. Climb from *Alphabet Novice* to *Master of Koine*. |
| 🔥 **Streaks & combos** | Daily streak, a daily XP goal you choose, and combo bonuses for answers in a row. |
| 🪙 **Drachmas** | Coins from lessons, goals and achievements buy streak freezes and 2× XP boosts. |
| 🏆 **25 achievements** | From *First Steps* to *For God So Loved* (translate John 3:16) and *Champion*. |
| 🎮 **Arcade** | 60-second speed rounds: Alphabet Blitz, Vocab Lightning, Parse Rush. |
| 🔁 **Review** | Spaced-repetition deck for every word you study, plus a notebook of your mistakes. |
| 📖 **Codex** | Your NT reading-readiness score, the verses you've collected, grammar notes and a lexicon. |

## The curriculum

1. **The Alphabet**: letters, diphthongs, breathings, accents, sounding out words
2. **First Words**: the 40 most frequent NT words; how cases work
3. **Nouns & the Article**: ὁ ἡ τό, 2nd and 1st declension. First verses: John 1:1–2, Mark 1:1
4. **Verbs Come Alive**: present active, εἰμί. John 10:30, 1:4, 14:6
5. **Building Blocks**: prepositions, adjectives, personal pronouns, αὐτός, demonstratives. Matthew 5:3
6. **Past & Future**: imperfect, future, 1st and 2nd aorist, contract verbs. John 11:35, Romans 3:23, John 1:5, **John 3:16**
7. **Middle & Passive**: voice, deponents, aorist passive. John 1:14, Romans 6:23, Ephesians 2:8
8. **The Third Declension**: 3rd declension, πᾶς and εἷς, relative and interrogative pronouns. 1 Corinthians 13:13, Philippians 4:13
9. **Moods & Verbals**: infinitives, participles, subjunctive, imperative, perfect. **The Lord's Prayer** (Matthew 6:9–11), Mark 1:15, John 8:12, 1:29

Along the way you learn the **200 most frequent words** in the NT, ten per lesson. Together they make up
about **72% of all the words** in the Greek New Testament.

## Why it's built this way (the learning science)

- **Frequency first.** Vocabulary is ordered by how often it occurs in the NT, so every word you learn
  pays off as quickly as possible. The Codex shows the share of NT text your words cover.
- **Spaced repetition.** Each word moves through memory boxes (1 → 2 → 4 → 8 → 16 → 35 → 75 days).
  A correct review promotes it and a miss sends it back to box 1.
- **Retrieval practice.** You learn by answering, not rereading. Every lesson is mostly questions.
- **Immediate, explained feedback.** Every answer shows *why*: the parsing, the rule, the gloss.
- **Desirable difficulty.** A question you miss comes back once at the end of the lesson.
- **Interleaving.** Vocabulary lessons slip in earlier words, and bosses mix everything in a unit.
- **Real text early.** You read John 1:1 in Unit 3. Each verse is fully parsed: tap any word for its
  dictionary form, meaning and parsing.
- **Production, not just recognition.** You build translations from pieces and then write your own,
  comparing them with a model translation.
- **Ambiguity is taught, not hidden.** Forms like τῶν, ὥρας or λύσω that can be parsed more than one way
  are flagged as such.
- **Pronunciation.** Letters are taught with the standard academic (Erasmian) pronunciation used in most
  seminary courses. The 🔊 button uses your device's Greek voice, which speaks modern Greek.

## Install on your phone

Open the deployed site in Safari (iPhone) or Chrome (Android), then choose **Share → Add to Home Screen**
(iPhone) or **⋮ → Install app** (Android). It opens full-screen and works offline after the first visit.

### Deploying to GitHub Pages

`.github/workflows/pages.yml` runs the tests and publishes the site on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site will be at `https://<your-user>.github.io/gamefied-greek/`.

## Running locally

```sh
npm run serve        # → http://localhost:8080
```

You can also open `index.html` directly; everything except offline caching works from `file://`.

## Development

```sh
npm test             # checks all content and generates every lesson 100× looking for bad questions
npm run make-icons   # re-render icons/*.png from the SVGs (needs Playwright)
```

| Path | What's in it |
|---|---|
| `js/data/alphabet.js` | letters, diphthongs, marks, words for reading practice |
| `js/data/vocab.js` | the 200 words, with dictionary forms, glosses and NT frequencies |
| `js/data/grammar.js` | every grammar lesson: notes, paradigms, concept checks, practice phrases |
| `js/data/readings.js` | NT verses with every word parsed, translation pieces, notes |
| `js/data/curriculum.js` | the units/path, level titles and achievements |
| `js/engine.js` | saved state, XP/levels/streaks, spaced repetition, question generators |
| `js/app.js` | screens, lesson player, arcade, effects |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA: offline cache and home-screen install |

**Adding content** is mostly data entry: add a lesson to `KG.grammar`, a verse to `KG.readings`, then
place it on the path in `KG.units`. The tests check that it's wired up correctly.

Greek text of the readings follows the SBL Greek New Testament (SBLGNT). Word frequencies are approximate
counts and vary slightly between editions.
