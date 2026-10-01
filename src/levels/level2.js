/**
 * LEVEL 2 — HEADPHONE CRISIS
 * A Namma Metro carriage, Purple Line, Indiranagar → Majestic.
 *
 * Aditya is on the train with Diya. She asks where his headphones are; he has
 * genuinely lost them. She makes him earn them back song by song, and when
 * he finally finds them the game tells him he was worried about the wrong
 * pair anyway.
 *
 * THE STRUCTURE, AND WHY IT IS THIS WAY:
 *
 *   1. He starts with NOTHING round his neck. The headphones really are
 *      lost — `playerAccessory` is deliberately unset, so there is no prop
 *      on him to contradict the panic. An earlier draft hung the pink
 *      earphones on him from frame one; that made every line of the search
 *      read as stupidity rather than comedy.
 *   2. The quiz is a GATE, not a diversion. A wrong answer replays the same
 *      round (see the songQuiz beat) — he cannot fail past it, only finish
 *      it. Getting every song right is what makes the headphones appear.
 *   3. He finds the headphones. They are his, they are fine, it is a real
 *      win.
 *   4. THEN the joke: MISSION FAILED, because the pink earphones are the
 *      ones he actually loves and he never once asked where THEY were. The
 *      failure is emotional, not logistical — this is not a mix-up gag and
 *      nobody says "those aren't yours".
 *   5. The pink earphones appear on his shirt at that moment (the `earphones`
 *      beat), because they were in his bag/pocket the whole time — not
 *      because they were dangling in frame while he searched.
 *
 * DESIGN: this level has no LEGO. Level 1's thesis was "you cannot jump, so
 * you must build"; this one's is "the thing you miss is the thing you love".
 * The mechanic is the music quiz, declared via `mechanic: 'story'` so the
 * offline checkers validate it as a walked, scripted level.
 *
 * Map legend: # terrain (carriage floor), . empty, P player start
 *
 * Column landmarks:
 *   x2       the door he boarded through at Indiranagar
 *   x8-30    the carriage interior — seats, poles, passengers
 *   x18      Diya, waiting
 *   x27      where the headphones turn up (revealed after every song is won)
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

  // NO accessory at the start. He has genuinely lost his headphones and is
  // carrying nothing visible — the pink earphones only come out at the
  // reveal, via the `earphones` beat. See the header comment.

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
  // No beacon: they appear at his feet the moment the last song is won, so
  // there is nothing to guide him toward — and a shaft of light inside a
  // metro carriage looks like a stage prop.
  goals: [{ x: 27, y: 9, emoji: '🎧', label: 'HEADPHONES', hidden: true, beacon: false }],

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
          // The panic answer is the correct one. She goes straight to the
          // disbelief — no intermediate beat.
          text: 'Faaaaack',
          correct: true,
          reply: 'WAIT.. YOU ACTUALLY LOST THEM?!?!?',
        },
        {
          text: 'I don’t need headphones',
          reply: ['DO YOU HAVE SOME NEW TEAA?'],
        },
      ],
    },

    // ---- he has no idea where they are ---------------------------------
    { t: 'react', who: 'diya', reaction: 'surprised' },
    { t: 'sting', kind: 'comedicFail', shake: 0.3 },
    { t: 'react', who: 'player', reaction: 'panic' },
    { t: 'say', who: 'player', text: 'BRO.. where tff are they' },
    { t: 'react', who: 'diya', reaction: null },

    // the idea
    { t: 'react', who: 'diya', reaction: 'excited' },
    { t: 'say', who: 'diya', text: 'Guess the song brooo.' },
    { t: 'say', who: 'player', text: 'That’s not going to find my headphones.' },
    { t: 'say', who: 'diya', text: 'Guess. The song.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'cameraRelease' },

    // ---- THE MINIGAME --------------------------------------------------
    // Every round must be won. A wrong answer replays the same song (see the
    // songQuiz beat) — the headphones are the prize for getting them ALL
    // right, so this beat cannot be failed past, only finished.
    // See src/config/songs.js to swap the songs.
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
    // Winning the last song is what makes him look down — no hunt required.
    { t: 'react', who: 'player', reaction: 'surprised' },
    { t: 'say', who: 'player', text: 'wait— they were under the seat this whole time.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },
    { t: 'metroAmbience', on: true },

    // ---- THE VICTORY ----------------------------------------------------
    // No hunt. Winning the songs IS finding them: the headphones were under
    // the seat the whole time and the last correct answer is what makes him
    // look down. Played completely straight — it is a real win.
    { t: 'control', on: false },
    { t: 'reveal', labels: ['HEADPHONES'] },
    { t: 'sting', kind: 'dramaticVictory', shake: 0.4 },
    { t: 'camera', focus: 'player', zoom: 1.7, dur: 1.0 },
    { t: 'react', who: 'player', reaction: 'victory' },
    { t: 'particles', color: '#ffd166', count: 46, spread: 2.6 },
    { t: 'banner', lines: ['🎧 HEADPHONES FOUND!'], sub: 'AGAINST ALL ODDS', kind: 'good', dur: 2.8 },
    // He puts them straight on, and wears them for the rest of the scene —
    // right up until he throws them away. Seeing them on his head is what
    // makes the discard land as a choice rather than a line of text.
    { t: 'earphones', who: 'player', state: 'headphones' },
    { t: 'react', who: 'diya', reaction: 'excited' },
    { t: 'say', who: 'diya', text: 'LESGOOOOOO!' },
    { t: 'react', who: 'diya', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    // ---- THE ACTUAL QUESTION ---------------------------------------------
    // He is holding his headphones and he is happy. Diya asks the one
    // question he has not thought about once this entire level.
    { t: 'wait', dur: 1.1 },
    { t: 'react', who: 'diya', reaction: 'deadpan' },
    { t: 'say', who: 'diya', text: '…bro.' },
    { t: 'say', who: 'player', text: 'What? I found them!' },
    { t: 'wait', dur: 0.6 },
    { t: 'say', who: 'diya', text: 'and your pink earphones?' },

    // ---- FULL PANIC -------------------------------------------------------
    // The headphones were an inconvenience. THIS is a crisis. He completely
    // loses it — and the length of this is the joke: he never came close to
    // caring this much about the pair he spent the whole level hunting.
    { t: 'sting', kind: 'comedicFail', shake: 0.35 },
    { t: 'metroAmbience', on: false },
    { t: 'react', who: 'player', reaction: 'panic' },
    { t: 'say', who: 'player', text: 'MY WHAT' },
    { t: 'camera', focus: 'player', zoom: 2.2, dur: 0.8, ease: 0.05 },
    { t: 'say', who: 'player', text: 'NO NO NO NO NO' },
    { t: 'react', who: 'player', reaction: 'surprised', shake: 0.3 },
    { t: 'say', who: 'player', text: 'WHERE ARE THEY' },
    { t: 'say', who: 'player', text: 'DIYA WHERE ARE THEY' },
    { t: 'react', who: 'diya', reaction: 'deadpan' },
    { t: 'say', who: 'diya', text: 'i’m not the one who had them.' },
    { t: 'react', who: 'player', reaction: 'panic', shake: 0.25 },
    { t: 'say', who: 'player', text: 'NOT THE PINK ONES PLEASE NOT THE PINK ONES' },

    // ---- FOUND — IN HIS SHIRT ---------------------------------------------
    // Mid-meltdown he pats himself down and they are right there, looped
    // through his own shirt. They appear HERE, not at level start: nothing
    // was ever dangling in frame to contradict the panic.
    { t: 'camera', focus: 'player', zoom: 2.7, dur: 1.2, ease: 0.045 },
    { t: 'wait', dur: 0.7 }, // silence
    { t: 'react', who: 'player', reaction: 'realization' },
    { t: 'say', who: 'player', text: '…wait.' },
    // Both at once: the cans still on his head, the pink pair now hanging
    // from his shirt. Diya's next line needs to point at a visible choice.
    { t: 'earphones', who: 'player', state: 'headphonesAndEarphones' },
    { t: 'particles', color: '#ff5fa2', count: 34, spread: 1.6 },
    { t: 'sting', kind: 'dramaticVictory', shake: 0.3 },
    { t: 'banner', lines: ['🎀 PINK EARPHONES'], sub: 'IN HIS SHIRT. THE ENTIRE TIME.', kind: 'good', dur: 2.8, sound: false },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'say', who: 'player', text: '…oh thank god.' },

    // ---- CAUGHT -----------------------------------------------------------
    { t: 'wait', dur: 0.8 },
    { t: 'react', who: 'diya', reaction: 'deadpan' },
    { t: 'say', who: 'diya', text: 'wow. so you clearly like THESE more.' },
    { t: 'react', who: 'player', reaction: 'embarrassed' },
    { t: 'wait', dur: 1.2 }, // he says nothing, which says everything
    { t: 'say', who: 'player', text: '…' },
    { t: 'say', who: 'diya', text: 'yeah. that’s what I thought.' },
    { t: 'react', who: 'diya', reaction: null },

    // ---- THE VERDICT ------------------------------------------------------
    // He answers by throwing the headphones away and putting the pink ones
    // in. No argument, no defence — just the action.
    { t: 'wait', dur: 0.6 },
    // The cans come OFF — this is the beat the whole scene has been building
    // to, so it gets its own moment before the pink ones go in.
    { t: 'earphones', who: 'player', state: 'earphonesHanging' },
    { t: 'sting', kind: 'comedicFail', shake: 0.2 },
    { t: 'particles', color: '#8a93a6', count: 18, spread: 2.2 },
    { t: 'banner', lines: ['🎧 HEADPHONES DISCARDED'], sub: 'he did not even hesitate', kind: 'bad', dur: 2.4, sound: false },
    { t: 'react', who: 'player', reaction: 'embarrassed' },

    // ---- MUSIC RESTORED --------------------------------------------------
    { t: 'earphones', who: 'player', state: 'earphonesWorn' },
    { t: 'wait', dur: 0.6 },
    // The actual record, not the synth loop — he ends the level listening to
    // the song he just guessed. Falls back to the synth if the file is gone.
    // `trackStart` drops in at the chorus (~0:55) rather than the intro: the
    // quiz already used the opening, and the scene should end on the part
    // he'd actually be mouthing along to.
    {
      t: 'musicMode',
      on: true,
      dur: 0.8,
      track: 'songs/round3-blank-space.mp3',
      trackStart: 55,
    },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'cameraRelease' },
    { t: 'camera', focus: { x: 20, y: 8 }, zoom: 0.85, dur: 2.4, ease: 0.04 },
    { t: 'banner', lines: ['🎵 MUSIC RESTORED'], sub: 'NOW PLAYING — BLANK SPACE', kind: 'good', dur: 2.6, sound: false },
    { t: 'particles', color: '#ff5fa2', count: 50, spread: 3 },

    // He is gone — earphones in, Taylor on, entirely elsewhere. He does not
    // speak again. Two lines from Diya and the scene is over.
    { t: 'wait', dur: 1.6 },
    { t: 'react', who: 'diya', reaction: 'deadpan' },
    { t: 'say', who: 'diya', text: 'ofc.' },
    { t: 'wait', dur: 1.0 },
    { t: 'say', who: 'diya', text: '*sigh*' },
    { t: 'react', who: 'diya', reaction: null },

    // HAPPINESS ONLY. HP is deliberately untouched this level.
    {
      t: 'award',
      happiness: 45,
      xp: 60,
      banner: 'HAPPINESS INCREASED',
      sub: '+HAPPINESS',
      dur: 2.8,
    },

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
  // Nobody speaks. The sigh was the last line of the scene, so the outro is
  // just the camera pulling back off the two of them, music still going.
  outroBeats: [
    { t: 'camera', focus: { x: 18, y: 8 }, zoom: 0.6, dur: 3.6, ease: 0.03 },
    { t: 'nextLocation', icon: '🏋️', title: 'THE GYM', dur: 3.4 },
  ],
}

export default level2
