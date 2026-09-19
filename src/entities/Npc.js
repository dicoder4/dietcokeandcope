/**
 * Npc.js — the friends.
 *
 * An NPC has no AI. It stands where it is told, walks where it is told, and
 * animates. Every decision about what it does belongs to the Director, which
 * keeps story logic in one readable script instead of scattered across
 * entity behaviour.
 *
 * Coordinates match Player: x is continuous, y is the FEET row.
 */

const NPC_WALK_SPEED = 4.6 // cells/sec — a touch slower than the player

export class Npc {
  constructor({ id, x, y, facing = -1, hidden = false, label = null }) {
    this.id = id
    this.x = x
    this.y = y
    this.spawnX = x
    this.spawnY = y
    this.facing = facing
    this.hidden = hidden
    this.label = label

    this.walking = false
    this.animT = Math.random() * 10 // desync idle bobs between characters
    this.talking = false
    this.reaction = null
    this.squash = 0
    this.targetX = null
    this.onArrive = null
  }

  reset() {
    this.x = this.spawnX
    this.y = this.spawnY
    this.walking = false
    this.talking = false
    this.reaction = null
    this.targetX = null
    this.onArrive = null
  }

  /** Send the NPC walking to a column. `cb` fires once on arrival. */
  walkTo(x, cb = null) {
    this.targetX = x
    this.onArrive = cb
    this.hidden = false
  }

  stop() {
    this.targetX = null
    this.walking = false
  }

  update(dt, world) {
    this.animT += dt

    if (this.targetX !== null) {
      const dx = this.targetX - this.x
      const dist = Math.abs(dx)
      if (dist < 0.06) {
        this.x = this.targetX
        this.targetX = null
        this.walking = false
        const cb = this.onArrive
        this.onArrive = null
        cb?.()
      } else {
        const dir = Math.sign(dx)
        this.facing = dir
        this.x += dir * Math.min(NPC_WALK_SPEED * dt, dist)
        this.walking = true
        // follow the ground: step down onto whatever floor is under us, so an
        // NPC walking a sloped campus path doesn't hover or sink
        this.settle(world)
      }
    } else {
      this.walking = false
    }

    if (this.squash > 0) this.squash = Math.max(0, this.squash - dt * 3.5)
  }

  /** Snap to the nearest floor below, within a couple of cells. */
  settle(world) {
    const grid = world?.grid
    if (!grid) return
    const col = Math.floor(this.x + 0.5)
    let y = Math.floor(this.y)
    // already standing on something? done.
    if (grid.isSolid(col, y + 1)) return
    for (let i = 1; i <= 3; i++) {
      if (grid.isSolid(col, y + i + 1)) {
        this.y = y + i
        return
      }
    }
    // step up one if we walked into a curb
    if (grid.isSolid(col, y)) this.y = y - 1
  }

  get cellX() {
    return Math.floor(this.x + 0.5)
  }

  /** True when the player is standing close enough to talk. */
  nearPlayer(player, range = 3) {
    return Math.abs(player.x - this.x) <= range && Math.abs(player.y - this.y) <= 2
  }

  pose() {
    return {
      walking: this.walking,
      animT: this.animT,
      facing: this.facing,
      squash: this.squash,
      talking: this.talking,
      reaction: this.reaction,
      accessory: this.accessory ?? null,
    }
  }
}
