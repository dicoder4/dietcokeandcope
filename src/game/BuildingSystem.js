/**
 * BuildingSystem.js — the game's primary verb.
 *
 * Owns: the inventory, the ghost preview, placement validity, removal,
 * and the (deliberately simple) structural rule that keeps builds from
 * floating in the void.
 *
 * STRUCTURAL RULE — a brick is placeable only if it is "anchored":
 *   at least one of its cells is orthogonally adjacent to something
 *   solid (terrain or an existing block), or it is right beside the
 *   player. This is what makes building feel physical without
 *   simulating a single newton of force.
 */

import { CELL } from './Grid.js'
import { BLOCK_TYPES, footprint, footprintSize, newBlockId } from '../entities/Block.js'

export const PLACE_REACH = 7.5 // cells, from player centre

export class BuildingSystem {
  constructor(world) {
    this.world = world
    this.inventory = {} // typeId -> count remaining
    this.placed = [] // { id, typeId, rot, ox, oy, cells, bornAt }
    this.selected = null
    this.rot = 0
    this.ghost = null // { ox, oy, valid, reason, cells }
    this.lastPlaceAt = -999
    this.lastRemoveAt = -999
  }

  loadInventory(inv) {
    this.inventory = { ...inv }
    this.placed = []
    const order = Object.keys(inv).filter((k) => inv[k] > 0)
    this.selected = order[0] ?? null
    this.rot = 0
    this.ghost = null
  }

  hasPlacedOfType(t) {
    return this.placed.some((p) => p.typeId === t)
  }

  countRemaining(typeId) {
    return this.inventory[typeId] ?? 0
  }

  totalRemaining() {
    return Object.values(this.inventory).reduce((a, b) => a + b, 0)
  }

  select(typeId) {
    if (this.inventory[typeId] === undefined) return
    this.selected = typeId
    this.rot = 0
  }

  cycleSelect(dir = 1) {
    const keys = Object.keys(this.inventory)
    if (!keys.length) return
    let i = keys.indexOf(this.selected)
    if (i < 0) i = 0
    i = (i + dir + keys.length) % keys.length
    this.selected = keys[i]
    this.rot = 0
  }

  rotate() {
    const t = BLOCK_TYPES[this.selected]
    if (!t) return false
    if (t.w === t.h) return false // square: rotation is a no-op, don't lie to the player
    this.rot = (this.rot + 1) % 2
    return true
  }

  /**
   * Compute the ghost preview for a hovered fractional cell.
   * The brick is centred on the cursor so placement feels direct.
   */
  updateGhost(cx, cy, player) {
    if (this.selected == null || this.countRemaining(this.selected) <= 0) {
      this.ghost = null
      return
    }
    const size = footprintSize(this.selected, this.rot)
    const ox = Math.round(cx - size.w / 2)
    const oy = Math.round(cy - size.h / 2)
    const cells = footprint(this.selected, this.rot).map((c) => ({ x: ox + c.x, y: oy + c.y }))
    const check = this.validate(cells, player)
    this.ghost = {
      ox,
      oy,
      cells,
      valid: check.ok,
      reason: check.reason,
      typeId: this.selected,
      rot: this.rot,
    }
  }

  clearGhost() {
    this.ghost = null
  }

  validate(cells, player) {
    const g = this.world.grid
    for (const c of cells) {
      if (!g.inBounds(c.x, c.y)) return { ok: false, reason: 'Outside the build area' }
      const k = g.get(c.x, c.y)
      if (k === CELL.HAZARD_ZONE) return { ok: false, reason: 'Cannot build into hazard' }
      if (k !== CELL.EMPTY) return { ok: false, reason: 'Space is occupied' }
    }
    // Do not entomb the player or an entity
    for (const c of cells) {
      if (player && player.occupies(c.x, c.y)) return { ok: false, reason: "That's where you're standing" }
      for (const h of this.world.hazards) {
        if (h.occupies && h.occupies(c.x, c.y)) return { ok: false, reason: 'Something is in the way' }
      }
    }
    // Reach check
    if (player) {
      let near = false
      for (const c of cells) {
        const d = Math.hypot(c.x + 0.5 - (player.x + 0.5), c.y + 0.5 - (player.y + 0.5))
        if (d <= PLACE_REACH) {
          near = true
          break
        }
      }
      if (!near) return { ok: false, reason: 'Too far away — walk closer' }
    }
    // Anchor check
    if (!this.isAnchored(cells, player)) {
      return { ok: false, reason: 'Needs support — build off the ground or another brick' }
    }
    return { ok: true }
  }

  isAnchored(cells, player) {
    const g = this.world.grid
    const own = new Set(cells.map((c) => c.x + ',' + c.y))
    for (const c of cells) {
      const nb = [
        [c.x + 1, c.y],
        [c.x - 1, c.y],
        [c.x, c.y + 1],
        [c.x, c.y - 1],
      ]
      for (const [nx, ny] of nb) {
        if (own.has(nx + ',' + ny)) continue
        if (ny >= g.height) continue
        if (!g.inBounds(nx, ny)) return true // the world's wall counts as anchor
        if (g.isSolid(nx, ny)) return true
        if (g.get(nx, ny) === CELL.PLATE) return true
      }
      // Standing next to the player counts — this is how stairs get built
      // upward from where you are.
      if (player) {
        const dx = Math.abs(c.x - player.x)
        const dy = Math.abs(c.y - player.y)
        if (dx <= 1 && dy <= 1) return true
      }
    }
    return false
  }

  /** Attempt to place the ghost. Returns a result object for feedback. */
  place(player, now) {
    if (!this.ghost) return { ok: false, reason: 'Nothing selected' }
    if (this.countRemaining(this.ghost.typeId) <= 0) {
      return { ok: false, reason: 'Out of that brick', outOfStock: true }
    }
    const check = this.validate(this.ghost.cells, player)
    if (!check.ok) return { ok: false, reason: check.reason }

    const id = newBlockId()
    const cells = this.ghost.cells.map((c) => ({ ...c }))
    for (const c of cells) this.world.grid.set(c.x, c.y, CELL.BLOCK, id)
    this.placed.push({
      id,
      typeId: this.ghost.typeId,
      rot: this.ghost.rot,
      ox: this.ghost.ox,
      oy: this.ghost.oy,
      cells,
      bornAt: now,
    })
    this.inventory[this.ghost.typeId]--
    this.lastPlaceAt = now
    this.world.onStructureChanged()
    return { ok: true, id, typeId: this.ghost.typeId, cells }
  }

  /** Remove the player-placed block occupying a cell; refund it. */
  removeAt(cx, cy, now) {
    const x = Math.floor(cx)
    const y = Math.floor(cy)
    const g = this.world.grid
    if (g.get(x, y) !== CELL.BLOCK) return { ok: false, reason: 'No brick there' }
    const id = g.getOwner(x, y)
    const i = this.placed.findIndex((p) => p.id === id)
    if (i < 0) return { ok: false, reason: 'That brick is part of the level' }
    const blk = this.placed[i]

    // We happily let you pull the floor out from under yourself.
    // Failure is fun; gravity will editorialize.
    for (const c of blk.cells) {
      if (g.get(c.x, c.y) === CELL.BLOCK && g.getOwner(c.x, c.y) === id) {
        g.set(c.x, c.y, CELL.EMPTY, null)
      }
    }
    this.placed.splice(i, 1)
    this.inventory[blk.typeId] = (this.inventory[blk.typeId] ?? 0) + 1
    this.lastRemoveAt = now
    this.world.onStructureChanged()
    return { ok: true, block: blk }
  }

  /** Wipe every player brick and refund all of it. */
  clearAll(now) {
    const copies = [...this.placed]
    for (const b of copies) {
      for (const c of b.cells) {
        if (this.world.grid.getOwner(c.x, c.y) === b.id) {
          this.world.grid.set(c.x, c.y, CELL.EMPTY, null)
        }
      }
      this.inventory[b.typeId] = (this.inventory[b.typeId] ?? 0) + 1
    }
    this.placed = []
    this.lastRemoveAt = now
    this.world.onStructureChanged()
    return copies.length
  }
}
