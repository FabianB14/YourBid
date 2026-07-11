// -----------------------------------------------------------------------------
// 💛 Hidden anniversary auction — a little surprise.
//
// When the topic is entered as your anniversary date (December 31, 2016) in
// ANY common format, the game skips normal item generation and loads this
// special auction instead: Shari's, The Witch (2016), and an "I love you" poem
// with a line for each year. Every item carries an "I love you."
//
// >>> PERSONALIZE THE TWO SPOTS MARKED "EDIT ME" BELOW. <<<
// -----------------------------------------------------------------------------

import type { Item } from '../types';

// EDIT ME — your wife's name (or a pet name). Shown in the secret banner/poem.
export const WIFE_NAME = 'my love';

// The anniversary the secret code unlocks.
const ANNIV = { year: 2016, month: 12, day: 31 };

/**
 * True if `input` is December 31, 2016 written in essentially any way:
 * 12/31/2016, 12-31-16, 31/12/2016, 2016-12-31, 12312016, 123116, 20161231,
 * "December 31 2016", "Dec 31, 2016", "31 December 2016", "31st Dec 2016", …
 */
export function isAnniversaryCode(input: string): boolean {
  if (!input) return false;
  const s = input.trim().toLowerCase();

  // Written month forms (strip commas/periods, ordinal suffixes, extra spaces).
  const written = s
    .replace(/[,.]/g, '')
    .replace(/(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const writtenForms = new Set([
    'december 31 2016',
    'december 31 16',
    '31 december 2016',
    '31 december 16',
    'dec 31 2016',
    'dec 31 16',
    '31 dec 2016',
    '31 dec 16',
  ]);
  if (writtenForms.has(written)) return true;

  // Pure-digit forms (mm/dd/yyyy, dd/mm/yyyy, yyyy-mm-dd, and 2-digit years).
  const digits = s.replace(/\D/g, '');
  const mm = '12';
  const dd = '31';
  const yyyy = String(ANNIV.year);
  const yy = yyyy.slice(2);
  const digitForms = new Set([
    mm + dd + yyyy, // 12312016
    mm + dd + yy, //   123116
    dd + mm + yyyy, // 31122016
    dd + mm + yy, //   311216
    yyyy + mm + dd, // 20161231
  ]);
  return digitForms.has(digits);
}

// EDIT ME — one line per year. These weave in your real moments (April 23,
// Dec 31 2016; Aug 30 2017; COVID 2020; Jan 6 2022). Tweak any line freely.
export const LOVE_POEM_TITLE = 'Eleven Decembers';
export const LOVE_POEM_LINES: Array<[year: string, line: string]> = [
  ['2016', 'Your birthday in April was the first I got to celebrate with you — and by the year’s last night, I got to marry you.'],
  ['2017', 'On August 30th you made me a father; our first daughter arrived and my whole world grew.'],
  ['2018', 'We learned the beautiful ordinary — late nights, morning coffee, and you.'],
  ['2019', 'Every day more sure that home was never a place; it was us.'],
  ['2020', 'The world shut its doors and we faced COVID side by side — I’d quarantine forever with you.'],
  ['2021', 'We came through it stronger, holding tighter, loving louder.'],
  ['2022', 'January 6th our son arrived — our family grew again, and so did my heart.'],
  ['2023', 'Forever turned out to be a thousand small good mornings, each one with you.'],
  ['2024', 'Still my steadiest place, still my favorite surprise.'],
  ['2025', 'Years in, and I’d choose that December 31st a thousand times over.'],
  ['2026', 'And here, now — I love you more than the day I married you.'],
];

function poemText(): string {
  const body = LOVE_POEM_LINES.map(([y, line]) => `${y} — ${line}`).join('\n');
  return `${LOVE_POEM_TITLE}\n\nFor ${WIFE_NAME},\n\n${body}\n\nRemember — every year, I love you more.`;
}

/**
 * The secret auction line-up. Each item's description ends with an "I love you,"
 * and the poem item carries the full poem behind a "💌 Read" button.
 */
export function anniversaryItems(): Array<Omit<Item, 'id'>> {
  return [
    {
      // April 23, 2016 — her first birthday you spent together.
      name: 'April 23, 2016 — Your Birthday, Together',
      description:
        'Your birthday, and the first one I got to celebrate at your side. I love you.',
      category: 'Our Day',
    },
    {
      name: "Shari's Cafe & Pies",
      description:
        'Our booth, late-night pies, and a hundred easy conversations. I love you.',
      category: 'Our Place',
    },
    {
      name: 'The Witch (2016)',
      description:
        'The eerie 2016 folk-horror we braved together — I’d face any dark woods with you. I love you.',
      category: 'Movie',
    },
    {
      name: 'December 31, 2016 — Our Wedding Day',
      description:
        'The last night of the year, you said yes to forever. Best day of my life. I love you.',
      category: 'Our Day',
    },
    {
      // August 30, 2017 — your first daughter's birthday.
      name: 'August 30, 2017 — Our First Daughter',
      description:
        'The day our first daughter arrived and made us a family. I love you.',
      category: 'Our Day',
    },
    {
      name: 'Through COVID, Together',
      description:
        'Locked-down days with no one but each other — I’d do it all again with you. I love you.',
      category: 'Us',
    },
    {
      // January 6, 2022 — your son's birthday.
      name: 'January 6, 2022 — Our Son',
      description:
        'The day our son was born and made our family complete. I love you.',
      category: 'Our Day',
    },
    {
      name: LOVE_POEM_TITLE,
      description:
        'A poem for you — one line for every year we’ve had. Tap 💌 Read. I love you.',
      category: 'Poem',
      message: poemText(),
    },
    {
      name: 'Forever & Always',
      description:
        'All the years still ahead of us — I can’t wait for every one. I love you.',
      category: 'Us',
    },
  ];
}
