/**
 * DevTools.js — level skipping and script fast-forward, for development.
 *
 * NOT SHIPPED. This module is imported from exactly one place, behind a bare
 * `import.meta.env.DEV` check in App.jsx, which Vite substitutes with a
 * literal `false` in a production build. The import is therefore unreachable
 * and Rollup drops this whole file from the bundle.
 *
 * That module-level exclusion is the reason the logic lives here instead of
 * on the Game class. A runtime `if (DEV)` guard inside Game.js does not keep
 * anything out of the shipped JavaScript — the branches, the method bodies
 * and the keybind strings all still ride along. Moving them into a module
 * nobody imports in production is what actually removes them.
 *
 * Attached to the live Game instance by `attachDevTools(game)`.
 */

import { LEVELS } from './Game.js'

/**
 * Bolt the dev methods onto a Game instance and switch on its keybinds.
 * Idempotent — calling it twice is harmless.
 */
export function attachDevTools(game) {
  if (!game || game._devAttached) return game
  game._devAttached = true
  game.devEnabled = true

  /** Load a level directly, skipping everything before it. */
  game.devGotoLevel = (i) => {
    game.devPanelOpen = false
    game.setPaused(false)
    game.loadLevel(Math.max(0, Math.min(LEVELS.length - 1, i)))
  }

  /** Jump to the next level, wrapping back to the first at the end. */
  game.devSkipLevel = () => {
    game.devGotoLevel((game.levelIndex + 1) % LEVELS.length)
  }

  /**
   * Fast-forward the current level's script to its Nth mission beat — the
   * chapter markers a level is naturally divided into. Every beat in between
   * still runs its enter/exit, so the world arrives in the state that
   * section expects: NPCs moved, items revealed, accessories flipped.
   */
  game.devSkipToMission = (ordinal) => {
    game.devPanelOpen = false
    game.setPaused(false)
    let seen = -1
    game.director.devSkipUntil((beat) => {
      if (beat.t !== 'mission') return false
      seen++
      return seen >= ordinal
    })
    game.pushState()
  }

  /** The mission beats of the current level, for the panel's jump list. */
  game.devMissionList = () => {
    const def = LEVELS[game.levelIndex]
    return (def?.beats ?? [])
      .filter((b) => b.t === 'mission')
      .map((b, i) => ({ i, icon: b.icon ?? '❗', title: b.title }))
  }

  /**
   * Handle one input edge. Returns true if it was a dev key.
   * Game calls this first, before the dialogue and minigame branches
   * swallow unrecognised keys — mid-cutscene is exactly when you want to
   * skip — and again from tick() while the panel has the game paused.
   */
  game.handleDevEdge = (e) => {
    if (e === 'devPanel') {
      game.devPanelOpen = !game.devPanelOpen
      game.setPaused(game.devPanelOpen)
      return true
    }
    if (e === 'devSkipBeat') {
      game.director.devSkipBeat()
      game.pushState()
      return true
    }
    if (e === 'devSkipLevel') {
      game.devSkipLevel()
      return true
    }
    return false
  }

  game.pushState()
  return game
}
