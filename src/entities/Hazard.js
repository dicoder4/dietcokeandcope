/**
 * Hazard.js — the "build under pressure" ingredient.
 *
 * A patroller walks a horizontal track. It is deliberately dumb (rule 24:
 * no complex enemy AI). What makes it interesting is that PLAYER BRICKS
 * BLOCK IT: place a wall in its path and it turns around. So the hazard
 * is really just another construction problem wearing a face.
 */

import { CELL } from '../game/Grid.js'

export class Patroller {
  constructor({ x, y, minX, maxX, speed = 2.4, kind = 'roomba' }) {
    this.x = x
    this.y = y // feet row
    this.spawn = { x, y }
    this.minX = minX
    this.maxX = maxX
    this.speed = speed
    this.dir = 1
    this.kind = kind
    this.animT = 0
    this.bumpFlash = 0
  }

  reset() {
    this.x = this.spawn.x
    this.y = this.spawn.y
    this.dir = 1
    this.bumpFlash = 0
  }

  occupies(x, y) {
    return Math.floor(this.x + 0.5) === x && y === this.y
  }

  update(dt, world) {
    this.animT += dt
    if (this.bumpFlash > 0) this.bumpFlash = Math.max(0, this.bumpFlash - dt * 3)
    const grid = world.grid
    const nx = this.x + this.dir * this.speed * dt
    const aheadCell = Math.floor(nx + 0.5) + (this.dir > 0 ? 0 : 0)
    const nextCell = this.dir > 0 ? Math.ceil(nx) : Math.floor(nx)

    let turn = false
    if (nx < this.minX || nx > this.maxX) turn = true
    // A wall in front? Turn around. THIS is the mechanic.
    if (grid.isSolid(nextCell, this.y)) turn = true
    // No floor ahead? Don't walk off a cliff.
    if (!grid.isSolid(nextCell, this.y + 1)) turn = true

    if (turn) {
      this.dir *= -1
      this.bumpFlash = 1
    } else {
      this.x = nx
    }
    void aheadCell
  }

  touches(player) {
    if (player.dead) return false
    const px = player.cellX
    const pfy = Math.floor(player.y)
    const hx = Math.floor(this.x + 0.5)
    if (Math.abs(this.x - player.x) > 0.85) return false
    return px === hx && (this.y === pfy || this.y === pfy - 1)
  }
}

/**
 * A crusher: drops from the ceiling on a timer. Blocked by bricks below it,
 * so a roof you build is a real roof.
 */
export class Crusher {
  constructor({ x, y, low, period = 3.2 }) {
    this.x = x
    this.y = y
    this.top = y
    this.low = low
    this.period = period
    this.t = Math.random() * period
    this.spawn = { x, y }
    this.kind = 'crusher'
  }

  reset() {
    this.y = this.spawn.y
    this.t = 0
  }

  occupies(x, y) {
    return x === this.x && y === Math.round(this.y)
  }

  update(dt, world) {
    this.t = (this.t + dt) % this.period
    const phase = this.t / this.period
    // fast down, slow up
    let target
    if (phase < 0.25) target = this.top + (this.low - this.top) * (phase / 0.25)
    else if (phase < 0.5) target = this.low
    else target = this.low + (this.top - this.low) * ((phase - 0.5) / 0.5)

    // stop at the first solid cell below the head — your roof holds
    const grid = world.grid
    let y = this.top
    while (y < target) {
      if (grid.isSolid(this.x, Math.floor(y + 1))) break
      y += Math.min(0.25, target - y)
    }
    this.y = y
  }

  touches(player) {
    if (player.dead) return false
    const py = Math.floor(player.y)
    if (player.cellX !== this.x) return false
    const cy = Math.round(this.y)
    return cy === py || cy === py - 1
  }
}

/** A pressure plate. Weighted by the player OR by any brick resting on it. */
export class Plate {
  constructor({ x, y, targetGates = [], label = 'GATE' }) {
    this.x = x
    this.y = y
    this.targetGates = targetGates
    this.label = label
    this.pressed = false
    this.pressAnim = 0
    this.pressedBy = null
  }

  evaluate(world) {
    const grid = world.grid
    const above = grid.get(this.x, this.y - 1)
    let pressed = false
    let by = null
    if (above === CELL.BLOCK || above === CELL.CRATE) {
      pressed = true
      by = 'brick'
    }
    const p = world.player
    if (!p.dead && p.cellX === this.x && Math.floor(p.y) === this.y - 1) {
      pressed = true
      by = by || 'player'
    }
    this.pressed = pressed
    this.pressedBy = by
    return pressed
  }
}
