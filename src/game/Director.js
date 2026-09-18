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
    this.foodBuilder = null // { categoryIndex, categories, selections, reaction, done, ... }
    this.skipCutscenes = false // headless simulation flag
    /**
     * Index of the last beat marked `checkpoint: true`. Dying rewinds the
     * script here (see rewindToCheckpoint). Without this, falling into the
     * gap mid-crossing would respawn the player back at the start of the
     * level while the story carried on without him — he would be rebuilding
     * the bridge under a "CROSS THE GAP" objective he had already passed.
     */
    this.checkpointIndex = -1
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
    this.foodBuilder = null
    this.checkpointIndex = -1
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
    if (this.beat.checkpoint) this.checkpointIndex = this.index
    handler.enter?.(this, this.beat, this.game)
    this.game.dirty = true
    // A beat with no update finishes the moment it starts.
    if (!handler.update) this.advance()
  }

  /**
   * Death rewinds the script to the last checkpoint so the story and the
   * player stay in sync. Re-entering that beat re-runs its `enter`, which
   * restores the mission card, the camera and the control/build flags that
   * belong to this stretch of the level.
   */
  rewindToCheckpoint() {
    if (this.checkpointIndex < 0 || this.done) return false
    // clear anything mid-flight from the beat that was interrupted
    this.dialogue = null
    this.banner = null
    this.foodBuilder = null
    this.index = this.checkpointIndex - 1 // advance() pre-increments
    this.advance()
    return true
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

  // ---- food-builder progression -----------------------------------------
  // Mirrors choose()/advanceDialogue() above: the UI reports a pick, the
  // `foodBuilder` beat's update() (in Beats.js) is what actually reacts to
  // it on the next tick. Kept as thin writes into `state` for the same
  // reason `choose` is — the beat owns the state machine, not the Director.

  /** Toggle (multi) or set (single) an option within the current category. */
  toggleFoodOption(optionIndex) {
    if (!this.foodBuilder) return
    this.state.foodPick = optionIndex
    this.game.dirty = true
  }

  /** Confirm the current category and move to the next one. */
  confirmFoodCategory() {
    if (!this.foodBuilder) return
    this.state.foodConfirm = true
    this.game.dirty = true
  }

  /** Skip an optional category without picking anything. */
  skipFoodCategory() {
    if (!this.foodBuilder) return
    this.state.foodSkip = true
    this.game.dirty = true
  }

  /** Called from the results screen's "EAT SHAWARMA" button. */
  finishFoodBuilder() {
    if (!this.foodBuilder) return
    this.state.foodDone = true
    this.game.dirty = true
  }

  snapshot() {
    return {
      dialogue: this.dialogue ? { ...this.dialogue } : null,
      cinematic: this.cinematic ? { ...this.cinematic } : null,
      mission: this.mission ? { ...this.mission } : null,
      banner: this.banner ? { ...this.banner } : null,
      foodBuilder: this.foodBuilder ? { ...this.foodBuilder } : null,
      controlEnabled: this.controlEnabled,
      buildAllowed: this.buildAllowed,
      storyDone: this.done,
    }
  }
}
