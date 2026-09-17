/**
 * quips.js — the gaming-humour bank.
 *
 * Kept out of gameConfig.js on purpose: gameConfig is the file the person
 * throwing the party edits, and it should stay short and obvious. These are
 * the game's own jokes.
 */

export const DEATH_QUIPS = {
  void: [
    'LEGO PHYSICS HAS SPOKEN.',
    'You have discovered the floor is optional. It is not.',
    'Skill issue.',
    'That was a load-bearing decision.',
  ],
  fall: [
    'LEGO PHYSICS HAS SPOKEN.',
    'Structural integrity: questionable.',
    'Gravity remains undefeated.',
    'Terminal velocity achieved. Shawarma: not achieved.',
  ],
  hazard: [
    'That was lava. It usually is.',
    'You touched the orange. The orange won.',
    'Respawn?',
    'Character development.',
  ],
  crush: [
    'Flattened. Like a plate. A 1x1 plate.',
    'The ceiling had opinions.',
    'Should have built a roof.',
  ],
}

export const REBUILD_QUIPS = [
  'Character development.',
  'Iteration is a legitimate strategy.',
  'Version 2.0.',
  'The blueprint was always a draft.',
]

export const SOLVE_QUIPS = [
  'Big brain build.',
  'That was NOT the intended solution.',
  'Certified structurally sound.',
  'Engineering degree: unofficial but earned.',
  'Somebody give this person a hard hat.',
]

export const OUT_OF_BLOCKS = [
  'You have encountered the true final boss: resource management.',
  'Out of bricks. Press Q to reclaim everything and rethink.',
  'Inventory: vibes only.',
]

export const INVALID_PLACE = [
  'It does not go there.',
  'Physics says no.',
  'That brick needs something to hold onto.',
]

/** Shown when someone keeps demolishing their own bridge. */
export const LEGO_NAG = [
  'Maybe stop doing that.',
  'The bridge did nothing to you.',
  'Version 4.0. Bold.',
  'At this point the gap is winning.',
]

/** Flavour for clicking bricks and picking up small useless pieces. */
export const LEGO_FLAVOUR = [
  'This piece is absolutely essential.',
  'Structurally: decorative.',
  'Every build needs one of these. Allegedly.',
]

export const LEGO_COLLAPSE = [
  'LEGO PHYSICS HAS SPOKEN.',
  'The bridge had opinions about your design.',
  'Gravity reviewed your blueprint.',
]

export const IDLE_HINTS = [
  'Bricks come back. Right-click or X to pick one up again.',
  'Press Q to reclaim every brick and start the build over.',
  'You cannot jump. That is not a bug, that is the entire game.',
  'A one-cell step is a stair. A two-cell step is a wall.',
]

export const pick = (arr, seed) =>
  arr[Math.abs(Math.floor(seed ?? Math.random() * arr.length)) % arr.length]

export const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
