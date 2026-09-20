# Food photos

`biryani.jpg` is the picture the Level 4 jigsaw puzzle is cut from.

## Why this folder is an exception

The rest of this repo ships **no binary art** on purpose — the characters
are drawn, and Level 3's sitcom "framebuffers" are coloured divs rather
than screencaps (see `src/config/framebuffers.js` for the reasoning).

Level 4's minigame is a real jigsaw of a real plate of biryani, which
needs an actual photograph. It is the only image the game loads.

## Rights

This photo was supplied by the project owner. If you are reusing this
repo, **replace it with a photo you own** — drop your own square image
in at this path and the puzzle picks it up with no code changes.

## Format

- **Square.** The puzzle cuts it into an even grid, so a non-square
  image will look stretched.
- **JPEG**, around 600×600. That is plenty: the puzzle draws it at a few
  hundred pixels. The original 1200×1200 PNG was 2.4 MB, which is a lot
  of bundle for a picture of rice; this is ~100 KB.
- If the file is missing the puzzle still runs — `Kitchen.jsx` falls back
  to drawing coloured tiles, so a missing image degrades rather than
  breaking the level.
