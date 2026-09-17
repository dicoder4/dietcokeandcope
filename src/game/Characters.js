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
  } else {
    ctx.moveTo(cx - bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx - bodyW * 0.62, ty + bodyH * 0.3 + armSwing * 0.4)
    ctx.moveTo(cx + bodyW * 0.45, ty + bodyH * 0.1)
    ctx.lineTo(cx + bodyW * 0.62, ty + bodyH * 0.3 - armSwing * 0.4)
  }
  ctx.stroke()

  // ---- head ----
  const hr = bodyW * 0.44
  const hy = ty - hr * 0.95
  const photo = ensureFace(c.id)

  if (photo) {
    drawPhotoHead(ctx, photo, cx, hy, hr, facing)
  } else {
    drawStylizedHead(ctx, c, cx, hy, hr, facing, animT, talking, reaction)
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

  // eyes
  const ex = facing * hr * 0.2
  ctx.fillStyle = '#243040'
  if (reaction === 'surprised') {
    ctx.beginPath()
    ctx.arc(cx + ex - 3.4, cy + hr * 0.18, 3, 0, Math.PI * 2)
    ctx.arc(cx + ex + 3.4, cy + hr * 0.18, 3, 0, Math.PI * 2)
    ctx.fill()
  } else if (reaction === 'happy') {
    ctx.strokeStyle = '#243040'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(cx + ex - 3.4, cy + hr * 0.24, 2.6, Math.PI, 0)
    ctx.arc(cx + ex + 3.4, cy + hr * 0.24, 2.6, Math.PI, 0)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(cx + ex - 3.2, cy + hr * 0.2, 1.9, 0, Math.PI * 2)
    ctx.arc(cx + ex + 3.2, cy + hr * 0.2, 1.9, 0, Math.PI * 2)
    ctx.fill()
  }

  // mouth — flaps while talking, which is most of what sells a dialogue scene
  const mouthOpen = talking ? 1.2 + Math.sin(animT * 18) * 1.2 : 0
  ctx.fillStyle = '#7a3a34'
  if (mouthOpen > 0.3) {
    ctx.beginPath()
    ctx.ellipse(cx + ex, cy + hr * 0.52, 2.6, mouthOpen, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (reaction === 'happy' || reaction === 'eating') {
    ctx.strokeStyle = '#7a3a34'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx + ex, cy + hr * 0.38, hr * 0.3, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  }
}
