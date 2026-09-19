/**
 * ============================================================
 *  SITCOM FRAMEBUFFERS — Level 3's graphics puzzles
 * ============================================================
 *
 *  THIS IS THE FILE YOU EDIT to change the puzzles. Nothing else
 *  needs touching.
 *
 *  ---- WHY THERE ARE NO IMAGES ------------------------------
 *
 *  Both "framebuffers" are drawn from coloured blocks and emoji in
 *  the DOM, not from PNGs. Same reason the characters are drawn
 *  rather than photographed: this repo ships no binary art, and a
 *  scrambled tile puzzle reads perfectly well as nine coloured
 *  squares that snap into a face. `tiles` below IS the picture.
 *
 *  ---- LEGAL ------------------------------------------------
 *
 *  These are affectionate references to The Office and Modern
 *  Family, not frames from them. Keep it that way — no screencaps.
 *
 *  ---- PUZZLE 1: THE CODE BLOCK -----------------------------
 *
 *    snippet      the C++ listing, one string per line
 *    blankIndex   which line is the empty slot
 *    blocks       four { id, code, correct?, reply } options
 *    onCorrect    what she says when the matrix aligns
 *
 *  Exactly ONE block must be marked `correct: true` — the level
 *  validator enforces it.
 *
 *  ---- PUZZLE 2: THE SLIDER ---------------------------------
 *
 *    strips        how many horizontal bands the image is cut into
 *    stripShear    per-strip multiplier; one offset value fixes all
 *                  of them at once because each is a multiple of
 *                  the same number. Keep them non-zero or that
 *                  strip is already aligned and looks broken.
 *    targetOffset  the slider value where everything lines up
 *    tolerance     how close counts as aligned (px). Generous on
 *                  purpose — this is a joke, not a precision test.
 *    correctFps    must be one of `fpsOptions`, also validated.
 * ============================================================
 */

/** XP awarded per framebuffer solved. */
export const GRAPHICS_XP_PER_PUZZLE = 50

/**
 * PUZZLE 1 — SCRANTON_OFFICE.RAW
 *
 * THE SCENE: Michael Scott, mid-declaration, holding the WORLD'S BEST BOSS
 * mug he bought for himself. Dundler Mifflin Scranton, beige everything,
 * fluorescent lighting doing nobody any favours.
 *
 * The 3x3 reads top-to-bottom as: ceiling tiles and the branch banner / his
 * face and the mug / shirt, tie and the desk with its paper stacks. `tiles`
 * is the picture as it SHOULD look, `scrambled` is where each one starts, and
 * every tile begins flipped 180°. The permutation is authored, not shuffled
 * at runtime, so it looks identical every time it is tested.
 */
export const SCRANTON_PUZZLE = {
  id: 'scranton',
  kind: 'scranton',
  monitorLabel: 'FRAMEBUFFER 01: SCRANTON_OFFICE.RAW',
  caption: 'M_SCOTT / WORLDS_BEST_BOSS.MUG',

  tiles: [
    // top row — strip lights and the branch wall
    { id: 't0', bg: '#c9c2a8', fg: '#6b6550', glyph: '' },
    { id: 't1', bg: '#d6cfb4', fg: '#6b6550', glyph: '📋' },
    { id: 't2', bg: '#c9c2a8', fg: '#6b6550', glyph: '' },
    // middle row — the man himself, and the mug
    { id: 't3', bg: '#b8ae90', fg: '#2b2f3a', glyph: '' },
    { id: 't4', bg: '#c2b896', fg: '#e8b98a', glyph: '😀' },
    { id: 't5', bg: '#b8ae90', fg: '#ffffff', glyph: '☕' },
    // bottom row — shirt, tie, and the desk covered in paper
    { id: 't6', bg: '#8e8a78', fg: '#ffffff', glyph: '👔' },
    { id: 't7', bg: '#7d7a6a', fg: '#ffffff', glyph: '📄' },
    { id: 't8', bg: '#8e8a78', fg: '#ffffff', glyph: '📠' },
  ],
  // scrambled[i] = which tile is currently sitting in slot i
  scrambled: [5, 2, 7, 0, 8, 3, 1, 6, 4],

  snippet: [
    '#include <tv_engine.h>',
    '',
    'int main() {',
    '  Window win = createWindow("Scranton GPU");',
    '  Texture img = loadBuffer("michael_scott.png");',
    '  ______________________________;',
    '  img.applyShader(FILTER_DUNDER_MIFFLIN_WARMTH);',
    '  return 0;',
    '}',
  ],
  blankIndex: 5,

  // Every wrong option is a real Office bit. The correct one is the only
  // line that is actually about graphics.
  blocks: [
    {
      id: 'parkour',
      code: 'img.parkour();',
      reply: ['PARKOUR!!', 'Bro that is not a function, that is a Michael problem.'],
    },
    {
      id: 'fix',
      code: 'img.fixTileMatrix(UNSCRAMBLE_FLIP_180);',
      correct: true,
    },
    {
      id: 'declare',
      code: 'win.declareBankruptcy();',
      reply: ['You cannot just SAY the word bankruptcy.', 'You have to DECLARE it. Still wrong.'],
    },
    {
      id: 'beets',
      code: 'schrute.orderBeets(BEARS, BEETS);',
      reply: ['Bears. Beets. Battlestar Galactica.', 'Identity theft is not a joke, Aditya.'],
    },
  ],

  onCorrect: 'Ayyy! Prison Mike would be proud. Matrix aligned!',
  onWrong: ['Bro...', 'You had ONE job.'],
}

/**
 * PUZZLE 2 — DUNPHY_CHAOS.RAW
 *
 * THE SCENE: Phil Dunphy has once again ended up hanging upside-down off a
 * ladder in the Dunphy house, mid-magic-trick, while Claire stands at the
 * bottom not helping. Warm suburban light, hardwood floors, a staircase
 * nobody is using correctly.
 *
 * The frame is torn into six horizontal bands that have slid apart. Read top
 * to bottom it is: the ladder, his shoes in the air, legs, shirt, his
 * upside-down face still delivering the line, and Claire at floor level.
 * One slider fixes all six at once.
 */
export const DUNPHY_PUZZLE = {
  id: 'dunphy',
  kind: 'dunphy',
  monitorLabel: 'FRAMEBUFFER 02: DUNPHY_CHAOS.RAW',
  caption: 'P_DUNPHY / LADDER_INCIDENT.MOV',

  strips: [
    { bg: '#b89a6a', glyph: '🪜', shear: 1.0 },
    { bg: '#c2a675', glyph: '👟', shear: -0.75 },
    { bg: '#ccb081', glyph: '🦵', shear: 1.35 },
    { bg: '#d6ba8d', glyph: '👕', shear: -1.1 },
    { bg: '#e0c69a', glyph: '🙃', shear: 0.85 },
    { bg: '#c9b48f', glyph: '🤦', shear: -1.4 },
  ],

  targetOffset: 0,
  tolerance: 6,
  sliderMin: -100,
  sliderMax: 100,
  startOffset: -64, // where the slider sits when the puzzle opens

  fpsOptions: [1, 60, 999999],
  correctFps: 60,
  fpsReplies: {
    1: 'Bro it is a SLIDESHOW. Even Claire is bored.',
    60: "THERE it is. That's how you be a cool dad.",
    999999: 'BRO IS BREAKING THE CONTINUUM! Calm it down!',
  },

  onAligned: "Okay that's lined up. Now the frame rate.",
  onCorrect: "WE COOKED. He's peak WHAAAT-level smooth now.",
}
