# public/songs/ — the Guess The Song clips

Drop short audio clips in this folder and the Level 2 music quiz will play them.

## Quick version

1. Cut 5–10 seconds out of three songs he'd recognise instantly.
2. Save them here with simple names — no spaces or punctuation, since the
   filename becomes part of a URL.
3. Open `src/config/songs.js`, point each round's `clip` at its file, and
   rewrite the `choices` and the `correct` id so the answers match.
4. Write the taunts. That's where the whole joke lives.

## What's here now

| file | round | answer |
|------|-------|--------|
| `round1-chalo-chalein.mp3` | 1 | Chalo Chalein |
| `round2-just-maath-maathalli.mp3` | 2 | Just Maath Maathalli |
| `round3-blank-space.mp3` | 3 | Blank Space |

Each round lists five options; only the correct one needs an audio file,
since only the correct song is ever played.

## Formats and size

Anything a browser can play: `.mp3`, `.m4a`, `.ogg`, `.wav`.

**Trim them.** The whole file is fetched and decoded before the round can
start, so a full-length track means a long silent wait. A 7-second clip is
~100 KB; a full song can be 10 MB+. Rounds only play a few seconds from a
random offset, so the rest of the file is pure download cost.

## If a file is missing

Nothing breaks. Each round in `src/config/songs.js` has a `synth` fallback — a
short melody generated live with oscillators — so the quiz is fully playable with
this folder completely empty. That's how the game ships.

## Legal

Only add clips you actually have the right to use. This repo deliberately ships
no copyrighted audio; the synth fallbacks exist so it never needs any.
