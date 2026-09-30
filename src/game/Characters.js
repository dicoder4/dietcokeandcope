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
  /**
   * Per-character height. `height` on a CAST entry scales the whole figure
   * about its FEET, so a shorter character still stands on the floor rather
   * than hovering or sinking into it — everything below is measured upward
   * from feetY. Width is left alone: scaling both would read as "far away"
   * instead of "shorter".
   */
  const scale = c.height ?? 1
  const bodyH = TILE_H * 1.55 * scale * (1 - squash * 0.28)
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
  } else if (reaction === 'backrub') {
    /**
     * ONE arm reaching out to the shoulder in front, kneading. The other
     * stays down at his side.
     *
     * One hand, not two, on purpose: it has to read as a casual "you work
     * too hard" shoulder squeeze in passing, and two hands on both
     * shoulders from behind reads as something else entirely. The reach
     * direction follows `facing`, so this works from either side.
     */
    const knead = Math.sin(animT * 5) * 2.6
    const dir = facing >= 0 ? 1 : -1
    // the working arm, out at shoulder height
    ctx.moveTo(cx + dir * bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx + dir * bodyW * 0.95, ty + bodyH * 0.04 + knead)
    // the idle arm
    ctx.moveTo(cx - dir * bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx - dir * bodyW * 0.58, ty + bodyH * 0.34)
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
  if (accessory === 'earphonesHanging' || accessory === 'headphonesAndEarphones') {
    drawEarphonesHanging(ctx, cx, ty, bodyW, bodyH, bob)
  }

  // ---- head ----
  // Scaled a little less than the body (sqrt, not linear): real short people
  // are not scale models, and a fully-shrunk head reads as a distant figure
  // rather than a shorter one.
  const hr = bodyW * 0.44 * Math.sqrt(scale)
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

  // ---- the big headphones ----
  // Level 4's ending, and the middle of Level 2 — where he wears the cans he
  // just found while the pink earphones hang round his neck, so the moment he
  // throws them away reads as a choice between two visible objects.
  if (accessory === 'headphones' || accessory === 'headphonesAndEarphones') {
    drawHeadphones(ctx, cx, hy, hr, animT)
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

/**
 * Big over-ear HEADPHONES — Level 4's ending.
 *
 * Deliberately not the Level 2 earphones: those are little pink buds on a
 * cable, and this moment needs the other thing entirely — the large closed-
 * back cans you put on to stop hearing the world. Drawn AFTER the head so
 * the cups sit over the ears rather than behind them.
 */
function drawHeadphones(ctx, cx, hy, hr, animT) {
  ctx.save()

  // the headband, arcing over the top of the skull
  ctx.strokeStyle = '#2b3038'
  ctx.lineWidth = 5.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, hy, hr * 1.12, Math.PI * 1.12, Math.PI * 1.88)
  ctx.stroke()
  // a highlight along the band so it reads as moulded plastic
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(cx, hy - 1.4, hr * 1.12, Math.PI * 1.2, Math.PI * 1.8)
  ctx.stroke()

  // the ear cups
  for (const s of [-1, 1]) {
    const ex2 = cx + s * hr * 1.04
    const ey2 = hy + hr * 0.12
    ctx.fillStyle = '#20252c'
    ctx.beginPath()
    ctx.roundRect(ex2 - 5.4, ey2 - 7.4, 10.8, 15, 5)
    ctx.fill()
    // the padded ring
    ctx.fillStyle = '#3a414a'
    ctx.beginPath()
    ctx.ellipse(ex2, ey2, 3.3, 5.6, 0, 0, Math.PI * 2)
    ctx.fill()
    // a small rim light on the outer edge
    ctx.fillStyle = 'rgba(255,255,255,0.16)'
    ctx.beginPath()
    ctx.roundRect(ex2 + s * 3.4, ey2 - 6, 1.6, 12, 1)
    ctx.fill()
  }

  // music notes, same idiom as the earphones — the world has sound again
  ctx.font = '11px system-ui, "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i < 3; i++) {
    const t = (animT * 0.8 + i * 0.33) % 1
    ctx.globalAlpha = Math.max(0, 1 - t) * 0.9
    const nx = cx + hr * (1.4 + i * 0.28) + Math.sin(t * 6 + i) * 4
    ctx.fillStyle = i % 2 ? '#7ed0ff' : '#ffd166'
    ctx.fillText(i % 2 ? '♪' : '♫', nx, hy - hr * 0.7 - t * 22)
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
    case 'smirk':
      // half-lidded and completely unbothered — he knows he can cook
      ctx.lineWidth = 1.9
      ctx.beginPath()
      ctx.moveTo(cx + ex - 5.6, ey - 0.6)
      ctx.lineTo(cx + ex - 1.4, ey - 0.6)
      ctx.moveTo(cx + ex + 1.4, ey - 0.6)
      ctx.lineTo(cx + ex + 5.6, ey - 0.6)
      ctx.stroke()
      // one brow cocked
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(cx + ex + 1.2, ey - hr * 0.3)
      ctx.lineTo(cx + ex + 6, ey - hr * 0.2)
      ctx.stroke()
      break
    case 'hearts': {
      /**
       * Heart eyes. Chirantan is delighted to see him and the game should
       * not be subtle about it. Beating on animT so they pulse.
       */
      const beat = 1 + Math.sin(animT * 6) * 0.14
      ctx.fillStyle = '#e8456b'
      for (const s of [-1, 1]) {
        const hx = cx + ex + s * 3.6
        const hs = 2.5 * beat
        ctx.beginPath()
        ctx.moveTo(hx, ey + hs * 0.95)
        ctx.bezierCurveTo(hx - hs * 1.5, ey - hs * 0.2, hx - hs * 0.5, ey - hs * 1.3, hx, ey - hs * 0.4)
        ctx.bezierCurveTo(hx + hs * 0.5, ey - hs * 1.3, hx + hs * 1.5, ey - hs * 0.2, hx, ey + hs * 0.95)
        ctx.fill()
      }
      ctx.fillStyle = ink
      break
    }
    case 'relaxed':
      // fully switched off. Closed arcs like relief, but wider and even
      // lower — the backrub face. Brows unclench upward, which is most of
      // what reads as "this man has no thoughts right now".
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.arc(cx + ex - 3.4, ey + hr * 0.05, 3.2, Math.PI * 1.02, Math.PI * 1.98)
      ctx.arc(cx + ex + 3.4, ey + hr * 0.05, 3.2, Math.PI * 1.02, Math.PI * 1.98)
      ctx.stroke()
      ctx.lineWidth = 1.3
      ctx.beginPath()
      ctx.arc(cx + ex - 3.4, ey - hr * 0.2, 3, Math.PI * 1.15, Math.PI * 1.85)
      ctx.arc(cx + ex + 3.4, ey - hr * 0.2, 3, Math.PI * 1.15, Math.PI * 1.85)
      ctx.stroke()
      break
    case 'crying':
      // squeezed shut and turned DOWN — the inverse of happy's arcs, which
      // is what stops this reading as a smile. Tears are drawn below.
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(cx + ex - 3.4, ey + hr * 0.16, 3, Math.PI * 0.08, Math.PI * 0.92)
      ctx.arc(cx + ex + 3.4, ey + hr * 0.16, 3, Math.PI * 0.08, Math.PI * 0.92)
      ctx.stroke()
      // brows pushed up in the middle — the dramatic wobble
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(cx + ex - 6, ey - hr * 0.16)
      ctx.lineTo(cx + ex - 1.4, ey - hr * 0.3)
      ctx.moveTo(cx + ex + 1.4, ey - hr * 0.3)
      ctx.lineTo(cx + ex + 6, ey - hr * 0.16)
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
  if (reaction === 'hearts') {
    // little hearts drifting up off the head, on staggered loops
    for (let i = 0; i < 3; i++) {
      const rise = (animT * 0.8 + i * 0.33) % 1
      const a = (1 - rise) * 0.85
      if (a <= 0.02) continue
      const hx = cx + (i - 1) * hr * 0.6 + Math.sin(animT * 2 + i) * 3
      const hy2 = cy - hr * 1.05 - rise * hr * 1.5
      const hs = 2.6 + rise * 1.4
      ctx.fillStyle = `rgba(232,69,107,${a})`
      ctx.beginPath()
      ctx.moveTo(hx, hy2 + hs * 0.95)
      ctx.bezierCurveTo(hx - hs * 1.5, hy2 - hs * 0.2, hx - hs * 0.5, hy2 - hs * 1.3, hx, hy2 - hs * 0.4)
      ctx.bezierCurveTo(hx + hs * 0.5, hy2 - hs * 1.3, hx + hs * 1.5, hy2 - hs * 0.2, hx, hy2 + hs * 0.95)
      ctx.fill()
    }
    ctx.fillStyle = ink
  }
  if (reaction === 'relaxed') {
    // two slow contentment puffs, bobbing on animT so the moment breathes
    ctx.strokeStyle = 'rgba(210,230,250,0.5)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 2; i++) {
      const drift = Math.sin(animT * 1.6 + i * 1.4) * 1.2
      ctx.beginPath()
      ctx.arc(
        cx + hr * (0.98 + i * 0.28),
        cy + hr * (0.42 - i * 0.34) + drift,
        2.6 - i * 0.7,
        Math.PI * 0.75,
        Math.PI * 1.95,
      )
      ctx.stroke()
    }
    ctx.strokeStyle = ink
  }
  if (reaction === 'crying') {
    /**
     * Tears, one per eye, falling on a loop. They are deliberately big and
     * evenly spaced — this is a cartoon meltdown over a plate of biryani,
     * not a sad scene, and the exaggeration is what keeps it funny.
     */
    ctx.fillStyle = 'rgba(126,200,227,0.9)'
    for (const s of [-1, 1]) {
      const fall = (animT * 1.5 + (s > 0 ? 0.5 : 0)) % 1
      ctx.beginPath()
      ctx.ellipse(
        cx + ex + s * 3.4,
        ey + hr * 0.3 + fall * hr * 0.75,
        2.1,
        3.1 + fall * 1.2,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
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
  } else if (reaction === 'relaxed') {
    // barely there — a tiny, slack, extremely content curve
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.42, hr * 0.18, 0.22 * Math.PI, 0.78 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'hearts' || reaction === 'backrub') {
    // a big open grin — he is thrilled
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.32, hr * 0.34, 0.12 * Math.PI, 0.88 * Math.PI)
    ctx.stroke()
  } else if (reaction === 'smirk') {
    // one side up. The "Me uh? ok bro" face.
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(cx + ex - hr * 0.22, cy + hr * 0.52)
    ctx.quadraticCurveTo(cx + ex + hr * 0.05, cy + hr * 0.56, cx + ex + hr * 0.26, cy + hr * 0.38)
    ctx.stroke()
  } else if (reaction === 'crying') {
    // a wide open wail, wobbling on animT so it never sits still
    const wail = hr * (0.26 + Math.sin(animT * 9) * 0.04)
    ctx.beginPath()
    ctx.ellipse(cx + ex, cy + hr * 0.54, hr * 0.2, wail, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
