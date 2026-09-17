/**
 * LEVEL 1 — THE SHAWARMA QUEST
 * Ramaiah Institute of Technology (MSRIT), Bengaluru.
 *
 * Aditya opens his eyes at Gate 11. Anisha is waiting. Between them and
 * Sultan there is a gap in the path and, for reasons nobody questions, a
 * pile of LEGO.
 *
 * DESIGN: the player cannot jump (see Player.js). The gap is 6 cells wide,
 * so the only category of solution is BUILD ACROSS IT. Several builds work:
 * one 2x4 beam plus a stud; two 1x2 plates and fill; or pile 2x2 cubes from
 * the trench floor and walk through. All are fine — that is the point.
 *
 * Map legend: # terrain, = thin platform, . empty, P player start
 *
 * Column landmarks:
 *   x2      Gate 11, where he wakes up
 *   x14     Anisha waits here
 *   x22-27  THE GAP (6 wide, bottomless — falling in is a respawn, not a loss)
 *   x30     LEGO pile (loose bricks to pick up)
 *   x38     Sultan: shawarma + Diet Coke
 */

const map = [
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '.P............................................',
  '######################......##################',
  '######################......##################',
  '######################......##################',
  '######################......##################',
]

const level1 = {
  id: 1,
  name: 'THE SHAWARMA QUEST',
  location: 'MSRIT — GATE 11',
  objective: 'Find out why you are awake',
  hint: 'You cannot jump. You can build. Left-click to lay a brick across the gap.',
  skyTop: '#7fb7e8',
  skyBottom: '#f6d7a8',
  teaches: 'BRIDGES',
  map,

  startStats: { hp: 60, happiness: 50, xp: 0 },

  // Scenery. Purely decorative — drawn by the Renderer, collides with nothing.
  props: [
    { type: 'gate', x: 2, y: 9, label: 'GATE 11' },
    { type: 'tree', x: 6, y: 9 },
    { type: 'bench', x: 9, y: 9 },
    { type: 'building', x: 11, y: 9, w: 5, h: 5, label: 'MSRIT' },
    { type: 'tree', x: 18, y: 9 },
    { type: 'sign', x: 20, y: 9, label: 'SULTAN →' },
    { type: 'tree', x: 33, y: 9 },
    { type: 'stall', x: 37, y: 9, label: 'SULTAN' },
  ],

  npcs: [
    // Anisha starts off to the right and walks in for the opening scene.
    { id: 'anisha', x: 19, y: 9, facing: -1 },
  ],

  // Enough bricks to bridge the gap several different ways, plus spares so
  // experimenting never dead-ends.
  inventory: {
    brick2x4: 2,
    brick1x2: 3,
    brick1x1: 3,
    brick2x2: 2,
  },

  collectibles: [
    // the LEGO pile by the gap
    { x: 30, y: 9, kind: 'brick', typeId: 'brick2x4', count: 1 },
    { x: 31, y: 9, kind: 'brick', typeId: 'brick1x1', count: 1 },
    { x: 36, y: 9, kind: 'treat', emoji: '🥤', label: 'DIET COKE' },
  ],

  goals: [{ x: 38, y: 9, emoji: '🌯', label: 'SHAWARMA' }],

  // A designer-verified solution, replayed by scripts/validateLevels.mjs.
  // ONE answer, not THE answer.
  reference: [
    { type: 'brick2x4', x: 22, y: 10, rot: 0 }, // beam fills x22-25
    { type: 'brick1x2', x: 26, y: 10, rot: 0 }, // plate closes x26-27
  ],

  completeTitle: 'MISSION COMPLETE',
  completeMessage: '🌯 THE SHAWARMA QUEST',
  rewards: ['+30 HP', '+1 SHAWARMA', '+1 DIET COKE', '+1 LEGO BRIDGE', '+100 XP'],

  // ======================================================================
  // THE SCRIPT
  // ======================================================================
  beats: [
    { t: 'boot', lines: ['SYSTEM BOOTING…', 'PLAYER DETECTED', 'LOCATION: MSRIT', 'OBJECTIVE: FIND SHAWARMA'], per: 0.9 },

    // open tight on his face, then pull out to reveal the campus
    { t: 'camera', focus: 'player', zoom: 2.6, dur: 0 },
    { t: 'eyesOpen', dur: 1.8 },
    { t: 'camera', focus: 'player', zoom: 1, dur: 3.0, ease: 0.06, track: true },
    { t: 'cameraRelease' },

    { t: 'say', who: 'player', text: '…where.', reaction: 'surprised' },
    { t: 'react', who: 'player', reaction: null },

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
      title: 'THE SHAWARMA QUEST',
      text: 'Reach Sultan and secure the sacred shawarma.',
      control: true,
      dur: 2.8,
    },
    { t: 'react', who: 'player', reaction: null },

    // Anisha leads the way toward the gap
    { t: 'npcWalk', id: 'anisha', to: 20, face: 1, wait: false },
    { t: 'waitFor', cond: 'playerReachedX', x: 20 },

    // THE PROBLEM
    { t: 'control', on: false },
    { t: 'npcWalk', id: 'anisha', to: 21, face: -1 },
    { t: 'say', who: 'anisha', text: 'Bro… there’s a problem.', reaction: 'surprised' },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'say', who: 'anisha', text: 'We need to get across.' },

    // reveal the gap
    { t: 'camera', focus: { x: 25, y: 11 }, zoom: 0.72, dur: 2.4, ease: 0.04 },
    { t: 'react', who: 'anisha', reaction: null },
    { t: 'say', who: 'anisha', text: '…is that LEGO?', auto: true, dur: 2.2 },
    { t: 'camera', focus: { x: 30, y: 9 }, zoom: 1.1, dur: 1.6 },
    { t: 'say', who: 'anisha', text: 'That is absolutely LEGO.' },
    { t: 'cameraRelease' },

    {
      t: 'mission',
      icon: '🧱',
      title: 'BUILD A BRIDGE',
      text: 'Construct a LEGO bridge from Gate 11 to Sultan.',
      control: true,
      build: true,
      dur: 3.0,
    },

    // ---- the mini-game: gameplay runs until he is across --------------
    { t: 'waitFor', cond: 'playerReachedX', x: 29, build: true },

    {
      t: 'banner',
      lines: ['BRIDGE COMPLETE.'],
      sub: 'ENGINEERING SKILLS: QUESTIONABLE  ·  STRUCTURAL INTEGRITY: ACCEPTABLE',
      kind: 'good',
      dur: 3.2,
    },
    { t: 'npcWalk', id: 'anisha', to: 29, face: 1, wait: false },

    {
      t: 'mission',
      icon: '🌯',
      title: 'REACH SULTAN',
      text: 'Shawarma. Diet Coke. In that order, or the other order.',
      control: true,
      build: true,
      dur: 2.4,
    },

    // ---- Sultan --------------------------------------------------------
    { t: 'waitFor', cond: 'goalReached', id: 'SHAWARMA', build: true },
    { t: 'control', on: false },
    { t: 'build', on: false },
    { t: 'npcWalk', id: 'anisha', to: 36, face: 1, wait: false },
    { t: 'camera', focus: 'player', zoom: 1.5, dur: 1.2 },
    { t: 'say', who: 'anisha', text: 'Finally.' },

    { t: 'react', who: 'player', reaction: 'eating' },
    { t: 'particles', color: '#ffd166', count: 40, spread: 2.2 },
    { t: 'award', hp: 30, xp: 100, banner: 'SHAWARMA POWER!', sub: '+30 HP', dur: 2.6 },
    { t: 'say', who: 'anisha', text: 'Now you can function.', reaction: 'happy' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },

    { t: 'complete' },
  ],

  // Shown after the LevelComplete card, on the way out.
  outroBeats: [
    { t: 'say', who: 'anisha', text: 'Okay, let’s go.' },
    { t: 'nextLocation', icon: '🎧', title: 'MUSIC DISTRICT', dur: 3.6 },
  ],
}

export default level1
