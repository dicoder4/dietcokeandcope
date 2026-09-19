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
 * A continuous floor slab — the interior alternative to studded bricks.
 *
 * Level 1's ground IS LEGO, so drawing it brick-by-brick with studs is
 * correct there. A metro carriage is not built out of LEGO, so an interior
 * level draws its deck as one unbroken vinyl surface instead: a single top
 * face per horizontal run, no studs, no per-cell seams, and a scuffed
 * gradient so it still reads as dimensional under the same lighting.
 *
 * `run` is the number of cells this slab spans horizontally, which lets the
 * caller coalesce a whole row into one path and keep the surface seamless.
 */
function drawFloorSlab(ctx, x, y, run, pal, opts = {}) {
  const { top = true } = opts
  const p = Camera.project(x, y)
  const w = run * TILE_W
  const sk = TILE_H * SKEW

  ctx.save()

  // ---- front face: the riser you see below the walking surface ----
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x + w, p.y)
  ctx.lineTo(p.x + w + sk, p.y + TILE_H)
  ctx.lineTo(p.x + sk, p.y + TILE_H)
  ctx.closePath()
  const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + TILE_H)
  grad.addColorStop(0, pal.color)
  grad.addColorStop(1, shade(pal.color, -14))
  ctx.fillStyle = grad
  ctx.fill()

  // ---- top face: the vinyl the passengers actually stand on ----
  if (top) {
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + w, p.y)
    ctx.lineTo(p.x + w + DEPTH * 0.9, p.y - DEPTH)
    ctx.lineTo(p.x + DEPTH * 0.9, p.y - DEPTH)
    ctx.closePath()
    ctx.fillStyle = pal.colorTop
    ctx.fill()

    // a long anti-slip groove running the length of the carriage, which is
    // what sells "train floor" rather than "grey rectangle"
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'
    ctx.lineWidth = 1
    for (const t of [0.34, 0.66]) {
      ctx.beginPath()
      ctx.moveTo(p.x + DEPTH * 0.9 * t, p.y - DEPTH * t)
      ctx.lineTo(p.x + w + DEPTH * 0.9 * t, p.y - DEPTH * t)
      ctx.stroke()
    }

    // the nose-edge highlight where the floor meets the drop
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + w, p.y)
    ctx.stroke()
  }

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
function drawProp(ctx, prop, now) {
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

    default:
      break
  }
  ctx.restore()
}

/**
 * The carriage ceiling light — the interior stand-in for sky. One warm strip
 * across the top of the screen, which starts pulsing in time once the
 * earphones go in.
 */
function drawCeilingStrip(ctx, w, h, now, music) {
  ctx.save()
  const pulse = music ? 0.62 + Math.sin(now * 6.5) * 0.28 : 0.4
  const stripH = h * 0.1
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
    // easiest thing to make pulse once the music starts.
    drawCeilingStrip(ctx, w, h, now, music)
  }

  ctx.save()
  // The carriage is always moving. A gentle vertical rock plus an occasional
  // lateral judder, applied before the camera transform so the whole scene
  // — floor, props, characters — rides together instead of sliding apart.
  if (interior) {
    const beat = music ? 1.9 : 1
    const rock = Math.sin(now * 3.1) * 1.3 * beat
    const judder = Math.sin(now * 0.7) * Math.sin(now * 11.3) * 0.9
    ctx.translate(judder, rock)
  }
  world.camera.apply(ctx)

  const g = world.grid

  // ---- scenery, behind everything playable ----
  // Passengers get told about the music so they can move to it; every other
  // prop ignores the flag.
  for (const prop of world.props ?? []) {
    drawProp(ctx, prop.type === 'passenger' && music ? { ...prop, bob: 1 } : prop, now)
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
  for (let y = 0; y < g.height; y++) {
    if (interior) {
      // A carriage floor is a surface, not a pile of bricks. Coalesce each
      // horizontal run of terrain into a single slab so no studs or cell
      // seams appear — see drawFloorSlab.
      let x = 0
      while (x < g.width) {
        if (g.get(x, y) !== CELL.TERRAIN) {
          x++
          continue
        }
        let run = 0
        while (x + run < g.width && g.get(x + run, y) === CELL.TERRAIN) run++
        // Only the topmost deck row gets a walking surface; the rows beneath
        // are the underframe and just need their front face.
        drawFloorSlab(ctx, x, y, run, ground.main, { top: !g.isSolid(x, y - 1) })
        x += run
      }
      continue
    }
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
    drawEmoji(ctx, gl.x, gl.y, gl.emoji, 40, bob)
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

  // ---- music mode, painted over the finished frame ----
  if (music) drawMusicOverlay(ctx, w, h, now)

  ctx.restore()
}
