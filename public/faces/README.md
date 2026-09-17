# Character photos

Drop a square, cropped photo of each person here to have their in-game
character use it as their head. The game works fine with none of these
present — it just draws a stylized head instead — so add them whenever
you have them.

## Filenames (must match exactly)

| File | Who |
|---|---|
| `aditya.png` | Aditya — the birthday boy / player character |
| `anisha.png` | Anisha — Level 1 friend |
| `diya.png` | Diya — Level 2 friend |
| `lord.png` | Lord — Level 3 friend |
| `chirantan.png` | Chirantan — Level 4 friend |
| `amogh.png` | Amogh — Level 4 friend |

## Format

- **PNG**, ideally with a transparent background.
- **Square-ish**, roughly face-centred — a selfie or a cropped headshot
  both work. The game clips it to a circle and covers the frame, so it
  does not need to be pixel-perfect.
- Around **256×256px** is plenty; anything reasonable will scale fine.
- No file → the game silently falls back to a drawn head using that
  character's colours from `src/config/gameConfig.js`.

That's it — no code changes needed. Just save the file here with the
right name and refresh the game.
