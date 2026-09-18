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

    default:
      break
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

  ctx.save()
  world.camera.apply(ctx)

  const g = world.grid

  // ---- scenery, behind everything playable ----
  for (const prop of world.props ?? []) drawProp(ctx, prop, now)

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
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const k = g.get(x, y)
      if (k === CELL.TERRAIN) {
        const v = g.variant[g.idx(x, y)]
        if (v === 99) {
          drawThinPlate(ctx, x, y, TERRAIN_ALT)
        } else {
          const pal = v % 2 === 0 ? TERRAIN : TERRAIN_ALT
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
  ctx.restore()
}
