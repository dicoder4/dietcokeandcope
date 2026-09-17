/**
 * Grid.js — the world's logical space.
 *
 * The world is a 2D side-on grid: x = column, y = row (y grows DOWNWARD,
 * so gravity pulls toward +y). It is rendered with a fake-isometric
 * projection (see Camera.js) so bricks look dimensional, but every rule
 * in the game is evaluated on these flat integer cells. That's the whole
 * trick: it LOOKS physical, it stays technically simple.
 */

export const TILE_W = 44 // on-screen width of one cell
export const TILE_H = 44 // on-screen height of one cell
export const DEPTH = 16 // faked isometric depth (top/side face thickness)

// Cell kinds
export const CELL = {
  EMPTY: 0,
  TERRAIN: 1, // level geometry, immovable
  BLOCK: 2, // player-placed brick
  HAZARD_ZONE: 3, // lava / spikes — kills on touch, cannot be built over
  PLATE: 4, // pressure plate, walkable, activates when weighted
  GATE: 5, // closed gate (solid). Opens -> becomes EMPTY
  CRATE: 6, // pushable object
}

// A pressure plate is part of the floor: you stand ON it, so it must be
// solid. It is simply a terrain cell that reports when something weighs on it.
export const SOLID_CELLS = new Set([
  CELL.TERRAIN,
  CELL.BLOCK,
  CELL.GATE,
  CELL.CRATE,
  CELL.PLATE,
])

export class Grid {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.cells = new Array(width * height).fill(CELL.EMPTY)
    // Parallel layer: which block instance owns a cell (for removal)
    this.owners = new Array(width * height).fill(null)
    // Cosmetic terrain variant per cell, for visual variety
    this.variant = new Array(width * height).fill(0)
  }

  idx(x, y) {
    return y * this.width + x
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return CELL.TERRAIN // outside the world is solid wall
    return this.cells[this.idx(x, y)]
  }

  set(x, y, kind, owner = null) {
    if (!this.inBounds(x, y)) return
    const i = this.idx(x, y)
    this.cells[i] = kind
    this.owners[i] = owner
  }

  getOwner(x, y) {
    if (!this.inBounds(x, y)) return null
    return this.owners[this.idx(x, y)]
  }

  isSolid(x, y) {
    if (y >= this.height) return false // below the world = the void, you fall
    return SOLID_CELLS.has(this.get(x, y))
  }

  isEmptyForBuild(x, y) {
    if (!this.inBounds(x, y)) return false
    return this.get(x, y) === CELL.EMPTY
  }

  isDeadly(x, y) {
    return this.get(x, y) === CELL.HAZARD_ZONE
  }

  /** Every cell currently occupied by a given block instance id. */
  cellsOwnedBy(id) {
    const out = []
    for (let i = 0; i < this.cells.length; i++) {
      if (this.owners[i] === id) {
        out.push({ x: i % this.width, y: Math.floor(i / this.width) })
      }
    }
    return out
  }
}
