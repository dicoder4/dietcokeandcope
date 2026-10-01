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
 *     Keep the filename simple — no spaces, no punctuation. It
 *     becomes part of a URL.
 *
 *  3. Rewrite `choices` with the song titles, and set `correct`
 *     to the id of the right one. Any number of choices works;
 *     the A/B/C/D… letters are generated from the list.
 *
 *  4. Write the taunts. That's the actual joke — make them sound
 *     like the friend who is sitting next to him.
 *
 *  ---- LEGAL ------------------------------------------------
 *
 *  This repo ships NO copyrighted audio of its own. Every round
 *  below also has a `synth` fallback: a short procedurally-made
 *  melody, so the quiz stays playable if a file is missing.
 *
 *  The clips referenced here are files the game's owner supplied
 *  from their own library for a private birthday gift. Only use
 *  clips you are permitted to use, and keep them short.
 *
 *  If a `clip` file is missing or fails to load, the round
 *  silently falls back to its `synth` melody. A wrong filename
 *  costs you the joke, never the game.
 *
 *  ---- THE SHAPE OF A ROUND ---------------------------------
 *
 *    id        unique string
 *    clip      optional path under public/ — omit for synth only
 *    synth     'anthem' | 'chill' | 'bossfinal'  (see Sound.js)
 *    seconds   how long the clip plays before the choices appear
 *    startAt   optional — seconds into the file to start. Use it when the
 *              file is a whole song rather than a trimmed clip, so the
 *              round lands on the chorus instead of a random moment.
 *    title     optional header line for this round
 *    taunt     what Diya says while it is playing
 *    choices   the options, as { id, label }
 *    correct   the id of the right choice
 *    onCorrect her line when he gets it
 *    onWrong   her line(s) when he doesn't — string or array
 * ============================================================
 */

export const SONG_ROUNDS = [
  {
    id: 'round1',
    clip: 'songs/round1-chalo-chalein.mp3',
    synth: 'anthem',
    seconds: 6,
    taunt: 'Come on bro, you KNOW this one.',
    choices: [
      { id: 'aajnaa', label: 'Aaj Naa' },
      { id: 'liggi', label: 'Liggi' },
      { id: 'chalochalein', label: 'Chalo Chalein' },
      { id: 'mimmi', label: 'Mimmi' },
      { id: 'sage', label: 'Sage' },
    ],
    correct: 'chalochalein',
    onCorrect: 'proud proud',
    onWrong: 'i expected better man',
  },

  {
    id: 'round2',
    clip: 'songs/round2-just-maath-maathalli.mp3',
    synth: 'chill',
    seconds: 7,
    taunt: 'Okay okay, this one’s easy.',
    choices: [
      { id: 'munjana', label: 'Munjaane Manjalli' },
      { id: 'nange', label: 'Nange Allava' },
      { id: 'baanina', label: 'Baanina Haniyu' },
      { id: 'preetiya', label: 'Preetiya Hesare Neevu' },
      { id: 'justmaath', label: 'Just Maath Maathalli' },
    ],
    correct: 'justmaath',
    onCorrect: 'smart smart',
    onWrong: 'no culture only che',
  },

  {
    id: 'round3',
    clip: 'songs/round3-blank-space.mp3',
    synth: 'bossfinal',
    seconds: 7,
    // Seven seconds from the very top of the track. This file is the full
    // song, so without a pinned start the random offset would drop him
    // somewhere unrecognisable mid-verse.
    startAt: 0,
    title: 'Since you’re the biggest Swiftie — a special round for you',
    taunt: 'Final boss. Guess this.',
    choices: [
      { id: 'lovestory', label: 'Love Story' },
      { id: 'willow', label: 'Willow' },
      { id: 'shakeitoff', label: 'Shake It Off' },
      { id: 'blankspace', label: 'Blank Space' },
      { id: 'delicate', label: 'Delicate' },
    ],
    correct: 'blankspace',
    onCorrect: 'sleyy queen 💅',
    onWrong: 'stop faking it we know how much you love her',
  },
]

/** XP awarded per correct guess. Comedy, not economy — keep it small. */
export const MUSIC_XP_PER_ROUND = 10

export default SONG_ROUNDS
