/**
 * LEVEL 4 — THE BEAR KITCHEN
 * A professional kitchen mid-service, run at the intensity of a hostage
 * situation, by two people who are about to reveal they cannot eat any of it.
 *
 * ============================================================
 *  THE JOKE — and why the level has no fail state
 * ============================================================
 *
 * He is told to make GOOD FOOD. He goes off on his own and makes a chicken
 * biryani, alone, with his back to them. It is excellent. Then he calls them
 * over and they inform him that they are vegetarian.
 *
 * The punchline only works if he genuinely SUCCEEDS, so nothing in the
 * cooking can punish him: a wrong layer bounces back with a line and costs
 * nothing, and a silly dish is only ever met with "are you sure?". The one
 * thing that goes wrong is a thing he had no way to know and no way to
 * prevent. That is the entire design.
 *
 * THE DISH CHOICE HAPPENS AT THE STOVE, not in front of them. That placement
 * is load-bearing: if they watched him choose, they would have stopped him,
 * and there would be no reveal. They find out when he serves it.
 *
 * ============================================================
 *  THE TWO FRIENDS — they are not the same character
 * ============================================================
 *
 * Every level introduces one new friend: Anisha (L1), Diya (L2), Lord (L3).
 * This one introduces the last two at once, and they are opposites:
 *
 *   CHIRANTAN  loves Aditya. Heart eyes the moment he walks in, one-handed
 *              backrub, delighted by everything he does. Even his meltdown
 *              is about missing out on paneer butter masala.
 *   AMOGH      bullies Aditya. Slams a pan down to break up the backrub,
 *              barks orders, and is the one who accuses him at the end.
 *
 * Keep that split. The comedy of the ending is both of them crying for
 * completely different and equally unhelpful reasons.
 *
 * HOW IT ENDS: he does not argue. He puts his headphones on — the Level 2
 * callback — and eats the entire biryani while they cry at him. That is the
 * HP award, and happiness is deliberately NOT touched (Level 2 was the
 * happiness level). Exactly one `award` beat, HP + XP only.
 *
 * Map legend: # terrain (kitchen floor), . empty, P player start
 *
 * Column landmarks:
 *   x2        the door he comes in through
 *   x9-17     THE LINE — burners, boards, the pot rail overhead
 *   x11-12    where Chirantan is waiting, and gives the backrub
 *   x14       where Amogh plants himself to shout
 *   x19-30    THE PASS — steel counters, tickets, plates, the oven
 *   x23-24    the stove he cooks at, alone, and the pot he reveals
 */

import { DISH_OPTIONS, BIRYANI_IMAGE, JIGSAW_GRID } from '../config/kitchen.js'

const map = [
  '.................................',
  '.................................',
  '.................................',
  '.................................',
  '.................................',
  '.................................',
  '.................................',
  '#...............................#',
  '#...............................#',
  '#.P.............................#',
  '#################################',
  '#################################',
  '#################################',
]

const level4 = {
  id: 4,
  name: 'THE BEAR KITCHEN',
  location: 'THE KITCHEN — MID SERVICE',
  objective: 'Make something good',
  hint: 'They said GOOD FOOD. Nobody mentioned any dietary requirements.',
  mechanic: 'story',
  teaches: 'COOKING',
  map,

  // Dark, hot and orange. The gym was underlit and purple; this is underlit
  // and on fire. Kept a few stops brighter than it sounds so the space
  // around the room reads as a warm, smoky kitchen rather than as void —
  // the same job Level 3's purple does for the lab.
  skyTop: '#4a3423',
  skyBottom: '#241a12',
  interior: true,
  // Swaps in tile, steel, the extractor hood and the ticket rail, and keeps
  // the room still (only the metro rocks). See Renderer.drawKitchenShell.
  shell: 'kitchen',
  floor: { color: '#3a3128', colorDark: '#27211a', colorTop: '#4a4036' },
  floorAlt: { color: '#413830', colorDark: '#2c2620', colorTop: '#524739' },

  // No startStats: he keeps everything he earned in Levels 1-3.

  props: [
    // ---- the line ----
    { type: 'gasBurner', x: 9, y: 9 },
    { type: 'cuttingBoard', x: 10, y: 9, color: '#5faf4f' },
    { type: 'steelCounter', x: 11, y: 9, w: 2 },
    { type: 'knifeBlock', x: 13, y: 9 },
    { type: 'gasBurner', x: 14, y: 9 },
    { type: 'spiceRack', x: 15, y: 9 },
    { type: 'cuttingBoard', x: 16, y: 9, color: '#e2453c' },
    { type: 'gasBurner', x: 17, y: 9 },

    // ---- the pass ----
    { type: 'steelCounter', x: 20, y: 9, w: 3 },
    { type: 'biryaniPot', x: 24, y: 9 },
    { type: 'steelCounter', x: 26, y: 9, w: 2 },
    { type: 'plateStack', x: 27, y: 9, count: 6 },
    { type: 'oven', x: 29, y: 9 },
    { type: 'steelCounter', x: 31, y: 9, w: 2 },

    // ---- other staff, moving fast in the background ----
    { type: 'passenger', x: 7, y: 9, color: '#43506a' },
    { type: 'passenger', x: 19, y: 9, color: '#4a4034' },
    { type: 'passenger', x: 30, y: 9, color: '#3c4a52' },
  ],

  // Chirantan is already here. Amogh arrives with the pan — see npcShow.
  npcs: [
    { id: 'chirantan', x: 12, y: 9, facing: 1 },
    { id: 'amogh', x: 20, y: 9, facing: -1, hidden: true },
  ],

  inventory: {},
  collectibles: [],

  // Hidden until it is actually cooked. The biryani is the reward for the
  // service, not something he walks over and picks up.
  // `image` makes this draw the real photo rather than an emoji — see the
  // goal-drawing branch in Renderer.js. The emoji stays as the fallback for
  // the moment before it loads (or forever, if the file is missing).
  goals: [
    {
      x: 24,
      y: 9,
      emoji: '🍗',
      image: 'food/biryani.jpg',
      label: 'CHICKEN BIRYANI',
      hidden: true,
    },
  ],

  completeTitle: 'KITCHEN CHAOS COMPLETE',
  completeMessage: '🍗 BIRYANI COOKED. NOBODY ATE IT.',
  rewards: ['+50 HP', '+100 XP', '+1 BIRYANI', '+KITCHEN XP'],

  // ======================================================================
  // THE SCRIPT
  // ======================================================================
  beats: [
    // ---- cold open ------------------------------------------------------
    { t: 'letterbox', on: true },
    { t: 'kitchenAmbience', on: true },
    { t: 'banner', lines: ['LOADING…'], sub: '', kind: 'info', dur: 1.4, sound: false },
    { t: 'sting', kind: 'knifeChop' },
    { t: 'banner', lines: ['LEVEL 4'], sub: '', kind: 'info', dur: 1.3, sound: false },
    { t: 'sting', kind: 'panClang', shake: 0.3 },
    { t: 'banner', lines: ['THE BEAR KITCHEN'], sub: '🔥', kind: 'info', dur: 2.0, sound: false },
    { t: 'camera', focus: { x: 17, y: 8 }, zoom: 0.6, dur: 3.4, ease: 0.03 },
    { t: 'banner', lines: ['WELCOME TO THE KITCHEN.'], sub: '', kind: 'bad', dur: 2.4, sound: false },
    { t: 'sting', kind: 'ticketPrint' },
    { t: 'camera', focus: 'player', zoom: 1, dur: 1.6, ease: 0.05, track: true },
    { t: 'cameraRelease' },
    { t: 'letterbox', on: false },

    {
      t: 'mission',
      icon: '🍳',
      title: 'THE KITCHEN QUEST',
      text: 'Two of them are in here. One is happy about it.',
      dur: 2.4,
      control: true,
    },

    // ---- CHIRANTAN SEES HIM ---------------------------------------------
    // The hearts go up the moment he starts walking, before a word is said.
    // Chirantan's whole character is that he is delighted Aditya exists.
    { t: 'waitFor', cond: 'playerReachedX', x: 9 },
    { t: 'react', who: 'chirantan', reaction: 'hearts' },
    { t: 'sting', kind: 'select' },
    { t: 'say', who: 'chirantan', text: 'MACHAAA 😍', auto: true, dur: 1.8 },

    { t: 'waitFor', cond: 'playerReachedX', x: 11 },
    { t: 'control', on: false },
    { t: 'camera', focus: { x: 12, y: 8 }, zoom: 1.3, dur: 1.0 },
    { t: 'say', who: 'chirantan', text: 'Brooooo.' },
    { t: 'react', who: 'player', reaction: 'confused' },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'say', who: 'chirantan', text: 'Come here.' },

    // ---- THE BACKRUB ----------------------------------------------------
    // He stops HALF a cell short, on Aditya's left, and reaches over with
    // one hand. Standing on the same column would hide him completely
    // behind Aditya — see the `backrub` reaction in Characters.js.
    { t: 'npcWalk', id: 'chirantan', to: 11.55, face: -1 },
    { t: 'react', who: 'chirantan', reaction: 'backrub' },
    { t: 'sting', kind: 'select' },
    { t: 'react', who: 'player', reaction: 'surprised' },
    { t: 'wait', dur: 0.8 },
    { t: 'react', who: 'player', reaction: 'relaxed' },
    { t: 'banner', lines: ['RELAXATION +++'], sub: '', kind: 'good', dur: 2.0, sound: false },
    { t: 'wait', dur: 0.7 },
    { t: 'say', who: 'player', text: 'Damn bro…' },
    { t: 'say', who: 'chirantan', text: 'You work too hard da.' },
    { t: 'wait', dur: 0.8 },
    { t: 'say', who: 'player', text: 'Finally. Someone who understands me.' },
    { t: 'say', who: 'chirantan', text: 'Always macha. Always.' },
    { t: 'wait', dur: 1.0 },

    // ---- AMOGH ----------------------------------------------------------
    // The hard cut. Everything above is warm; everything below is Amogh
    // being relentlessly horrible to him, which is their entire dynamic.
    { t: 'sting', kind: 'panClang', shake: 0.55 },
    { t: 'react', who: 'player', reaction: 'panic' },
    { t: 'react', who: 'chirantan', reaction: 'surprised' },
    { t: 'npcShow', id: 'amogh', x: 20, y: 9, facing: -1 },
    { t: 'camera', focus: { x: 16, y: 8 }, zoom: 1.2, dur: 0.7 },
    { t: 'npcWalk', id: 'amogh', to: 14, face: -1 },
    { t: 'react', who: 'amogh', reaction: 'frustration' },
    { t: 'say', who: 'amogh', text: 'Omg stop being so gay' },
    { t: 'wait', dur: 1.0 },
    { t: 'say', who: 'amogh', text: 'And start cooking' },
    { t: 'react', who: 'chirantan', reaction: 'embarrassed' },
    { t: 'react', who: 'player', reaction: 'confused' },
    { t: 'say', who: 'player', text: '…what?' },
    { t: 'react', who: 'amogh', reaction: 'deadpan' },
    { t: 'say', who: 'amogh', text: "You're cooking." },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'react', who: 'amogh', reaction: 'excited' },
    { t: 'say', who: 'amogh', text: 'Laudeee make food daaa.' },
    { t: 'say', who: 'amogh', text: 'GOOD FOOD.' },

    // ---- "ME UH? OK BRO" ------------------------------------------------
    // No menu here, no negotiation. He accepts, smirks, and walks off. The
    // other two have no idea what is about to happen to them.
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'player', reaction: 'surprised' },
    { t: 'say', who: 'player', text: 'Me uh?' },
    { t: 'wait', dur: 1.0 },
    { t: 'react', who: 'player', reaction: 'smirk' },
    { t: 'say', who: 'player', text: 'ok bro' },
    { t: 'sting', kind: 'ayyy' },
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'chirantan', reaction: 'hearts' },
    { t: 'say', who: 'chirantan', text: 'Ayyy he said ok!', auto: true, dur: 1.8 },
    { t: 'react', who: 'amogh', reaction: 'deadpan' },
    { t: 'say', who: 'amogh', text: 'We will see.', auto: true, dur: 1.6 },
    { t: 'react', who: 'player', reaction: null },
    { t: 'react', who: 'amogh', reaction: null },
    { t: 'react', who: 'chirantan', reaction: null },
    { t: 'cameraRelease' },

    {
      t: 'mission',
      icon: '🔥',
      title: 'GO COOK',
      text: 'Head to the stove. They are not invited.',
      dur: 2.8,
      control: true,
      checkpoint: true,
    },

    // ---- AT THE STOVE ---------------------------------------------------
    // He walks away from them to the far end of the line. The dish choice
    // happens HERE, alone, which is what makes the reveal work later.
    { t: 'waitFor', cond: 'playerReachedX', x: 23 },
    { t: 'control', on: false },
    { t: 'camera', focus: { x: 24, y: 8 }, zoom: 1.2, dur: 1.2 },
    { t: 'react', who: 'player', reaction: 'concentration' },
    { t: 'say', who: 'player', text: 'Right.' },
    { t: 'react', who: 'player', reaction: null },
    {
      t: 'kitchen',
      dishes: DISH_OPTIONS,
      image: BIRYANI_IMAGE,
      grid: JIGSAW_GRID,
      checkpoint: true,
    },

    // ---- THE BEAR MOMENT ------------------------------------------------
    // Everything stops. The kitchen goes quiet, the camera finds the pot.
    // The one genuinely sincere stretch of the level, immediately demolished.
    { t: 'kitchenAmbience', on: false },
    { t: 'letterbox', on: true },
    { t: 'camera', focus: { x: 24, y: 8 }, zoom: 1.5, dur: 2.6, ease: 0.028 },
    { t: 'sting', kind: 'steamHiss' },
    { t: 'wait', dur: 1.8 },
    { t: 'sting', kind: 'lidOpen', shake: 0.25 },
    { t: 'reveal', labels: ['CHICKEN BIRYANI'] },
    { t: 'particles', x: 24, y: 8, color: '#ffd08a', count: 48, spread: 2.8 },
    { t: 'banner', lines: ['🍗 CHICKEN BIRYANI'], sub: '', kind: 'good', dur: 2.2 },
    { t: 'sting', kind: 'dramaticVictory', shake: 0.3 },
    { t: 'banner', lines: ['COOKED SUCCESSFULLY'], sub: '', kind: 'good', dur: 2.2, sound: false },
    { t: 'react', who: 'player', reaction: 'victory' },
    { t: 'say', who: 'player', text: 'LESGOOOOOOOO.' },
    { t: 'letterbox', on: false },

    // ---- HE CALLS THEM OVER ---------------------------------------------
    { t: 'react', who: 'player', reaction: 'excited' },
    { t: 'say', who: 'player', text: 'AY. COME.' },
    { t: 'sting', kind: 'ticketPrint' },
    { t: 'camera', focus: { x: 22, y: 8 }, zoom: 1.1, dur: 1.2 },
    { t: 'npcWalk', id: 'chirantan', to: 22, face: 1, wait: false },
    { t: 'npcWalk', id: 'amogh', to: 21, face: 1 },
    { t: 'react', who: 'chirantan', reaction: 'hearts' },
    { t: 'say', who: 'chirantan', text: 'It smells INSANE macha.' },
    { t: 'react', who: 'amogh', reaction: 'surprised' },
    { t: 'wait', dur: 1.4 },

    // ---- THE VEGETARIAN REVEAL ------------------------------------------
    { t: 'sting', kind: 'recordScratch', shake: 0.3 },
    { t: 'react', who: 'chirantan', reaction: 'realization' },
    { t: 'react', who: 'amogh', reaction: 'realization' },
    { t: 'wait', dur: 1.4 },
    { t: 'react', who: 'amogh', reaction: 'panic' },
    { t: 'say', who: 'amogh', text: 'Ay laude.' },
    { t: 'react', who: 'player', reaction: 'confused' },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'say', who: 'amogh', text: 'WE ARE VEGETARIAN.' },
    { t: 'wait', dur: 1.2 },
    { t: 'say', who: 'amogh', text: 'What is this?!' },
    { t: 'react', who: 'player', reaction: 'deadpan' },
    { t: 'wait', dur: 1.4 },
    { t: 'say', who: 'player', text: "Well ya'll asked me to make good food." },
    { t: 'wait', dur: 0.9 },
    { t: 'react', who: 'player', reaction: 'smirk' },
    { t: 'say', who: 'player', text: 'And I did.' },
    { t: 'sting', kind: 'comedicFail', shake: 0.4 },

    // ---- THE MELTDOWN ---------------------------------------------------
    { t: 'react', who: 'chirantan', reaction: 'crying' },
    { t: 'react', who: 'amogh', reaction: 'crying' },
    { t: 'camera', focus: { x: 22, y: 8 }, zoom: 1.3, dur: 1.2 },
    { t: 'wait', dur: 1.2 },
    {
      t: 'banner',
      lines: ['FRIENDS FED: ❌'],
      sub: 'VEGETARIAN FRIENDS HAPPY: ❌  ·  BIRYANI SUCCESSFUL: ✅',
      kind: 'bad',
      dur: 3.2,
      sound: false,
    },
    { t: 'say', who: 'chirantan', text: 'Macha I wanted starters, sides, paneer butter masala 😭' },
    { t: 'react', who: 'player', reaction: 'confused' },
    { t: 'say', who: 'player', text: 'You said good food.' },
    { t: 'say', who: 'amogh', text: "Machuda I'm going to medical college 😭" },
    { t: 'wait', dur: 1.4 },

    // ---- THEY BOTH LEAVE ------------------------------------------------
    // Amogh walks out on that line without waiting for an answer, and
    // Chirantan follows him to Udupi. Nobody stays. Nobody eats it.
    { t: 'react', who: 'amogh', reaction: 'frustration' },
    { t: 'npcWalk', id: 'amogh', to: 31, face: 1, wait: false },
    { t: 'react', who: 'player', reaction: 'deadpan' },
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'chirantan', reaction: 'crying' },
    { t: 'say', who: 'chirantan', text: 'Macha… I am going Udupi.' },
    { t: 'wait', dur: 0.9 },
    { t: 'say', who: 'chirantan', text: 'Sorry da 😭' },
    { t: 'npcWalk', id: 'chirantan', to: 31, face: 1, wait: false },
    { t: 'wait', dur: 1.6 },
    { t: 'banner', lines: ['THEY LEFT FOR UDUPI'], sub: '', kind: 'bad', dur: 2.6, sound: false },
    { t: 'npcHide', id: 'amogh' },
    { t: 'npcHide', id: 'chirantan' },
    { t: 'wait', dur: 1.2 },

    // ---- HEADPHONES ON, EAT --------------------------------------------
    // Alone in the kitchen with a biryani nobody else would eat. He does
    // not chase them and he does not argue. He puts the big over-ear
    // headphones on and gets to work on it.
    { t: 'react', who: 'player', reaction: null },
    { t: 'camera', focus: 'player', zoom: 1.4, dur: 1.2 },
    { t: 'wait', dur: 1.0 },
    { t: 'headphones', who: 'player', on: true },
    { t: 'sting', kind: 'metroChime' },
    { t: 'banner', lines: ['🎧 HEADPHONES ON'], sub: '', kind: 'info', dur: 2.2, sound: false },
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'player', reaction: 'eating' },
    { t: 'sting', kind: 'sizzle' },
    { t: 'wait', dur: 1.8 },
    { t: 'particles', x: 24, y: 8, color: '#ffd08a', count: 30, spread: 2.2 },
    { t: 'wait', dur: 1.4 },
    { t: 'react', who: 'player', reaction: 'victory' },
    {
      t: 'award',
      hp: 50,
      xp: 100,
      banner: 'HP RESTORED',
      sub: '+50 HP  ·  +100 XP',
      dur: 3.0,
    },
    {
      t: 'banner',
      lines: ['BIRYANI POWER ACQUIRED 🍗'],
      sub: '',
      kind: 'good',
      dur: 2.6,
      sound: false,
    },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },

    {
      t: 'mission',
      icon: '🍳',
      title: 'KITCHEN CHAOS COMPLETE',
      text: '+50 HP  ·  +100 XP',
      dur: 2.4,
    },

    { t: 'complete' },
  ],

  // The camera pulls back off the pot to show the whole empty kitchen: no
  // Chirantan, no Amogh, and one man in headphones working through a
  // biryani built for three. Nobody speaks, because there is nobody left
  // to speak to — that silence is the ending.
  outroBeats: [
    { t: 'camera', focus: 'player', zoom: 1.4, dur: 1.8, ease: 0.04 },
    { t: 'camera', focus: { x: 18, y: 8 }, zoom: 0.55, dur: 4.2, ease: 0.025 },
    { t: 'kitchenAmbience', on: false },
    // Level 5 does not exist yet, so this card HOLDS — the same convention
    // Levels 1-3 each used while they were the newest level. When the next
    // level is built, swap `hold: true` for `dur: 3.4` so storyDone fires
    // and App.jsx loads on.
    { t: 'nextLocation', icon: '🎂', title: 'THE BIRTHDAY', hold: true },
  ],
}

export default level4
