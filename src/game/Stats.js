/**
 * Stats.js — HP / HAPPINESS / XP.
 *
 * These are story meters, not combat mechanics. Nothing in the game reduces
 * HP; levels *award* it. The meters exist so that finishing a level feels
 * like a console game handing you a number, and so the ending can say
 * "FRIENDSHIP LEVEL: MAX" and have it mean something on screen.
 *
 * Each stat keeps a `value` (the truth) and a `shown` (what the bar is
 * currently drawn at). `shown` eases toward `value` so an award animates as
 * a bar filling rather than a number teleporting.
 */

const MAX = 100

export class Stats {
  constructor({ hp = 60, happiness = 50, xp = 0 } = {}) {
    this.hp = hp
    this.happiness = happiness
    this.xp = xp
    // display values, chased in update()
    this.hpShown = hp
    this.happinessShown = happiness
    this.xpShown = xp
    /** transient "+30 HP" floaters, drained by the UI */
    this.floats = []
  }

  /**
   * Award (or, in principle, remove) stat points. Returns the floaters so a
   * caller can mirror them into a toast if it wants.
   */
  award({ hp = 0, happiness = 0, xp = 0, label = null } = {}) {
    const made = []
    if (hp) {
      this.hp = clamp(this.hp + hp)
      made.push(this._float(hp, 'HP', 'hp'))
    }
    if (happiness) {
      this.happiness = clamp(this.happiness + happiness)
      made.push(this._float(happiness, 'HAPPINESS', 'happiness'))
    }
    if (xp) {
      this.xp = Math.max(0, this.xp + xp)
      made.push(this._float(xp, 'XP', 'xp'))
    }
    if (label) {
      made.push({
        id: Math.random().toString(36).slice(2),
        text: label,
        kind: 'label',
        born: Date.now(),
      })
      this.floats.push(made[made.length - 1])
    }
    return made
  }

  _float(amount, unit, kind) {
    const f = {
      id: Math.random().toString(36).slice(2),
      text: (amount > 0 ? '+' : '') + amount + ' ' + unit,
      kind,
      born: Date.now(),
    }
    this.floats.push(f)
    return f
  }

  /** Drop floaters older than their lifetime. Called from the game loop. */
  update(dt) {
    const k = 1 - Math.pow(0.02, dt) // smooth, framerate-independent chase
    this.hpShown += (this.hp - this.hpShown) * k
    this.happinessShown += (this.happiness - this.happinessShown) * k
    this.xpShown += (this.xp - this.xpShown) * k
    if (Math.abs(this.hp - this.hpShown) < 0.2) this.hpShown = this.hp
    if (Math.abs(this.happiness - this.happinessShown) < 0.2) this.happinessShown = this.happiness
    if (Math.abs(this.xp - this.xpShown) < 0.5) this.xpShown = this.xp

    if (this.floats.length) {
      const now = Date.now()
      this.floats = this.floats.filter((f) => now - f.born < 2200)
    }
  }

  /** True while a bar is still visibly animating — used to hold a beat open. */
  get settling() {
    return (
      this.hpShown !== this.hp ||
      this.happinessShown !== this.happiness ||
      this.xpShown !== this.xp
    )
  }

  snapshot() {
    return {
      hp: this.hp,
      happiness: this.happiness,
      xp: this.xp,
      hpShown: this.hpShown,
      happinessShown: this.happinessShown,
      xpShown: this.xpShown,
      max: MAX,
      floats: this.floats.map((f) => ({ ...f })),
    }
  }
}

function clamp(v) {
  return Math.max(0, Math.min(MAX, v))
}

export { MAX as STAT_MAX }
