# public/songs/ — the Guess The Song clips

Drop short audio clips in this folder and the Level 2 music quiz will play them.

## Quick version

1. Cut 5–10 seconds out of three songs he'd recognise instantly.
2. Save them here as `round1.mp3`, `round2.mp3`, `round3.mp3`.
3. Open `src/config/songs.js` and rewrite the four `choices` and the `correct`
   id for each round so the answers match your clips.
4. Write the taunts. That's where the whole joke lives.

## Formats

Anything a browser can play: `.mp3`, `.m4a`, `.ogg`, `.wav`.
Keep them short — these load over the network before the round starts.

## If a file is missing

Nothing breaks. Each round in `src/config/songs.js` has a `synth` fallback — a
short melody generated live with oscillators — so the quiz is fully playable with
this folder completely empty. That's how the game ships.

## Legal

Only add clips you actually have the right to use. This repo deliberately ships
no copyrighted audio; the synth fallbacks exist so it never needs any.
