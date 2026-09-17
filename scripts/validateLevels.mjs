/**
 * validateLevels.mjs — offline sanity checker for level geometry.
 *
 * This is a sanity check, not a theorem prover. It answers three questions
 * that catch the level-design bugs that actually happen:
 *
 *   1. Does the player spawn somewhere legal, standing on real floor?
 *   2. Is the goal UNREACHABLE without building? (it must be — that is the
 *      entire design thesis of the game)
 *   3. Does a HAND-AUTHORED reference solution reach the goal, using only
 *      bricks the level actually gives you?
 *
 * Point 3 is the important one and it is deliberately not a search. Each
 * level ships a `reference` solution in its definition: the list of bricks a
 * designer knows works. We replay it through the real movement rules. If the
 * reference stops working after a map edit, this fails loudly — which is
 * exactly when a human should look.
 *
 * Run: npm run validate
 */

import level1 from '../src/levels/level1.js'
import { BLOCK_TYPES, footprint } from '../src/entities/Block.js'

const LEVELS = [level1]

const SOLID = new Set(['#', '=', '|', '_', 'B'])
const FATAL_FALL = 6

function parse(def, { openGates = false } = {}) {
  const rows = def.map
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const grid = []
  let start = null
  for (let y = 0; y < h; y++) {
    const row = rows[y].padEnd(w, ' ')
    const line = []
    for (let x = 0; x < w; x++) {
      let ch = row[x]
      if (ch === 'P') {
        start = { x, y }
        ch = '.'
      }
      if (ch === ' ') ch = '.'
      line.push(ch)
    }
    grid.push(line)
  }
  for (const p of def.plates ?? []) grid[p.y][p.x] = '_'
  for (const g of def.gates ?? []) {
    for (let y = g.y; y < g.y + (g.h ?? 1); y++) {
      for (let x = g.x; x < g.x + (g.w ?? 1); x++) grid[y][x] = openGates ? '.' : '|'
    }
  }
  return { grid, w, h, start }
}

const solid = (g, x, y) => {
  if (y >= g.length) return false // the void: you fall through it
  if (x < 0 || y < 0 || x >= g[0].length) return true // world walls
  return SOLID.has(g[y][x])
}
const deadly = (g, x, y) =>
  y >= 0 && y < g.length && x >= 0 && x < g[0].length && g[y][x] === '^'

/** A 2-tall body with feet at (x,y) fits here? */
const bodyFits = (g, x, y) =>
  !solid(g, x, y) && !solid(g, x, y - 1) && !deadly(g, x, y) && !deadly(g, x, y - 1)

/**
 * Where can the player stand, given this exact grid? Mirrors Player.js:
 * walk sideways, step up exactly one cell, fall (fatal past 6 cells).
 */
function reachable(g, start) {
  const key = (x, y) => x + ',' + y
  const settle = (x, y) => {
    let fy = y
    let dropped = 0
    while (!solid(g, x, fy + 1)) {
      fy++
      dropped++
      if (fy > g.length + 1) return null // fell into the void
      if (dropped > FATAL_FALL) return null // splat
    }
    return bodyFits(g, x, fy) ? { x, y: fy } : null
  }

  const first = settle(start.x, start.y)
  if (!first) return new Set()
  const seen = new Set([key(first.x, first.y)])
  const stack = [first]

  while (stack.length) {
    const cur = stack.pop()
    for (const dx of [-1, 1]) {
      const nx = cur.x + dx
      let next = null
      if (bodyFits(g, nx, cur.y)) {
        next = settle(nx, cur.y) // walk, then fall if unsupported
      } else if (
        solid(g, nx, cur.y) &&
        bodyFits(g, nx, cur.y - 1) &&
        !solid(g, cur.x, cur.y - 2)
      ) {
        next = settle(nx, cur.y - 1) // step up one cell
      }
      if (next && !seen.has(key(next.x, next.y))) {
        seen.add(key(next.x, next.y))
        stack.push(next)
      }
    }
  }
  return seen
}

/** Stamp a reference brick onto the grid. Returns an error string or null. */
function stampBrick(g, spec, budget) {
  const { type, x, y, rot = 0 } = spec
  const t = BLOCK_TYPES[type]
  if (!t) return 'unknown brick type "' + type + '"'
  if ((budget[type] ?? 0) <= 0) return 'reference uses more ' + type + ' than the level provides'
  for (const c of footprint(type, rot)) {
    const cx = x + c.x
    const cy = y + c.y
    if (cy < 0 || cy >= g.length || cx < 0 || cx >= g[0].length) {
      return 'brick at ' + x + ',' + y + ' goes out of bounds'
    }
    if (g[cy][cx] !== '.') {
      return 'brick at ' + x + ',' + y + ' overlaps "' + g[cy][cx] + '" at ' + cx + ',' + cy
    }
  }
  for (const c of footprint(type, rot)) g[y + c.y][x + c.x] = 'B'
  budget[type]--
  return null
}

let failures = 0
const fail = (msg) => {
  failures++
  console.log('     ✗ ' + msg)
}

for (const def of LEVELS) {
  console.log('─'.repeat(64))
  console.log('LEVEL ' + def.id + ' — ' + def.name)

  const goals = def.goals ?? []
  const key = (x, y) => x + ',' + y
  const goalReached = (set) => goals.every((gl) => set.has(key(gl.x, gl.y)))

  // --- 1. legal spawn -------------------------------------------------
  {
    const { grid, start } = parse(def)
    if (!start) fail('no P start marker in the map')
    else if (!bodyFits(grid, start.x, start.y)) fail('player spawns inside geometry')
    else {
      const reach = reachable(grid, start)
      if (reach.size === 0) fail('player spawn immediately dies (void or hazard below)')
      else console.log('     ✓ spawn is legal (' + reach.size + ' cells walkable bare)')
    }
  }

  // --- 2. unreachable without building --------------------------------
  {
    const { grid, start } = parse(def, { openGates: true })
    const reach = reachable(grid, start)
    if (goalReached(reach)) {
      fail('goal is reachable WITHOUT building — building must be required')
    } else {
      console.log('     ✓ goal is unreachable without building')
    }
  }

  // --- 3. the reference solution works --------------------------------
  if (!def.reference || !def.reference.length) {
    fail('no reference solution authored — cannot verify solvability')
  } else {
    // Gate-locked goals assume the plate puzzle is solved; the reference is
    // required to include the brick that weighs the plate down, and we check
    // that separately below.
    const { grid, start } = parse(def, { openGates: true })
    const budget = { ...def.inventory }
    for (const c of def.collectibles ?? []) {
      if (c.kind === 'brick') budget[c.typeId] = (budget[c.typeId] ?? 0) + c.count
    }
    let err = null
    for (const spec of def.reference) {
      err = stampBrick(grid, spec, budget)
      if (err) break
    }
    if (err) {
      fail('reference solution invalid: ' + err)
    } else {
      const reach = reachable(grid, start)
      if (!goalReached(reach)) {
        const missing = goals.filter((gl) => !reach.has(key(gl.x, gl.y)))
        fail(
          'reference solution does NOT reach ' +
            missing.map((m) => m.label + '@' + m.x + ',' + m.y).join(', ')
        )
      } else {
        console.log(
          '     ✓ reference solution reaches the goal (' + def.reference.length + ' bricks)'
        )
      }

      // every brick pickup should be collectable, or it is decoration
      const unreachable = (def.collectibles ?? []).filter(
        (c) => !reach.has(key(c.x, c.y)) && !reach.has(key(c.x, c.y + 1))
      )
      if (unreachable.length) {
        console.log(
          '     ! pickups not on the reference path: ' +
            unreachable.map((c) => (c.label || c.typeId) + '@' + c.x + ',' + c.y).join(', ') +
            ' (fine if intentionally optional)'
        )
      }

      // Plates must be reachable, and the cell above must be free for a
      // paperweight brick. Both are checked WITHOUT the reference's own
      // paperweight in place — once the weight is resting there the player
      // can no longer stand on that cell, which is the whole point of the
      // puzzle, not a bug.
      for (const p of def.plates ?? []) {
        const { grid: g2, start: s2 } = parse(def, { openGates: true })
        const budget2 = { ...def.inventory }
        for (const c of def.collectibles ?? []) {
          if (c.kind === 'brick') budget2[c.typeId] = (budget2[c.typeId] ?? 0) + c.count
        }
        // replay the reference, skipping any brick that lands on this plate
        for (const spec of def.reference) {
          const onPlate = footprint(spec.type, spec.rot ?? 0).some(
            (c) => spec.x + c.x === p.x && spec.y + c.y === p.y - 1
          )
          if (!onPlate) stampBrick(g2, spec, budget2)
        }
        const reach2 = reachable(g2, s2)
        const standing = reach2.has(key(p.x, p.y - 1))
        const weightable = g2[p.y - 1]?.[p.x] === '.'
        if (!standing) {
          fail('plate at ' + p.x + ',' + p.y + ' cannot be reached')
        } else if (!weightable) {
          fail('plate at ' + p.x + ',' + p.y + ' has no free cell above for a weight')
        } else {
          console.log('     ✓ plate at ' + p.x + ',' + p.y + ' is reachable and weightable')
        }
        // and the reference must actually weigh it down
        const weighted = def.reference.some((spec) =>
          footprint(spec.type, spec.rot ?? 0).some(
            (c) => spec.x + c.x === p.x && spec.y + c.y === p.y - 1
          )
        )
        if (!weighted) {
          fail('reference never puts a brick on the plate at ' + p.x + ',' + p.y)
        } else {
          console.log('     ✓ reference rests a brick on the plate (the paperweight move)')
        }
      }
    }
  }

  const invTotal = Object.values(def.inventory).reduce((a, b) => a + b, 0)
  const pickupTotal = (def.collectibles ?? [])
    .filter((c) => c.kind === 'brick')
    .reduce((a, c) => a + c.count, 0)
  console.log('       bricks: ' + invTotal + ' starting + ' + pickupTotal + ' findable')
}

console.log('─'.repeat(64))
if (failures === 0) {
  console.log('ALL LEVEL CHECKS PASSED')
} else {
  console.log(failures + ' PROBLEM(S) FOUND')
}
process.exit(failures === 0 ? 0 : 1)
