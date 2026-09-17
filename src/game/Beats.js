/**
 * Beats.js — the vocabulary a level script is written in.
 *
 * Each beat type is an object with up to three hooks:
 *   enter(dir, beat, game)          — run once when the beat starts
 *   update(dir, beat, game, dt)     — run each frame; return TRUE when done
 *   exit(dir, beat, game)           — run once when the beat finishes
 *
 * A beat with no `update` is instantaneous. `dir.state` is scratch space that
 * the Director clears between beats, and `dir.state.t` is seconds elapsed in
 * the current beat.
 *
 * Adding a new kind of story moment means adding an entry here, not editing
 * the engine. That is the whole point of the split.
 */

import { Camera } from './Camera.js'
import { sfx } from './Sound.js'

/** Resolve a beat's `focus` field to a projected world point. */
function resolveFocus(focus, game) {
  const w = game.world
  if (!focus || focus === 'player') {
    return Camera.project(w.player.x, w.player.y - 0.6)
  }
  if (typeof focus === 'string') {
    const npc = w.npcs.find((n) => n.id === focus)
    if (npc) return Camera.project(npc.x, npc.y - 0.6)
    return Camera.project(w.player.x, w.player.y - 0.6)
  }
  return Camera.project(focus.x, focus.y)
}

function findNpc(game, id) {
  return game.world.npcs.find((n) => n.id === id) ?? null
}

export const BEATS = {
  /**
   * boot — the BIRTHDAY.EXE opening. Lines appear one at a time on black.
   */
  boot: {
    enter(dir, beat) {
      dir.cinematic = {
        kind: 'boot',
        lines: beat.lines ?? [],
        shown: 0,
        blackout: true,
        letterbox: true,
      }
      dir.controlEnabled = false
    },
    update(dir, beat) {
      const per = beat.per ?? 0.85
      const n = Math.min(beat.lines.length, Math.floor(dir.state.t / per) + 1)
      if (n !== dir.cinematic.shown) {
        dir.cinematic = { ...dir.cinematic, shown: n }
        sfx.select()
        dir.game.dirty = true
      }
      return dir.state.t > per * beat.lines.length + (beat.hold ?? 0.9)
    },
    exit(dir) {
      dir.cinematic = { ...dir.cinematic, blackout: false, fadingIn: true }
    },
  },

  /**
   * eyesOpen — the blink-awake transition from black into the world.
   */
  eyesOpen: {
    enter(dir, beat) {
      dir.cinematic = { kind: 'eyesOpen', letterbox: true, progress: 0, dur: beat.dur ?? 2.2 }
      dir.controlEnabled = false
    },
    update(dir, beat) {
      const dur = beat.dur ?? 2.2
      const p = Math.min(1, dir.state.t / dur)
      dir.cinematic = { ...dir.cinematic, progress: p }
      dir.game.dirty = true
      return p >= 1
    },
    exit(dir) {
      // Letterbox stays up until an explicit `letterbox: {on:false}` beat
      // (or `control` turning input on) drops it — see the `control` and
      // `letterbox` handlers below.
      dir.cinematic = { kind: 'idle', letterbox: true }
    },
  },

  /** letterbox — show/hide the cinematic bars without touching anything else. */
  letterbox: {
    enter(dir, beat) {
      dir.cinematic = beat.on === false ? null : { kind: 'idle', letterbox: true }
    },
  },

  /**
   * camera — move/zoom the cinematic camera. `dur: 0` snaps.
   * focus: 'player' | npcId | { x, y }
   */
  camera: {
    enter(dir, beat, game) {
      const p = resolveFocus(beat.focus, game)
      game.world.camera.focusOn(p.x, p.y, beat.zoom ?? 1, beat.ease ?? 0.004)
      if ((beat.dur ?? 0) === 0) {
        game.world.camera.follow(0, 0, 0, true) // snap to the focus point
      }
    },
    update(dir, beat, game) {
      // Keep tracking a moving subject (e.g. the player) for the duration.
      if (beat.track) {
        const p = resolveFocus(beat.focus, game)
        game.world.camera.focusOn(p.x, p.y, beat.zoom ?? 1, beat.ease ?? 0.004)
      }
      return dir.state.t >= (beat.dur ?? 0)
    },
  },

  /** cameraRelease — hand the camera back to following the player. */
  cameraRelease: {
    enter(dir, beat, game) {
      game.world.camera.release(beat.zoom ?? 1)
    },
  },

  /** control — turn player input on or off. */
  control: {
    enter(dir, beat) {
      dir.controlEnabled = beat.on !== false
      if (beat.build !== undefined) dir.buildAllowed = beat.build
      // Handing control back is the natural "we're in gameplay now" signal —
      // drop a lingering letterbox unless the beat explicitly wants it kept
      // (e.g. a cinematic walk-and-talk where input is briefly on).
      if (dir.controlEnabled && beat.keepLetterbox !== true) dir.cinematic = null
    },
  },

  /** build — enable or disable the building system. */
  build: {
    enter(dir, beat) {
      dir.buildAllowed = beat.on !== false
    },
  },

  /**
   * say — one line of dialogue. Waits for the player to acknowledge unless
   * `auto` is set, in which case it holds for a duration and moves on.
   */
  say: {
    enter(dir, beat, game) {
      const who = beat.who ?? 'player'
      const speaker =
        who === 'player' ? game.world.player : findNpc(game, who) ?? game.world.player
      speaker.talking = true
      if (beat.reaction) speaker.reaction = beat.reaction
      dir.dialogue = {
        who,
        name: game.nameOf(who),
        text: beat.text,
        portraitId: game.faceIdOf(who),
        options: null,
        auto: !!beat.auto,
      }
      dir.controlEnabled = false
      sfx.select()
    },
    update(dir, beat) {
      if (beat.auto) return dir.state.t > (beat.dur ?? 2.4)
      // a minimum on-screen time stops a stray click from eating the line
      return dir.state.dialogueAcked && dir.state.t > 0.25
    },
    exit(dir, beat, game) {
      const who = beat.who ?? 'player'
      const speaker =
        who === 'player' ? game.world.player : findNpc(game, who) ?? game.world.player
      speaker.talking = false
      if (beat.clearReaction !== false) speaker.reaction = null
      dir.dialogue = null
    },
  },

  /**
   * choice — a branching dialogue prompt.
   *
   * Wrong answers are not failures: they play their reply and then re-ask,
   * because the jokes in the wrong answers are the point. Only the option
   * marked `correct` advances the script.
   */
  choice: {
    enter(dir, beat, game) {
      const who = beat.who ?? 'player'
      dir.dialogue = {
        who,
        name: game.nameOf(who),
        text: beat.text ?? null,
        portraitId: game.faceIdOf(who),
        options: beat.options.map((o) => o.text),
        reply: null,
      }
      dir.controlEnabled = false
      dir.state.phase = 'asking'
    },
    update(dir, beat, game) {
      const st = dir.state

      if (st.phase === 'asking') {
        if (st.chosen == null) return false
        const opt = beat.options[st.chosen]
        st.opt = opt
        st.chosen = null
        st.phase = 'replying'
        st.replyStart = st.t
        st.replyIndex = 0
        const speaker = beat.who && beat.who !== 'player' ? findNpc(game, beat.who) : null
        if (speaker) speaker.talking = true
        // the reply may be one string or a sequence
        st.replyLines = Array.isArray(opt.reply) ? opt.reply : [opt.reply]
        if (opt.andThen) st.replyLines = [...st.replyLines, opt.andThen]
        dir.dialogue = {
          ...dir.dialogue,
          options: null,
          text: st.replyLines[0],
          name: game.nameOf(beat.who ?? 'player'),
        }
        sfx.select()
        if (opt.correct) sfx.pickup()
        return false
      }

      if (st.phase === 'replying') {
        const per = beat.replyPer ?? 2.3
        const idx = Math.min(st.replyLines.length - 1, Math.floor((st.t - st.replyStart) / per))
        if (idx !== st.replyIndex) {
          st.replyIndex = idx
          dir.dialogue = { ...dir.dialogue, text: st.replyLines[idx] }
          game.dirty = true
        }
        const elapsed = st.t - st.replyStart
        if (elapsed < per * st.replyLines.length) return false

        if (st.opt.correct) return true // script moves on

        // Wrong answer: re-ask. The joke lands, nothing is lost.
        st.phase = 'asking'
        st.chosen = null
        dir.dialogue = {
          ...dir.dialogue,
          text: beat.text ?? null,
          options: beat.options.map((o) => o.text),
        }
        game.dirty = true
        return false
      }
      return false
    },
    exit(dir, beat, game) {
      if (beat.who && beat.who !== 'player') {
        const n = findNpc(game, beat.who)
        if (n) n.talking = false
      }
      dir.dialogue = null
    },
  },

  /** mission — the GTA-style objective card, and it sticks in the HUD. */
  mission: {
    enter(dir, beat, game) {
      dir.mission = { icon: beat.icon ?? '❗', title: beat.title, text: beat.text ?? '' }
      dir.banner = {
        lines: ['NEW MISSION', `${beat.icon ?? ''} ${beat.title}`.trim()],
        sub: beat.text ?? '',
        kind: 'mission',
        born: game.now,
      }
      if (beat.build !== undefined) dir.buildAllowed = beat.build
      if (beat.control !== undefined) dir.controlEnabled = beat.control
      if (dir.controlEnabled && beat.keepLetterbox !== true) dir.cinematic = null
      sfx.gate()
    },
    update(dir, beat) {
      return dir.state.t > (beat.dur ?? 2.6)
    },
    exit(dir) {
      dir.banner = null
    },
  },

  /** banner — a full-width title card. Pure flavour, no state change. */
  banner: {
    enter(dir, beat, game) {
      dir.banner = {
        lines: beat.lines ?? [],
        sub: beat.sub ?? '',
        kind: beat.kind ?? 'info',
        born: game.now,
      }
      if (beat.sound !== false) sfx.win()
    },
    update(dir, beat) {
      return dir.state.t > (beat.dur ?? 2.8)
    },
    exit(dir) {
      dir.banner = null
    },
  },

  /** wait — hold for a duration. */
  wait: {
    update(dir, beat) {
      return dir.state.t >= (beat.dur ?? 1)
    },
  },

  /**
   * waitFor — the interactive beats. Gameplay runs; the script resumes when
   * the condition is true. This is what turns a cutscene list into a game.
   */
  waitFor: {
    enter(dir, beat) {
      if (beat.control !== false) dir.controlEnabled = true
      if (beat.build !== undefined) dir.buildAllowed = beat.build
      if (dir.controlEnabled && beat.keepLetterbox !== true) dir.cinematic = null
    },
    update(dir, beat, game) {
      const w = game.world
      switch (beat.cond) {
        case 'playerReachedX': {
          const dx = w.player.x - beat.x
          return beat.dir === '<' ? dx <= 0 : dx >= 0
        }
        case 'playerNearNpc': {
          const n = findNpc(game, beat.id)
          return n ? n.nearPlayer(w.player, beat.range ?? 3) : true
        }
        case 'goalReached': {
          const g = beat.id ? w.goals.find((x) => x.label === beat.id) : w.goals[0]
          return g ? g.reached : w.goals.every((x) => x.reached)
        }
        case 'allGoalsReached':
          return w.goals.every((g) => g.reached || g.optional)
        case 'collected': {
          const c = w.collectibles.find((x) => x.label === beat.id)
          return c ? c.taken : true
        }
        case 'bricksPlaced':
          return w.building.placed.length >= (beat.count ?? 1)
        case 'statsSettled':
          return !game.stats.settling
        default:
          console.warn('[Beats] unknown waitFor condition:', beat.cond)
          return true
      }
    },
  },

  /** npcWalk — send a friend somewhere; optionally wait for arrival. */
  npcWalk: {
    enter(dir, beat, game) {
      const n = findNpc(game, beat.id)
      if (!n) return
      n.walkTo(beat.to, () => {
        dir.state.arrived = true
        game.dirty = true
      })
      if (beat.face !== undefined) dir.state.faceAfter = beat.face
    },
    update(dir, beat, game) {
      if (beat.wait === false) return true
      if (!dir.state.arrived) return false
      const n = findNpc(game, beat.id)
      if (n && dir.state.faceAfter !== undefined) n.facing = dir.state.faceAfter
      return true
    },
  },

  /** playerWalk — move the player under script control. */
  playerWalk: {
    enter(dir, beat, game) {
      dir.controlEnabled = false
      game.world.player.scriptedMove(beat.to, () => {
        dir.state.arrived = true
        game.dirty = true
      })
    },
    update(dir, beat) {
      if (beat.wait === false) return true
      // safety valve: never let a blocked walk wedge the script forever
      return dir.state.arrived || dir.state.t > (beat.timeout ?? 8)
    },
    exit(dir, beat, game) {
      game.world.player.cancelScriptedMove()
    },
  },

  /** npcShow / npcHide — pop a character in or out of the scene. */
  npcShow: {
    enter(dir, beat, game) {
      const n = findNpc(game, beat.id)
      if (!n) return
      n.hidden = false
      if (beat.x !== undefined) n.x = beat.x
      if (beat.y !== undefined) n.y = beat.y
      if (beat.facing !== undefined) n.facing = beat.facing
    },
  },
  npcHide: {
    enter(dir, beat, game) {
      const n = findNpc(game, beat.id)
      if (n) n.hidden = true
    },
  },

  /** react — set a character's expression (surprised / happy / eating). */
  react: {
    enter(dir, beat, game) {
      const who = beat.who ?? 'player'
      const target = who === 'player' ? game.world.player : findNpc(game, who)
      if (target) target.reaction = beat.reaction ?? null
      if (beat.shake) game.world.camera.kick(beat.shake)
    },
  },

  /** award — hand out HP / HAPPINESS / XP with a celebratory banner. */
  award: {
    enter(dir, beat, game) {
      game.stats.award({
        hp: beat.hp ?? 0,
        happiness: beat.happiness ?? 0,
        xp: beat.xp ?? 0,
      })
      if (beat.banner) {
        dir.banner = { lines: [beat.banner], sub: beat.sub ?? '', kind: 'good', born: game.now }
      }
      sfx.treat()
      game.world.camera.kick(0.2)
    },
    update(dir, beat, game) {
      return dir.state.t > (beat.dur ?? 2.4) && !game.stats.settling
    },
    exit(dir) {
      dir.banner = null
    },
  },

  /** particles — a burst of confetti at a cell. */
  particles: {
    enter(dir, beat, game) {
      game.world.spawnParticles(
        beat.x ?? game.world.player.x,
        beat.y ?? game.world.player.y,
        beat.color ?? '#ffd166',
        beat.count ?? 30,
        beat.spread ?? 2
      )
    },
  },

  /** complete — fire the level-complete flow. */
  complete: {
    enter(dir, beat, game) {
      game.completeLevel(beat)
    },
  },

  /** nextLocation — the "NEXT LOCATION… 🎧 MUSIC DISTRICT" teaser card. */
  nextLocation: {
    enter(dir, beat) {
      dir.cinematic = {
        kind: 'nextLocation',
        letterbox: true,
        title: 'NEXT LOCATION…',
        subtitle: `${beat.icon ?? ''} ${beat.title}`.trim(),
      }
      dir.controlEnabled = false
      sfx.fanfare()
    },
    update(dir, beat) {
      return dir.state.t > (beat.dur ?? 3.4)
    },
    exit(dir) {
      dir.cinematic = null
    },
  },
}
