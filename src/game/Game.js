/**
 * Game.js — the engine: owns the loop, the current World, and the bridge
 * between canvas-land and React-land.
 *
 * React never re-renders per frame. The loop runs on the canvas; whenever
 * something React needs to know changes (inventory, objective, toasts), we
 * push a plain snapshot object through onState. That keeps the game at 60fps
 * while the HUD stays declarative.
 */

import { World } from './World.js'
import { Input } from './Input.js'
import { render } from './Renderer.js'
import { Camera } from './Camera.js'
import { Director } from './Director.js'
import { Stats } from './Stats.js'
import { preloadFaces, characterOf } from './Characters.js'
import { BLOCK_TYPES } from '../entities/Block.js'
import { sfx, resumeAudio, stopAllAudio } from './Sound.js'
import gameConfig from '../config/gameConfig.js'
import {
  DEATH_QUIPS,
  SOLVE_QUIPS,
  OUT_OF_BLOCKS,
  INVALID_PLACE,
  LEGO_NAG,
  LEGO_CONFUSION,
  LEGO_WOBBLE,
  BRIDGE_FAIL_QUIPS,
  rand,
} from '../config/quips.js'

import level1 from '../levels/level1.js'
import level2 from '../levels/level2.js'

export const LEVELS = [level1, level2]

/**
 * The adventure is four worlds (MSRIT shawarma quest, metro headphones, gym
 * PC build, the bear kitchen), the first two of which are built so far.
 * `isFinal` below is deliberately NOT `levelIndex === LEVELS.length - 1` —
 * that would make Level 1 "final" (and route into the birthday-cake Ending
 * screen) just because it's the only one that exists yet. TOTAL_LEVELS is
 * the real target; bump it only when a level is actually finished, and it
 * stays in sync with LEVELS.length once all four are built.
 */
export const TOTAL_LEVELS = 4

const RESPAWN_DELAY = 0.85 // seconds — fast retry, per the "failure is fun" rule

/** Fed to the world while a cutscene owns the controls. */
const NEUTRAL_INPUT = { left: false, right: false, up: false, down: false }

export class Game {
  constructor(canvas, { onState, onLevelComplete, onAchievement }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onState = onState
    this.onLevelComplete = onLevelComplete
    this.onAchievement = onAchievement

    this.input = new Input()
    this.input.attach(canvas)

    this.levelIndex = 0
    this.world = null
    this.running = false
    this.paused = false
    this.buildMode = true
    this.now = 0
    this.lastT = 0
    this.deadFor = 0
    this.toasts = []
    /** run counters (bricks placed, deaths…) — distinct from story stats */
    this.counters = { placed: 0, removed: 0, deaths: 0, treats: 0, clears: 0 }
    /** HP / HAPPINESS / XP — the meters the story awards */
    this.stats = new Stats({ hp: 0, happiness: 0, xp: 0 })
    this.director = new Director(this)
    this.treatsFound = new Set()
    this.deathQuip = null
    this.rafId = null
    this.dirty = true
    this.devPanelOpen = false

    preloadFaces()

    this.resize()
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize)
  }

  destroy() {
    this.running = false
    stopAllAudio()
    if (this.rafId) cancelAnimationFrame(this.rafId)
    clearTimeout(this._bridgeFailBannerT)
    this.input.detach()
    window.removeEventListener('resize', this._onResize)
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = Math.floor(w * dpr)
    this.canvas.height = Math.floor(h * dpr)
    this.view = { w, h, dpr }
    if (this.world) this.world.camera.resize(w, h)
    this.dirty = true
  }

  loadLevel(i) {
    // Ambience and music are per-level and long-running; nothing else stops
    // them, so a level change has to.
    stopAllAudio()
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, i))
    const def = LEVELS[this.levelIndex]
    this.world = new World(def, this.view.w, this.view.h)
    this.deadFor = 0
    this.deathQuip = null
    this.buildMode = true
    this.toasts = []
    this._wobbleShown = false
    if (def.startStats) {
      this.stats = new Stats(def.startStats)
    }
    // The Director owns the opening from here: it decides when the player
    // gets the controls and when bricks become available.
    this.director.load(def.beats)
    if (!def.beats?.length) {
      // a level with no script behaves like the old puzzle levels
      this.director.controlEnabled = true
      this.director.buildAllowed = true
      this.toast(def.name, def.objective, 'objective')
    }
    this.pushState()
  }

  // ---- character helpers, used by Beats for dialogue attribution --------

  /** Display name for a speaker id ('player' or an NPC id). */
  nameOf(who) {
    if (who === 'player') return gameConfig.playerName
    return characterOf(who).name
  }

  /** Photo/appearance id for a speaker, for the dialogue portrait. */
  faceIdOf(who) {
    return who === 'player' ? gameConfig.playerId : who
  }

  /** Called by the `complete` beat. */
  completeLevel(beat = {}) {
    const def = LEVELS[this.levelIndex]
    this.onLevelComplete?.({
      levelIndex: this.levelIndex,
      title: beat.title ?? def.completeTitle,
      message: beat.message ?? def.completeMessage,
      rewards: beat.rewards ?? def.rewards ?? [],
      bricksUsed: this.world.building.placed.length,
      deaths: this.counters.deaths,
      stats: this.stats.snapshot(),
      isFinal: this.levelIndex === TOTAL_LEVELS - 1,
    })
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastT = performance.now()
    const loop = (t) => {
      if (!this.running) return
      const dt = Math.min(0.05, (t - this.lastT) / 1000)
      this.lastT = t
      this.now += dt
      this.tick(dt)
      this.draw()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  setPaused(p) {
    this.paused = p
    this.pushState()
  }

  toast(title, body, kind = 'info', ttl = 3.4) {
    this.toasts.push({ id: Math.random().toString(36).slice(2), title, body, kind, ttl, born: this.now })
    if (this.toasts.length > 4) this.toasts.shift()
    this.dirty = true
  }

  /**
   * Service dev keys while the game is paused, putting every other edge back
   * so the normal handler still sees it — otherwise draining here would eat
   * the Escape that unpauses. No-op unless DevTools has been attached, which
   * only happens in a dev build.
   */
  handleDevEdges() {
    if (!this.handleDevEdge) return
    const keep = []
    for (const e of this.input.drainEdges()) {
      if (!this.handleDevEdge(e)) keep.push(e)
    }
    if (keep.length) this.input.edges.unshift(...keep)
  }

  // ---------------------------------------------------------------- input
  handleEdges() {
    const b = this.world.building
    const d = this.director
    for (const e of this.input.drainEdges()) {
      // Dev tools go FIRST, before the dialogue and minigame branches below
      // swallow every key they don't recognise — mid-cutscene is exactly
      // when you want to skip. `handleDevEdge` only exists when DevTools.js
      // has been attached, which never happens in a production build.
      if (this.handleDevEdge?.(e)) continue

      // Dialogue owns the keyboard while it is open: Enter/Space steps a
      // line, 1-4 pick an option. Everything else is swallowed so the player
      // cannot place bricks mid-conversation.
      if (d.dialogue) {
        if (e === 'pause') {
          this.setPaused(!this.paused)
          continue
        }
        if (e === 'confirm' || e === 'place') {
          d.advanceDialogue()
          this.pushState()
          continue
        }
        const pick = /^slot(\d)$/.exec(e)
        if (pick && d.dialogue.options) {
          const i = Number(pick[1]) - 1
          if (i < d.dialogue.options.length) {
            d.choose(i)
            sfx.select()
            this.pushState()
          }
        }
        continue
      }

      // The song quiz owns the keyboard the same way: 1-4 answer the round,
      // Enter/Space replays the clip. Nothing else gets through.
      if (d.songQuiz) {
        if (e === 'pause') {
          this.setPaused(!this.paused)
          continue
        }
        if (e === 'confirm' || e === 'place') {
          d.replaySong()
          this.pushState()
          continue
        }
        const pick = /^slot(\d)$/.exec(e)
        if (pick) {
          const i = Number(pick[1]) - 1
          const round = d.songQuiz.rounds[d.songQuiz.roundIndex]
          if (round && i < round.choices.length) {
            d.pickSong(i)
            this.pushState()
          }
        }
        continue
      }

      // Building verbs are inert outside a build phase.
      const buildVerb =
        e === 'place' ||
        e === 'remove' ||
        e === 'removeAtCursor' ||
        e === 'clearAll' ||
        e === 'rotate' ||
        e === 'toggleBuild' ||
        e === 'nextBlock' ||
        e === 'prevBlock' ||
        /^slot\d$/.test(e)
      if (buildVerb && !d.buildAllowed) continue

      switch (e) {
        case 'pause':
          this.setPaused(!this.paused)
          break
        case 'toggleBuild':
          this.buildMode = !this.buildMode
          sfx.select()
          this.dirty = true
          break
        case 'rotate': {
          if (b.rotate()) {
            sfx.select()
            this.dirty = true
          } else {
            this.toast('Square brick', 'Rotating it would change nothing.', 'info', 1.6)
          }
          break
        }
        case 'place':
          resumeAudio()
          this.tryPlace()
          break
        case 'remove':
        case 'removeAtCursor':
          this.tryRemove()
          break
        case 'clearAll': {
          const n = b.clearAll(this.now)
          if (n > 0) {
            sfx.remove()
            this.counters.clears++
            // demolishing your own bridge repeatedly earns commentary
            const body =
              this.counters.clears >= 3
                ? rand(LEGO_NAG)
                : n + ' bricks back in the box. Character development.'
            this.toast('Build cleared', body, 'info')
          }
          break
        }
        case 'nextBlock':
          b.cycleSelect(1)
          sfx.select()
          break
        case 'prevBlock':
          b.cycleSelect(-1)
          sfx.select()
          break
        case 'hint':
          this.toast('Hint', LEVELS[this.levelIndex].hint, 'hint', 6)
          break
        default: {
          const m = /^slot(\d)$/.exec(e)
          if (m) {
            const keys = Object.keys(b.inventory)
            const k = keys[Number(m[1]) - 1]
            if (k) {
              b.select(k)
              sfx.select()
            }
          }
          break
        }
      }
    }
  }

  tryPlace() {
    const b = this.world.building
    const res = b.place(this.world.player, this.now)
    if (res.ok) {
      this.counters.placed++
      sfx.place()
      const t = BLOCK_TYPES[res.typeId]
      const c = res.cells[0]
      this.world.spawnParticles(c.x + 0.5, c.y + 0.5, t.colorTop, 8, 1)
      this.world.camera.kick(0.06)
      if (this.counters.placed === 1) this.onAchievement?.('FIRST BRICK', 'It begins.')
      if (this.counters.placed === 25) this.onAchievement?.('BRICKLAYER', '25 bricks placed.')
      if (res.typeId === 'special') this.onAchievement?.('GOLDEN TOUCH', 'You used the golden brick.')

      const def = LEVELS[this.levelIndex]
      // a brick landing well away from the gap gets heckled, not helped
      if (def.gapCenter != null && Math.abs(c.x - def.gapCenter) > 9) {
        this.toast('Anisha', rand(LEGO_CONFUSION), 'warn', 2.8)
      }
      // the first time the span looks like a real, if wobbly, bridge
      if (b.placed.length === 4 && !this._wobbleShown) {
        this._wobbleShown = true
        this.toast('Anisha', rand(LEGO_WOBBLE), 'info', 2.6)
      }
      // the bridge needs about five bricks. Twelve is a statement.
      if (b.placed.length === 12) {
        this.toast('Structural review', 'Bro is overengineering a bridge.', 'info', 3)
      }
    } else {
      sfx.invalid()
      if (res.outOfStock) this.toast('Out of bricks', rand(OUT_OF_BLOCKS), 'warn', 2.6)
      else this.toast("Can't build there", res.reason || rand(INVALID_PLACE), 'warn', 2.2)
    }
    this.pushState()
  }

  tryRemove() {
    const b = this.world.building
    const { cx, cy } = this.world.camera.unproject(this.input.mouseX, this.input.mouseY)
    const res = b.removeAt(cx, cy, this.now)
    if (res.ok) {
      this.counters.removed++
      sfx.remove()
      const t = BLOCK_TYPES[res.block.typeId]
      for (const c of res.block.cells) {
        this.world.spawnParticles(c.x + 0.5, c.y + 0.5, t.color, 4, 0.8)
      }
      if (this.counters.removed === 10) {
        this.onAchievement?.('ITERATIVE DESIGN', 'Ten bricks reclaimed. Build, test, rebuild.')
      }
    } else {
      sfx.invalid()
    }
    this.pushState()
  }

  // ---------------------------------------------------------------- tick
  tick(dt) {
    // The dev panel pauses the game, which stops handleEdges() below from
    // ever running — so its own keys have to be serviced before the pause
    // check, or the panel could be opened and never closed from the keyboard.
    if (this.paused && this.world) this.handleDevEdges()
    if (this.paused || !this.world) return
    const w = this.world
    const p = w.player
    const d = this.director

    this.handleEdges()

    // The story script advances here, and may take away the controls.
    d.update(dt)
    this.stats.update(dt)

    const canBuild = this.buildMode && d.buildAllowed && !d.dialogue

    // ghost preview follows the cursor
    if (canBuild && this.input.mouseInside && !p.dead) {
      const { cx, cy } = w.camera.unproject(this.input.mouseX, this.input.mouseY)
      w.building.updateGhost(cx, cy, p)
    } else {
      w.building.clearGhost()
    }

    // held left-mouse paints bricks, which makes long bridges pleasant
    if (canBuild && this.input.placeHeld && !p.dead && w.building.ghost?.valid) {
      if (this.now - w.building.lastPlaceAt > 0.12) this.tryPlace()
    }
    if (canBuild && this.input.removeHeld && this.now - w.building.lastRemoveAt > 0.12) {
      const { cx, cy } = w.camera.unproject(this.input.mouseX, this.input.mouseY)
      if (w.grid.getOwner(Math.floor(cx), Math.floor(cy))) this.tryRemove()
    }

    const wasDead = p.dead
    // While a cutscene holds the controls, feed the world a dead input so the
    // player stands still — except when the Director is scripting a walk.
    const worldInput = d.blocksInput ? NEUTRAL_INPUT : this.input
    w.update(dt, worldInput, this.now)

    // footstep ticks
    if (p.walking && !p.dead) {
      this._stepT = (this._stepT ?? 0) + dt
      if (this._stepT > 0.26) {
        this._stepT = 0
        sfx.step()
      }
    }

    if (!wasDead && p.dead) this.onDeath()

    // drain world events
    for (const ev of w.drainEvents()) this.handleEvent(ev)

    // respawn
    if (p.dead) {
      this.deadFor += dt
      if (this.deadFor > RESPAWN_DELAY) this.respawn()
    }

    // tick toasts
    if (this.toasts.length) {
      const before = this.toasts.length
      this.toasts = this.toasts.filter((t) => this.now - t.born < t.ttl)
      if (this.toasts.length !== before) this.dirty = true
    }

    if (this.dirty) this.pushState()
  }

  handleEvent(ev) {
    const w = this.world
    switch (ev.type) {
      case 'pickupBrick': {
        sfx.pickup()
        const t = BLOCK_TYPES[ev.typeId]
        this.toast('+' + ev.count + ' ' + t.label, 'More building capacity.', 'good', 2.4)
        this.dirty = true
        break
      }
      case 'pickupTreat': {
        sfx.treat()
        this.counters.treats++
        this.treatsFound.add(ev.label)
        this.toast(ev.emoji + '  ' + ev.label, ev.optional ? 'Optional snack secured.' : '', 'good', 3)
        if (ev.optional) this.onAchievement?.('SNACK HUNTER', 'You found a hidden treat.')
        this.dirty = true
        break
      }
      case 'goalReached': {
        sfx.win()
        this.toast(ev.emoji + '  ' + ev.label, rand(SOLVE_QUIPS), 'good', 4)
        break
      }
      case 'gateOpen':
        sfx.gate()
        this.toast('GATE OPEN', 'The plate is holding. Nice paperweight.', 'good', 2.6)
        break
      case 'gateClose':
        this.toast('GATE CLOSED', 'Whatever was on the plate is gone.', 'warn', 2.6)
        break
      case 'levelComplete': {
        const bricksUsed = w.building.placed.length
        if (bricksUsed <= 4) this.onAchievement?.('MINIMALIST', 'Solved it with four bricks or fewer.')
        if (this.counters.deaths === 0) this.onAchievement?.('FLAWLESS BUILD', 'No respawns this level.')
        // On a scripted level the story decides when the level is over — the
        // goal being reached is just another beat condition. Only an
        // unscripted level ends itself here.
        if (!LEVELS[this.levelIndex].beats?.length) this.completeLevel()
        break
      }
      default:
        break
    }
  }

  onDeath() {
    this.counters.deaths++
    const p = this.world.player
    sfx.die()
    this.world.camera.kick(0.5)
    this.world.spawnParticles(p.x + 0.5, p.y + 0.5, '#ff7a5c', 24, 1.4)

    const def = LEVELS[this.levelIndex]
    const inBridgePhase = p.deathReason === 'void' && def.gapCenter != null
    if (inBridgePhase) {
      // The brief's exact beat: a "BRIDGE FAILED" card, then Anisha roasts
      // the architecture. Set outside the beat system (death can happen
      // mid-any-beat), so it self-clears on a plain timer instead of
      // relying on a beat's own update() to tear it down.
      this.director.banner = { lines: ['BRIDGE FAILED'], sub: '', kind: 'bad', born: this.now }
      clearTimeout(this._bridgeFailBannerT)
      this._bridgeFailBannerT = setTimeout(() => {
        if (this.director.banner?.lines?.[0] === 'BRIDGE FAILED') {
          this.director.banner = null
          this.dirty = true
        }
      }, 2200)
      this.deathQuip = rand(BRIDGE_FAIL_QUIPS)
      this.toast('Anisha', this.deathQuip, 'bad', 2.6)
    } else {
      const bank = DEATH_QUIPS[p.deathReason] ?? DEATH_QUIPS.void
      this.deathQuip = rand(bank)
      this.toast('OOF', this.deathQuip, 'bad', 2.4)
    }
    if (this.counters.deaths === 5) {
      this.onAchievement?.('PERSISTENCE', 'Five respawns. The build goes on.')
    }
    this.dirty = true
  }

  /**
   * Respawn keeps the player's structure intact. Wiping someone's build on
   * death would punish exactly the experimentation the game is asking for.
   */
  respawn() {
    this.world.reset({ keepBuild: true })
    // The player is back at the level's spawn point, so the story has to go
    // back with him — otherwise he rebuilds the bridge while a "CROSS THE
    // GAP" objective from further ahead is still on screen.
    this.director.rewindToCheckpoint()
    this.deadFor = 0
    this.deathQuip = null
    this.dirty = true
  }

  restartLevel() {
    this.loadLevel(this.levelIndex)
  }

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.loadLevel(this.levelIndex + 1)
      return true
    }
    return false
  }

  // ---------------------------------------------------------------- state
  pushState() {
    this.dirty = false
    const w = this.world
    if (!w) return
    const b = w.building
    const def = LEVELS[this.levelIndex]
    this.onState?.({
      levelIndex: this.levelIndex,
      levelName: def.name,
      objective: def.objective,
      hint: def.hint,
      teaches: def.teaches,
      paused: this.paused,
      buildMode: this.buildMode,
      dead: w.player.dead,
      deathQuip: this.deathQuip,
      selected: b.selected,
      rot: b.rot,
      inventory: { ...b.inventory },
      placedCount: b.placed.length,
      totalRemaining: b.totalRemaining(),
      ghostValid: b.ghost?.valid ?? null,
      ghostReason: b.ghost?.reason ?? null,
      toasts: this.toasts.map((t) => ({ ...t })),
      counters: { ...this.counters },
      stats: this.stats.snapshot(),
      location: def.location ?? null,
      // dev-only. `devEnabled` is set by DevTools.attachDevTools, which is
      // never imported in a production build — so these stay false/empty and
      // the panel never renders there.
      dev: this.devEnabled === true,
      devPanelOpen: this.devPanelOpen === true,
      devBeatIndex: this.director.index,
      devBeatType: this.director.beat?.t ?? null,
      devMissions: this.devMissionList?.() ?? [],
      playerName: gameConfig.playerName,
      plates: w.plates.map((p) => ({ x: p.x, y: p.y, pressed: p.pressed, label: p.label })),
      goals: w.goals.map((g) => ({ label: g.label, emoji: g.emoji, reached: g.reached })),
      ...this.director.snapshot(),
    })
  }

  draw() {
    if (!this.world) return
    render(this.ctx, this.world, this.view, {
      now: this.now,
      buildMode: this.buildMode && this.director.buildAllowed && !this.paused,
    })
    void Camera
  }
}
