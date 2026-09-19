/**
 * World.js — assembles a level into live state and ticks it.
 *
 * A level is authored as ASCII art (see src/levels/*.js). That keeps level
 * design fast and readable, and makes it obvious at a glance whether a
 * puzzle is solvable.
 */

import { Grid, CELL } from './Grid.js'
import { Player } from './Player.js'
import { Camera } from './Camera.js'
import { BuildingSystem } from './BuildingSystem.js'
import { Patroller, Crusher, Plate } from '../entities/Hazard.js'
import { Collectible, Goal } from '../entities/Collectible.js'
import { Npc } from '../entities/Npc.js'

export const LEGEND = {
  '.': CELL.EMPTY,
  ' ': CELL.EMPTY,
  '#': CELL.TERRAIN,
  '=': CELL.TERRAIN, // visually a thin platform, mechanically terrain
  '^': CELL.HAZARD_ZONE,
  '_': CELL.PLATE,
  '|': CELL.GATE,
}

export class World {
  constructor(levelDef, viewW, viewH) {
    this.def = levelDef
    this.camera = new Camera(viewW, viewH)
    this.building = new BuildingSystem(this)
    this.events = [] // transient feedback events, drained by Game
    this.particles = []
    this.build(levelDef)
  }

  build(def) {
    const rows = def.map
    const h = rows.length
    const w = Math.max(...rows.map((r) => r.length))
    this.grid = new Grid(w, h)
    this.gates = new Map() // id -> { cells, open }
    this.plates = []
    this.hazards = []
    this.collectibles = []
    this.goals = []
    this.npcs = []
    this.props = def.props ?? [] // purely decorative scenery, see Renderer
    this.startCell = { x: 2, y: h - 2 }

    for (let y = 0; y < h; y++) {
      const row = rows[y].padEnd(w, ' ')
      for (let x = 0; x < w; x++) {
        const ch = row[x]
        if (ch === 'P') {
          this.startCell = { x, y }
          continue
        }
        const kind = LEGEND[ch]
        if (kind !== undefined) {
          this.grid.set(x, y, kind)
          this.grid.variant[this.grid.idx(x, y)] = (x * 7 + y * 13) % 4
          if (ch === '=') this.grid.variant[this.grid.idx(x, y)] = 99 // thin-plate look
        }
      }
    }

    // gates declared separately so several cells can share one id
    for (const g of def.gates ?? []) {
      const cells = []
      for (let y = g.y; y < g.y + (g.h ?? 1); y++) {
        for (let x = g.x; x < g.x + (g.w ?? 1); x++) {
          this.grid.set(x, y, CELL.GATE)
          cells.push({ x, y })
        }
      }
      this.gates.set(g.id, { id: g.id, cells, open: false, anim: 0 })
    }

    for (const p of def.plates ?? []) {
      this.grid.set(p.x, p.y, CELL.PLATE)
      this.plates.push(new Plate(p))
    }
    for (const hz of def.hazards ?? []) {
      if (hz.type === 'crusher') this.hazards.push(new Crusher(hz))
      else this.hazards.push(new Patroller(hz))
    }
    for (const c of def.collectibles ?? []) this.collectibles.push(new Collectible(c))
    for (const g of def.goals ?? []) this.goals.push(new Goal(g))
    for (const n of def.npcs ?? []) this.npcs.push(new Npc(n))

    this.player = new Player(this.startCell.x, this.startCell.y)
    // Worn from the first frame, not spawned mid-level. Level 2's whole joke
    // depends on the pink earphones being visibly on him the entire time he
    // is looking for them — see Characters.js.
    this.player.accessory = def.playerAccessory ?? null
    this.musicMode = false
    this.musicStart = 0
    // Level 3's equivalent flag: once the rig boots, the RGB comes up and
    // the monitors switch to the restored sitcom scenes. See Renderer.
    this.rigOnline = false
    this.rigStart = 0
    this.building.loadInventory(def.inventory ?? {})

    const wp = Camera.project(this.player.x, this.player.y)
    this.camera.follow(wp.x, wp.y, 0, true)
    this.time = 0
    this.deaths = 0
    this.complete = false
  }

  reset({ keepBuild = false } = {}) {
    const savedPlaced = keepBuild ? this.building.placed.map((p) => ({ ...p })) : null
    const savedInv = keepBuild ? { ...this.building.inventory } : null
    // A respawn must not rewind the story: NPCs stay where the script put
    // them, and collected items stay collected.
    const savedNpcs = this.npcs?.map((n) => ({ id: n.id, x: n.x, y: n.y, facing: n.facing, hidden: n.hidden }))
    const savedTaken = this.collectibles?.filter((c) => c.taken).map((c) => c.label)
    const savedGoals = this.goals?.filter((g) => g.reached).map((g) => g.label)
    // Story reveals survive a respawn too: once the shawarma has been built
    // and put on the counter, dying must not un-build it.
    const savedShown = this.collectibles?.filter((c) => !c.hidden).map((c) => c.label)
    const savedShownGoals = this.goals?.filter((g) => !g.hidden).map((g) => g.label)
    const wasComplete = this.complete
    // Once the earphones are in his ears, a death must not put them back on
    // his shirt — that would replay the punchline he has already had.
    const savedAccessory = this.player?.accessory
    const savedMusicMode = this.musicMode
    // Same reasoning for the rig: once it has booted, dying must not
    // un-build it and turn the room's lights back off.
    const savedRig = this.rigOnline

    this.build(this.def)
    // keep the completion latch, or restoring reached goals below would
    // re-fire levelComplete on every respawn
    this.complete = wasComplete ?? false
    if (savedAccessory !== undefined) this.player.accessory = savedAccessory
    this.musicMode = savedMusicMode ?? false
    this.rigOnline = savedRig ?? false

    if (savedNpcs) {
      for (const s of savedNpcs) {
        const n = this.npcs.find((x) => x.id === s.id)
        if (n) Object.assign(n, { x: s.x, y: s.y, facing: s.facing, hidden: s.hidden })
      }
    }
    if (savedTaken?.length) {
      for (const c of this.collectibles) if (savedTaken.includes(c.label)) c.taken = true
    }
    if (savedGoals?.length) {
      for (const g of this.goals) if (savedGoals.includes(g.label)) g.reached = true
    }
    if (savedShown?.length) {
      for (const c of this.collectibles) if (savedShown.includes(c.label)) c.hidden = false
    }
    if (savedShownGoals?.length) {
      for (const g of this.goals) if (savedShownGoals.includes(g.label)) g.hidden = false
    }

    if (keepBuild && savedPlaced) {
      // restore the structure so a death doesn't erase honest work
      this.building.inventory = savedInv
      this.building.placed = savedPlaced
      for (const b of savedPlaced) {
        for (const c of b.cells) {
          if (this.grid.get(c.x, c.y) === CELL.EMPTY) this.grid.set(c.x, c.y, CELL.BLOCK, b.id)
        }
      }
      this.onStructureChanged()
    }
  }

  /** Called whenever the player's structure changes — re-evaluates plates. */
  onStructureChanged() {
    this.evaluatePlates()
  }

  evaluatePlates() {
    const active = new Set()
    for (const plate of this.plates) {
      if (plate.evaluate(this)) {
        for (const gid of plate.targetGates) active.add(gid)
      }
    }
    for (const [gid, gate] of this.gates) {
      const shouldOpen = active.has(gid)
      if (shouldOpen !== gate.open) {
        gate.open = shouldOpen
        gate.anim = 1
        for (const c of gate.cells) {
          this.grid.set(c.x, c.y, shouldOpen ? CELL.EMPTY : CELL.GATE)
        }
        this.emit(shouldOpen ? 'gateOpen' : 'gateClose', { gid })
      }
    }
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data })
  }

  drainEvents() {
    const e = this.events
    this.events = []
    return e
  }

  spawnParticles(cx, cy, color, n = 10, spread = 1) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * spread,
        y: cy + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        life: 0.5 + Math.random() * 0.5,
        max: 1,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  update(dt, input, now) {
    this.time += dt
    const p = this.player

    p.update(dt, input, this, now)

    for (const h of this.hazards) h.update(dt, this)
    for (const c of this.collectibles) c.update(dt)
    for (const g of this.goals) g.update(dt)
    for (const n of this.npcs) n.update(dt, this)
    for (const [, gate] of this.gates) if (gate.anim > 0) gate.anim = Math.max(0, gate.anim - dt * 3)

    this.evaluatePlates()

    // hazard contact
    if (!p.dead) {
      for (const h of this.hazards) {
        if (h.touches(p)) {
          p.kill(h.kind === 'crusher' ? 'crush' : 'hazard')
          break
        }
      }
    }

    // pickups
    for (const c of this.collectibles) {
      if (!c.taken && c.touches(p)) {
        c.taken = true
        if (c.kind === 'brick') {
          this.building.inventory[c.typeId] = (this.building.inventory[c.typeId] ?? 0) + c.count
          if (!this.building.selected) this.building.selected = c.typeId
          this.emit('pickupBrick', { typeId: c.typeId, count: c.count, x: c.x, y: c.y })
        } else {
          this.emit('pickupTreat', { label: c.label, emoji: c.emoji, x: c.x, y: c.y, optional: c.optional })
        }
        this.spawnParticles(c.x + 0.5, c.y + 0.5, '#ffd166', 14, 1.2)
      }
    }

    // goal
    for (const g of this.goals) {
      if (!g.reached && g.touches(p)) {
        const gatesOk = g.requiresGates.every((gid) => this.gates.get(gid)?.open)
        if (gatesOk) {
          g.reached = true
          this.emit('goalReached', { label: g.label, emoji: g.emoji, x: g.x, y: g.y })
          this.spawnParticles(g.x + 0.5, g.y + 0.5, '#ffe066', 40, 2)
          this.camera.kick(0.3)
        }
      }
    }
    if (!this.complete && this.goals.length && this.goals.every((g) => g.reached || g.optional)) {
      this.complete = true
      this.emit('levelComplete', {})
    }

    // particles
    for (const pt of this.particles) {
      pt.life -= dt
      pt.vy += 9 * dt
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
    }
    this.particles = this.particles.filter((pt) => pt.life > 0)

    // camera
    const wp = Camera.project(p.x, p.y - 0.6)
    this.camera.follow(wp.x, wp.y, dt)
    this.camera.update(dt)
  }
}
