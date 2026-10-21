# Greek New Testament data

Built by `scripts/build-nt.mjs` from public sources:

- **Greek text:** SBL Greek New Testament (SBLGNT), © 2010 Society of Biblical Literature and Logos Bible Software,
  used under the [SBLGNT license](https://sblgnt.com/license/). Text-critical sigla are removed for reading.
- **Parsing and lemmas:** [MorphGNT SBLGNT](https://github.com/morphgnt/sblgnt) (J. K. Tauber, ed.),
  licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The derived files here are
  shared under the same license.
- **Glosses:** Dodson Greek Lexicon (public domain), via
  [biblicalhumanities/Dodson-Greek-Lexicon](https://github.com/biblicalhumanities/Dodson-Greek-Lexicon).
- **English comparison:** World English Bible (public domain), via
  [TehShrike/world-english-bible](https://github.com/TehShrike/world-english-bible).

Files: `books.json` (book list and verse counts), `lexicon.json` (`[lemma, gloss, NT frequency]`),
`<Book>.json` (`ch[chapter][verse] = [[text, lemmaIndex, morphCode], …]`), `en/<Book>.json` (WEB verses).
