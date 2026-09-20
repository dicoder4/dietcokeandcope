/**
 * Renderer.js — fake 2.5D drawing.
 *
 * Every cell is drawn as a front face plus a top face and a right face,
 * sheared by Camera.SKEW. Studs go on the top face. It's all 2D canvas —
 * no 3D, no models, no Blender — but it reads as dimensional because the
 * lighting is consistent and the shear never changes.
 */

import { TILE_W, TILE_H, DEPTH, CELL } from './Grid.js'
import { Camera, SKEW } from './Camera.js'
import { BLOCK_TYPES, footprint } from '../entities/Block.js'
import { drawCharacter } from './Characters.js'
import gameConfig from '../config/gameConfig.js'

// Campus paving in warm daylight — the top face is the walkable surface, so
// it is the lightest of the three.
const TERRAIN = {
  color: '#9a8a74',
  colorDark: '#6d6152',
  colorTop: '#bdae94',
}
const TERRAIN_ALT = {
  color: '#a3917a',
  colorDark: '#756757',
  colorTop: '#c6b79c',
}
const PLATE_COLORS = { color: '#7a6a3a', colorDark: '#524727', colorTop: '#b09a52' }

/**
 * A level can override the ground palette — Level 2's metro floor is grey
 * vinyl, not campus paving. `floor` sets the main tone and `floorAlt` the
 * chequer; either may be omitted to keep the default.
 */
function floorPalettes(def) {
  return {
    main: def.floor ?? TERRAIN,
    alt: def.floorAlt ?? def.floor ?? TERRAIN_ALT,
  }
}

/**
 * ctx.roundRect is well supported in current browsers, but a missing method
 * inside the render loop would throw every frame and take the whole game down.
 * A three-line fallback is cheaper than that risk.
 */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
    this.moveTo(x + rr, y)
    this.arcTo(x + w, y, x + w, y + h, rr)
    this.arcTo(x + w, y + h, x, y + h, rr)
    this.arcTo(x, y + h, x, y, rr)
    this.arcTo(x, y, x + w, y, rr)
    this.closePath()
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  r = Math.max(0, Math.min(255, Math.round(r + amt)))
  g = Math.max(0, Math.min(255, Math.round(g + amt)))
  b = Math.max(0, Math.min(255, Math.round(b + amt)))
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

/**
 * Draw one dimensional brick face spanning cells (x,y) with size wCells x hCells.
 * Studs are drawn on the top face only, one per cell column.
 */
export function drawBrick(ctx, x, y, wCells, hCells, pal, opts = {}) {
  const { alpha = 1, studs = true, outline = true, glow = null, lift = 0 } = opts
  const p = Camera.project(x, y)
  const px = p.x
  const py = p.y - lift
  const w = wCells * TILE_W
  const h = hCells * TILE_H
  const sk = TILE_H * SKEW // horizontal shift over one row of height

  ctx.save()
  ctx.globalAlpha = alpha

  if (glow) {
    ctx.shadowColor = glow
    ctx.shadowBlur = 18
  }

  // ---- front face (a parallelogram sheared by the row offset) ----
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(px + w, py)
  ctx.lineTo(px + w + sk * hCells, py + h)
  ctx.lineTo(px + sk * hCells, py + h)
  ctx.closePath()
  const grad = ctx.createLinearGradient(px, py, px + w * 0.3, py + h)
  grad.addColorStop(0, shade(pal.color, 14))
  grad.addColorStop(1, pal.color)
  ctx.fillStyle = grad
  ctx.fill()

  ctx.shadowBlur = 0

  // ---- top face ----
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(px + w, py)
  ctx.lineTo(px + w + DEPTH * 0.9, py - DEPTH)
  ctx.lineTo(px + DEPTH * 0.9, py - DEPTH)
  ctx.closePath()
  ctx.fillStyle = pal.colorTop
  ctx.fill()

  // ---- right face ----
  ctx.beginPath()
  ctx.moveTo(px + w, py)
  ctx.lineTo(px + w + DEPTH * 0.9, py - DEPTH)
  ctx.lineTo(px + w + DEPTH * 0.9 + sk * hCells, py - DEPTH + h)
  ctx.lineTo(px + w + sk * hCells, py + h)
  ctx.closePath()
  ctx.fillStyle = pal.colorDark
  ctx.fill()

  // ---- studs on the top face ----
  if (studs) {
    for (let i = 0; i < wCells; i++) {
      const sx = px + (i + 0.5) * TILE_W + DEPTH * 0.45
      const sy = py - DEPTH * 0.5
      ctx.beginPath()
      ctx.ellipse(sx, sy, TILE_W * 0.22, DEPTH * 0.34, 0, 0, Math.PI * 2)
      ctx.fillStyle = shade(pal.colorTop, 22)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(sx, sy - DEPTH * 0.16, TILE_W * 0.2, DEPTH * 0.3, 0, 0, Math.PI * 2)
      ctx.fillStyle = shade(pal.colorTop, 44)
      ctx.fill()
    }
  }

  // ---- seam lines between cells so the brick reads as modular ----
  ctx.strokeStyle = 'rgba(0,0,0,0.13)'
  ctx.lineWidth = 1
  for (let i = 1; i < wCells; i++) {
    const lx = px + i * TILE_W
    ctx.beginPath()
    ctx.moveTo(lx, py)
    ctx.lineTo(lx + sk * hCells, py + h)
    ctx.stroke()
  }
  for (let j = 1; j < hCells; j++) {
    const ly = py + j * TILE_H
    ctx.beginPath()
    ctx.moveTo(px + sk * j, ly)
    ctx.lineTo(px + w + sk * j, ly)
    ctx.stroke()
  }

  if (outline) {
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + w, py)
    ctx.lineTo(px + w + sk * hCells, py + h)
    ctx.lineTo(px + sk * hCells, py + h)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1.4
    ctx.stroke()
  }

  ctx.restore()
}

function drawThinPlate(ctx, x, y, pal) {
  const p = Camera.project(x, y)
  const h = TILE_H * 0.34
  const sk = TILE_H * SKEW * 0.34
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x + TILE_W, p.y)
  ctx.lineTo(p.x + TILE_W + sk, p.y + h)
  ctx.lineTo(p.x + sk, p.y + h)
  ctx.closePath()
  ctx.fillStyle = pal.color
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x + TILE_W, p.y)
  ctx.lineTo(p.x + TILE_W + DEPTH * 0.9, p.y - DEPTH * 0.55)
  ctx.lineTo(p.x + DEPTH * 0.9, p.y - DEPTH * 0.55)
  ctx.closePath()
  ctx.fillStyle = pal.colorTop
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

/**
 * Lazy image cache, same shape as Characters.ensureFace: ask for a URL, get
 * back an image once it has loaded or null until then. Failures are
 * memoised as 'missing' so a absent file is never re-requested every frame.
 *
 * The game ships exactly one image (the biryani — see public/food/README),
 * and anything drawn through here must degrade gracefully without it.
 */
const imageCache = new Map()

function ensureImage(url) {
  if (!url || typeof Image === 'undefined') return null
  const hit = imageCache.get(url)
  if (hit === 'missing') return null
  if (hit) return hit.complete && hit.naturalWidth ? hit : null
  const img = new Image()
  img.onerror = () => imageCache.set(url, 'missing')
  img.src = url
  imageCache.set(url, img)
  return null
}

/**
 * A continuous floor slab — the interior alternative to studded bricks.
 *
 * Level 1's ground IS LEGO, so drawing it brick-by-brick with studs is
 * correct there. A metro carriage is neither made of LEGO nor tilted, so an
 * interior deck is one unbroken vinyl slab per horizontal run, with vertical
 * sides and no studs. (The tilt itself is removed once for the whole scene —
 * see the `interior` un-shear in render().)
 *
 * `run` is the number of cells this slab spans horizontally, which lets the
 * caller coalesce a whole row into one path and keep the surface seamless.
 *
 * `opts.line` is the painted stripe along the deck — '#d8b53f' is the metro's
 * safety line. Pass null for a surface that has no such marking (the gym's
 * rubber matting), which is the only thing that differs between the two.
 */
function drawFloorSlab(ctx, x, y, run, pal, opts = {}) {
  const line = opts.line === undefined ? '#d8b53f' : opts.line
  // Axis-aligned, like the carriage shell: the unsheared cell origin, so the
  // deck stays square under render()'s interior un-shear.
  const px = x * TILE_W
  const py = y * TILE_H
  const w = run * TILE_W

  ctx.save()

  // The deck the passengers stand on. Seen from the side this is a shallow
  // band, not a tall block — a metro floor has no visible underframe from
  // inside the coach.
  const deckH = TILE_H * 0.55

  // ---- the floor surface ----
  const surf = ctx.createLinearGradient(px, py, px, py + deckH)
  surf.addColorStop(0, pal.colorTop)
  surf.addColorStop(1, shade(pal.colorTop, -24))
  ctx.fillStyle = surf
  ctx.fillRect(px, py, w, deckH)

  // ---- the yellow safety line that runs the length of every metro coach ---
  if (line) {
    ctx.fillStyle = line
    ctx.fillRect(px, py + deckH * 0.34, w, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(px, py + deckH * 0.34, w, 1)
  }

  // ---- anti-slip grooves, evenly spaced down the coach ----
  ctx.strokeStyle = 'rgba(0,0,0,0.13)'
  ctx.lineWidth = 1
  for (const t of [0.62, 0.78, 0.92]) {
    const gy = Math.round(py + deckH * t) + 0.5
    ctx.beginPath()
    ctx.moveTo(px, gy)
    ctx.lineTo(px + w, gy)
    ctx.stroke()
  }

  // ---- the bright nose edge where the floor catches the ceiling light ----
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(px, py, w, 2)

  // ---- dark shadow under the seats, along the back of the deck ----
  const shad = ctx.createLinearGradient(px, py, px, py + deckH * 0.3)
  shad.addColorStop(0, 'rgba(0,0,0,0.3)')
  shad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shad
  ctx.fillRect(px, py, w, deckH * 0.3)

  ctx.restore()
}

/** Faint build-grid dots so the player can see where bricks can go. */
function drawBuildGrid(ctx, world, buildMode) {
  if (!buildMode) return
  const g = world.grid
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.get(x, y) !== CELL.EMPTY) continue
      const p = Camera.project(x + 0.5, y + 0.5)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawShadowBlob(ctx, world, x, y) {
  const g = world.grid
  let gy = Math.floor(y)
  let steps = 0
  while (gy < g.height && !g.isSolid(Math.floor(x + 0.5), gy + 1) && steps < 20) {
    gy++
    steps++
  }
  if (gy >= g.height) return
  const p = Camera.project(x + 0.5, gy + 1)
  const fade = Math.max(0.08, 0.34 - steps * 0.03)
  ctx.save()
  ctx.globalAlpha = fade
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(p.x, p.y - 2, TILE_W * 0.34, DEPTH * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawEmoji(ctx, x, y, emoji, size, bob = 0) {
  const p = Camera.project(x + 0.5, y + 1)
  ctx.save()
  ctx.font = size + 'px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3
  ctx.fillText(emoji, p.x + TILE_H * SKEW * 0.5, p.y - 4 + bob)
  ctx.restore()
}

function drawHazard(ctx, h, now) {
  if (h.kind === 'crusher') {
    const p = Camera.project(h.x, h.y)
    // chain up to the ceiling
    ctx.save()
    ctx.strokeStyle = 'rgba(200,210,225,0.45)'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 4])
    const top = Camera.project(h.x, h.top - 3)
    ctx.beginPath()
    ctx.moveTo(p.x + TILE_W * 0.5, p.y)
    ctx.lineTo(top.x + TILE_W * 0.5, top.y)
    ctx.stroke()
    ctx.restore()
    drawBrick(ctx, h.x, h.y, 1, 1, { color: '#8c3b4f', colorDark: '#5e2434', colorTop: '#c05c72' }, { studs: false })
    drawEmoji(ctx, h.x, h.y, '⬇️', 18, 0)
    return
  }
  const wobble = Math.sin(h.animT * 9) * 1.5
  drawBrick(
    ctx,
    h.x,
    h.y,
    1,
    1,
    h.bumpFlash > 0
      ? { color: '#ff8a5c', colorDark: '#b9482a', colorTop: '#ffb08c' }
      : { color: '#c0392b', colorDark: '#7d2318', colorTop: '#e4614f' },
    { studs: false, lift: wobble }
  )
  const p = Camera.project(h.x + 0.5, h.y + 1)
  ctx.save()
  ctx.font = '20px system-ui, "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🤖', p.x + TILE_H * SKEW * 0.5, p.y - 12 + wobble)
  ctx.restore()
  void now
}

/**
 * Campus scenery. Props are decoration only — they sit behind everything
 * playable and collide with nothing, so a level can be dressed without
 * touching its geometry.
 */
function drawProp(ctx, prop, now, rig = false) {
  const { type, x, y } = prop
  const p = Camera.project(x, y)
  const baseX = p.x + TILE_W * 0.5 + TILE_H * SKEW
  const baseY = p.y + TILE_H

  ctx.save()
  switch (type) {
    case 'tree': {
      const sway = Math.sin(now * 1.1 + x) * 3
      ctx.fillStyle = '#6b4a2f'
      ctx.fillRect(baseX - 4, baseY - TILE_H * 1.5, 8, TILE_H * 1.5)
      for (const [dy, r, c] of [
        [2.35, 26, '#2f7a3e'],
        [2.0, 22, '#3d9450'],
        [1.72, 17, '#54ac63'],
      ]) {
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(baseX + sway * (dy - 1.5), baseY - TILE_H * dy, r, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'bench': {
      ctx.fillStyle = '#8a6240'
      ctx.fillRect(baseX - 26, baseY - 22, 52, 7)
      ctx.fillRect(baseX - 26, baseY - 34, 52, 6)
      ctx.fillStyle = '#5d4128'
      ctx.fillRect(baseX - 22, baseY - 22, 5, 22)
      ctx.fillRect(baseX + 17, baseY - 22, 5, 22)
      break
    }

    case 'gate': {
      // GATE 11 — two pillars and a banner arch
      const gh = TILE_H * 3.2
      ctx.fillStyle = '#c9d3dd'
      ctx.fillRect(baseX - 46, baseY - gh, 14, gh)
      ctx.fillRect(baseX + 32, baseY - gh, 14, gh)
      ctx.fillStyle = '#1f6f9c'
      ctx.fillRect(baseX - 48, baseY - gh - 20, 96, 24)
      ctx.fillStyle = '#eef4fb'
      ctx.font = 'bold 13px "Trebuchet MS", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(prop.label ?? 'GATE 11', baseX, baseY - gh - 3)
      break
    }

    case 'building': {
      const bw = (prop.w ?? 4) * TILE_W
      const bh = (prop.h ?? 4) * TILE_H
      ctx.fillStyle = '#d9cbb4'
      ctx.fillRect(baseX - bw / 2, baseY - bh, bw, bh)
      ctx.fillStyle = '#c0b096'
      ctx.fillRect(baseX - bw / 2, baseY - bh, bw, 12)
      // windows
      ctx.fillStyle = 'rgba(80,130,170,0.65)'
      for (let r = 0; r < (prop.h ?? 4) - 1; r++) {
        for (let c = 0; c < (prop.w ?? 4); c++) {
          ctx.fillRect(baseX - bw / 2 + 12 + c * TILE_W, baseY - bh + 24 + r * TILE_H, 20, 24)
        }
      }
      if (prop.label) {
        ctx.fillStyle = '#3d4a58'
        ctx.font = 'bold 14px "Trebuchet MS", system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(prop.label, baseX, baseY - bh + 9)
      }
      break
    }

    case 'sign': {
      ctx.fillStyle = '#7a8899'
      ctx.fillRect(baseX - 3, baseY - TILE_H * 1.6, 6, TILE_H * 1.6)
      ctx.fillStyle = '#f2b230'
      ctx.fillRect(baseX - 34, baseY - TILE_H * 2.3, 68, 24)
      ctx.fillStyle = '#16202e'
      ctx.font = 'bold 12px "Trebuchet MS", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(prop.label ?? '', baseX, baseY - TILE_H * 2.3 + 16)
      break
    }

    case 'stall': {
      // SULTAN: the shawarma stall. Striped awning, glowing spit.
      const sw = TILE_W * 3.4
      const sh = TILE_H * 2.2
      ctx.fillStyle = '#3d2f26'
      ctx.fillRect(baseX - sw / 2, baseY - sh, sw, sh)
      // awning
      const stripes = 7
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 ? '#e2453c' : '#f6f2e8'
        ctx.fillRect(baseX - sw / 2 + (i * sw) / stripes, baseY - sh - 20, sw / stripes, 20)
      }
      // the rotating spit, which is the whole reason we came
      const glow = 0.5 + Math.sin(now * 2) * 0.2
      ctx.save()
      ctx.shadowColor = `rgba(255,170,60,${glow})`
      ctx.shadowBlur = 16
      ctx.fillStyle = '#b5702f'
      ctx.beginPath()
      ctx.ellipse(baseX, baseY - sh * 0.48, 13, 26, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#ffe9b8'
      ctx.font = 'bold 15px "Trebuchet MS", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(prop.label ?? 'SULTAN', baseX, baseY - sh - 26)
      break
    }

    // ================================================================
    //  BENGALURU METRO — Level 2's carriage interior
    // ================================================================

    case 'metroWindow': {
      // The window is where the level sells "this train is moving": layered
      // silhouettes of the city slide past at different speeds, so the
      // parallax alone reads as motion even when nothing else changes.
      const ww = TILE_W * 2.6
      const wh = TILE_H * 1.9
      const wx = baseX - ww / 2
      const wy = baseY - TILE_H * 3.4

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(wx, wy, ww, wh, 10)
      ctx.clip()

      // daylight outside
      const outside = ctx.createLinearGradient(wx, wy, wx, wy + wh)
      outside.addColorStop(0, '#8fc4e8')
      outside.addColorStop(1, '#dfe9ee')
      ctx.fillStyle = outside
      ctx.fillRect(wx, wy, ww, wh)

      // far skyline — slow
      const far = (now * 38 + x * 60) % (ww + 140)
      ctx.fillStyle = 'rgba(110,140,170,0.55)'
      for (let i = -1; i < 5; i++) {
        const bx = wx + ((i * 46 - far) % (ww + 140)) + 70
        ctx.fillRect(bx, wy + wh * 0.32, 26, wh * 0.68)
        ctx.fillRect(bx + 30, wy + wh * 0.46, 16, wh * 0.54)
      }
      // near trees/poles — fast, which is what makes it feel like a train
      const near = (now * 165 + x * 90) % (ww + 120)
      ctx.fillStyle = 'rgba(52,96,72,0.75)'
      for (let i = -1; i < 6; i++) {
        const tx = wx + ((i * 58 - near) % (ww + 120)) + 60
        ctx.beginPath()
        ctx.arc(tx, wy + wh * 0.72, 13, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(tx - 2, wy + wh * 0.72, 4, wh * 0.28)
      }
      ctx.restore()

      // frame + glass sheen
      ctx.strokeStyle = '#8a94a6'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(wx, wy, ww, wh, 10)
      ctx.stroke()
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(wx + ww * 0.1, wy + wh)
      ctx.lineTo(wx + ww * 0.42, wy)
      ctx.lineTo(wx + ww * 0.6, wy)
      ctx.lineTo(wx + ww * 0.28, wy + wh)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      break
    }

    case 'metroSeat': {
      const sw = TILE_W * 2.2
      const sy = baseY - TILE_H * 0.55
      // the blue bench cushion
      ctx.fillStyle = '#2f6fa8'
      ctx.beginPath()
      ctx.roundRect(baseX - sw / 2, sy - 16, sw, 16, 5)
      ctx.fill()
      // backrest
      ctx.fillStyle = '#3d86c4'
      ctx.beginPath()
      ctx.roundRect(baseX - sw / 2, sy - TILE_H * 1.25, sw, TILE_H * 0.85, 6)
      ctx.fill()
      // stainless legs
      ctx.fillStyle = '#9aa7b6'
      ctx.fillRect(baseX - sw / 2 + 4, sy, 5, 18)
      ctx.fillRect(baseX + sw / 2 - 9, sy, 5, 18)
      break
    }

    case 'metroPole': {
      const ph = TILE_H * 3.5
      const grad = ctx.createLinearGradient(baseX - 4, 0, baseX + 4, 0)
      grad.addColorStop(0, '#8e9aa8')
      grad.addColorStop(0.45, '#e3eaf1')
      grad.addColorStop(1, '#7c8794')
      ctx.fillStyle = grad
      ctx.fillRect(baseX - 4, baseY - ph, 8, ph)
      // hanging handle, swaying with the train
      const swing = Math.sin(now * 1.6 + x) * 6
      ctx.strokeStyle = '#c3ccd6'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(baseX, baseY - ph + 8)
      ctx.lineTo(baseX + swing, baseY - ph + 34)
      ctx.stroke()
      ctx.strokeStyle = '#d8dee6'
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.ellipse(baseX + swing * 1.15, baseY - ph + 44, 8, 11, swing * 0.02, 0, Math.PI * 2)
      ctx.stroke()
      break
    }

    case 'metroDoor': {
      const dw = TILE_W * 2.4
      const dh = TILE_H * 3.4
      const dx = baseX - dw / 2
      const dy = baseY - dh
      ctx.fillStyle = '#c6cfd9'
      ctx.fillRect(dx, dy, dw, dh)
      // the glass panel
      ctx.fillStyle = 'rgba(150,190,215,0.55)'
      ctx.fillRect(dx + 8, dy + 14, dw - 16, dh * 0.5)
      // the yellow safety strip every metro door has
      ctx.fillStyle = '#f2b230'
      ctx.fillRect(dx, dy + dh - 16, dw, 6)
      // centre seam
      ctx.strokeStyle = '#96a1ae'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(baseX, dy)
      ctx.lineTo(baseX, dy + dh)
      ctx.stroke()
      break
    }

    case 'metroSign': {
      // The route strip above the door — BMRCL purple line.
      const sw = TILE_W * 3.6
      const sy = baseY - TILE_H * 3.9
      ctx.fillStyle = '#1d2330'
      ctx.beginPath()
      ctx.roundRect(baseX - sw / 2, sy, sw, 26, 5)
      ctx.fill()
      ctx.fillStyle = '#9b6fd4'
      ctx.fillRect(baseX - sw / 2 + 6, sy + 18, sw - 12, 4)
      ctx.fillStyle = '#eef4fb'
      ctx.font = 'bold 11px "Trebuchet MS", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(prop.label ?? 'NEXT: MG ROAD', baseX, sy + 14)
      break
    }

    case 'passenger': {
      // Background commuters. Deliberately faceless silhouettes — they are
      // scenery, not cast. In music mode they bob to the beat.
      const bobbing = prop.bob ?? 0
      const lift = bobbing ? Math.abs(Math.sin(now * 5.2 + x)) * 5 * bobbing : 0
      const ph = TILE_H * 1.4
      ctx.save()
      ctx.globalAlpha = 0.55
      ctx.fillStyle = prop.color ?? '#3c4759'
      // body
      ctx.beginPath()
      ctx.roundRect(baseX - 11, baseY - ph - lift, 22, ph * 0.72, 5)
      ctx.fill()
      // head
      ctx.beginPath()
      ctx.arc(baseX, baseY - ph - lift - 10, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }

    // ------------------------------------------------------------------
    //  LEVEL 3 — the gym half
    //
    //  Deliberately a bit too much of everything: the joke is that someone
    //  put a full gym and a full PC lab in the same room. These are props,
    //  so none of them collide — the player walks straight past the bench
    //  press, which is exactly the point of the level.
    // ------------------------------------------------------------------

    case 'dumbbellRack': {
      const rw = TILE_W * 2.6
      const rx = baseX - rw / 2
      // the angled rack frame
      ctx.fillStyle = '#39404f'
      ctx.beginPath()
      ctx.roundRect(rx, baseY - TILE_H * 1.15, rw, TILE_H * 1.15, 4)
      ctx.fill()
      ctx.fillStyle = '#2a303c'
      ctx.fillRect(rx, baseY - TILE_H * 0.62, rw, 5)
      // two shelves of dumbbells, big ones at the bottom
      for (const [row, r, gap] of [
        [0.78, 7, 17],
        [0.3, 5, 13],
      ]) {
        const dy = baseY - TILE_H * row
        for (let i = 0; i < 4; i++) {
          const dx = rx + 10 + i * gap
          ctx.fillStyle = '#12161d'
          ctx.beginPath()
          ctx.arc(dx, dy, r, 0, Math.PI * 2)
          ctx.arc(dx + r * 1.5, dy, r, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#5a6475'
          ctx.fillRect(dx, dy - 2, r * 1.5, 4)
        }
      }
      break
    }

    case 'barbell': {
      // Leaning against the wall, because nobody re-racks.
      const bh = TILE_H * 2.8
      ctx.save()
      ctx.translate(baseX, baseY)
      ctx.rotate(-0.22)
      ctx.fillStyle = '#aab4c2'
      ctx.fillRect(-3, -bh, 6, bh)
      // the plates
      for (const [py, r] of [
        [-bh + 16, 15],
        [-16, 15],
      ]) {
        ctx.fillStyle = '#1a1f28'
        ctx.beginPath()
        ctx.ellipse(0, py, 7, r, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e2453c'
        ctx.beginPath()
        ctx.ellipse(0, py, 3.5, r * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      break
    }

    case 'benchPress': {
      const bw = TILE_W * 3.4
      const bx = baseX - bw / 2
      const padY = baseY - TILE_H * 0.95
      // uprights
      ctx.fillStyle = '#4a5364'
      ctx.fillRect(bx + 6, baseY - TILE_H * 2.3, 7, TILE_H * 2.3)
      ctx.fillRect(bx + bw - 13, baseY - TILE_H * 2.3, 7, TILE_H * 2.3)
      // the bar resting in the hooks
      ctx.fillStyle = '#c3ccd6'
      ctx.fillRect(bx - 6, baseY - TILE_H * 2.22, bw + 12, 5)
      ctx.fillStyle = '#1a1f28'
      ctx.beginPath()
      ctx.ellipse(bx - 4, baseY - TILE_H * 2.2, 5, 13, 0, 0, Math.PI * 2)
      ctx.ellipse(bx + bw + 4, baseY - TILE_H * 2.2, 5, 13, 0, 0, Math.PI * 2)
      ctx.fill()
      // the red vinyl pad
      ctx.fillStyle = '#b8352c'
      ctx.beginPath()
      ctx.roundRect(bx + 14, padY, bw - 28, 13, 5)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fillRect(bx + 14, padY + 2, bw - 28, 3)
      // legs
      ctx.fillStyle = '#39404f'
      ctx.fillRect(bx + 20, padY + 13, 6, TILE_H * 0.95 - 13)
      ctx.fillRect(bx + bw - 26, padY + 13, 6, TILE_H * 0.95 - 13)
      break
    }

    case 'proteinBottle': {
      // A shaker and a tub of something with far too many scoops in it.
      const sh = TILE_H * 0.85
      ctx.fillStyle = '#2b3242'
      ctx.beginPath()
      ctx.roundRect(baseX - 8, baseY - sh, 16, sh, 3)
      ctx.fill()
      ctx.fillStyle = prop.color ?? '#7ee08a'
      ctx.beginPath()
      ctx.roundRect(baseX - 8, baseY - sh * 0.62, 16, sh * 0.62, 3)
      ctx.fill()
      // the lid
      ctx.fillStyle = '#e2453c'
      ctx.beginPath()
      ctx.roundRect(baseX - 9, baseY - sh - 6, 18, 7, 2)
      ctx.fill()
      break
    }

    case 'gymMirror': {
      // A free-standing mirror on the floor, separate from the wall one in
      // the shell — it catches the RGB and doubles the clutter.
      const mw = TILE_W * 1.6
      const mh = TILE_H * 2.6
      ctx.fillStyle = '#39404f'
      ctx.fillRect(baseX - mw / 2 - 3, baseY - mh - 3, mw + 6, mh + 6)
      const gl = ctx.createLinearGradient(baseX - mw / 2, baseY - mh, baseX + mw / 2, baseY)
      gl.addColorStop(0, 'rgba(170,200,225,0.4)')
      gl.addColorStop(1, 'rgba(110,140,170,0.3)')
      ctx.fillStyle = gl
      ctx.fillRect(baseX - mw / 2, baseY - mh, mw, mh)
      break
    }

    // ------------------------------------------------------------------
    //  LEVEL 3 — the PC lab half
    // ------------------------------------------------------------------

    case 'pcCase': {
      const cw = TILE_W * 1.5
      const ch = TILE_H * 2.6
      const cx = baseX - cw / 2
      const cy = baseY - ch
      // the chassis
      ctx.fillStyle = '#171b24'
      ctx.beginPath()
      ctx.roundRect(cx, cy, cw, ch, 4)
      ctx.fill()
      // tempered glass side panel, lit from inside once the rig is up
      const hue = rig ? (now * 70) % 360 : 210
      const glass = ctx.createLinearGradient(cx, cy, cx, baseY)
      glass.addColorStop(0, `hsla(${hue}, 85%, 60%, ${rig ? 0.5 : 0.12})`)
      glass.addColorStop(1, `hsla(${(hue + 60) % 360}, 85%, 55%, ${rig ? 0.35 : 0.08})`)
      ctx.fillStyle = glass
      ctx.fillRect(cx + 4, cy + 5, cw - 8, ch - 10)
      // three case fans, spinning only when powered
      const spin = rig ? now * 7 : 0
      for (let i = 0; i < 3; i++) {
        const fy = cy + 16 + i * (ch - 30) / 2.4
        const fx = cx + cw * 0.34
        ctx.save()
        ctx.translate(fx, fy)
        ctx.strokeStyle = rig ? `hsla(${(hue + i * 40) % 360}, 90%, 70%, 0.9)` : '#39404f'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, Math.PI * 2)
        ctx.stroke()
        ctx.rotate(spin + i)
        for (let b = 0; b < 3; b++) {
          ctx.rotate((Math.PI * 2) / 3)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(6, 2)
          ctx.stroke()
        }
        ctx.restore()
      }
      // front power LED
      ctx.fillStyle = rig ? '#7ef0a0' : '#3a4150'
      ctx.beginPath()
      ctx.arc(cx + cw - 7, cy + 9, 2.6, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'monitorDesk': {
      // The desk with however many monitors the level asks for. Before the
      // rig boots they show scrolling code; after, the restored sitcom
      // scenes, which is the visible payoff of the whole level.
      const count = prop.screens ?? 2
      const dw = TILE_W * (1.9 + count * 0.9)
      const dx = baseX - dw / 2
      const deskY = baseY - TILE_H * 1.05

      // desk surface + legs
      ctx.fillStyle = '#3a2f26'
      ctx.beginPath()
      ctx.roundRect(dx, deskY, dw, 9, 2)
      ctx.fill()
      ctx.fillStyle = '#242a35'
      ctx.fillRect(dx + 8, deskY + 9, 6, TILE_H * 1.05 - 9)
      ctx.fillRect(dx + dw - 14, deskY + 9, 6, TILE_H * 1.05 - 9)

      // the monitors
      const mw = TILE_W * 1.5
      const mh = TILE_H * 1.15
      for (let i = 0; i < count; i++) {
        const mx = dx + 14 + i * (mw + 9)
        const my = deskY - mh - 8
        // stand
        ctx.fillStyle = '#1b1f28'
        ctx.fillRect(mx + mw / 2 - 4, my + mh, 8, 8)
        ctx.fillRect(mx + mw / 2 - 12, deskY - 2, 24, 3)
        // bezel
        ctx.fillStyle = '#0d1016'
        ctx.beginPath()
        ctx.roundRect(mx, my, mw, mh, 3)
        ctx.fill()
        // the screen
        const sx = mx + 3
        const sy = my + 3
        const sw = mw - 6
        const sh = mh - 6
        if (rig) {
          // ultra-HD sitcom: a warm office on one, a blue living room on
          // the next, with a little figure in each
          const warm = i % 2 === 0
          ctx.fillStyle = warm ? '#6b5a3a' : '#3c4a6b'
          ctx.fillRect(sx, sy, sw, sh)
          ctx.font = `${Math.round(sh * 0.55)}px system-ui, "Segoe UI Emoji", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(warm ? '🙂' : '🙃', sx + sw / 2, sy + sh / 2)
          // scanline sheen
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          ctx.fillRect(sx, sy, sw, sh * 0.3)
        } else {
          // scrolling code: green lines creeping up the panel
          ctx.fillStyle = '#0a1410'
          ctx.fillRect(sx, sy, sw, sh)
          ctx.fillStyle = 'rgba(126,240,160,0.75)'
          const rows = 7
          for (let r = 0; r < rows; r++) {
            const t = (now * 12 + r * 9 + i * 5) % (rows * 9)
            const ly = sy + sh - (t % sh)
            const lw = ((r * 37 + i * 13) % 100) / 100
            ctx.fillRect(sx + 3, ly, (sw - 6) * (0.3 + lw * 0.6), 1.6)
          }
        }
      }

      // keyboard + mouse on the desk
      ctx.fillStyle = rig ? `hsla(${(now * 70) % 360}, 80%, 60%, 0.9)` : '#39404f'
      ctx.beginPath()
      ctx.roundRect(dx + dw * 0.3, deskY - 5, TILE_W * 1.5, 5, 2)
      ctx.fill()
      ctx.fillStyle = '#4a5364'
      ctx.beginPath()
      ctx.ellipse(dx + dw * 0.3 + TILE_W * 1.7, deskY - 3, 5, 3.4, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'gpuShelf': {
      // A shelf of loose components, treated like trophies.
      const sw = TILE_W * 2.4
      const sx = baseX - sw / 2
      const sy = baseY - TILE_H * 1.5
      ctx.fillStyle = '#2f3644'
      ctx.beginPath()
      ctx.roundRect(sx, sy, sw, 6, 2)
      ctx.fill()
      // the GPU: a long black slab with a fan and a lit edge
      ctx.fillStyle = '#12161d'
      ctx.beginPath()
      ctx.roundRect(sx + 6, sy - 15, sw - 12, 15, 2)
      ctx.fill()
      const hue = rig ? (now * 70) % 360 : 200
      ctx.fillStyle = `hsla(${hue}, 85%, 62%, ${rig ? 0.95 : 0.4})`
      ctx.fillRect(sx + 6, sy - 15, sw - 12, 2)
      ctx.strokeStyle = '#5a6475'
      ctx.lineWidth = 1.5
      for (const fx of [sx + sw * 0.32, sx + sw * 0.66]) {
        ctx.beginPath()
        ctx.arc(fx, sy - 7.5, 5, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }

    case 'ramStick': {
      // RAM standing on end like a little monolith, heatspreader and all.
      const rh = TILE_H * 0.8
      ctx.fillStyle = '#1b2029'
      ctx.beginPath()
      ctx.roundRect(baseX - 5, baseY - rh, 10, rh, 2)
      ctx.fill()
      ctx.fillStyle = prop.color ?? '#b07be0'
      ctx.fillRect(baseX - 5, baseY - rh, 10, 4)
      // gold contacts
      ctx.fillStyle = '#d4a53f'
      ctx.fillRect(baseX - 5, baseY - 3, 10, 3)
      break
    }

    case 'coolingFan': {
      // A spare 120mm fan, propped up and spinning when the rig is on.
      const r = 13
      const cy2 = baseY - r - 3
      ctx.fillStyle = '#1b2029'
      ctx.beginPath()
      ctx.roundRect(baseX - r - 2, cy2 - r - 2, (r + 2) * 2, (r + 2) * 2, 3)
      ctx.fill()
      ctx.save()
      ctx.translate(baseX, cy2)
      ctx.rotate(rig ? now * 9 : now * 0.3)
      ctx.fillStyle = rig ? `hsla(${(now * 70) % 360}, 85%, 65%, 0.85)` : '#4a5364'
      for (let b = 0; b < 7; b++) {
        ctx.rotate((Math.PI * 2) / 7)
        ctx.beginPath()
        ctx.ellipse(r * 0.5, 0, r * 0.45, 3.4, 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      ctx.fillStyle = '#2f3644'
      ctx.beginPath()
      ctx.arc(baseX, cy2, 4, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'rgbStrip': {
      // A floor-standing RGB bar. Pure vibe, zero function.
      const sh = TILE_H * 2.2
      const hue = rig ? (now * 70 + x * 25) % 360 : (200 + x * 6) % 360
      ctx.fillStyle = '#1b2029'
      ctx.fillRect(baseX - 4, baseY - sh, 8, sh)
      ctx.fillStyle = `hsla(${hue}, 90%, 62%, ${rig ? 0.95 : 0.45})`
      ctx.fillRect(baseX - 2.5, baseY - sh + 4, 5, sh - 8)
      // the glow it throws onto the floor
      const glow = ctx.createRadialGradient(baseX, baseY - sh / 2, 2, baseX, baseY - sh / 2, 46)
      glow.addColorStop(0, `hsla(${hue}, 90%, 62%, ${rig ? 0.3 : 0.12})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(baseX - 46, baseY - sh - 20, 92, sh + 40)
      break
    }

    // ---- LEVEL 4: THE BEAR KITCHEN ------------------------------------

    case 'steelCounter': {
      // The workhorse of the room. A steel top on open legs, with whatever
      // is stacked underneath showing through.
      const cw = TILE_W * (prop.w ?? 2)
      const ch = TILE_H * 1.15
      const topY = baseY - ch
      ctx.fillStyle = '#2b2f35'
      ctx.fillRect(baseX - cw / 2 + 5, topY + 6, 5, ch - 6)
      ctx.fillRect(baseX + cw / 2 - 10, topY + 6, 5, ch - 6)
      // undershelf
      ctx.fillStyle = '#3a3f46'
      ctx.fillRect(baseX - cw / 2 + 3, baseY - ch * 0.34, cw - 6, 4)
      // the top, catching the lamps
      const top = ctx.createLinearGradient(0, topY, 0, topY + 10)
      top.addColorStop(0, '#7b828a')
      top.addColorStop(1, '#4e545b')
      ctx.fillStyle = top
      ctx.fillRect(baseX - cw / 2, topY, cw, 9)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(baseX - cw / 2, topY, cw, 2)
      break
    }

    case 'gasBurner': {
      // A burner with a live flame. This is the main moving light source in
      // the room, so the flicker is deliberately strong.
      const bw = TILE_W * 0.86
      const topY = baseY - TILE_H * 1.05
      ctx.fillStyle = '#23272c'
      ctx.fillRect(baseX - bw / 2, topY, bw, TILE_H * 1.05)
      ctx.fillStyle = '#31363c'
      ctx.fillRect(baseX - bw / 2, topY, bw, 7)
      // grate
      ctx.strokeStyle = '#15181c'
      ctx.lineWidth = 2.4
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(baseX + i * 7, topY + 1)
        ctx.lineTo(baseX + i * 7, topY + 6)
        ctx.stroke()
      }
      /**
       * The flame. Three lobes, each on its own phase so the ring never
       * pulses as one shape, and deliberately BIG — at 44px tiles a
       * realistically-sized burner flame is a few pixels of smudge, and
       * this is the main light source in the room.
       */
      const lick = 1 + Math.sin(now * 11 + x) * 0.18
      for (let i = 0; i < 3; i++) {
        const fx = baseX + (i - 1) * 8
        const wob = 1 + Math.sin(now * 13 + i * 2.1 + x) * 0.2
        const fh = TILE_H * (0.62 + (i === 1 ? 0.2 : 0)) * lick * wob
        const flame = ctx.createLinearGradient(0, topY - fh, 0, topY + 2)
        flame.addColorStop(0, 'rgba(255,236,190,0.95)')
        flame.addColorStop(0.35, 'rgba(255,170,60,0.9)')
        flame.addColorStop(0.75, 'rgba(90,170,255,0.85)')
        flame.addColorStop(1, 'rgba(60,130,240,0.5)')
        ctx.fillStyle = flame
        ctx.beginPath()
        ctx.moveTo(fx - 6, topY + 2)
        ctx.quadraticCurveTo(fx - 7, topY - fh * 0.55, fx, topY - fh)
        ctx.quadraticCurveTo(fx + 7, topY - fh * 0.55, fx + 6, topY + 2)
        ctx.closePath()
        ctx.fill()
      }
      // the pool of heat it throws
      const heat = ctx.createRadialGradient(baseX, topY, 3, baseX, topY, 54)
      heat.addColorStop(0, 'rgba(255,150,60,0.34)')
      heat.addColorStop(1, 'rgba(255,120,40,0)')
      ctx.fillStyle = heat
      ctx.beginPath()
      ctx.arc(baseX, topY, 54, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'biryaniPot': {
      // The hero pot. `lid` closed is the Bear moment; open is the reveal.
      const pw = TILE_W * 1.05
      const ph = TILE_H * 0.82
      const topY = baseY - TILE_H * 1.5
      drawSteam(ctx, baseX, topY - 6, now, prop.lid === false ? 1.5 : 0.7)
      // body
      const body = ctx.createLinearGradient(baseX - pw / 2, 0, baseX + pw / 2, 0)
      body.addColorStop(0, '#5a6068')
      body.addColorStop(0.5, '#7d848c')
      body.addColorStop(1, '#474d54')
      ctx.fillStyle = body
      ctx.fillRect(baseX - pw / 2, topY, pw, ph)
      // handles
      ctx.strokeStyle = '#3a3f45'
      ctx.lineWidth = 3
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(baseX + s * (pw / 2 + 2), topY + ph * 0.3, 5, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (prop.lid === false) {
        // rice, golden, heaped
        ctx.fillStyle = '#e8d9b0'
        ctx.beginPath()
        ctx.ellipse(baseX, topY + 2, pw * 0.46, ph * 0.22, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#d8a445'
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2
          ctx.beginPath()
          ctx.ellipse(
            baseX + Math.cos(a) * pw * 0.26,
            topY + 2 + Math.sin(a) * ph * 0.1,
            3.4,
            2.2,
            0,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }
      } else {
        // the lid, with its knob
        ctx.fillStyle = '#8b9199'
        ctx.beginPath()
        ctx.ellipse(baseX, topY, pw * 0.54, ph * 0.2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#2f343a'
        ctx.beginPath()
        ctx.arc(baseX, topY - 5, 3.4, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'cuttingBoard': {
      const bw = TILE_W * 0.9
      const topY = baseY - TILE_H * 1.18
      ctx.fillStyle = '#c69a5f'
      ctx.fillRect(baseX - bw / 2, topY, bw, 6)
      ctx.fillStyle = 'rgba(80,52,26,0.4)'
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(baseX - bw / 2 + 4 + i * (bw / 5), topY + 1.5, 1.2, 3)
      }
      // whatever is being prepped
      ctx.fillStyle = prop.color ?? '#5faf4f'
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(baseX - 8 + i * 8, topY - 2, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'knifeBlock': {
      const topY = baseY - TILE_H * 1.5
      ctx.fillStyle = '#5b4632'
      ctx.fillRect(baseX - 9, topY + 8, 18, TILE_H * 0.55)
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#2a2f35'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(baseX - 5 + i * 5, topY + 8)
        ctx.lineTo(baseX - 3 + i * 5, topY - 6)
        ctx.stroke()
        ctx.strokeStyle = '#b9c0c8'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(baseX - 5 + i * 5, topY + 8)
        ctx.lineTo(baseX - 3.4 + i * 5, topY - 5)
        ctx.stroke()
      }
      break
    }

    case 'spiceRack': {
      // The most Indian-kitchen object in the room: a row of masala tins.
      const topY = baseY - TILE_H * 1.62
      const colors = ['#c2622a', '#d8a445', '#8d3b2a', '#5f7a2e', '#b8862f', '#7a3f1d']
      ctx.fillStyle = '#4a3a2a'
      ctx.fillRect(baseX - TILE_W * 0.5, topY + TILE_H * 0.36, TILE_W, 4)
      for (let i = 0; i < 6; i++) {
        const sx = baseX - TILE_W * 0.42 + i * (TILE_W * 0.17)
        ctx.fillStyle = '#9aa1a9'
        ctx.fillRect(sx, topY + TILE_H * 0.1, TILE_W * 0.13, TILE_H * 0.26)
        ctx.fillStyle = colors[i]
        ctx.fillRect(sx + 1, topY + TILE_H * 0.13, TILE_W * 0.13 - 2, TILE_H * 0.14)
      }
      break
    }

    case 'oven': {
      const ow = TILE_W * 1.4
      const oh = TILE_H * 1.9
      const topY = baseY - oh
      ctx.fillStyle = '#2c3037'
      ctx.fillRect(baseX - ow / 2, topY, ow, oh)
      ctx.fillStyle = '#3a4047'
      ctx.fillRect(baseX - ow / 2, topY, ow, 8)
      // door glass, lit from inside
      const glow = ctx.createLinearGradient(0, topY + 14, 0, topY + oh * 0.72)
      glow.addColorStop(0, 'rgba(255,150,50,0.5)')
      glow.addColorStop(1, 'rgba(180,70,20,0.65)')
      ctx.fillStyle = glow
      ctx.fillRect(baseX - ow / 2 + 6, topY + 14, ow - 12, oh * 0.58)
      ctx.strokeStyle = '#1a1e23'
      ctx.lineWidth = 2
      ctx.strokeRect(baseX - ow / 2 + 6, topY + 14, ow - 12, oh * 0.58)
      // handle
      ctx.fillStyle = '#9aa1a9'
      ctx.fillRect(baseX - ow / 2 + 4, topY + 9, ow - 8, 3.5)
      break
    }

    case 'plateStack': {
      const topY = baseY - TILE_H * 1.2
      for (let i = 0; i < (prop.count ?? 5); i++) {
        ctx.fillStyle = i % 2 ? '#e8ecef' : '#dfe4e8'
        ctx.beginPath()
        ctx.ellipse(baseX, topY - i * 3.4, TILE_W * 0.3, TILE_H * 0.11, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(120,130,140,0.5)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
      break
    }

    default:
      break
  }
  ctx.restore()
}

/**
 * STEAM — the one effect this game did not already have.
 *
 * Three soft radial puffs rising and fading on a loop, offset from each
 * other so the column never pulses as a single shape. Built from the same
 * radial-gradient idiom as the RGB strip's floor glow rather than from
 * particles, because steam wants to be big, slow and translucent, and the
 * particle system draws small opaque squares.
 *
 * `strength` scales both size and opacity: ~0.7 for a simmering pot, 1.5+
 * for the lid coming off.
 */
function drawSteam(ctx, x, y, now, strength = 1) {
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const phase = (now * 0.45 + i * 0.33) % 1
    const rise = phase * TILE_H * 2.4 * strength
    const r = (9 + phase * 22) * strength
    const alpha = (1 - phase) * 0.3 * strength
    if (alpha <= 0.01) continue
    const drift = Math.sin(now * 1.2 + i * 2.1) * 6 * phase
    const g = ctx.createRadialGradient(x + drift, y - rise, 0, x + drift, y - rise, r)
    g.addColorStop(0, `rgba(255,252,246,${alpha})`)
    g.addColorStop(1, 'rgba(255,250,242,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x + drift, y - rise, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/**
 * The carriage ceiling light — the interior stand-in for sky. One warm strip
 * across the top of the screen, which starts pulsing in time once the
 * earphones go in.
 */
function drawCeilingStrip(ctx, w, h, now, music, shell = 'metro', rig = false) {
  ctx.save()
  const stripH = h * 0.1

  if (shell === 'gym') {
    // The lab's RGB. Idle it is a calm cyan; once the rig boots it cycles
    // hue, which is the cheapest possible way to make the whole room react
    // to the build finishing.
    const hue = rig ? (now * 70) % 360 : 190
    const pulse = rig ? 0.6 + Math.sin(now * 4) * 0.22 : 0.34
    const g = ctx.createLinearGradient(0, 0, 0, stripH * 2.4)
    g.addColorStop(0, `hsla(${hue}, 85%, 62%, ${pulse})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, stripH * 2.4)

    // two parallel housings — it reads as a lab, not a single train tube
    ctx.fillStyle = `hsla(${hue}, 90%, 72%, ${rig ? 0.9 : 0.55})`
    ctx.fillRect(0, stripH * 0.3, w, 5)
    ctx.fillStyle = `hsla(${(hue + 140) % 360}, 90%, 70%, ${rig ? 0.75 : 0.35})`
    ctx.fillRect(0, stripH * 0.72, w, 3)
    ctx.restore()
    return
  }

  if (shell === 'kitchen') {
    /**
     * Hot service lamps over the pass. Nothing cycles and nothing pulses —
     * a working kitchen is lit hard and flat, and keeping this steady is
     * what lets the steam and the burners be the only moving light.
     */
    const g = ctx.createLinearGradient(0, 0, 0, stripH * 2.8)
    g.addColorStop(0, 'rgba(255,208,140,0.5)')
    g.addColorStop(1, 'rgba(255,170,90,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, stripH * 2.8)

    // the heat-lamp bar itself, with its bulbs
    ctx.fillStyle = 'rgba(58,44,34,0.9)'
    ctx.fillRect(0, stripH * 0.26, w, 7)
    const spacing = 96
    for (let x = spacing * 0.5; x < w; x += spacing) {
      const bulb = ctx.createRadialGradient(x, stripH * 0.4 + 6, 0, x, stripH * 0.4 + 6, 26)
      bulb.addColorStop(0, 'rgba(255,196,110,0.85)')
      bulb.addColorStop(1, 'rgba(255,170,80,0)')
      ctx.fillStyle = bulb
      ctx.beginPath()
      ctx.arc(x, stripH * 0.4 + 6, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffd08a'
      ctx.fillRect(x - 7, stripH * 0.26 + 6, 14, 3)
    }
    ctx.restore()
    return
  }

  const pulse = music ? 0.62 + Math.sin(now * 6.5) * 0.28 : 0.4
  const g = ctx.createLinearGradient(0, 0, 0, stripH * 2.4)
  g.addColorStop(0, music ? `rgba(255,190,240,${pulse})` : `rgba(210,228,245,${pulse})`)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, stripH * 2.4)

  // the housing itself
  ctx.fillStyle = music ? 'rgba(255,220,250,0.85)' : 'rgba(228,238,248,0.8)'
  ctx.fillRect(0, stripH * 0.35, w, 6)
  ctx.restore()
}

/**
 * THE GYM SHELL — the thing that makes Level 3 read as "a gym that someone
 * has filled with computers" rather than "furniture in a grey room".
 *
 * Same contract as drawCarriageShell: world space, behind every prop, built
 * from axis-aligned rects off the UNSHEARED cell origin (render() has
 * cancelled the projection's shear for interior levels). Three zones across
 * the room, left to right, matching where the level puts its props:
 *
 *   x < 17    the gym half: mirrored wall, wall bars, a motivational poster
 *   x >= 17   the lab half: pegboard, cable trays, RGB wash
 *
 * `rig` is world.rigOnline — once the PC boots, the whole room lights up.
 */
function drawGymShell(ctx, x0, x1, deckY, now, rig) {
  const left = { x: x0 * TILE_W, y: deckY * TILE_H }
  const right = { x: x1 * TILE_W, y: deckY * TILE_H }
  const wallW = right.x - left.x
  const split = left.x + wallW * 0.5 // gym | lab

  const roofY = left.y - TILE_H * 5.6
  const wainscotY = left.y - TILE_H * 1.6

  ctx.save()

  // ---- the back wall ----
  const wall = ctx.createLinearGradient(0, roofY, 0, left.y)
  wall.addColorStop(0, rig ? '#241d38' : '#20242e')
  wall.addColorStop(1, rig ? '#171327' : '#171a22')
  ctx.fillStyle = wall
  ctx.fillRect(left.x, roofY, wallW, left.y - roofY)

  // ---- GYM HALF: the mirror ----
  const mirrorX = left.x + TILE_W * 1.2
  const mirrorW = split - mirrorX - TILE_W * 0.6
  const mirrorY = roofY + TILE_H * 1.1
  const mirrorH = wainscotY - mirrorY
  const glass = ctx.createLinearGradient(mirrorX, mirrorY, mirrorX + mirrorW, wainscotY)
  glass.addColorStop(0, 'rgba(150,180,205,0.30)')
  glass.addColorStop(0.5, 'rgba(190,215,235,0.16)')
  glass.addColorStop(1, 'rgba(120,150,180,0.26)')
  ctx.fillStyle = glass
  ctx.fillRect(mirrorX, mirrorY, mirrorW, mirrorH)
  // a diagonal sheen so it reads as glass rather than a grey panel
  ctx.save()
  ctx.beginPath()
  ctx.rect(mirrorX, mirrorY, mirrorW, mirrorH)
  ctx.clip()
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.beginPath()
  ctx.moveTo(mirrorX + mirrorW * 0.12, mirrorY)
  ctx.lineTo(mirrorX + mirrorW * 0.3, mirrorY)
  ctx.lineTo(mirrorX + mirrorW * 0.1, mirrorY + mirrorH)
  ctx.lineTo(mirrorX - mirrorW * 0.08, mirrorY + mirrorH)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  // frame
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  ctx.strokeRect(mirrorX, mirrorY, mirrorW, mirrorH)

  // ---- LAB HALF: pegboard ----
  ctx.save()
  ctx.beginPath()
  ctx.rect(split, roofY + TILE_H * 0.9, right.x - split, wainscotY - roofY - TILE_H * 0.9)
  ctx.clip()
  ctx.fillStyle = rig ? '#2b2242' : '#1c2030'
  ctx.fillRect(split, roofY + TILE_H * 0.9, right.x - split, wainscotY - roofY)
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  for (let px = split + 9; px < right.x; px += 16) {
    for (let py = roofY + TILE_H * 1.3; py < wainscotY; py += 16) {
      ctx.beginPath()
      ctx.arc(px, py, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  // ---- the RGB strip washing the wall, brighter once the rig is up ----
  const hue = rig ? (now * 70) % 360 : 190
  const wash = ctx.createLinearGradient(0, wainscotY - TILE_H * 2.4, 0, wainscotY)
  wash.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`)
  wash.addColorStop(1, `hsla(${hue}, 90%, 60%, ${rig ? 0.3 : 0.12})`)
  ctx.fillStyle = wash
  ctx.fillRect(left.x, wainscotY - TILE_H * 2.4, wallW, TILE_H * 2.4)

  // the strip itself, tucked under the shelf line
  ctx.fillStyle = `hsla(${hue}, 95%, 68%, ${rig ? 0.95 : 0.5})`
  ctx.fillRect(left.x, wainscotY - 3, wallW, 3)

  // ---- rubber wainscot, the band the equipment sits against ----
  const skirt = ctx.createLinearGradient(0, wainscotY, 0, left.y)
  skirt.addColorStop(0, '#2b3040')
  skirt.addColorStop(1, '#171a24')
  ctx.fillStyle = skirt
  ctx.fillRect(left.x, wainscotY, wallW, left.y - wainscotY)

  // vertical joints in the rubber
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'
  ctx.lineWidth = 1
  for (let px = left.x; px < right.x; px += TILE_W * 2) {
    ctx.beginPath()
    ctx.moveTo(px, wainscotY)
    ctx.lineTo(px, left.y)
    ctx.stroke()
  }

  // ---- ceiling ribs ----
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(left.x, roofY, wallW, TILE_H * 0.5)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  for (let px = left.x; px < right.x; px += TILE_W * 3) {
    ctx.beginPath()
    ctx.moveTo(px, roofY)
    ctx.lineTo(px, roofY + TILE_H * 0.5)
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * THE KITCHEN SHELL — the thing that makes Level 4 read as "a professional
 * kitchen mid-service" rather than "furniture in a brown room".
 *
 * Same contract as the other two: world space, behind every prop, built from
 * axis-aligned rects off the UNSHEARED cell origin. Two zones across the
 * room, matching where the level puts its props:
 *
 *   x < 18    the line: subway tile, the burner wall, a rail of hanging pans
 *   x >= 18   the pass: brushed steel, heat lamps, the ticket rail
 *
 * Deliberately darker and warmer than the gym. The gym was underlit and
 * purple; this is underlit and ORANGE, lit almost entirely from the burners
 * and the pass lamps, with hard shadows between them. That contrast is what
 * makes the first half of the level feel like a different kind of pressure.
 */
function drawKitchenShell(ctx, x0, x1, deckY, now) {
  const left = { x: x0 * TILE_W, y: deckY * TILE_H }
  const right = { x: x1 * TILE_W, y: deckY * TILE_H }
  const wallW = right.x - left.x
  const roofY = left.y - TILE_H * 5.6
  const splashY = left.y - TILE_H * 2.9
  const split = left.x + wallW * 0.55

  ctx.save()

  // ---- back wall ----
  const wall = ctx.createLinearGradient(0, roofY, 0, left.y)
  wall.addColorStop(0, '#241a14')
  wall.addColorStop(0.6, '#2e221a')
  wall.addColorStop(1, '#1b1410')
  ctx.fillStyle = wall
  ctx.fillRect(left.x, roofY, wallW, left.y - roofY)

  // ---- the line half: white subway tile, grimy at the grout ----
  ctx.save()
  ctx.beginPath()
  ctx.rect(left.x, splashY, split - left.x, left.y - splashY)
  ctx.clip()
  ctx.fillStyle = '#cfc4b4'
  ctx.fillRect(left.x, splashY, split - left.x, left.y - splashY)
  const tileW = TILE_W * 0.62
  const tileH = TILE_H * 0.52
  ctx.strokeStyle = 'rgba(70,56,44,0.45)'
  ctx.lineWidth = 1.4
  let row = 0
  for (let py = splashY; py < left.y; py += tileH, row++) {
    const stagger = row % 2 ? tileW * 0.5 : 0
    for (let px = left.x - tileW; px < split + tileW; px += tileW) {
      ctx.strokeRect(px + stagger, py, tileW, tileH)
    }
  }
  // grease haze rising off the burners
  const grime = ctx.createLinearGradient(0, left.y, 0, splashY)
  grime.addColorStop(0, 'rgba(120,78,40,0.42)')
  grime.addColorStop(1, 'rgba(120,78,40,0)')
  ctx.fillStyle = grime
  ctx.fillRect(left.x, splashY, split - left.x, left.y - splashY)
  ctx.restore()

  // ---- the pass half: brushed stainless ----
  ctx.save()
  ctx.beginPath()
  ctx.rect(split, splashY, right.x - split, left.y - splashY)
  ctx.clip()
  const steel = ctx.createLinearGradient(0, splashY, 0, left.y)
  steel.addColorStop(0, '#5a5f66')
  steel.addColorStop(0.5, '#464b52')
  steel.addColorStop(1, '#33373d')
  ctx.fillStyle = steel
  ctx.fillRect(split, splashY, right.x - split, left.y - splashY)
  // the brushed grain
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'
  ctx.lineWidth = 1
  for (let py = splashY; py < left.y; py += 3) {
    ctx.beginPath()
    ctx.moveTo(split, py)
    ctx.lineTo(right.x, py)
    ctx.stroke()
  }
  ctx.restore()

  // the seam where tile meets steel
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(split - 2, splashY, 4, left.y - splashY)

  // ---- the extractor hood, running the whole width ----
  const hoodY = roofY + TILE_H * 0.9
  const hoodH = TILE_H * 1.5
  const hood = ctx.createLinearGradient(0, hoodY, 0, hoodY + hoodH)
  hood.addColorStop(0, '#6d737b')
  hood.addColorStop(1, '#3c4147')
  ctx.fillStyle = hood
  ctx.fillRect(left.x, hoodY, wallW, hoodH)
  // the angled lip that catches the lamp light
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(left.x, hoodY + hoodH - 5, wallW, 5)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(left.x, hoodY + hoodH, wallW, TILE_H * 0.22)
  // filter baffles
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 2
  for (let px = left.x + 10; px < right.x; px += TILE_W * 0.7) {
    ctx.beginPath()
    ctx.moveTo(px, hoodY + 6)
    ctx.lineTo(px, hoodY + hoodH - 8)
    ctx.stroke()
  }

  // ---- the pot rail, with pans hanging off it ----
  const railY = splashY - TILE_H * 0.85
  ctx.strokeStyle = '#8b9199'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(left.x + TILE_W * 0.5, railY)
  ctx.lineTo(split - TILE_W * 0.4, railY)
  ctx.stroke()
  for (let i = 0; i < 7; i++) {
    const px = left.x + TILE_W * (1.2 + i * 1.6)
    if (px > split - TILE_W) break
    const swing = Math.sin(now * 0.7 + i) * 1.2
    ctx.strokeStyle = 'rgba(200,206,214,0.7)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(px, railY)
    ctx.lineTo(px + swing, railY + TILE_H * 0.3)
    ctx.stroke()
    // the pan itself
    ctx.fillStyle = i % 2 ? '#3a3f45' : '#4a5057'
    ctx.beginPath()
    ctx.ellipse(px + swing, railY + TILE_H * 0.55, TILE_W * 0.26, TILE_H * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  // ---- the ticket rail over the pass ----
  const tRailY = splashY - TILE_H * 0.7
  ctx.strokeStyle = '#9aa1a9'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(split + TILE_W * 0.5, tRailY)
  ctx.lineTo(right.x - TILE_W * 0.5, tRailY)
  ctx.stroke()
  for (let i = 0; i < 9; i++) {
    const px = split + TILE_W * (1 + i * 1.3)
    if (px > right.x - TILE_W) break
    const flutter = Math.sin(now * 1.4 + i * 0.8) * 0.8
    ctx.save()
    ctx.translate(px, tRailY)
    ctx.rotate(flutter * 0.02)
    ctx.fillStyle = 'rgba(244,240,228,0.92)'
    ctx.fillRect(-TILE_W * 0.16, 0, TILE_W * 0.32, TILE_H * 0.58)
    ctx.strokeStyle = 'rgba(90,80,66,0.5)'
    ctx.lineWidth = 0.8
    for (let l = 1; l < 4; l++) {
      ctx.beginPath()
      ctx.moveTo(-TILE_W * 0.11, TILE_H * 0.1 * l)
      ctx.lineTo(TILE_W * 0.11, TILE_H * 0.1 * l)
      ctx.stroke()
    }
    ctx.restore()
  }

  // ---- the warm wash off the burners, along the floor line ----
  const wash = ctx.createLinearGradient(0, left.y - TILE_H * 2.6, 0, left.y)
  wash.addColorStop(0, 'rgba(255,146,54,0)')
  wash.addColorStop(1, 'rgba(255,146,54,0.26)')
  ctx.fillStyle = wash
  ctx.fillRect(left.x, left.y - TILE_H * 2.6, wallW, TILE_H * 2.6)

  ctx.restore()
}

/**
 * THE CARRIAGE SHELL — the thing that makes Level 2 read as "inside a train"
 * rather than "furniture in a grey room".
 *
 * Drawn in WORLD space, behind every prop, so it scrolls and rocks with the
 * scene. Three bands stacked up the wall, matching a real Namma Metro coach:
 *
 *   roof      curved ceiling ribs + the lit strip housing
 *   upper     the window band — a long continuous glazed run
 *   lower     the panelled wall the seats are bolted to, plus the skirting
 *
 * `deckY` is the floor row the carriage sits on; everything is measured up
 * from there so the shell always meets the floor exactly.
 */
function drawCarriageShell(ctx, x0, x1, deckY, now, music) {
  /**
   * This routine is built entirely from axis-aligned rects, so its origin
   * must be the UNSHEARED cell position. render() has already cancelled the
   * projection's shear for interior levels; feeding a raw Camera.project()
   * origin in here would re-introduce it on one axis only and slant every
   * wall — which is exactly how the coach turned into a rhombus.
   */
  const left = { x: x0 * TILE_W, y: deckY * TILE_H }
  const right = { x: x1 * TILE_W, y: deckY * TILE_H }
  const wallW = right.x - left.x

  const roofY = left.y - TILE_H * 5.6
  const windowTop = left.y - TILE_H * 4.2
  const windowBot = left.y - TILE_H * 2.0
  const skirtY = left.y - TILE_H * 0.35

  ctx.save()

  // ---- lower wall: the panelling the seats mount onto ----
  const lower = ctx.createLinearGradient(0, windowBot, 0, left.y)
  lower.addColorStop(0, music ? '#5d5470' : '#59616f')
  lower.addColorStop(1, music ? '#3b3450' : '#3a404c')
  ctx.fillStyle = lower
  ctx.fillRect(left.x, windowBot, wallW, left.y - windowBot)

  // vertical panel joints, evenly spaced down the coach
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 1
  for (let px = left.x; px < right.x; px += TILE_W * 2) {
    ctx.beginPath()
    ctx.moveTo(px, windowBot)
    ctx.lineTo(px, skirtY)
    ctx.stroke()
  }

  // stainless skirting board along the bottom of the wall
  ctx.fillStyle = music ? '#8f83a6' : '#7d8694'
  ctx.fillRect(left.x, skirtY, wallW, TILE_H * 0.35)
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.fillRect(left.x, skirtY, wallW, 3)

  // ---- window band: one continuous glazed run ----
  const glass = ctx.createLinearGradient(0, windowTop, 0, windowBot)
  glass.addColorStop(0, '#9fc9e6')
  glass.addColorStop(0.55, '#cfe3ee')
  glass.addColorStop(1, '#b6cdd9')
  ctx.fillStyle = glass
  ctx.fillRect(left.x, windowTop, wallW, windowBot - windowTop)

  // the city sliding past behind the glass — two parallax layers, clipped to
  // the band so it never spills onto the wall
  ctx.save()
  ctx.beginPath()
  ctx.rect(left.x, windowTop, wallW, windowBot - windowTop)
  ctx.clip()
  const bandH = windowBot - windowTop
  const far = (now * 40) % 190
  ctx.fillStyle = 'rgba(112,142,172,0.5)'
  for (let i = -2; i * 190 - far < wallW + 190; i++) {
    const bx = left.x + i * 190 - far
    ctx.fillRect(bx, windowTop + bandH * 0.3, 52, bandH * 0.7)
    ctx.fillRect(bx + 64, windowTop + bandH * 0.48, 34, bandH * 0.52)
    ctx.fillRect(bx + 112, windowTop + bandH * 0.38, 44, bandH * 0.62)
  }
  const near = (now * 190) % 150
  ctx.fillStyle = 'rgba(48,92,70,0.7)'
  for (let i = -2; i * 150 - near < wallW + 150; i++) {
    const tx = left.x + i * 150 - near
    ctx.beginPath()
    ctx.arc(tx, windowBot - bandH * 0.22, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(tx - 2.5, windowBot - bandH * 0.22, 5, bandH * 0.22)
  }
  ctx.restore()

  // window mullions — the posts between each pane
  ctx.fillStyle = music ? '#6f6486' : '#6b7480'
  for (let px = left.x; px <= right.x; px += TILE_W * 4) {
    ctx.fillRect(px - 3, windowTop, 6, windowBot - windowTop)
  }
  // rubber seals top and bottom
  ctx.fillStyle = '#4a515c'
  ctx.fillRect(left.x, windowTop - 5, wallW, 7)
  ctx.fillRect(left.x, windowBot - 2, wallW, 7)

  // a diagonal sheen so the glass reads as glass
  ctx.save()
  ctx.beginPath()
  ctx.rect(left.x, windowTop, wallW, windowBot - windowTop)
  ctx.clip()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#ffffff'
  for (let px = left.x - bandH; px < right.x; px += TILE_W * 5) {
    ctx.beginPath()
    ctx.moveTo(px, windowBot)
    ctx.lineTo(px + bandH * 0.7, windowTop)
    ctx.lineTo(px + bandH * 1.15, windowTop)
    ctx.lineTo(px + bandH * 0.45, windowBot)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // ---- roof: curved ceiling with ribs ----
  const roof = ctx.createLinearGradient(0, roofY, 0, windowTop)
  roof.addColorStop(0, music ? '#efe0f7' : '#dfe6ee')
  roof.addColorStop(1, music ? '#c9b6da' : '#b9c3cf')
  ctx.fillStyle = roof
  ctx.beginPath()
  ctx.moveTo(left.x, windowTop)
  ctx.quadraticCurveTo(left.x + wallW / 2, roofY - TILE_H * 0.7, right.x, windowTop)
  ctx.lineTo(right.x, windowTop - 4)
  ctx.quadraticCurveTo(left.x + wallW / 2, roofY - TILE_H * 0.9, left.x, windowTop - 4)
  ctx.closePath()
  ctx.fill()

  // fill the ceiling body above the windows
  ctx.beginPath()
  ctx.moveTo(left.x, windowTop)
  ctx.quadraticCurveTo(left.x + wallW / 2, roofY - TILE_H * 0.7, right.x, windowTop)
  ctx.lineTo(right.x, windowTop)
  ctx.lineTo(left.x, windowTop)
  ctx.closePath()
  ctx.fill()

  // ceiling ribs, spaced like the real coach
  ctx.strokeStyle = 'rgba(80,95,115,0.28)'
  ctx.lineWidth = 2
  for (let px = left.x + TILE_W * 2; px < right.x; px += TILE_W * 4) {
    const t = (px - left.x) / wallW
    const dip = Math.sin(t * Math.PI) * TILE_H * 0.55
    ctx.beginPath()
    ctx.moveTo(px, windowTop)
    ctx.lineTo(px, windowTop - dip - TILE_H * 0.35)
    ctx.stroke()
  }

  // the lit strip running the length of the ceiling
  const lit = music ? 0.55 + Math.sin(now * 6.5) * 0.25 : 0.42
  ctx.fillStyle = music
    ? `rgba(255,205,245,${lit})`
    : `rgba(236,246,255,${lit})`
  ctx.fillRect(left.x, windowTop - TILE_H * 1.5, wallW, 9)
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.shadowColor = music ? 'rgba(255,180,235,0.9)' : 'rgba(215,236,255,0.9)'
  ctx.shadowBlur = 22
  ctx.fillRect(left.x, windowTop - TILE_H * 1.5, wallW, 9)
  ctx.restore()

  ctx.restore()
}

/**
 * MUSIC MODE. Everything here is additive over the finished frame: a warm
 * colour wash, a bar visualiser along the bottom, and drifting notes. It is
 * drawn in screen space (outside the camera transform) so it stays put while
 * the carriage rocks underneath it.
 */
function drawMusicOverlay(ctx, w, h, now) {
  ctx.save()

  // warm wash — the world literally gets more colourful
  const wash = ctx.createLinearGradient(0, 0, w, h)
  wash.addColorStop(0, 'rgba(255,95,162,0.13)')
  wash.addColorStop(0.5, 'rgba(255,214,102,0.07)')
  wash.addColorStop(1, 'rgba(120,140,255,0.13)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, w, h)

  // the visualiser along the floor edge
  const bars = 48
  const bw = w / bars
  for (let i = 0; i < bars; i++) {
    const amp =
      Math.abs(Math.sin(now * 5.5 + i * 0.5)) * 0.6 +
      Math.abs(Math.sin(now * 8.2 + i * 1.3)) * 0.4
    const bh = 14 + amp * 54
    const hue = (i * 7 + now * 60) % 360
    ctx.fillStyle = `hsla(${hue}, 85%, 64%, 0.5)`
    ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh)
  }

  // notes drifting up the sides
  ctx.font = '18px system-ui, "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  for (let i = 0; i < 10; i++) {
    const t = (now * 0.32 + i * 0.1) % 1
    const nx = ((i * 137) % w)
    const ny = h - t * h
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.55
    ctx.fillStyle = i % 2 ? '#ff5fa2' : '#ffd166'
    ctx.fillText(i % 3 === 0 ? '♫' : '♪', nx + Math.sin(now * 2 + i) * 18, ny)
  }

  ctx.restore()
}

/** A small speech puff over a character who is mid-line. */
function drawSpeechTail(ctx, x, y) {
  const p = Camera.project(x + 0.5, y - 1)
  const cx = p.x + TILE_H * SKEW * 0.5
  const cy = p.y - 6
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  for (const [dx, dy, r] of [
    [0, 0, 7],
    [9, 5, 4.5],
    [15, 10, 2.8],
  ]) {
    ctx.beginPath()
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#16202e'
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('···', cx, cy + 3)
  ctx.restore()
}

export function render(ctx, world, view, state) {
  const { w, h, dpr } = view
  const now = state.now
  ctx.save()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // ---- sky ----
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, world.def.skyTop ?? '#1b2440')
  sky.addColorStop(1, world.def.skyBottom ?? '#3c2f4d')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const interior = world.def.interior === true
  const music = world.musicMode === true
  /**
   * WHICH interior. Level 2's carriage was the first, so its look (window
   * band, yellow safety line, the constant rocking of a moving train) was
   * written straight into the `interior` path. Level 3 is a gym that does
   * not move and has no windows, so the train-specific parts are gated on
   * this instead. Defaulting to 'metro' keeps Level 2 byte-identical.
   */
  const shell = world.def.shell ?? 'metro'
  const rig = world.rigOnline === true

  if (!interior) {
    // parallax clouds — a slow drift that sells daylight and depth
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#ffffff'
    const off = -world.camera.x * 0.06 + now * 5
    for (let i = -1; i < 10; i++) {
      const bx = (((i * 260 + off) % (w + 520)) + w + 520) % (w + 520) - 260
      const by = 40 + ((i * 97) % 140)
      for (const [dx, dy, r] of [
        [0, 0, 26],
        [30, 6, 20],
        [-28, 8, 17],
        [12, -12, 18],
      ]) {
        ctx.beginPath()
        ctx.arc(bx + dx, by + dy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  } else {
    // Indoors there is no sky to look at, so the ceiling does the work: a
    // lit strip running the length of the carriage, which is also the
    // easiest thing to make pulse once the music starts. In the gym the same
    // strip is the RGB lighting, which hue-cycles once the rig boots.
    drawCeilingStrip(ctx, w, h, now, music, shell, rig)
  }

  ctx.save()
  // The carriage is always moving. A gentle vertical rock plus an occasional
  // lateral judder, applied before the camera transform so the whole scene
  // — floor, props, characters — rides together instead of sliding apart.
  // A gym floor does not do this, so it is gated on the metro shell.
  if (interior && shell === 'metro') {
    const beat = music ? 1.9 : 1
    const rock = Math.sin(now * 3.1) * 1.3 * beat
    const judder = Math.sin(now * 0.7) * Math.sin(now * 11.3) * 0.9
    ctx.translate(judder, rock)
  }
  world.camera.apply(ctx)

  const g = world.grid

  /**
   * Straighten the carriage.
   *
   * Camera.project() shears every row right by TILE_H * SKEW, which is what
   * gives the LEGO world its 2.5D tilt. A train is not tilted, and over this
   * map's rows that shear leans the whole coach into a rhombus.
   *
   * Note this CANNOT be fixed with a counter-shear matrix: a shear slants
   * every shape drawn through it, so cancelling the projection's lean would
   * simply lean all the axis-aligned coach art by the same amount instead.
   * The fix is to not shear interior art in the first place — `unproj`
   * below is the flat cell→screen mapping every interior routine uses, and
   * PROJECT_FLAT makes characters and props positioned by Camera.project
   * land in that same flat space.
   */
  if (interior) Camera.setFlat(true)

  // ---- the carriage itself, behind every prop ----
  // Walls, windows and roof are structure, not scenery: without them the
  // seats and poles float in a void and the level stops reading as a train.
  if (interior) {
    const deckY = g.height - 3 // the top of the floor slab
    if (shell === 'gym') drawGymShell(ctx, 0, g.width, deckY, now, rig)
    else if (shell === 'kitchen') drawKitchenShell(ctx, 0, g.width, deckY, now)
    else drawCarriageShell(ctx, 0, g.width, deckY, now, music)
  }

  // ---- scenery, behind everything playable ----
  // Passengers get told about the music so they can move to it; every other
  // prop ignores the flag.
  for (const prop of world.props ?? []) {
    drawProp(ctx, prop.type === 'passenger' && music ? { ...prop, bob: 1 } : prop, now, rig)
  }

  drawBuildGrid(ctx, world, state.buildMode)

  // ---- hazard zones (lava) — drawn first, they live at the bottom ----
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (g.get(x, y) !== CELL.HAZARD_ZONE) continue
      const p = Camera.project(x, y)
      const wob = Math.sin(now * 2.5 + x * 0.6) * 2
      ctx.save()
      const lg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + TILE_H)
      lg.addColorStop(0, '#ff7a3d')
      lg.addColorStop(1, '#a01f2b')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.moveTo(p.x, p.y + wob)
      ctx.lineTo(p.x + TILE_W, p.y - wob)
      ctx.lineTo(p.x + TILE_W + TILE_H * SKEW, p.y + TILE_H)
      ctx.lineTo(p.x + TILE_H * SKEW, p.y + TILE_H)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#ffd08a'
      ctx.fillRect(p.x, p.y + wob - 1.5, TILE_W, 2)
      ctx.restore()
    }
  }

  // ---- terrain, drawn back-to-front (top rows first) ----
  const ground = floorPalettes(world.def)
  if (interior) {
    // A carriage floor is ONE surface. The map's lower rows are collision
    // geometry, not scenery: drawing each of them produced a stack of grey
    // slabs stepping out below the coach. The deck is the first FULL-WIDTH
    // terrain row (the rows above it hold only the end-wall cells at each
    // end of the coach, which are structure, not floor). Draw it once.
    let deck = -1
    for (let y = 0; y < g.height && deck < 0; y++) {
      let run = 0
      for (let x = 0; x < g.width; x++) if (g.get(x, y) === CELL.TERRAIN) run++
      if (run === g.width) deck = y
    }
    if (deck >= 0) {
      drawFloorSlab(ctx, 0, deck, g.width, ground.main, {
        // Only the metro has a painted safety line. A gym floor and a
        // kitchen floor are both just floor.
        line: shell === 'gym' || shell === 'kitchen' ? null : undefined,
      })
    }
  }
  for (let y = 0; y < g.height && !interior; y++) {
    for (let x = 0; x < g.width; x++) {
      const k = g.get(x, y)
      if (k === CELL.TERRAIN) {
        const v = g.variant[g.idx(x, y)]
        if (v === 99) {
          drawThinPlate(ctx, x, y, ground.alt)
        } else {
          const pal = v % 2 === 0 ? ground.main : ground.alt
          // only draw studs if nothing sits directly on top (cleaner look)
          const covered = g.isSolid(x, y - 1)
          drawBrick(ctx, x, y, 1, 1, pal, { studs: !covered })
        }
      } else if (k === CELL.PLATE) {
        const plate = world.plates.find((pl) => pl.x === x && pl.y === y)
        const pressed = plate?.pressed
        drawThinPlate(ctx, x, y + (pressed ? 0.16 : 0), pressed ? { color: '#4fc26a', colorDark: '#2c7a3f', colorTop: '#8ce8a2' } : PLATE_COLORS)
        if (!pressed) {
          const p = Camera.project(x + 0.5, y)
          ctx.save()
          ctx.globalAlpha = 0.5 + Math.sin(now * 4) * 0.2
          ctx.strokeStyle = '#ffd166'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(p.x - 7, p.y - 16)
          ctx.lineTo(p.x, p.y - 9)
          ctx.lineTo(p.x + 7, p.y - 16)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
  }

  // ---- gates ----
  for (const [, gate] of world.gates) {
    if (gate.open) {
      ctx.save()
      ctx.globalAlpha = 0.16
      for (const c of gate.cells) drawBrick(ctx, c.x, c.y, 1, 1, { color: '#4fc26a', colorDark: '#2c7a3f', colorTop: '#8ce8a2' }, { studs: false, outline: false })
      ctx.restore()
    } else {
      for (const c of gate.cells) {
        drawBrick(ctx, c.x, c.y, 1, 1, { color: '#4a5570', colorDark: '#2f3750', colorTop: '#6b7896' }, { studs: false })
      }
      const first = gate.cells[0]
      if (first) drawEmoji(ctx, first.x, first.y, '🔒', 15)
    }
  }

  // ---- player-placed bricks (drawn as whole pieces, not cells) ----
  for (const b of world.building.placed) {
    const t = BLOCK_TYPES[b.typeId]
    const age = now - b.bornAt
    const pop = age < 0.22 ? 1 - age / 0.22 : 0
    const cells = footprint(b.typeId, b.rot)
    // draw per-cell so the shape can be non-rectangular in future
    const minX = Math.min(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const maxX = Math.max(...cells.map((c) => c.x))
    const maxY = Math.max(...cells.map((c) => c.y))
    drawBrick(ctx, b.ox + minX, b.oy + minY, maxX - minX + 1, maxY - minY + 1, t, {
      lift: pop * 10,
      alpha: 1,
      glow: t.special ? 'rgba(255,214,90,0.8)' : null,
    })
    if (pop > 0) {
      // placement flash
      const p = Camera.project(b.ox, b.oy)
      ctx.save()
      ctx.globalAlpha = pop * 0.7
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.strokeRect(p.x - 3, p.y - 3 - pop * 10, (maxX - minX + 1) * TILE_W + 6, (maxY - minY + 1) * TILE_H + 6)
      ctx.restore()
    }
  }

  // ---- collectibles ----
  for (const c of world.collectibles) {
    if (c.taken || c.hidden) continue
    const bob = Math.sin(c.bob) * 4
    drawShadowBlob(ctx, world, c.x, c.y)
    if (c.kind === 'brick') {
      const t = BLOCK_TYPES[c.typeId]
      ctx.save()
      ctx.globalAlpha = 0.95
      drawBrick(ctx, c.x, c.y, 1, 1, t, { lift: 8 - bob, glow: 'rgba(255,255,255,0.5)' })
      ctx.restore()
      const p = Camera.project(c.x + 0.5, c.y)
      ctx.save()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('+' + c.count + ' ' + t.short, p.x + 6, p.y - 24 + bob)
      ctx.restore()
    } else {
      drawEmoji(ctx, c.x, c.y, c.emoji, c.optional ? 26 : 32, bob)
      if (c.optional) {
        const p = Camera.project(c.x + 0.5, c.y)
        ctx.save()
        ctx.globalAlpha = 0.45 + Math.sin(now * 3) * 0.2
        ctx.strokeStyle = '#ffd166'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.arc(p.x + 6, p.y + 4 + bob, 22, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  // ---- goals ----
  for (const gl of world.goals) {
    if (gl.reached || gl.hidden) continue
    const bob = Math.sin(gl.bob) * 5
    const p = Camera.project(gl.x + 0.5, gl.y + 1)
    // beacon
    ctx.save()
    const bg = ctx.createLinearGradient(p.x, p.y - 400, p.x, p.y)
    bg.addColorStop(0, 'rgba(255,214,102,0)')
    bg.addColorStop(1, 'rgba(255,214,102,0.22)')
    ctx.fillStyle = bg
    ctx.fillRect(p.x - 16, p.y - 400, 32, 400)
    ctx.restore()
    drawShadowBlob(ctx, world, gl.x, gl.y)
    /**
     * A goal can carry a real photo instead of an emoji (`image:` on the
     * goal). Level 4's biryani does, because "a plate of biryani" is the
     * payoff of the whole level and a 🍗 does not sell it. Falls back to
     * the emoji until the file loads, or forever if it is missing.
     */
    const img = gl.image ? ensureImage(gl.image) : null
    if (img) {
      const size = 64
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 3
      ctx.beginPath()
      ctx.arc(p.x, p.y - size * 0.55 + bob, size * 0.5, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, p.x - size * 0.5, p.y - size * 1.05 + bob, size, size)
      ctx.restore()
      // a warm rim so it reads as a plated dish, not a pasted cutout
      ctx.save()
      ctx.strokeStyle = 'rgba(255,214,140,0.75)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y - size * 0.55 + bob, size * 0.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    } else {
      drawEmoji(ctx, gl.x, gl.y, gl.emoji, 40, bob)
    }
  }

  // ---- hazards ----
  for (const hz of world.hazards) {
    drawShadowBlob(ctx, world, hz.x, hz.y)
    drawHazard(ctx, hz, now)
  }

  // ---- NPCs ----
  for (const npc of world.npcs ?? []) {
    if (npc.hidden) continue
    drawShadowBlob(ctx, world, npc.x, npc.y)
    drawCharacter(ctx, npc.id, npc.x, npc.y, npc.pose())
    if (npc.talking) drawSpeechTail(ctx, npc.x, npc.y)
  }

  // ---- player ----
  if (!world.player.dead) {
    drawShadowBlob(ctx, world, world.player.x, world.player.y)
    drawCharacter(ctx, gameConfig.playerId, world.player.x, world.player.y, world.player.pose())
    if (world.player.talking) drawSpeechTail(ctx, world.player.x, world.player.y)
  } else {
    // a sad pile of parts
    const p = Camera.project(world.player.x + 0.5, world.player.y + 1)
    ctx.save()
    ctx.font = '26px system-ui, "Segoe UI Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💥', p.x, p.y - 6)
    ctx.restore()
  }

  // ---- ghost preview ----
  const ghost = world.building.ghost
  if (state.buildMode && ghost) {
    const t = BLOCK_TYPES[ghost.typeId]
    const cells = footprint(ghost.typeId, ghost.rot)
    const maxX = Math.max(...cells.map((c) => c.x))
    const maxY = Math.max(...cells.map((c) => c.y))
    ctx.save()
    ctx.globalAlpha = ghost.valid ? 0.55 : 0.28
    drawBrick(ctx, ghost.ox, ghost.oy, maxX + 1, maxY + 1, ghost.valid ? t : { color: '#8a8f9c', colorDark: '#5a5f6b', colorTop: '#b3b8c4' }, {
      studs: true,
      glow: ghost.valid ? 'rgba(255,255,255,0.6)' : null,
    })
    ctx.restore()
    // cell highlights
    ctx.save()
    ctx.lineWidth = 2
    ctx.strokeStyle = ghost.valid ? 'rgba(140,255,170,0.95)' : 'rgba(255,110,110,0.95)'
    for (const c of ghost.cells) {
      const p = Camera.project(c.x, c.y)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x + TILE_W, p.y)
      ctx.lineTo(p.x + TILE_W + TILE_H * SKEW, p.y + TILE_H)
      ctx.lineTo(p.x + TILE_H * SKEW, p.y + TILE_H)
      ctx.closePath()
      ctx.stroke()
    }
    ctx.restore()
  }

  // ---- particles ----
  for (const pt of world.particles) {
    const p = Camera.project(pt.x, pt.y)
    ctx.save()
    ctx.globalAlpha = Math.max(0, pt.life / pt.max)
    ctx.fillStyle = pt.color
    ctx.fillRect(p.x - pt.size / 2, p.y - pt.size / 2, pt.size, pt.size)
    ctx.restore()
  }

  ctx.restore() // camera

  // Flat projection is a per-frame mode, never a global one: clear it before
  // anything outside this frame (a LEGO level, a hit test) reads it.
  Camera.setFlat(false)

  // ---- music mode, painted over the finished frame ----
  if (music) drawMusicOverlay(ctx, w, h, now)

  ctx.restore()
}
