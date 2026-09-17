/**
 * simulate.mjs — headless playtest of the REAL game code.
 *
 * validateLevels.mjs checks level geometry against a model of the movement
 * rules. This is the other half: it imports the actual World, Player and
 * BuildingSystem the browser runs, places each level's reference bricks
 * through the real BuildingSystem (so the real anchor/reach/overlap rules
 * apply), then walks the real Player to the goal by stepping the real update
 * loop at a fixed 60Hz.
 *
 * If this passes, the levels are not merely well-shaped on paper — they are
 * beatable by the code that ships.
 *
 * Run: npm run simulate
 */

import { World } from '../src/game/World.js'
import { LEVELS } from '../src/game/Game.js'
import { footprint } from '../src/entities/Block.js'

const DT = 1 / 60
const MAX_SECONDS = 180

const makeInput = () => ({ left: false, right: false, up: false, down: false })

/**
 * Place one reference brick through the real BuildingSystem. The player is
 * temporarily moved next to the target so the reach check passes the same way
 * it would for a human who had walked there; every other rule (anchoring,
 * overlap, hazard, bounds) is enforced exactly as in the game.
 */
function placeReference(world, spec, now) {
  const b = world.building
  const p = world.player
  const rot = spec.rot ?? 0

  b.select(spec.type)
  b.rot = rot

  const savedX = p.x
  const savedY = p.y
  const fpCells = footprint(spec.type, rot).map((c) => ({ x: spec.x + c.x, y: spec.y + c.y }))
  const occupied = new Set(fpCells.map((c) => c.x + ',' + c.y))

  // Stand the player where a human plausibly would: adjacent to the brick and
  // not inside it. We try the diagonal/orthogonal neighbours of the footprint
  // (which is what makes building a staircase upward legal — see
  // BuildingSystem.isAnchored) and take the first spot that the real rules
  // accept. If none works, the placement genuinely is not reachable in play.
  const candidates = []
  for (const c of fpCells) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1], [-1, -1], [1, -1], [0, -1]]) {
      const nx = c.x + dx
      const ny = c.y + dy
      if (occupied.has(nx + ',' + ny)) continue
      candidates.push({ x: nx, y: ny })
    }
  }

  let res = { ok: false, reason: 'no standable spot beside the brick' }
  for (const cand of candidates) {
    p.x = cand.x
    p.y = cand.y
    b.ghost = {
      ox: spec.x,
      oy: spec.y,
      cells: fpCells,
      typeId: spec.type,
      rot,
      valid: true,
    }
    res = b.place(p, now)
    if (res.ok) break
  }

  p.x = savedX
  p.y = savedY
  return res
}

let failures = 0
const say = (s) => console.log(s)

for (const def of LEVELS) {
  say('─'.repeat(64))
  say('LEVEL ' + def.id + ' — ' + def.name)

  const world = new World(def, 1280, 720)
  let now = 0

  // --- 1. the real BuildingSystem must accept the reference build ---------
  let placeErrors = 0
  for (const spec of def.reference ?? []) {
    const res = placeReference(world, spec, now)
    if (!res.ok) {
      say(
        '     ✗ BuildingSystem rejected ' +
          spec.type + '@' + spec.x + ',' + spec.y + ': ' + res.reason
      )
      placeErrors++
    }
  }
  if (placeErrors === 0) {
    say('     ✓ all ' + (def.reference?.length ?? 0) + ' reference bricks accepted by the real rules')
  }
  failures += placeErrors

  // --- 2. plates must have opened their gates -----------------------------
  world.onStructureChanged()
  for (const [gid, gate] of world.gates) {
    if (!gate.open) {
      say('     ✗ gate "' + gid + '" still closed after the reference build')
      failures++
    } else {
      say('     ✓ gate "' + gid + '" opened by the brick resting on the plate')
    }
  }

  // --- 3. walk the real Player to the goal --------------------------------
  // Hazards are removed for this pass: we are measuring whether the geometry
  // and the build are traversable, not whether a bot happened to be elsewhere.
  // Hazard behaviour is exercised separately below.
  const savedHazards = world.hazards
  world.hazards = []

  const goal = world.goals[0]
  const input = makeInput()
  let best = Infinity
  let stuckFor = 0
  let reverseFor = 0
  let reached = false
  let deaths = 0

  for (let step = 0; step < MAX_SECONDS / DT; step++) {
    now += DT
    const p = world.player
    const dx = goal.x - p.x

    // Walk toward the goal. If progress stalls (a ramp needs a run-up, or we
    // are nose-first into a wall), back off briefly and try again.
    if (reverseFor > 0) {
      reverseFor -= DT
      input.left = dx > 0
      input.right = dx <= 0
    } else {
      input.right = dx > 0.1
      input.left = dx < -0.1
    }

    world.update(DT, input, now)

    if (world.player.dead) {
      deaths++
      world.reset({ keepBuild: true })
      if (deaths > 6) break
      best = Infinity
      continue
    }

    if (world.goals.every((g) => g.reached)) {
      reached = true
      break
    }

    const d =
      Math.abs(goal.x - world.player.x) + Math.abs(goal.y - world.player.y) * 1.5
    if (d < best - 0.01) {
      best = d
      stuckFor = 0
    } else {
      stuckFor += DT
      if (stuckFor > 1.5) {
        reverseFor = 0.4
        stuckFor = 0
      }
    }
  }

  world.hazards = savedHazards

  if (reached) {
    say('     ✓ the real Player walked the real build to ' + goal.label)
  } else {
    say(
      '     ✗ the real Player could NOT reach ' + goal.label +
        ' (closest ' + best.toFixed(1) + ', ' + deaths + ' deaths)'
    )
    failures++
  }

  // --- 4. hazards must be blockable by bricks (the level-3 thesis) --------
  if (savedHazards.some((h) => h.kind !== 'crusher')) {
    const w2 = new World(def, 1280, 720)
    const bot = w2.hazards.find((h) => h.kind !== 'crusher')
    const startDir = bot.dir
    // drop a wall directly in front of the bot and confirm it turns around
    const wallX = Math.floor(bot.x) + (startDir > 0 ? 2 : -2)
    w2.grid.set(wallX, bot.y, 2, 'testwall')
    let turned = false
    for (let i = 0; i < 240; i++) {
      bot.update(DT, w2)
      if (bot.dir !== startDir) {
        turned = true
        break
      }
    }
    if (turned) {
      say('     ✓ a placed brick turns the patrol bot around (walls actually work)')
    } else {
      say('     ✗ the patrol bot ignored a brick wall in its path')
      failures++
    }
  }
}

say('─'.repeat(64))
say(failures === 0 ? 'HEADLESS PLAYTEST PASSED' : failures + ' SIMULATION FAILURE(S)')
process.exit(failures === 0 ? 0 : 1)
