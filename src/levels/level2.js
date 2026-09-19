/**
 * LEVEL 2 — HEADPHONE CRISIS
 * A Namma Metro carriage, Purple Line, Indiranagar → Majestic.
 *
 * Aditya is on the train with Diya. She asks where his headphones are. He
 * panics. What follows is a three-round guess-the-song interrogation, the
 * discovery of a pair of headphones, and then the actual point: his pink
 * earphones have been looped through his shirt the entire time — visible to
 * the player from the very first frame of the level.
 *
 * THE PUNCHLINE IS NOT "those aren't yours". He finds real headphones and
 * they are fine. MISSION FAILED fires because he spent the whole level
 * panicking about the wrong pair — he loves the pink earphones more, and he
 * should have been worried about THEM. The failure is emotional, not
 * logistical. Do not rewrite this into a mix-up gag.
 *
 * DESIGN: this level has no LEGO. Level 1's thesis was "you cannot jump, so
 * you must build"; this one's is "you cannot find what you are wearing". The
 * mechanic is the music quiz, declared via `mechanic: 'story'` so the offline
 * checkers validate it as a walked, scripted level instead of a brick puzzle.
 *
 * THE JOKE ONLY WORKS IF THE EARPHONES ARE VISIBLE. `playerAccessory` is set
 * from frame one (World.build reads it) and never spawned mid-level. Every
 * second the player spends hunting the carriage, the answer is hanging off
 * the protagonist's own shirt. Do not hide them to "preserve the twist" —
 * the twist IS that they were never hidden.
 *
 * Map legend: # terrain (carriage floor), . empty, P player start
 *
 * Column landmarks:
 *   x2       the door he boarded through at Indiranagar
 *   x8-30    the carriage interior — seats, poles, passengers
 *   x18      Diya, waiting
 *   x27      where the headphones turn up (revealed after all three songs)
 */

import { SONG_ROUNDS } from '../config/songs.js'

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

const level2 = {
  id: 2,
  name: 'HEADPHONE CRISIS',
  location: 'NAMMA METRO — INDIRANAGAR → MAJESTIC',
  objective: 'Find your headphones',
  hint: 'They are closer than you think. Much closer.',
  mechanic: 'story',
  teaches: 'MUSIC',
  map,

  // Inside a train there is no sky — the gradient is the far end of the
  // carriage, and `interior: true` swaps the clouds for a ceiling light.
  skyTop: '#2e3a4e',
  skyBottom: '#1a2130',
  interior: true,
  floor: { color: '#4a5568', colorDark: '#333c4d', colorTop: '#6b7a91' },
  floorAlt: { color: '#515e72', colorDark: '#3a4356', colorTop: '#74839b' },

  // No startStats: Level 2 inherits the meters he earned in Level 1, so he
  // walks into the metro with his shawarma HP and XP intact. This level only
  // ever awards HAPPINESS and XP — never HP.

  // The pink earphones. Worn, not placed. See the header comment.
  playerAccessory: 'earphonesHanging',

  props: [
    { type: 'metroDoor', x: 3, y: 9 },
    { type: 'metroSign', x: 6, y: 9, label: 'NEXT: HALASURU' },
    { type: 'metroWindow', x: 7, y: 9 },
    { type: 'metroSeat', x: 9, y: 9 },
    { type: 'passenger', x: 10, y: 9, color: '#43506a' },
    { type: 'metroPole', x: 12, y: 9 },
    { type: 'metroWindow', x: 13, y: 9 },
    { type: 'metroSeat', x: 15, y: 9 },
    { type: 'passenger', x: 15, y: 9, color: '#4a3f5e' },
    { type: 'metroPole', x: 17, y: 9 },
    { type: 'metroWindow', x: 19, y: 9 },
    { type: 'metroSeat', x: 21, y: 9 },
    { type: 'passenger', x: 22, y: 9, color: '#3c5560' },
    { type: 'metroPole', x: 24, y: 9 },
    { type: 'metroWindow', x: 25, y: 9 },
    { type: 'metroSeat', x: 27, y: 9 },
    { type: 'passenger', x: 28, y: 9, color: '#50435a' },
    { type: 'metroSign', x: 29, y: 9, label: 'MAJESTIC →' },
    { type: 'metroDoor', x: 30, y: 9 },
  ],

  npcs: [{ id: 'diya', x: 18, y: 9, facing: -1 }],

  // No bricks in this level at all.
  inventory: {},
  collectibles: [],

  // The headphones. Real ones, genuinely his — the gag is not a mix-up.
  // Hidden until all three songs are done, because the search is the reward
  // for the quiz, not a parallel activity.
  goals: [{ x: 27, y: 9, emoji: '🎧', label: 'HEADPHONES', hidden: true }],

  completeTitle: 'MISSION COMPLETE',
  completeMessage: '🎧 HEADPHONE CRISIS',
  rewards: ['+HAPPINESS', '+MUSIC XP', '+1 PINK EARPHONE'],

  // ======================================================================
  // THE SCRIPT
  // ======================================================================
  beats: [
    // ---- arrival ------------------------------------------------------
    { t: 'metroAmbience', on: true, chime: true },
    { t: 'camera', focus: { x: 16, y: 8 }, zoom: 0.72, dur: 2.8, ease: 0.04 },
    { t: 'banner', lines: ['NAMMA METRO'], sub: 'INDIRANAGAR → MAJESTIC  ·  PURPLE LINE', kind: 'info', dur: 2.4 },
    { t: 'camera', focus: 'player', zoom: 1, dur: 1.6, ease: 0.05, track: true },
    { t: 'cameraRelease' },

    // No mission card yet. He has no idea anything is wrong — the headphones
    // only become an objective once Diya asks about them. Handing the player
    // a "FIND THE HEADPHONES" card here would spoil her question before she
    // gets to ask it.
    { t: 'mission', icon: '🚇', title: 'NAMMA METRO', text: 'Diya is down the carriage. Go say hi.', dur: 2.4, control: true },

    // he walks down the carriage; she clocks him
    { t: 'waitFor', cond: 'playerReachedX', x: 15 },
    { t: 'control', on: false },
    { t: 'npcWalk', id: 'diya', to: 16, face: -1 },
    { t: 'camera', focus: { x: 15, y: 8 }, zoom: 1.3, dur: 0.9 },

    // ---- the greeting --------------------------------------------------
    { t: 'say', who: 'player', text: 'Yoo wassupp' },
    { t: 'react', who: 'diya', reaction: 'excited' },
    { t: 'say', who: 'diya', text: 'wassup wassup' },
    { t: 'react', who: 'diya', reaction: null },

    // ---- the question --------------------------------------------------
    { t: 'say', who: 'diya', text: 'umm where are your headphones?' },

    // Every wrong answer is a different Diya bit — that is the whole reason
    // the choice exists. She never repeats herself, and none of them are
    // punished; they just get roasted and she asks again.
    {
      t: 'choice',
      who: 'diya',
      options: [
        {
          text: 'Machuda',
          reply: ['why are you depressed again bro'],
        },
        {
          text: 'Lore da',
          reply: ['.. issues pah..'],
        },
        {
          text: 'Faaaaack',
          correct: true,
          reply: 'Wait.',
        },
        {
          text: 'I don’t need headphones',
          reply: ['DO YOU HAVE SOME NEW TEAA?'],
        },
      ],
    },

    // ---- he panics -----------------------------------------------------
    { t: 'react', who: 'diya', reaction: 'surprised' },
    { t: 'sting', kind: 'comedicFail', shake: 0.3 },
    { t: 'say', who: 'diya', text: 'WAIT… YOU ACTUALLY LOST THEM?!' },
    { t: 'react', who: 'player', reaction: 'panic' },
    { t: 'say', who: 'player', text: 'I— maybe?' },
    { t: 'say', who: 'player', text: 'Faaaaack.' },
    { t: 'react', who: 'diya', reaction: null },

    // the idea
    { t: 'say', who: 'diya', text: 'Wait wait wait…' },
    { t: 'react', who: 'diya', reaction: 'excited' },
    { t: 'say', who: 'diya', text: 'Guess the song brooo.' },
    { t: 'say', who: 'player', text: 'That’s not going to find my headphones.' },
    { t: 'say', who: 'diya', text: 'Guess. The song.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'cameraRelease' },

    // ---- THE MINIGAME --------------------------------------------------
    // Three rounds, all inside one beat. Wrong answers are free — the
    // rounds always advance. See src/config/songs.js to swap the songs.
    {
      t: 'mission',
      icon: '🎵',
      title: 'FIND YOUR HEADPHONES',
      text: 'GUESS THE SONG',
      dur: 2.8,
      checkpoint: true,
    },
    { t: 'songQuiz', rounds: SONG_ROUNDS, resultHold: 2.6 },

    // ---- she is satisfied, then remembers why they started -------------
    { t: 'camera', focus: { x: 17, y: 8 }, zoom: 1.25, dur: 0.8 },
    { t: 'say', who: 'diya', text: 'Okay okay…' },
    { t: 'react', who: 'diya', reaction: 'happy' },
    { t: 'say', who: 'diya', text: 'You’re still a music head.' },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'wait', dur: 0.8 },
    { t: 'react', who: 'diya', reaction: 'surprised' },
    { t: 'say', who: 'diya', text: 'But WHERE ARE YOUR HEADPHONES?' },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'react', who: 'player', reaction: 'realization' },
    { t: 'say', who: 'player', text: 'Oh. Right.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },
    { t: 'metroAmbience', on: true },

    // ---- the search ----------------------------------------------------
    // All three songs are done, so the headphones turn up. The search is
    // short on purpose: the brief says the physical hunt is not the level.
    {
      t: 'mission',
      icon: '🎧',
      title: 'FIND YOUR HEADPHONES',
      text: 'Look around the carriage.',
      dur: 2.4,
      control: true,
      checkpoint: true,
    },
    { t: 'reveal', labels: ['HEADPHONES'] },
    { t: 'npcWalk', id: 'diya', to: 22, face: 1, wait: false },
    { t: 'waitFor', cond: 'goalReached', id: 'HEADPHONES' },

    // ---- THE VICTORY ----------------------------------------------------
    // Played completely straight, and it IS a real victory — he found them.
    // The failure that follows is about which pair he was panicking over.
    { t: 'control', on: false },
    { t: 'sting', kind: 'dramaticVictory', shake: 0.4 },
    { t: 'camera', focus: 'player', zoom: 1.7, dur: 1.0 },
    { t: 'react', who: 'player', reaction: 'victory' },
    { t: 'particles', color: '#ffd166', count: 46, spread: 2.6 },
    { t: 'banner', lines: ['🎧 HEADPHONES FOUND!'], sub: 'AGAINST ALL ODDS', kind: 'good', dur: 2.8 },
    { t: 'react', who: 'diya', reaction: 'excited' },
    { t: 'say', who: 'diya', text: 'LESGOOOOOO!' },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    // ---- MISSION FAILED --------------------------------------------------
    // Not a mix-up. He found headphones and they are his. The game fails him
    // because he spent the entire level panicking about the wrong pair —
    // the pink earphones were the ones that mattered, and they were on him.
    { t: 'wait', dur: 1.1 },
    { t: 'react', who: 'diya', reaction: 'deadpan' },
    { t: 'say', who: 'diya', text: '…bro.' },
    { t: 'say', who: 'player', text: 'What?' },
    { t: 'wait', dur: 0.7 },

    { t: 'sting', kind: 'comedicFail', shake: 0.25 },
    {
      t: 'banner',
      lines: ['MISSION FAILED'],
      sub: 'we know you love your pink earphones more',
      kind: 'bad',
      dur: 3.2,
      sound: false,
    },
    {
      t: 'banner',
      lines: ['YOU SHOULD’VE BEEN WORRIED ABOUT THEM!'],
      sub: '',
      kind: 'bad',
      dur: 2.8,
      sound: false,
    },

    // ---- THE REVEAL ------------------------------------------------------
    // The camera finally looks at him properly. The pink cable has been
    // drawn on his shirt since the first frame of the level; this is just
    // the moment anyone bothers to look at it.
    { t: 'metroAmbience', on: false },
    { t: 'camera', focus: 'player', zoom: 2.6, dur: 1.8, ease: 0.04 },
    { t: 'wait', dur: 1.4 }, // silence
    { t: 'react', who: 'player', reaction: 'realization' },
    { t: 'wait', dur: 0.8 },
    { t: 'say', who: 'player', text: '…oh.' },

    { t: 'react', who: 'diya', reaction: 'surprised' },
    { t: 'say', who: 'diya', text: 'YOU HAD THEM THE WHOLE TIME.' },
    { t: 'react', who: 'player', reaction: 'embarrassed' },
    { t: 'say', who: 'player', text: 'They were in my shirt.' },
    { t: 'react', who: 'diya', reaction: 'deadpan' },

    // the long comedic pause — nobody says anything, the train just moves
    { t: 'wait', dur: 2.6 },
    { t: 'say', who: 'diya', text: 'Bro.' },
    { t: 'wait', dur: 1.0 },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    // ---- MUSIC RESTORED --------------------------------------------------
    { t: 'earphones', who: 'player', state: 'earphonesWorn' },
    { t: 'wait', dur: 0.6 },
    { t: 'musicMode', on: true, dur: 0.8 },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'cameraRelease' },
    { t: 'camera', focus: { x: 20, y: 8 }, zoom: 0.85, dur: 2.4, ease: 0.04 },
    { t: 'banner', lines: ['🎵 MUSIC RESTORED'], sub: '', kind: 'good', dur: 2.4, sound: false },
    { t: 'particles', color: '#ff5fa2', count: 50, spread: 3 },

    // HAPPINESS ONLY. HP is deliberately untouched this level.
    {
      t: 'award',
      happiness: 45,
      xp: 60,
      banner: 'HAPPINESS INCREASED',
      sub: '+HAPPINESS',
      dur: 2.8,
    },

    { t: 'say', who: 'diya', text: 'There he is.', reaction: 'happy' },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    {
      t: 'mission',
      icon: '🎵',
      title: 'MUSIC RESTORED',
      text: 'HAPPINESS +++',
      dur: 2.4,
    },

    { t: 'complete' },
  ],

  // The music keeps going quietly, the camera pulls back, the train carries
  // on. Level 3 exists now, so this card is a TIMED transition rather than a
  // hold: without a `dur` the beat never completes, `storyDone` never fires,
  // and App.jsx never loads the gym. Same change Level 1 made the moment
  // this level was built.
  outroBeats: [
    { t: 'camera', focus: { x: 18, y: 8 }, zoom: 0.6, dur: 3.2, ease: 0.03 },
    { t: 'say', who: 'diya', text: 'Okay. Majestic next.', auto: true, dur: 2.0 },
    { t: 'nextLocation', icon: '🏋️', title: 'THE GYM', dur: 3.4 },
  ],
}

export default level2
