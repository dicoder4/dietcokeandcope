/**
 * LEVEL 1 — THE SHAWARMA QUEST
 * Ramaiah Institute of Technology (MSRIT), Bengaluru.
 *
 * Aditya opens his eyes at Gate 11. Anisha is waiting. Between them and
 * Sultan there is a gap in the path and, for reasons nobody questions, a
 * pile of LEGO. He earns the shawarma: build the bridge, cross it, then
 * build the shawarma itself at the counter before he gets to eat it.
 *
 * DESIGN: the player cannot jump (see Player.js). The gap is 11 cells wide,
 * so a real multi-brick span is required — this is not a two-brick patch
 * job anymore. Several builds work: two 2x4 beams plus a 2x2 and a 1x1;
 * three 2x2 cubes plus small fillers; a pillar laid flat as a long single
 * plank plus studs. All are fine — that is the point.
 *
 * Map legend: # terrain, = thin platform, . empty, P player start
 *
 * Column landmarks:
 *   x2       Gate 11, where he wakes up
 *   x15      Anisha waits here
 *   x19-20   LEGO pile (loose bricks, on the NEAR side where he needs them)
 *   x22-32   THE GAP (11 wide, bottomless — falling in is a respawn, not a loss)
 *   x33      first solid ground on the far side — "you made it" fires here
 *   x42      Sultan: the counter where the shawarma gets built
 *
 * SEQUENCING: the shawarma (x43) and the Diet Coke (x41) start `hidden`.
 * They are not props lying on a counter; they come into existence only
 * after the food-builder minigame runs. Deaths rewind the script to the
 * last `checkpoint` beat so the objective on screen always matches where
 * the player actually is.
 */

const map = [
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.......................................................',
  '.P.....................................................',
  '######################...........######################',
  '######################...........######################',
  '######################...........######################',
  '######################...........######################',
]

// The shawarma-building minigame's categories. A top-level const (not a
// field on `level1`) so the `foodBuilder` beat below can reference it
// directly as a JS value — Beats.js has no notion of "the current level
// definition" and shouldn't need one just to read this list.
const SHAWARMA_CATEGORIES = [
  {
    key: 'chicken',
    title: 'CHOOSE YOUR CHICKEN',
    subtitle: 'The foundation. Choose wisely.',
    multi: false,
    options: [
      { id: 'tandoori', emoji: '🍗', label: 'Tandoori Chicken', color: '#c9622f', reaction: 'Okayyy. Good choice.' },
      { id: 'bbq', emoji: '🔥', label: 'BBQ Chicken', color: '#8a3b1f', reaction: 'Bro went sweet.' },
      { id: 'spicy', emoji: '🌶️', label: 'Spicy Chicken', color: '#a62f2f', reaction: 'You sure?' },
      { id: 'classic', emoji: '🍗', label: 'Classic Shawarma Chicken', color: '#c48a3e', reaction: 'The safe pick. Respect.' },
      { id: 'peri', emoji: '🔥', label: 'Peri Peri Chicken', color: '#b8451f', reaction: 'Oh, we’re doing this.' },
    ],
  },
  {
    key: 'sauce',
    title: 'CHOOSE YOUR SAUCE',
    subtitle: 'Pick a few. Not all of them.',
    multi: true,
    max: 3,
    warnAt: 4,
    warnReply: 'Bro.\nThat’s not a shawarma anymore.',
    options: [
      { id: 'garlic', emoji: '🤍', label: 'Garlic Sauce', color: '#f2edd8', reaction: 'The GOAT. Correct.' },
      { id: 'mayo', emoji: '⚪', label: 'Mayo', color: '#f5eeda', reaction: 'Fine. Boring, but fine.' },
      { id: 'chilli', emoji: '🔴', label: 'Chilli Sauce', color: '#c73a2f', reaction: 'Bold.' },
      { id: 'peri', emoji: '🟠', label: 'Peri Peri', color: '#d96a24', reaction: 'Now we’re talking.' },
      { id: 'bbq', emoji: '🟤', label: 'BBQ Sauce', color: '#6b3f22', reaction: 'Sweet and questionable.' },
      { id: 'mint', emoji: '🟢', label: 'Mint Sauce', color: '#6fa860', reaction: 'Unexpected. I respect it.' },
    ],
  },
  {
    key: 'fillings',
    title: 'ADD YOUR FILLINGS',
    subtitle: 'Take as many as you want.',
    multi: true,
    options: [
      { id: 'fries', emoji: '🍟', label: 'Fries', color: '#f2c14e', reaction: 'FRIES ADDED ✓\nCorrect.', special: true },
      { id: 'pickles', emoji: '🥒', label: 'Pickles', color: '#7bb04a', reaction: 'Tangy. Bold. Correct.' },
      { id: 'onion', emoji: '🧅', label: 'Onion', color: '#c9a6d9', reaction: 'The crunch is non-negotiable.' },
      { id: 'tomato', emoji: '🍅', label: 'Tomato', color: '#d6493a', reaction: 'Diplomatic choice.' },
      { id: 'lettuce', emoji: '🥬', label: 'Lettuce', color: '#7fbf5f', reaction: 'Structural integrity: improved.' },
      { id: 'cabbage', emoji: '🥗', label: 'Cabbage', color: '#c9d97e', reaction: 'The unsung hero.' },
      { id: 'jalapenos', emoji: '🌶️', label: 'Jalapeños', color: '#4f8a3e', reaction: 'Bold AND spicy. Noted.' },
      { id: 'cheese', emoji: '🧀', label: 'Cheese', color: '#f2c14e', reaction: 'A statement.' },
    ],
  },
  {
    key: 'extras',
    title: 'ANY EXTRAS?',
    subtitle: 'Optional. Don’t overthink it.',
    multi: true,
    optional: true,
    options: [
      { id: 'extraChicken', emoji: '🍗', label: 'Extra Chicken', color: '#c9622f', reaction: 'Ambitious.' },
      { id: 'extraSauce', emoji: '🥫', label: 'Extra Sauce', color: '#e0a23e', reaction: 'This is going to be messy.' },
      { id: 'extraFries', emoji: '🍟', label: 'Extra Fries', color: '#f2c14e', reaction: 'Correct, again.' },
      { id: 'extraCheese', emoji: '🧀', label: 'Cheese', color: '#f2c14e', reaction: 'A second statement.' },
      { id: 'extraSpicy', emoji: '🌶️', label: 'Extra Spicy', color: '#a62f2f', reaction: 'This is a mistake. Continue anyway.' },
    ],
  },
  {
    key: 'drink',
    title: 'ADD A DRINK?',
    subtitle: 'There is only one correct answer.',
    multi: false,
    options: [
      { id: 'dietcoke', emoji: '🥤', label: 'Diet Coke', color: '#3a3a3a', reaction: 'Now we’re talking.', special: true },
      { id: 'water', emoji: '💧', label: 'Water', color: '#7ec8e3', reaction: 'Responsible. Unnecessary, but responsible.' },
      { id: 'juice', emoji: '🧃', label: 'Juice', color: '#e8a13e', reaction: 'A choice was made.' },
    ],
  },
]

const level1 = {
  id: 1,
  name: 'GET THIS MAN A SHAWARMA',
  location: 'MSRIT — GATE 11',
  // LEGO is THIS level's mechanic, not a rule of the game. The offline
  // checkers branch on this: 'build' levels must be unsolvable without
  // bricks, 'story' levels are walked and scripted instead.
  mechanic: 'build',
  objective: 'Find out why you are awake',
  hint: 'You cannot jump. You can build. Left-click to lay a brick across the gap.',
  // Center column of the gap, used only for the "WHAT ARE YOU BUILDING"
  // reaction when a brick lands somewhere that clearly isn't helping.
  gapCenter: 27,
  skyTop: '#7fb7e8',
  skyBottom: '#f6d7a8',
  teaches: 'BRIDGES',
  map,

  startStats: { hp: 0, happiness: 0, xp: 0 },

  // Scenery. Purely decorative — drawn by the Renderer, collides with nothing.
  props: [
    { type: 'gate', x: 2, y: 9, label: 'GATE 11' },
    { type: 'tree', x: 6, y: 9 },
    { type: 'bench', x: 9, y: 9 },
    { type: 'building', x: 11, y: 9, w: 5, h: 5, label: 'MSRIT' },
    { type: 'tree', x: 18, y: 9 },
    { type: 'sign', x: 20, y: 9, label: 'SULTAN →' },
    { type: 'tree', x: 38, y: 9 },
    { type: 'stall', x: 42, y: 9, label: 'SULTAN' },
  ],

  npcs: [
    // Anisha starts off to the right and walks in for the opening scene.
    { id: 'anisha', x: 19, y: 9, facing: -1 },
  ],

  // A real span needs real material. Plenty of spares so experimenting —
  // and failing — never dead-ends the puzzle.
  inventory: {
    brick2x4: 4,
    brick2x2: 4,
    brick1x2: 4,
    brick1x1: 4,
    pillar: 1, // the "weird useless piece" — technically usable, mostly a joke
  },

  collectibles: [
    // The LEGO pile sits on the NEAR side, before the gap — it has to be
    // reachable at the moment he actually needs bricks, not stranded on the
    // far bank behind the very gap it is meant to bridge.
    { x: 19, y: 9, kind: 'brick', typeId: 'brick2x4', count: 1 },
    { x: 20, y: 9, kind: 'brick', typeId: 'brick1x1', count: 1 },
    // The Diet Coke does not exist until he orders it at the counter.
    { x: 41, y: 9, kind: 'treat', emoji: '🥤', label: 'DIET COKE', hidden: true },
  ],

  // The shawarma is not sitting on the counter waiting for him — it does
  // not exist until he has built it. Revealed by the `reveal` beat.
  goals: [{ x: 43, y: 9, emoji: '🌯', label: 'SHAWARMA', hidden: true }],

  // A designer-verified solution, replayed by scripts/validateLevels.mjs.
  // ONE answer, not THE answer — covers the full 11-cell gap (x22-32).
  reference: [
    { type: 'brick2x4', x: 22, y: 10, rot: 0 }, // x22-25
    { type: 'brick2x4', x: 26, y: 10, rot: 0 }, // x26-29
    { type: 'brick2x2', x: 30, y: 10, rot: 0 }, // x30-31
    { type: 'brick1x1', x: 32, y: 10, rot: 0 }, // x32
  ],

  completeTitle: 'MISSION COMPLETE',
  completeMessage: '🌯 THE PERFECT SHAWARMA QUEST',
  rewards: ['+30 HP', '+100 XP', '+1 SHAWARMA', '+1 DIET COKE', '+SHAWARMA POWER'],

  // ======================================================================
  // THE SCRIPT
  // ======================================================================
  beats: [
    // The eyes-opening animation is the first thing the player sees —
    // starts on black, no boot text, no menu. Camera opens tight on his
    // face so the blink reads clearly, then pulls out to reveal MSRIT.
    { t: 'camera', focus: 'player', zoom: 2.6, dur: 0 },
    { t: 'eyesOpen', dur: 2.6, hold: 0.5 },
    { t: 'camera', focus: 'player', zoom: 1, dur: 3.0, ease: 0.06, track: true },
    { t: 'cameraRelease' },

    { t: 'mission', icon: '📍', title: 'MSRIT', text: 'Gate 11. Somehow.', dur: 2.2, control: true },

    // he walks; Anisha notices him
    { t: 'waitFor', cond: 'playerReachedX', x: 12 },
    { t: 'control', on: false },
    { t: 'npcWalk', id: 'anisha', to: 15, face: -1 },
    { t: 'camera', focus: { x: 13.5, y: 8 }, zoom: 1.25, dur: 0.9 },

    { t: 'say', who: 'anisha', text: 'Hey yoooo, whatsup?' },

    {
      t: 'choice',
      who: 'anisha',
      options: [
        {
          text: 'Who are you?',
          reply: ['…Anisha. We have had three years of classes together.', 'Blink twice if you need help.'],
        },
        {
          text: 'Where am I?',
          reply: ['College. Same college. The one you come to every day.', 'Are you okay.'],
        },
        {
          text: 'Where is my shawarma?',
          correct: true,
          reply: 'Okay. Priorities.',
          andThen: 'Come. We need to get to Sultan.',
        },
        {
          text: 'Why am I here?',
          reply: ['Existential. Bold choice for 11am.', 'Try again.'],
        },
      ],
    },

    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'cameraRelease' },
    {
      t: 'mission',
      icon: '🌯',
      title: 'GET THIS MAN A SHAWARMA',
      text: 'Reach Sultan and secure the sacred shawarma.',
      control: true,
      dur: 2.8,
    },
    { t: 'react', who: 'player', reaction: null },

    // Anisha leads the way toward the gap. The trigger sits well short of
    // the gap edge (x22) — a fast or held-key walk can cover several cells
    // between one Director tick and the next, so the buffer has to survive
    // more than a single frame's worth of overshoot.
    { t: 'npcWalk', id: 'anisha', to: 18, face: 1, wait: false },
    { t: 'waitFor', cond: 'playerReachedX', x: 18 },

    // ==================================================================
    // THE PROBLEM — expanded per the brief's exact beats
    // ==================================================================
    { t: 'control', on: false },
    { t: 'npcWalk', id: 'anisha', to: 19, face: -1 },
    { t: 'say', who: 'anisha', text: 'Bro…' },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'say', who: 'anisha', text: 'We need to get across.' },

    // reveal the gap — now a proper wide chasm
    { t: 'camera', focus: { x: 27, y: 11 }, zoom: 0.6, dur: 2.6, ease: 0.035 },
    { t: 'say', who: 'anisha', text: '…and?' },
    // Aditya is the one who clocks the LEGO and lights up — this is his
    // moment, not Anisha's. She's just confused by his enthusiasm.
    { t: 'camera', focus: { x: 35, y: 9 }, zoom: 1.1, dur: 1.6 },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'say', who: 'player', text: 'LEGO!' },
    { t: 'say', who: 'player', text: 'Is that— that is SO much LEGO.' },
    { t: 'say', who: 'anisha', text: 'Okay, focus.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },

    // ==================================================================
    // BUILD + CROSS. This whole stretch is one checkpoint: falling in the
    // gap rewinds the script to here, so a death drops him back at the
    // start of the bridge job with the right objective on screen — never
    // mid-crossing dialogue he has not earned yet.
    // ==================================================================
    {
      t: 'mission',
      icon: '🧱',
      title: 'LEGO BRIDGE CONSTRUCTION',
      text: 'Build a bridge across the gap, then cross it.',
      control: true,
      build: true,
      dur: 3.0,
      checkpoint: true,
    },

    // ---- the mini-game + the crossing, as one continuous stretch ------
    // The wobble triggers at x27 — the middle of the 11-wide gap (x22-32),
    // so he is genuinely standing on his own bridge when it happens.
    { t: 'waitFor', cond: 'playerReachedX', x: 27, build: true },
    { t: 'control', on: false },
    { t: 'react', who: 'player', reaction: 'surprised', shake: 0.35 },
    { t: 'say', who: 'player', text: 'BRO.' },
    { t: 'say', who: 'anisha', text: 'Don’t look down.' },
    { t: 'say', who: 'player', text: '…why would you say that?' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'control', on: true, build: true },

    // ---- actually across: x33 is the first solid cell on the far side --
    { t: 'waitFor', cond: 'playerReachedX', x: 33, build: true },
    {
      t: 'banner',
      lines: ['BRIDGE COMPLETE ✓'],
      sub: 'ENGINEERING SKILLS: QUESTIONABLE  ·  STRUCTURAL INTEGRITY: ACCEPTABLE',
      kind: 'good',
      dur: 2.6,
    },
    { t: 'banner', lines: ['YOU MADE IT.'], sub: '', kind: 'good', dur: 1.8 },
    { t: 'say', who: 'anisha', text: 'Okay. Let’s go.', auto: true, dur: 1.8 },

    // safely across — from here a death can only be a silly one, so the
    // checkpoint moves up with him
    {
      t: 'mission',
      icon: '🌯',
      title: 'REACH SULTAN',
      text: 'It is right there. Walk.',
      control: true,
      build: false,
      dur: 2.0,
      checkpoint: true,
    },
    { t: 'npcWalk', id: 'anisha', to: 40, face: 1, wait: false },

    // ==================================================================
    // SULTAN — build the shawarma before eating it
    // ==================================================================
    // Arriving at the counter. The counter is EMPTY at this point — the
    // shawarma and the Diet Coke do not exist in the world yet (both start
    // `hidden` in the level definition). He has to order and build them.
    { t: 'waitFor', cond: 'playerReachedX', x: 41 },
    { t: 'control', on: false },
    { t: 'build', on: false },
    { t: 'camera', focus: 'player', zoom: 1.4, dur: 1.0 },
    { t: 'say', who: 'anisha', text: 'Finally.' },
    { t: 'say', who: 'player', text: 'Let’s go.' },
    { t: 'say', who: 'anisha', text: 'Okay.' },
    // Explicit: he builds it, she just watches and heckles — that's the joke.
    { t: 'say', who: 'anisha', text: 'Build your shawarma. I’ll wait.' },
    { t: 'cameraRelease' },

    {
      t: 'mission',
      icon: '🌯',
      title: 'THE PERFECT SHAWARMA QUEST',
      text: 'Build it. Then eat it.',
      dur: 2.6,
      checkpoint: true,
    },

    // the shawarma-building minigame — see Beats.js `foodBuilder`.
    // Only Aditya makes choices here; nothing in the beat lets Anisha (or
    // anything else) skip ahead to eating before this fully resolves —
    // `complete` sits after both the builder AND the eating beats below,
    // so there is no path to the shawarma without building it first.
    { t: 'foodBuilder', categories: SHAWARMA_CATEGORIES },

    // NOW they exist: he built the shawarma and the drink came with it.
    { t: 'reveal', labels: ['SHAWARMA', 'DIET COKE'] },
    { t: 'banner', lines: ['🌯 PERFECT SHAWARMA COMPLETE'], sub: '', kind: 'good', dur: 2.2 },
    { t: 'banner', lines: ['🥤 DIET COKE ACQUIRED'], sub: '', kind: 'good', dur: 1.8 },
    { t: 'say', who: 'anisha', text: 'Finally. Give me some.' },
    { t: 'say', who: 'player', text: 'Fine. One bite.' },

    // both eat — he built it, but he's not eating alone
    { t: 'react', who: 'player', reaction: 'eating' },
    { t: 'react', who: 'anisha', reaction: 'eating' },
    { t: 'particles', color: '#ffd166', count: 40, spread: 2.2 },
    { t: 'award', hp: 30, xp: 100, banner: 'SHAWARMA POWER ACQUIRED', sub: '+30 HP', dur: 2.6 },
    { t: 'say', who: 'anisha', text: 'Now you can function.', reaction: 'happy' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'react', who: 'anisha', reaction: null },

    { t: 'complete' },
  ],

  // Shown after the LevelComplete card, on the way out. Level 2 exists now,
  // so this card is a timed transition into the metro rather than the end of
  // the line — no `hold`, which lets `storyDone` fire and App.jsx load on.
  outroBeats: [
    { t: 'say', who: 'anisha', text: 'Okay, let’s go.' },
    { t: 'nextLocation', icon: '🎧', title: 'MUSIC DISTRICT', dur: 3.4 },
  ],
}

export default level1
