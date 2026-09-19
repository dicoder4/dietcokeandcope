/**
 * Player.js — the builder.
 *
 * Design note, and it is THE design note: the player CANNOT JUMP.
 * They walk, and they can step up exactly one cell (a curb, a single
 * brick). Everything else — gaps, height, hazards — must be solved by
 * building. Remove the building system and this character can do
 * essentially nothing. That is intentional.
 *
 * x is continuous for smooth motion; y snaps to integers when grounded.
 * All collision is evaluated on integer cells, so it stays deterministic.
 */

import { CELL } from './Grid.js'

const WALK_SPEED = 5.4 // cells / second
const GRAVITY = 30 // cells / second^2
const MAX_FALL = 24 // cells / second
const FATAL_FALL_CELLS = 6.5 // fall further than this and you go splat
const SUBSTEP = 0.2 // cells per collision substep

export class Player {
  constructor(x, y) {
    this.spawnX = x
    this.spawnY = y
    this.w = 1
    this.h = 2 // feet at y, head at y-1
    this.reset()
  }

  reset() {
    this.x = this.spawnX
    this.y = this.spawnY
    this.vy = 0
    this.facing = 1
    this.onGround = false
    this.dead = false
    this.deathReason = null
    this.walking = false
    this.fallStartY = this.spawnY
    this.airborne = false
    this.animT = 0
    this.squash = 0
    // cutscene control: when set, the Director is driving, not the keyboard
    this.scriptedTargetX = null
    this.onScriptArrive = null
    this.talking = false
    this.reaction = null
  }

  /**
   * Walk to a column under script control. The Director uses this to move
   * the player during cutscenes (following a friend, stepping onto the
   * bridge) without faking key presses.
   */
  scriptedMove(targetX, cb = null) {
    this.scriptedTargetX = targetX
    this.onScriptArrive = cb
  }

  cancelScriptedMove() {
    this.scriptedTargetX = null
    this.onScriptArrive = null
  }

  pose() {
    return {
      walking: this.walking,
      animT: this.animT,
      facing: this.facing,
      squash: this.squash,
      talking: this.talking,
      reaction: this.reaction,
      // Level 2 hangs the pink earphones off the player from frame one —
      // see Characters.js drawEarphonesHanging.
      accessory: this.accessory ?? null,
    }
  }

  get cellX() {
    return Math.floor(this.x + 0.5)
  }

  bodyCells() {
    const cx = this.cellX
    const fy = Math.floor(this.y)
    const out = []
    for (let i = 0; i < this.h; i++) out.push({ x: cx, y: fy - i })
    return out
  }

  occupies(x, y) {
    if (x !== this.cellX) return false
    const fy = Math.floor(this.y)
    return y <= fy && y > fy - this.h
  }

  /** Would a body with feet at feetY, in column cellX, be inside something solid? */
  blocked(grid, cellX, feetY) {
    for (let i = 0; i < this.h; i++) {
      if (grid.isSolid(cellX, feetY - i)) return true
    }
    return false
  }

  update(dt, input, world, now) {
    if (this.dead) return
    const grid = world.grid
    this.animT += dt

    // ---- shove out of any brick that appeared inside us ---------------
    let guard = 0
    while (this.blocked(grid, this.cellX, Math.floor(this.y)) && guard++ < 4) {
      this.y -= 1
      this.vy = 0
    }

    // ---- horizontal ---------------------------------------------------
    let dir = 0
    if (this.scriptedTargetX !== null) {
      // a cutscene is walking us; keyboard input is ignored entirely
      const dx = this.scriptedTargetX - this.x
      if (Math.abs(dx) < 0.08) {
        this.x = this.scriptedTargetX
        this.scriptedTargetX = null
        const cb = this.onScriptArrive
        this.onScriptArrive = null
        cb?.()
      } else {
        dir = Math.sign(dx)
      }
    } else {
      if (input.left) dir -= 1
      if (input.right) dir += 1
    }
    if (dir !== 0) this.facing = dir
    this.walking = dir !== 0 && this.onGround

    if (dir !== 0) {
      const nx = this.x + dir * WALK_SPEED * dt
      const feetY = Math.floor(this.y)
      const targetCell = Math.floor(nx + 0.5)

      if (targetCell === this.cellX) {
        this.x = nx // still inside the same cell, always fine
      } else if (!this.blocked(grid, targetCell, feetY)) {
        this.x = nx
      } else if (
        this.onGround &&
        !this.blocked(grid, targetCell, feetY - 1) &&
        !grid.isSolid(this.cellX, feetY - this.h)
      ) {
        // step up exactly one cell — a single brick is climbable
        this.x = nx
        this.y = feetY - 1
        this.squash = 0.2
      }
      // otherwise: you walk into a wall and stop. Build a way up.
    }

    // ---- vertical -----------------------------------------------------
    const cellX = this.cellX
    const feetY = Math.floor(this.y)
    const supported = Number.isInteger(this.y) && grid.isSolid(cellX, feetY + 1)

    if (supported) {
      if (this.airborne) this.land(now, world)
      this.onGround = true
      this.vy = 0
    } else {
      this.onGround = false
      if (!this.airborne) {
        this.airborne = true
        this.fallStartY = this.y
      }
      this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt)

      let remaining = this.vy * dt
      while (remaining > 0.0001) {
        const step = Math.min(remaining, SUBSTEP)
        const ny = this.y + step
        const nextFeetCell = Math.floor(ny + 1e-6)
        if (nextFeetCell !== Math.floor(this.y) && grid.isSolid(cellX, nextFeetCell)) {
          // we would enter a solid cell with our feet -> rest on top of it
          this.y = nextFeetCell - 1
          this.land(now, world)
          break
        }
        this.y = ny
        remaining -= step
        // landed exactly on a surface?
        const fy = Math.floor(this.y + 1e-6)
        if (grid.isSolid(cellX, fy + 1) && this.y >= fy - 1e-6 && this.y <= fy + 1e-6) {
          this.y = fy
          this.land(now, world)
          break
        }
        if (this.y > grid.height + 3) break
      }
    }

    if (this.squash > 0) this.squash = Math.max(0, this.squash - dt * 3.5)

    // ---- death --------------------------------------------------------
    if (this.y > grid.height + 2) {
      this.kill('void')
      return
    }
    for (const c of this.bodyCells()) {
      if (grid.isDeadly(c.x, c.y)) {
        this.kill('hazard')
        return
      }
    }
  }

  land(now, world) {
    const dropped = this.y - this.fallStartY
    this.airborne = false
    this.onGround = true
    this.vy = 0
    this.y = Math.round(this.y)
    if (dropped > 1.2) {
      this.squash = Math.min(1, dropped / 6)
      if (world) world.camera.kick(Math.min(0.45, dropped / 16))
    }
    if (dropped > FATAL_FALL_CELLS) this.kill('fall')
  }

  kill(reason) {
    if (this.dead) return
    this.dead = true
    this.deathReason = reason
  }

  feetCell() {
    return { x: this.cellX, y: Math.floor(this.y) }
  }

  standingOnPlate(grid) {
    const f = this.feetCell()
    return grid.get(f.x, f.y + 1) === CELL.PLATE
  }
}
