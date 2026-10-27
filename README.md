# Koine Quest

A game that teaches you **Biblical (Koine) Greek** from the alphabet up and ends with you
reading and translating the **New Testament** in the original.

It is an installable web app (PWA): add it to your phone's home screen and it works offline.
No account, no server, no build step. Your progress is saved on your device.

## The adventure

Koine Quest is a third-person 3D journey through the world of the New Testament. You are **Theophilus**, an apprentice
**scribe**, travelling through nine worlds from Alphabet Hollow to the Great Library. Every grammar rule you
master is a **spell**, and the goal is to read and translate the Greek New Testament freely.

- **Nine separate worlds**, each its own valley with its own road, landmarks, creatures and weather:
  the round-doored village and Great Oak of Alphabet Hollow, the giant Word Tree of the misty Wordwood, the
  windmill and wheat of the Fields, the bridge and mill of Verb River, Aquila's tents and cranes on Builders'
  Ridge, the Hourglass of Ages in the Ruins of Time, the island shrine on Mirror Lake, the switchback climb of the
  Declension Peaks and the colonnaded avenue to the Great Library.
- **Portals** join the worlds. Beat a world's guardian and its gate becomes a portal to the next world; the
  portal you arrived through leads back. The **world map** takes you to any world you've reached.
- **Cutscenes**: arriving in a world, the camera sweeps over it and its master greets you; beating a guardian,
  it bows, speaks, and the portal blazes open.
- **Three teachers in every world**, each at their own spot along the road with a slate, a bench and their own
  lessons, so walking on through a world means learning on. They give you lessons as quests. A golden light and the quest arrow always show where to go next.
- **Shades of Forgetting** roam the road. Touch one and you must remember a word (or recast a fading spell)
  to banish it with a bolt from your wand: this is your spaced-repetition review. An **elite shade** in each
  world hunts your weakest words and takes three right answers in a row.
- **Places to visit**: the master of each world teaches by the road, the others in places of their own,
  reached by a trail of stones from a signpost: a 🏠 cottage you walk into (the roof lifts away inside), an 🪨
  island you reach by hopping across stepping stones (miss and you splash back to the shore), a 🌷 garden behind
  a word gate that opens when you answer a word, a 🔭 lookout up a stair, a 🔥 campfire or a 🛒 market stall.
- **Side quests**, all fed by your review queue (due words first):
  - 🎣 **Word Fishing** at the pond, river and lake: cast, wait for a bite, name the fish's word before it slips away. Words you know by heart come up as golden fish.
  - 🔤 **Rune Circle** in every world: walk (and hop) across lettered stones to spell the Greek word.
  - 📦 **Courier** errands: a villager needs a word; find the right glowing word nearby and carry it back.
- **Collect** glowing letters, daily coins, and **lost scrolls**: NT passages to read and translate in the Reading Room.

Controls: WASD/arrows to move, Shift to run, Space to jump, E to talk, drag to look around.
On a phone, put your thumb down on the walking side to walk (right side by default; switch to left in
Profile → Settings), drag on the other side to look, and use the on-screen buttons.

## How a lesson works

Every lesson is played in 3D, in a place from the world you're in: a village green, a forest clearing,
a wheat field, a riverbank, a builders' yard, the ruins, a lake-shore pier, a snowy mountain ledge or the Library hall.

1. **Your master teaches** one small idea, showing it on real Greek with the key part glowing in the air.
2. **You try it at once** with a guided question. A miss explains the rule and lets you try again, with no penalty.
3. Teach → try repeats a few times, then **a trial** begins against a challenger with a health bar
   (each world's own creature: a training dummy, a treant, a scarecrow, the riddle toad, a clockwork builder,
   the sand serpent, the mirror wraith, the snow yeti, the ink drake; or a living spellbook, Kleon the rival
   apprentice, or a shade).
4. Trials mix answer tablets you strike with bolts of light, matching beams, translation bridges and **mini-games**:
   - **Word Rain** (vocabulary): catch the falling word that means the English target.
   - **Declension Defense** (nouns): strike each marching form with its case.
   - **Parsing Forge** (verbs): name the tense, then the person and number.
   - **Verse Race** (readings): pick the next piece of the translation against the clock.

**Power-ups** are earned by finishing daily quests, keeping your day streak, reaching an 8× combo and setting
Arcade records: 💡 **Hint** removes two wrong answers, 🛡 **Shield** blocks one lost heart (guardians and shades),
⏳ **Slow Time** slows the clock in timed games.

Lessons move on automatically after each answer: quickly when you're right, more slowly when there's a
correction to read. Tap to skip ahead, or change the speed in Settings. Finished grammar lessons add a spell to
your **Spellbook**, where its notes and charts can be studied any time.

**Clear concepts**: every grammar lesson opens with *the big idea* in plain English, the same thing in English
(*he / him* for the cases, *go / went* for the second aorist) and one thing to remember (`js/data/plain.js`).
Greek examples carry the sound and meaning under each word. The **📖** button in any lesson, and the link under a
wrong answer, opens the rule again with its charts.

## The Reading Room

Open **any passage of the Greek New Testament**: the whole SBLGNT is built in, every word parsed. Tap a word for
its dictionary form, meaning and parsing, or show glosses for new words or for every word. Write your translation
verse by verse (it's saved), compare it with the World English Bible, and add any word to your review deck.
Twenty passages, from John 1:1–5 to Revelation 21, are collected as scrolls on the journey.

## How it plays

| | |
|---|---|
| 🗺 **Path** | 9 units, 82 lessons (including 9 bosses and 22 NT readings). Each lesson unlocks the next. Earn up to ★★★ per lesson. |
| ⭐ **XP & levels** | Every answer earns XP. Climb from *Alphabet Novice* to *Archmage of Koine*. |
| 🔥 **Streaks & combos** | Daily streak, a daily XP goal you choose, and combo bonuses for answers in a row. |
| 📋 **Daily quests** | Three goals a day (answers, lessons, reviews, shades, verses, combos…) for coins and XP. |
| 🎁 **Loot & wardrobe** | Guardians drop treasure chests: robes, hats, staffs and companions (owl, dove, lamb). Coins buy the rest. |
| 🏆 **31 achievements** | From *First Steps* to *For God So Loved* (translate John 3:16) and *The Great Library*. |
| 🎮 **Arcade** | 60-second high-score rounds with combo multipliers (×2, ×3, ×4) and 🥉🥈🥇 medals: the 3D spell games (Word Rain, Declension Defense, Parsing Forge, Verse Race) and the speed rounds (Alphabet Blitz, Vocab Lightning, Parse Rush). |
| 🔁 **Review** | Spaced-repetition deck for every word you study, plus a notebook of your mistakes. |
| 📖 **Library** | Reading Room, scroll collection, reading-readiness score, Spellbook and lexicon. |

**Sound** follows the play, all synthesized in the browser (no sound files): footsteps on grass, stone, snow or
the wooden bridge, coins, letters that climb the scale, portals, a shade's hum as it closes in, spells, hits and
shattering tablets, the rain, march, anvil and clock of the mini-games, and combos that rise in pitch. Each world
has a quiet background of its own (birds, wind, water, crickets, embers), which can be turned off.

**Help with the Greek** (Profile → Settings → Greek help; *Sound + English* by default): English meanings show under
Greek wherever they don't give the answer away (verses become interlinear: sound and meaning under each word), and a
free **👁 Peek** shows them everywhere else, in lessons, the Arcade, shade battles and the villagers' games; a peeked
word isn't counted as remembered and earns half XP. At every level every Greek word shows how it sounds
(ἀρχή → archē): the main word, Greek answers, matching stones, Word Rain, shade battles and the side quests the
villagers give you (fishing, word gates, Rune Circle, Courier, Word Arches). It never shows where it would give the
answer away (alphabet and letter-sound questions). The forms in Declension Defense and Parsing Forge show their dictionary form and meaning.

Settings include auto-advance speed, **Graphics: High/Low** (Low drops grass, shadows and outlines and thins the
trees; on any setting the resolution adapts when frames run slow), 2D lessons instead of 3D, sound,
read-aloud, and unlocking all lessons if you already know some Greek.

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
  A correct review promotes it; a miss sends it back to box 1 and makes it due again the same day, and getting
  it right then only counts as relearned (back tomorrow). Grammar spells follow the same schedule: a learned
  spell fades when it falls due and comes back in Review and as a shade. The arcade, the side quests and the
  shades all draw due words first and write every answer back into the schedule.
- **Teach, then retrieve.** Each idea is taught in a few sentences and immediately tried, then practiced in a
  trial. You learn by answering, not rereading.
- **Immediate, explained feedback.** Every answer shows *why*: the parsing, the rule, the gloss.
- **Desirable difficulty.** A question you miss comes back a few questions later, and once more at the end if
  you miss it again. Mastered lessons
  replay with harder "produce the form" questions, well-known words come back English → Greek, and elite shades
  drill your weakest words.
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

`.github/workflows/pages.yml` runs the tests and publishes the site on every push to `main` or the development
branch (GitHub only lets the site publish from the repository's default branch).
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
| `js/data/teach.js` | teaching beats and the spell for every grammar lesson |
| `js/data/plain.js` | the big idea of each grammar lesson in plain English, with an English example and a tip |
| `js/data/passages.js`, `story.js`, `wardrobe.js` | collectible scrolls, story beats, cosmetics |
| `js/world.js` | the 3D world engine: terrain, portals, cutscenes, characters (Three.js, vendored in `js/vendor/` under the MIT license) |
| `js/worlds.js`, `js/props.js` | the nine worlds' roads, ground shapes and landmarks |
| `js/stage.js` | the 3D lesson stage: tablets, challengers, mini-games, power-ups |
| `js/audio.js` | every sound effect and each world's background sound (Web Audio) |
| `js/stagesets.js` | the trial places for each world and each world's creature |
| `js/fx.js` | shared look: painted sky with sun, moon, clouds, stars, aurora and rainbow; far hills; water with ripples, fish and shore foam; painterly ground with cloud shadows, rock ledges and rain puddles; wind in trees, grass and flowers; birds, butterflies and leaf gusts; sunbeams, bloom, rim light and sky reflections; battle rune circle, light pillars, portal vortex, footprints; moss on rocks, lantern heads, painted sign boards; colour grade with a soft vignette; the parchment world map; the hero's body language |
| `js/venues.js` | the teachers' places: cottage (a room of its own; step back out and the day has moved on: sunset, night, dawn, storm), island, word-gate garden, lookout, campfire, stall |
| `js/raiders.js` | Raiders of Forgetting: arrive for each missed day (Profile → "If I miss a day") |
| `js/cloud.js` | cloud save across devices with a private sync code (Supabase `game_save`/`game_load`) |
| `js/sidequests.js` | Word Fishing, the Rune Circle and Courier errands, driven by the review queue |
| `js/reader.js` | the Reading Room |
| `data/nt/` | the whole Greek NT, lexicon and English comparison, built by `scripts/build-nt.mjs` (see its README for sources and licenses) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA: offline cache and home-screen install |

**Adding content** is mostly data entry: add a lesson to `KG.grammar`, a verse to `KG.readings`, then
place it on the path in `KG.units`. The tests check that it's wired up correctly.

Greek text: SBL Greek New Testament (SBLGNT) © 2010 Society of Biblical Literature and Logos Bible Software.
Parsing: MorphGNT (CC BY-SA). Glosses: Dodson lexicon (public domain). Comparison: World English Bible (public domain).
Word frequencies are approximate counts and vary slightly between editions.
