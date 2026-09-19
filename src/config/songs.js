/**
 * ============================================================
 *  GUESS THE SONG — Level 2's music quiz
 * ============================================================
 *
 *  THIS IS THE FILE YOU EDIT to make the quiz personal. Nothing
 *  else needs touching.
 *
 *  ---- HOW TO PUT YOUR OWN SONGS IN -------------------------
 *
 *  1. Drop short clips (5-10 seconds is perfect) into:
 *         public/songs/
 *     Any web audio format works: .mp3, .m4a, .ogg, .wav
 *
 *  2. Point `clip` at the file, relative to public/:
 *         clip: 'songs/whatever-you-named-it.mp3'
 *
 *  3. Rewrite `choices` with the four song titles, and set
 *     `correct` to the id of the right one.
 *
 *  4. Write the taunts. That's the actual joke — make them sound
 *     like the friend who is sitting next to him.
 *
 *  ---- LEGAL ------------------------------------------------
 *
 *  This repo ships NO copyrighted audio. Every round below has a
 *  `synth` fallback: a short procedurally-generated melody made with
 *  oscillators, so the quiz is fully playable out of the box with no
 *  files at all. Only use clips you are permitted to use.
 *
 *  If a `clip` file is missing or fails to load, the round silently
 *  falls back to its `synth` melody. A wrong filename costs you the
 *  joke, never the game.
 *
 *  ---- THE SHAPE OF A ROUND ---------------------------------
 *
 *    id        unique string
 *    clip      optional path under public/ — omit for synth only
 *    synth     'anthem' | 'chill' | 'bossfinal'  (see Sound.js)
 *    seconds   how long the clip plays before the choices appear
 *    taunt     what Diya says while it is playing
 *    choices   exactly four { id, label }
 *    correct   the id of the right choice
 *    onCorrect her line when he gets it
 *    onWrong   her line(s) when he doesn't — string or array
 * ============================================================
 */

export const SONG_ROUNDS = [
  {
    id: 'round1',
    clip: 'songs/round1.mp3',
    synth: 'anthem',
    seconds: 7,
    taunt: 'Come on bro, you KNOW this one.',
    choices: [
      { id: 'a', label: 'Song A' },
      { id: 'b', label: 'Song B' },
      { id: 'c', label: 'Song C' },
      { id: 'd', label: 'Song D' },
    ],
    correct: 'b',
    onCorrect: 'Lessgoooo',
    onWrong: ['Bro…', 'How do you not know this?'],
  },

  {
    id: 'round2',
    clip: 'songs/round2.mp3',
    synth: 'chill',
    seconds: 8,
    taunt: 'Okay okay, this one’s easy.',
    choices: [
      { id: 'a', label: 'Song A' },
      { id: 'b', label: 'Song B' },
      { id: 'c', label: 'Song C' },
      { id: 'd', label: 'Song D' },
    ],
    correct: 'c',
    onCorrect: 'LESGOOOO.',
    onWrong: 'You’re actually embarrassing yourself.',
  },

  {
    id: 'round3',
    clip: 'songs/round3.mp3',
    synth: 'bossfinal',
    seconds: 9,
    taunt: 'Final boss. Guess this.',
    choices: [
      { id: 'a', label: 'Song A' },
      { id: 'b', label: 'Song B' },
      { id: 'c', label: 'Song C' },
      { id: 'd', label: 'Song D' },
    ],
    correct: 'a',
    onCorrect: 'YOOOOO HOW DID YOU GET THAT SO FAST?',
    onWrong: ['Bro.', 'That was YOUR song.'],
  },
]

/** XP awarded per correct guess. Comedy, not economy — keep it small. */
export const MUSIC_XP_PER_ROUND = 10

export default SONG_ROUNDS
