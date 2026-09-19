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
    skin: '#e8b98a',
    hair: '#1d1a1c',
    shirt: '#f2663c',
    shirtAlt: '#c94a26',
    pants: '#2e4a7d',
  },
  anisha: {
    id: 'anisha',
    name: 'ANISHA',
    skin: '#f0c49a',
    hair: '#241a18',
    shirt: '#8bd24f',
    shirtAlt: '#5c9a2f',
    pants: '#34405c',
    longHair: true,
  },
  diya: {
    id: 'diya',
    name: 'DIYA',
    skin: '#e6b183',
    hair: '#2a1410',
    shirt: '#e05c9e',
    shirtAlt: '#a83b74',
    pants: '#2c3450',
    longHair: true,
  },
  lord: {
    id: 'lord',
    name: 'LORD',
    skin: '#e9bd91',
    hair: '#1e1518',
    shirt: '#3fa7e0',
    shirtAlt: '#1f6f9c',
    pants: '#2c3450',
    longHair: true,
  },
  chirantan: {
    id: 'chirantan',
    name: 'CHIRANTAN',
    skin: '#e3b184',
    hair: '#1a1517',
    shirt: '#f2b230',
    shirtAlt: '#b87c12',
    pants: '#2b3346',
  },
  amogh: {
    id: 'amogh',
    name: 'AMOGH',
    skin: '#d99a6c',
    hair: '#171316',
    shirt: '#b07be0',
    shirtAlt: '#71479c',
    pants: '#2a3145',
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
