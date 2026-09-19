/**
 * Characters.js — one drawing routine for every human in the game.
 *
 * The player and every NPC are the same kind of object: a stylized
 * brick-figure whose colours come from gameConfig's CAST. The head is the
 * only part that varies structurally:
 *
 *   1. If public/faces/<id>.png exists, it is drawn clipped to a circle.
 *   2. Otherwise a stylized head is drawn from the character's colours.
 *
 * Photo loading is async and never blocks. The game starts with drawn heads
 * and silently upgrades to photos the moment they decode, so a missing file
 * is a non-event rather than a broken character.
 */

import { TILE_W, TILE_H } from './Grid.js'
import { Camera, SKEW } from './Camera.js'
import { CAST } from '../config/gameConfig.js'

// id -> HTMLImageElement | 'missing' | 'loading'
const faceCache = new Map()

/** Where the photos live. Vite serves public/ from the app root. */
const facePath = (id) => `${import.meta.env?.BASE_URL ?? '/'}faces/${id}.png`.replace('//faces', '/faces')

/**
 * Kick off a photo load. Safe to call every frame — the cache makes repeats
 * free, and a failed load is remembered so we never retry in a loop.
 */
export function ensureFace(id) {
  if (!id) return null
  const hit = faceCache.get(id)
  if (hit) return hit === 'loading' || hit === 'missing' ? null : hit
  if (typeof Image === 'undefined') return null

  faceCache.set(id, 'loading')
  const img = new Image()
  img.onload = () => faceCache.set(id, img)
  img.onerror = () => faceCache.set(id, 'missing')
  img.src = facePath(id)
  return null
}

/** Preload every cast photo at boot so heads pop in before they're on screen. */
export function preloadFaces() {
  for (const id of Object.keys(CAST)) ensureFace(id)
}

export function characterOf(id) {
  return (
    CAST[id] ?? {
      id: id ?? 'unknown',
      name: (id ?? 'someone').toUpperCase(),
      skin: '#ffd08a',
      hair: '#241a18',
      shirt: '#f2663c',
      shirtAlt: '#c94a26',
      pants: '#2e4a7d',
    }
  )
}

/**
 * Draw a character standing in cell (x, y) — y being the FEET row, matching
 * Player's convention.
 *
 * `pose` carries the animation state:
 *   { walking, animT, facing, squash, talking, reaction, dead }
 * reaction: null | 'surprised' | 'happy' | 'eating'
 */
export function drawCharacter(ctx, charId, x, y, pose = {}) {
  const c = characterOf(charId)
  const {
    walking = false,
    animT = 0,
    facing = 1,
    squash = 0,
    talking = false,
    reaction = null,
    accessory = null,
  } = pose

  const bob = walking ? Math.sin(animT * 13) * 1.8 : Math.sin(animT * 2.4) * 0.8
  const p = Camera.project(x, y)
  const cx = p.x + TILE_W * 0.5 + TILE_H * SKEW * 0.5
  const feetY = p.y + TILE_H
  const bodyH = TILE_H * 1.55 * (1 - squash * 0.28)
  const bodyW = TILE_W * 0.62 * (1 + squash * 0.2)

  ctx.save()

  // ---- legs ----
  const legSwing = walking ? Math.sin(animT * 13) * 5 : 0
  ctx.fillStyle = c.pants
  for (const s of [-1, 1]) {
    ctx.save()
    ctx.translate(cx + s * bodyW * 0.24, feetY - bodyH * 0.3)
    ctx.beginPath()
    ctx.roundRect(-bodyW * 0.18, 0, bodyW * 0.34, bodyH * 0.32 + s * legSwing * 0.3, 3)
    ctx.fill()
    ctx.restore()
  }

  // ---- torso ----
  const ty = feetY - bodyH * 0.32 - bodyH * 0.42 + bob
  ctx.fillStyle = c.shirt
  ctx.beginPath()
  ctx.roundRect(cx - bodyW / 2, ty, bodyW, bodyH * 0.44, 4)
  ctx.fill()
  // highlight down one side so the figure reads as dimensional
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.roundRect(cx - bodyW / 2, ty, bodyW * 0.4, bodyH * 0.44, 4)
  ctx.fill()

  // ---- arms ----
  ctx.strokeStyle = c.skin
  ctx.lineWidth = 4.5
  ctx.lineCap = 'round'
  let armSwing = walking ? Math.sin(animT * 13 + Math.PI) * 6 : 2
  if (talking) armSwing = Math.sin(animT * 7) * 5 // gesturing while speaking
  ctx.beginPath()
  if (reaction === 'surprised') {
    // both arms up
    ctx.moveTo(cx - bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx - bodyW * 0.72, ty - bodyH * 0.16)
    ctx.moveTo(cx + bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx + bodyW * 0.72, ty - bodyH * 0.16)
  } else if (reaction === 'victory') {
    // arms thrown straight up, with a little pump — the victory pose
    const pump = Math.sin(animT * 9) * 3
    ctx.moveTo(cx - bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx - bodyW * 0.66, ty - bodyH * 0.42 + pump)
    ctx.moveTo(cx + bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx + bodyW * 0.66, ty - bodyH * 0.42 - pump)
  } else {
    ctx.moveTo(cx - bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx - bodyW * 0.62, ty + bodyH * 0.3 + armSwing * 0.4)
    ctx.moveTo(cx + bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx + bodyW * 0.62, ty + bodyH * 0.3 - armSwing * 0.4)
  }
  ctx.stroke()

  // ---- the pink earphones, hanging ----
  // Drawn AFTER the torso and BEFORE the head, so the cable reads as coming
  // out from inside the collar and lying on the shirt front. See
  // drawEarphonesHanging for why this is the whole joke of Level 2.
  if (accessory === 'earphonesHanging') {
    drawEarphonesHanging(ctx, cx, ty, bodyW, bodyH, bob)
  }

  // ---- head ----
  const hr = bodyW * 0.44
  const hy = ty - hr * 0.95
  const photo = ensureFace(c.id)

  if (photo) {
    drawPhotoHead(ctx, photo, cx, hy, hr, facing)
  } else {
    drawStylizedHead(ctx, c, cx, hy, hr, facing, animT, talking, reaction)
  }

  // ---- the pink earphones, worn ----
  // Over the head this time: buds in the ears, cable running back down into
  // the collar, and the little notes that say the music is finally on.
  if (accessory === 'earphonesWorn') {
    drawEarphonesWorn(ctx, cx, hy, hr, ty, animT)
  }

  ctx.restore()
}

// ======================================================================
//  THE PINK EARPHONES
//
//  Level 2's punchline only works if the player can SEE them the entire
//  time. They are not a world pickup and they never appear by magic —
//  they are part of how Aditya is drawn from the very first frame, looped
//  through his shirt, while both characters tear the carriage apart
//  looking for them.
// ======================================================================

const EARPHONE_PINK = '#ff5fa2'
const EARPHONE_PINK_DARK = '#d43d80'

/**
 * Hanging: the cable emerges from inside the collar, loops once through the
 * shirt front, and the two buds dangle at chest height. Swings slightly with
 * the walk bob so it reads as physically attached to him, not painted on.
 */
function drawEarphonesHanging(ctx, cx, ty, bodyW, bodyH, bob) {
  const collarY = ty + bodyH * 0.03 // just below the neckline
  const sway = bob * 0.5

  ctx.save()
  ctx.strokeStyle = EARPHONE_PINK
  ctx.lineWidth = 2.1
  ctx.lineCap = 'round'

  // the cable: out of the collar, down across the shirt, back through it,
  // then down to the buds. Two strands so the "looped through" is legible.
  ctx.beginPath()
  ctx.moveTo(cx - bodyW * 0.1, collarY)
  ctx.quadraticCurveTo(
    cx - bodyW * 0.34,
    collarY + bodyH * 0.14,
    cx - bodyW * 0.26 + sway,
    collarY + bodyH * 0.3
  )
  ctx.moveTo(cx + bodyW * 0.1, collarY)
  ctx.quadraticCurveTo(
    cx + bodyW * 0.3,
    collarY + bodyH * 0.12,
    cx + bodyW * 0.18 + sway,
    collarY + bodyH * 0.29
  )
  ctx.stroke()

  // the loop where the cable passes through the shirt — the detail that
  // makes "it was threaded through his clothes" obvious at a glance
  ctx.beginPath()
  ctx.ellipse(cx + bodyW * 0.02, collarY + bodyH * 0.16, bodyW * 0.16, bodyH * 0.05, -0.25, 0, Math.PI * 2)
  ctx.stroke()

  // the buds
  ctx.fillStyle = EARPHONE_PINK
  for (const [dx, dy] of [
    [-bodyW * 0.26 + sway, collarY + bodyH * 0.3],
    [bodyW * 0.18 + sway, collarY + bodyH * 0.29],
  ]) {
    ctx.beginPath()
    ctx.ellipse(cx + dx, dy, 3.1, 4.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.fillStyle = EARPHONE_PINK_DARK
    ctx.beginPath()
    ctx.ellipse(cx + dx, dy + 1.4, 1.5, 1.9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}

/** Worn: buds in both ears, cable down into the collar, music notes rising. */
function drawEarphonesWorn(ctx, cx, hy, hr, ty, animT) {
  ctx.save()
  ctx.strokeStyle = EARPHONE_PINK
  ctx.lineWidth = 2.1
  ctx.lineCap = 'round'

  // cable from each ear down into the shirt
  ctx.beginPath()
  ctx.moveTo(cx - hr * 0.94, hy + hr * 0.16)
  ctx.quadraticCurveTo(cx - hr * 0.8, ty - hr * 0.1, cx - hr * 0.2, ty + hr * 0.2)
  ctx.moveTo(cx + hr * 0.94, hy + hr * 0.16)
  ctx.quadraticCurveTo(cx + hr * 0.8, ty - hr * 0.1, cx + hr * 0.2, ty + hr * 0.2)
  ctx.stroke()

  // the buds, seated in the ears
  ctx.fillStyle = EARPHONE_PINK
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(cx + s * hr * 0.94, hy + hr * 0.14, 3.4, 4.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // music notes — the visual confirmation that the world has sound again
  ctx.font = '11px system-ui, "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i < 3; i++) {
    const t = (animT * 0.8 + i * 0.33) % 1
    ctx.globalAlpha = Math.max(0, 1 - t) * 0.9
    const nx = cx + hr * (1.3 + i * 0.28) + Math.sin(t * 6 + i) * 4
    ctx.fillStyle = i % 2 ? EARPHONE_PINK : '#ffd166'
    ctx.fillText(i % 2 ? '♪' : '♫', nx, hy - hr * 0.6 - t * 22)
  }

  ctx.restore()
}

function drawPhotoHead(ctx, img, cx, cy, hr, facing) {
  const r = hr * 1.24
  ctx.save()
  // soft drop shadow so the cutout sits in the scene instead of floating
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.001)' // shadow needs something to cast from
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  // cover-fit the photo into the circle, never squashing it
  const side = r * 2
  const scale = Math.max(side / img.width, side / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  ctx.restore()

  // rim light, so it reads as a game character rather than a pasted selfie
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  void facing
}

function drawStylizedHead(ctx, c, cx, cy, hr, facing, animT, talking, reaction) {
  // hair behind the face (long-hair characters get a fuller silhouette)
  if (c.longHair) {
    ctx.fillStyle = c.hair
    ctx.beginPath()
    ctx.ellipse(cx, cy + hr * 0.25, hr * 1.22, hr * 1.45, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = c.skin
  ctx.beginPath()
  ctx.arc(cx, cy, hr, 0, Math.PI * 2)
  ctx.fill()

  // hair on top
  ctx.fillStyle = c.hair
  ctx.beginPath()
  ctx.arc(cx, cy - hr * 0.1, hr * 1.02, Math.PI, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx, cy - hr * 0.08, hr * 1.06, hr * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  // ---- eyes ----
  // Level 2 is carried almost entirely by reaction shots, so the expression
  // set is wider than Level 1 needed. Each one is a cheap eye + mouth + brow
  // treatment; nothing here is more than a few strokes.
  const ex = facing * hr * 0.2
  const ey = cy + hr * 0.2
  const ink = '#243040'
  ctx.fillStyle = ink
  ctx.strokeStyle = ink

  const dotEyes = (r = 1.9, dy = 0) => {
    ctx.beginPath()
    ctx.arc(cx + ex - 3.2, ey + dy, r, 0, Math.PI * 2)
    ctx.arc(cx + ex + 3.2, ey + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const arcEyes = (r = 2.6) => {
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(cx + ex - 3.4, ey + hr * 0.04, r, Math.PI, 0)
    ctx.arc(cx + ex + 3.4, ey + hr * 0.04, r, Math.PI, 0)
    ctx.stroke()
  }
  const flatEyes = () => {
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(cx + ex - 5.4, ey)
    ctx.lineTo(cx + ex - 1.4, ey)
    ctx.moveTo(cx + ex + 1.4, ey)
    ctx.lineTo(cx + ex + 5.4, ey)
    ctx.stroke()
  }

  switch (reaction) {
    case 'surprised':
    case 'realization':
      dotEyes(3)
      break
    case 'panic':
      dotEyes(3.4, -0.6)
      break
    case 'excited':
      dotEyes(3.2)
      break
    case 'happy':
    case 'victory':
      arcEyes(reaction === 'victory' ? 3 : 2.6)
      break
    case 'deadpan':
    case 'embarrassed':
      flatEyes()
      break
    case 'concentration':
      // narrowed, locked on the screen. Both eyes squeezed to slits with
      // brows angled down — "I am reading this code very hard."
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx + ex - 5.4, ey)
      ctx.lineTo(cx + ex - 1.4, ey)
      ctx.moveTo(cx + ex + 1.4, ey)
      ctx.lineTo(cx + ex + 5.4, ey)
      ctx.stroke()
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx + ex - 5.8, ey - hr * 0.26)
      ctx.lineTo(cx + ex - 1.6, ey - hr * 0.16)
      ctx.moveTo(cx + ex + 1.6, ey - hr * 0.16)
      ctx.lineTo(cx + ex + 5.8, ey - hr * 0.26)
      ctx.stroke()
      break
    case 'relief':
      // eyes closed, exhaling. Same arcs as happy but flatter and lower.
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(cx + ex - 3.4, ey + hr * 0.02, 2.8, Math.PI * 1.05, Math.PI * 1.95)
      ctx.arc(cx + ex + 3.4, ey + hr * 0.02, 2.8, Math.PI * 1.05, Math.PI * 1.95)
      ctx.stroke()
      break
    case 'frustration':
      // brows slammed together over hard dots
      dotEyes(2.2)
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(cx + ex - 6, ey - hr * 0.3)
      ctx.lineTo(cx + ex - 1.2, ey - hr * 0.13)
      ctx.moveTo(cx + ex + 1.2, ey - hr * 0.13)
      ctx.lineTo(cx + ex + 6, ey - hr * 0.3)
      ctx.stroke()
      break
    case 'confused':
      // one eye narrowed, one normal — the "…what" face
      ctx.beginPath()
      ctx.arc(cx + ex - 3.2, ey, 1.9, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 1.7
      ctx.beginPath()
      ctx.moveTo(cx + ex + 1.6, ey)
      ctx.lineTo(cx + ex + 5.2, ey)
      ctx.stroke()
      // raised brow
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(cx + ex + 3.4, ey - hr * 0.22, 2.6, Math.PI * 1.1, Math.PI * 1.9)
      ctx.stroke()
      break
    default:
      dotEyes()
  }

  // ---- extra face furniture for the bigger reactions ----
  if (reaction === 'panic') {
    // sweat drop, flung off the side of the head
    ctx.fillStyle = '#7ec8e3'
    ctx.beginPath()
    ctx.ellipse(cx + hr * 0.85, cy - hr * 0.35, 2, 3.2, 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  if (reaction === 'embarrassed') {
    // blush
    ctx.fillStyle = 'rgba(232,90,120,0.45)'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(cx + s * hr * 0.58, cy + hr * 0.38, hr * 0.22, hr * 0.13, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (reaction === 'frustration') {
    // the anger tick on the temple
    ctx.strokeStyle = '#e2453c'
    ctx.lineWidth = 1.6
    const tx = cx - hr * 0.72
    const ty = cy - hr * 0.6
    ctx.beginPath()
    ctx.moveTo(tx - 3, ty - 3)
    ctx.lineTo(tx + 3, ty + 3)
    ctx.moveTo(tx + 3, ty - 3)
    ctx.lineTo(tx - 3, ty + 3)
    ctx.stroke()
    ctx.strokeStyle = ink
  }
  if (reaction === 'relief') {
    // the exhale, puffing off to the side
    ctx.strokeStyle = 'rgba(200,225,245,0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx + hr * 0.95, cy + hr * 0.5, 3.2, Math.PI * 0.8, Math.PI * 1.9)
    ctx.stroke()
    ctx.strokeStyle = ink
  }

  // ---- mouth ----
  // Flaps while talking, which is most of what sells a dialogue scene.
  const mouthOpen = talking ? 1.2 + Math.sin(animT * 18) * 1.2 : 0
  ctx.fillStyle = '#7a3a34'
  ctx.strokeStyle = '#7a3a34'

  if (mouthOpen > 0.3) {
    ctx.beginPath()
    ctx.ellipse(cx + ex, cy + hr * 0.52, 2.6, mouthOpen, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (reaction === 'panic' || reaction === 'excited') {
    // wide open — shouting
    ctx.beginPath()
    ctx.ellipse(cx + ex, cy + hr * 0.5, hr * 0.22, hr * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (reaction === 'realization') {
    // small "o"
    ctx.beginPath()
    ctx.ellipse(cx + ex, cy + hr * 0.5, hr * 0.12, hr * 0.15, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (reaction === 'victory') {
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.3, hr * 0.38, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'happy' || reaction === 'eating') {
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.38, hr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'deadpan' || reaction === 'embarrassed') {
    // a flat line. Carries "...oh." and "Bro." on its own.
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(cx + ex - hr * 0.2, cy + hr * 0.52)
    ctx.lineTo(cx + ex + hr * 0.2, cy + hr * 0.52)
    ctx.stroke()
  } else if (reaction === 'concentration') {
    // tongue-out focus: a small flat mouth pushed to one side
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(cx + ex - hr * 0.16, cy + hr * 0.5)
    ctx.lineTo(cx + ex + hr * 0.1, cy + hr * 0.54)
    ctx.stroke()
  } else if (reaction === 'relief') {
    // a small soft smile — the "oh thank god" face
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.4, hr * 0.22, 0.2 * Math.PI, 0.8 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'frustration') {
    // downturned
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.74, hr * 0.28, 1.15 * Math.PI, 1.85 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'confused') {
    // wavy
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx + ex - hr * 0.22, cy + hr * 0.52)
    ctx.quadraticCurveTo(cx + ex - hr * 0.07, cy + hr * 0.42, cx + ex, cy + hr * 0.52)
    ctx.quadraticCurveTo(cx + ex + hr * 0.07, cy + hr * 0.62, cx + ex + hr * 0.22, cy + hr * 0.52)
    ctx.stroke()
  }
}
