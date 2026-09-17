/**
 * Director.js — the story runner.
 *
 * A level is a list of BEATS: an ordered script of things that happen.
 * The Director walks that list, one beat at a time. Each beat either
 * completes instantly (show a mission card), after a duration (a camera
 * move), or when a condition is met (the player crosses the bridge).
 *
 * Why this exists: without it, story state becomes a pile of booleans
 * smeared through Game.tick() — `hasMetFriend`, `didSeeGap`, `bridgeShown` —
 * and every new level makes that worse. Here, a level reads top to bottom
 * like a screenplay, and the engine underneath never learns about the story
 * at all.
 *
 * Input gating: some beats take the controls away (dialogue, cinematics).
 * `blocksInput` tells Game whether the keyboard should reach the player this
 * frame. Building is gated separately via `buildAllowed`, because the LEGO
 * section is the only part of Level 1 where bricks make sense.
 *
 * See src/game/Beats.js for what each beat type does.
 */

import { BEATS } from './Beats.js'

export class Director {
  constructor(game) {
    this.game = game
    this.beats = []
    this.index = -1
    this.beat = null
    this.state = {} // per-beat scratch space, cleared on advance
    this.done = false

    // ---- things the rest of the game reads -----------------------------
    this.controlEnabled = false // can the keyboard move the player?
    this.buildAllowed = false // is the building system live?
    this.dialogue = null // { who, name, text, options, portraitId }
    this.cinematic = null // { letterbox, lines, title, subtitle, fade, kind }
    this.mission = null // { icon, title, text }
    this.banner = null // { lines, born }
    this.skipCutscenes = false // headless simulation flag
  }

  load(beats) {
    this.beats = beats ?? []
    this.index = -1
    this.beat = null
    this.state = {}
    this.done = false
    this.controlEnabled = false
    this.buildAllowed = false
    this.dialogue = null
    this.cinematic = null
    this.mission = null
    this.banner = null
    if (this.skipCutscenes) {
      // Headless mode: no story, just let the level be playable immediately.
      this.done = true
      this.controlEnabled = true
      this.buildAllowed = true
      return
    }
    this.advance()
  }

  get blocksInput() {
    return !this.controlEnabled
  }

  /** Move to the next beat and start it. */
  advance() {
    this.state = {}
    this.index++
    if (this.index >= this.beats.length) {
      this.beat = null
      this.done = true
      this.game.dirty = true
      return
    }
    this.beat = this.beats[this.index]
    const handler = BEATS[this.beat.t]
    if (!handler) {
      console.warn('[Director] unknown beat type:', this.beat.t)
      this.advance()
      return
    }
    handler.enter?.(this, this.beat, this.game)
    this.game.dirty = true
    // A beat with no update finishes the moment it starts.
    if (!handler.update) this.advance()
  }

  update(dt) {
    if (this.done || !this.beat) return
    const handler = BEATS[this.beat.t]
    if (!handler?.update) return
    this.state.t = (this.state.t ?? 0) + dt
    // A beat's update() routinely mutates visible state (dialogue text,
    // a banner) without going through advance() — mark the frame dirty
    // unconditionally so Game.tick() actually pushes it to React. This is
    // cheap: pushState() only runs once per frame regardless.
    this.game.dirty = true
    if (handler.update(this, this.beat, this.game, dt)) {
      handler.exit?.(this, this.beat, this.game)
      this.advance()
    }
  }

  // ---- player-driven progression --------------------------------------

  /** Called by the UI when a dialogue line is clicked/keyed through. */
  advanceDialogue() {
    if (!this.dialogue) return
    if (this.dialogue.options) return // a choice must be chosen, not skipped
    this.state.dialogueAcked = true
    this.game.dirty = true
  }

  /** Called by the UI when a dialogue option is picked. */
  choose(optionIndex) {
    if (!this.dialogue?.options) return
    this.state.chosen = optionIndex
    this.game.dirty = true
  }

  snapshot() {
    return {
      dialogue: this.dialogue ? { ...this.dialogue } : null,
      cinematic: this.cinematic ? { ...this.cinematic } : null,
      mission: this.mission ? { ...this.mission } : null,
      banner: this.banner ? { ...this.banner } : null,
      controlEnabled: this.controlEnabled,
      buildAllowed: this.buildAllowed,
      storyDone: this.done,
    }
  }
}
