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

/** Anisha, watching a brick land somewhere nowhere near the gap. */
export const LEGO_CONFUSION = [
  'WHAT ARE YOU BUILDING 😭',
  'That is not a bridge. That is a shed.',
  'I don’t— what is that.',
  'Sir. The gap is over there.',
]

/** Anisha's reaction the moment someone falls through the gap. */
export const BRIDGE_FAIL_QUIPS = [
  'Okay bro. Maybe architecture isn’t your thing.',
  'Structural engineering: not your major.',
  'That’s one way to test load-bearing capacity.',
  'We are going to pretend that didn’t happen.',
]

/** A milestone reaction the first time the bridge looks genuinely shaky. */
export const LEGO_WOBBLE = [
  'I don’t think that’s structurally sound.',
  'That’s… a choice of engineering.',
  'Bro I can see it wobbling from here.',
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
