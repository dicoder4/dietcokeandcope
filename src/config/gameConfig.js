/**
 * ============================================================
 *  SHAWARMAGEDDON — PERSONALIZATION FILE
 * ============================================================
 *  Everything personal lives HERE. Change these strings and the
 *  whole game re-themes itself. No need to touch any other file.
 * ============================================================
 */

/**
 * CAST
 *
 * `id` must match the photo filename you drop into public/faces/
 * (e.g. id 'aditya' -> public/faces/aditya.png). If no photo is
 * there, the game draws a stylized head using these colours instead.
 * See public/faces/README.md.
 */
export const CAST = {
  aditya: {
    id: 'aditya',
    name: 'ADITYA',
    skin: '#d99b6c',
    hair: '#1d1a1c',
    shirt: '#68c4d4',
    shirtAlt: '#4baabc',
    pants: '#d6c8b0',
    sunglasses: true,
  },
  anisha: {
    id: 'anisha',
    name: 'ANISHA',
    skin: '#b57f5bff',
    hair: '#1c1615',
    shirt: '#f8c4d0',
    shirtAlt: '#d99cb0',
    pants: '#b0c9f0ff',
    longHair: true,
  },
  diya: {
    id: 'diya',
    name: 'DIYA',
    skin: '#eebf99',
    hair: '#1a1413',
    shirt: '#f88604ff',
    shirtAlt: '#16161b',
    pants: '#385a8a',
    longHair: true,
    height: 0.86,
  },
  lord: {
    id: 'lord',
    name: 'ADITRI',
    skin: '#ebc49f',
    hair: '#1b1615',
    shirt: '#f2f2f4',
    shirtAlt: '#d5d5d9',
    pants: '#e6d6dc',
    longHair: true,
    glasses: true,
  },
  aditri: {
    id: 'aditri',
    name: 'ADITRI',
    skin: '#ebc49f',
    hair: '#1b1615',
    shirt: '#f2f2f4',
    shirtAlt: '#d5d5d9',
    pants: '#7bf57bff',
    longHair: true,
    glasses: true,
  },
  chirantan: {
    id: 'chirantan',
    name: 'CHIRANTAN',
    skin: '#d89c6d',
    hair: '#1c1716',
    shirt: '#4a443b',
    shirtAlt: '#332f28',
    pants: '#d6c5a0',
  },
  amogh: {
    id: 'amogh',
    name: 'AMOGH',
    skin: '#ecc5a2',
    hair: '#171316',
    shirt: '#f7b09c',
    shirtAlt: '#d98d79',
    pants: '#2c3448',
  },
}

const gameConfig = {
  // --- WHO IS THIS FOR ---------------------------------------
  playerId: 'aditya',
  playerName: CAST.aditya.name,
  age: 21, // his age going into this adventure
  birthdayAge: 22, // the age he turns — shown at the very end, after HBD

  cast: CAST,

  // --- THE BIG MESSAGE ---------------------------------------
  birthdayMessage:
    'You built your way through another year. Nice work, engineer.',

  // --- FINAL REVEAL MESSAGES (shown one by one at the end) ---
  customMessages: [
    'Another year, another build.',
    'Still the only person who can make a plate of biryani disappear in 90 seconds.',
    'May your shawarma always be wrapped tight and your Diet Coke always be cold.',
    'Thanks for being the kind of friend who helps carry the heavy blocks.',
  ],

  // --- INSIDE JOKES (sprinkled through loading/level screens) -
  insideJokes: [
    'Diet Coke is a food group. This is science.',
    'Gate 11 has seen things.',
    'Nobody has ever finished a shawarma without getting garlic sauce on their sleeve.',
    'Sultan at 4pm is a spiritual experience.',
    'You have 4 blocks and a dream.',
  ],

  // --- FRIENDS (get a shout-out on the credits scene) --------
  friends: ['Anisha', 'Diya', 'Lord', 'Chirantan', 'Amogh'],

  // --- SIGN-OFF ----------------------------------------------
  signature: '— with love, from the build crew',

  // --- TUNING (safe to ignore) -------------------------------
  showControlsHintOnLevel1: true,
  musicEnabled: true,
  sfxEnabled: true,
}

export default gameConfig
