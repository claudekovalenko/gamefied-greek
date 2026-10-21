// The passage ladder: NT passages to collect as scrolls and translate,
// ordered roughly from easiest Greek (John's simple style) to hardest.
// `unit` is the world where the scroll is found (0-based, matching KG.units);
// beating that world's guardian also hands it over.
window.KG = window.KG || {};

KG.passages = [
  { id: 'jn1a', ref: 'John 1:1-5', title: 'In the Beginning', unit: 2 },
  { id: '1jn4', ref: '1 John 4:7-12', title: 'God Is Love', unit: 3 },
  { id: 'jn3', ref: 'John 3:16-21', title: 'For God So Loved the World', unit: 3 },
  { id: 'jn14', ref: 'John 14:1-7', title: 'The Way, the Truth and the Life', unit: 4 },
  { id: 'mk1a', ref: 'Mark 1:1-11', title: 'The Baptism of Jesus', unit: 4 },
  { id: 'jn10', ref: 'John 10:7-18', title: 'The Good Shepherd', unit: 5 },
  { id: 'mt6', ref: 'Matthew 6:9-13', title: "The Lord's Prayer", unit: 5 },
  { id: 'jn1b', ref: 'John 1:6-18', title: 'The Word Became Flesh', unit: 5 },
  { id: 'mt5', ref: 'Matthew 5:1-12', title: 'The Beatitudes', unit: 6 },
  { id: 'mk1b', ref: 'Mark 1:14-20', title: 'Follow Me', unit: 6 },
  { id: 'lk2', ref: 'Luke 2:8-14', title: 'Glory to God in the Highest', unit: 6 },
  { id: 'ro5', ref: 'Romans 5:1-11', title: 'Peace with God', unit: 7 },
  { id: 'eph2', ref: 'Ephesians 2:1-10', title: 'Saved by Grace', unit: 7 },
  { id: '1co13', ref: '1 Corinthians 13:1-13', title: 'The Way of Love', unit: 7 },
  { id: 'php2', ref: 'Philippians 2:5-11', title: 'The Mind of Christ', unit: 8 },
  { id: 'lk15', ref: 'Luke 15:11-32', title: 'The Prodigal Son', unit: 8 },
  { id: 'ro8', ref: 'Romans 8:28-39', title: 'More than Conquerors', unit: 8 },
  { id: 'heb11', ref: 'Hebrews 11:1-6', title: 'By Faith', unit: 8 },
  { id: 'jas1', ref: 'James 1:2-8', title: 'Count It All Joy', unit: 8 },
  { id: 're21', ref: 'Revelation 21:1-7', title: 'All Things New', unit: 8 },
];
