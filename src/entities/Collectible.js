/**
 * Collectible.js — food, drink, and loose bricks lying around.
 *
 * Two flavours:
 *   - 'brick'  : picking it up adds to your inventory. This is how a level
 *                can reward exploration with more building capacity.
 *   - 'treat'  : shawarma / diet coke / malt / biryani. Optional or goal.
 */

export class Collectible {
  constructor({ x, y, kind, typeId = null, count = 1, emoji = '', label = '', optional = false, hidden = false }) {
    this.x = x
    this.y = y
    this.kind = kind // 'brick' | 'treat'
    this.typeId = typeId // for bricks: which BLOCK_TYPES id
    this.count = count
    this.emoji = emoji
    this.label = label
    this.optional = optional
    /**
     * Hidden items are not drawn and cannot be picked up. A level starts an
     * item hidden when the story has not produced it yet — the shawarma does
     * not exist on the counter until it has been built. The `reveal` beat
     * flips this.
     */
    this.hidden = hidden
    this.taken = false
    this.bob = Math.random() * Math.PI * 2
  }

  reset() {
    this.taken = false
  }

  update(dt) {
    this.bob += dt * 2.6
  }

  touches(player) {
    if (this.taken || this.hidden || player.dead) return false
    const px = player.cellX
    const fy = Math.floor(player.y)
    if (px !== this.x) return false
    return this.y === fy || this.y === fy - 1
  }
}

/** The level's actual objective marker. */
export class Goal {
  constructor({ x, y, emoji = '⭐', label = 'GOAL', requiresGates = [], hidden = false }) {
    this.x = x
    this.y = y
    this.emoji = emoji
    this.label = label
    this.requiresGates = requiresGates
    /** Same contract as Collectible.hidden — invisible and untouchable. */
    this.hidden = hidden
    this.reached = false
    this.bob = 0
  }

  reset() {
    this.reached = false
  }

  update(dt) {
    this.bob += dt * 2
  }

  touches(player) {
    if (this.hidden || player.dead) return false
    const px = player.cellX
    const fy = Math.floor(player.y)
    if (px !== this.x) return false
    return this.y === fy || this.y === fy - 1
  }
}
