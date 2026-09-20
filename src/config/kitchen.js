/**
 * ============================================================
 *  THE BEAR KITCHEN — Level 4's biryani puzzle
 * ============================================================
 *
 *  THIS IS THE FILE YOU EDIT to change what he cooks, what the
 *  wrong dishes say back, or how hard the jigsaw is.
 *
 *  ---- THE ONE IMAGE IN THE GAME ----------------------------
 *
 *  Everything else in this repo is drawn — the characters, and
 *  Level 3's sitcom "framebuffers" (see config/framebuffers.js
 *  for that reasoning). This level is the exception: its puzzle
 *  is a real jigsaw of a real plate of biryani, which needs an
 *  actual photograph. See public/food/README.md for the rights
 *  note and how to swap the picture.
 *
 *  ---- THE DISH CHOICE --------------------------------------
 *
 *  Presented at the STOVE, not in front of the other two — they
 *  have no idea what he is making until he serves it, which is
 *  what makes the ending land. Biryani is his favourite food, so
 *  a wrong pick is not "are you sure?" — it is him dismissing
 *  the idea out of hand and going back to the board.
 *
 *  ---- THE JIGSAW -------------------------------------------
 *
 *  Click two pieces to swap them. Solved when every piece is
 *  home. There is no move limit, no timer and no fail state:
 *  the joke of this level is that he SUCCEEDS and is punished
 *  for it, so the cooking must never be what defeats him.
 * ============================================================
 */

/** XP awarded per correctly placed jigsaw piece. */
export const KITCHEN_XP_PER_LAYER = 12

/**
 * The jigsaw. `BIRYANI_IMAGE` is cut into a GRID x GRID board, shuffled,
 * and rebuilt by swapping pieces.
 *
 * 3x3 on purpose. A 4x4 of a plate of rice is genuinely hard to read —
 * every tile is beige with a bit of orange — and this is a birthday gag,
 * not a test. Nine pieces is enough to feel like a puzzle and still be
 * solvable by looking at it.
 *
 * If the image is missing the puzzle still runs: the UI falls back to
 * numbered coloured tiles. See public/food/README.md.
 */
export const BIRYANI_IMAGE = 'food/biryani.jpg'
export const JIGSAW_GRID = 3

/**
 * What he can choose to cook, at the stove, with his back to the
 * other two. Exactly one is `correct`; the rest bounce off the
 * `confirm` line and send him back to the board.
 */
export const DISH_OPTIONS = [
  {
    id: 'maggi',
    emoji: '🍜',
    label: 'MAGGI',
    confirm: 'Nah. Not today.',
  },
  {
    id: 'pasta',
    emoji: '🍝',
    label: 'PASTA',
    confirm: 'Not in this kitchen.',
  },
  {
    id: 'fried-rice',
    emoji: '🍛',
    label: 'FRIED RICE',
    confirm: 'Close. But no.',
  },
  {
    id: 'biryani',
    emoji: '🍗',
    label: 'CHICKEN BIRYANI',
    correct: true,
    confirm: null,
  },
]

export default { DISH_OPTIONS, BIRYANI_IMAGE, JIGSAW_GRID, KITCHEN_XP_PER_LAYER }
