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
import {
  sfx,
  duck,
  unduck,
  metroAmbience,
  playClip,
  playSynthSong,
  startMusicMode,
} from './Sound.js'
import { MUSIC_XP_PER_ROUND } from '../config/songs.js'

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

/**
 * Turn the food-builder's selections into a joke score. Not a serious
 * simulation — every category lands 3-5 stars, "special" picks (fries,
 * Diet Coke, the correct-answer-shaped choices) nudge it up. The two flat
 * stats are randomized within a plausible range purely for the gag.
 */
function scoreShawarma(fb) {
  const stars = {}
  let specials = 0
  let totalPicks = 0
  for (const cat of fb.categories) {
    const ids = fb.selections[cat.key] ?? []
    totalPicks += ids.length
    const hasSpecial = cat.options.some((o) => ids.includes(o.id) && o.special)
    if (hasSpecial) specials++
    const base = ids.length === 0 ? 3 : 4
    stars[cat.key] = Math.min(5, base + (hasSpecial ? 1 : 0))
  }
  const overall = Math.round(
    Object.values(stars).reduce((a, b) => a + b, 0) / Object.keys(stars).length
  )
  return {
    stars,
    overall,
    messLevel: Math.min(99, 40 + totalPicks * 7 + Math.floor(Math.random() * 15)),
    sauceChaos: (fb.selections.sauce?.length ?? 0) >= 3 ? 'MAX' : 'MODERATE',
  }
}

/**
 * Start a quiz round's audio. Tries the real clip first; if the file is
 * absent or unplayable, falls back to the round's procedural melody so the
 * round still happens. The repo ships no audio files, so out of the box this
 * always takes the synth path — see public/songs/README.md.
 *
 * Returns a handle with .stop(), which is how the beat cuts the music before
 * the answer choices appear.
 */
function startRoundAudio(round) {
  if (!round) return null
  const seconds = round.seconds ?? 7
  duck(0.34, 0.25)

  if (!round.clip) return playSynthSong(round.synth, seconds)

  let fallback = null
  const clip = playClip(round.clip, {
    seconds,
    onMissing: () => {
      fallback = playSynthSong(round.synth, seconds)
    },
  })
  // One handle covering whichever source actually ended up playing.
  return {
    stop() {
      clip.stop()
      fallback?.stop()
    },
  }
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
   * eyesOpen — the very first thing the player sees: black, then a blink,
   * then the eyes open onto the world. No boot text, no menu — this beat
   * IS the start of the game.
   */
  eyesOpen: {
    enter(dir, beat) {
      dir.cinematic = { kind: 'eyesOpen', letterbox: true, progress: 0, dur: beat.dur ?? 2.6 }
      dir.controlEnabled = false
    },
    update(dir, beat) {
      const dur = beat.dur ?? 2.6
      // hold a beat past progress=1 so "fully open" is unmistakably the
      // resting state, not a single frame passed through on the way to exit
      const holdFrom = dur
      const holdUntil = dur + (beat.hold ?? 0.5)
      const p = Math.min(1, dir.state.t / dur)
      if (dir.cinematic.progress !== p) {
        dir.cinematic = { ...dir.cinematic, progress: p }
        dir.game.dirty = true
      }
      return dir.state.t >= holdUntil && dir.state.t >= holdFrom
    },
    exit(dir) {
      // Eyes are open — drop the letterbox immediately, nothing lingers.
      dir.cinematic = null
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
  /**
   * reveal — bring a hidden collectible or goal into the world.
   *
   * Items the story has not produced yet start `hidden: true` in the level
   * definition, so they are neither drawn nor collectable. The shawarma
   * only exists on the counter once it has actually been built; the Diet
   * Coke only once it has been ordered. `labels` takes one or more item
   * labels (matching `label` on the collectible/goal).
   */
  reveal: {
    enter(dir, beat, game) {
      const labels = Array.isArray(beat.labels) ? beat.labels : [beat.labels]
      const w = game.world
      for (const label of labels) {
        const c = w.collectibles.find((x) => x.label === label)
        if (c) {
          c.hidden = false
          w.spawnParticles(c.x + 0.5, c.y + 0.5, '#ffd166', 18, 1.4)
        }
        const g = w.goals.find((x) => x.label === label)
        if (g) {
          g.hidden = false
          w.spawnParticles(g.x + 0.5, g.y + 0.5, '#ffe066', 22, 1.6)
        }
      }
      sfx.pickup()
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

  /**
   * foodBuilder — the shawarma-construction minigame.
   *
   * `beat.categories` is a list of { key, title, subtitle, multi, max,
   * optional, warnAt, warnReply, options: [{ id, emoji, label, color,
   * reaction, special }] }. Single-select categories advance the moment an
   * option is picked; multi-select categories wait for "confirm" (or
   * "skip" if `optional`). After the last category, the beat holds on a
   * results screen (star ratings + joke stats) until the player hits
   * "EAT SHAWARMA" — see FoodBuilder.jsx for the UI this drives.
   *
   * All of this lives in dir.foodBuilder, snapshotted whole every frame
   * like dir.dialogue — it is the UI's only source of truth.
   */
  foodBuilder: {
    enter(dir, beat) {
      dir.controlEnabled = false
      dir.foodBuilder = {
        categories: beat.categories,
        categoryIndex: 0,
        selections: {}, // key -> array of option ids
        reaction: null, // last "Anisha said" line, shown under the cards
        results: null, // set once every category is done
      }
    },
    update(dir, beat, game) {
      const fb = dir.foodBuilder
      const st = dir.state

      if (fb.results) {
        // Holding on the results screen until the player eats.
        if (st.foodDone) return true
        return false
      }

      const cat = fb.categories[fb.categoryIndex]
      const picked = fb.selections[cat.key] ?? []

      if (st.foodPick != null) {
        const opt = cat.options[st.foodPick]
        st.foodPick = null
        if (opt) {
          if (cat.multi) {
            const already = picked.includes(opt.id)
            const next = already ? picked.filter((id) => id !== opt.id) : [...picked, opt.id]
            fb.selections = { ...fb.selections, [cat.key]: next }
            if (!already && cat.warnAt && next.length >= cat.warnAt) {
              fb.reaction = cat.warnReply ?? opt.reaction ?? null
            } else if (!already) {
              fb.reaction = opt.reaction ?? null
            }
            if (opt.special) sfx.pickup()
            else sfx.select()
          } else {
            // single-select: this choice IS the category's answer
            fb.selections = { ...fb.selections, [cat.key]: [opt.id] }
            fb.reaction = opt.reaction ?? null
            sfx.select()
            if (opt.special) sfx.pickup()
            st.advanceAfter = 0.55 // let the reaction line land before moving on
          }
          game.dirty = true
        }
      }

      if (st.foodSkip) {
        st.foodSkip = false
        fb.selections = { ...fb.selections, [cat.key]: [] }
        fb.reaction = null
        st.advanceAfter = 0.05
        game.dirty = true
      }

      if (st.foodConfirm) {
        st.foodConfirm = false
        if (cat.multi) st.advanceAfter = 0.05
      }

      if (st.advanceAfter != null) {
        st.advanceWaitFrom = st.advanceWaitFrom ?? st.t
        if (st.t - st.advanceWaitFrom >= st.advanceAfter) {
          st.advanceAfter = null
          st.advanceWaitFrom = null
          if (fb.categoryIndex + 1 < fb.categories.length) {
            fb.categoryIndex += 1
            fb.reaction = null
          } else {
            fb.results = scoreShawarma(fb)
            sfx.win()
          }
          dir.foodBuilder = { ...fb }
          game.dirty = true
        }
      }

      return false
    },
    exit(dir) {
      dir.foodBuilder = null
    },
  },

  /**
   * songQuiz — Level 2's minigame: GUESS THE SONG, three rounds.
   *
   * Structurally the twin of `foodBuilder` above: all state lives in
   * `dir.songQuiz`, snapshotted whole each frame, and the UI only reads it
   * and reports picks back through two thin Director methods.
   *
   * Each round is a small state machine:
   *
   *   playing   — a clip (or a synth melody) plays for `seconds`
   *   answering — audio STOPS, then the four choices appear. The song is
   *               never audible underneath them; that is the brief.
   *   result    — ✓/✗ plus Diya's reaction, then the next round
   *
   * Getting one wrong costs nothing but dignity. The rounds always advance —
   * this is a joke between friends, not an exam.
   */
  songQuiz: {
    enter(dir, beat, game) {
      dir.controlEnabled = false
      metroAmbience(false)
      dir.songQuiz = {
        rounds: beat.rounds,
        roundIndex: 0,
        phase: 'playing',
        picked: null,
        wasCorrect: null,
        score: 0,
        reaction: null,
      }
      dir.state.audio = startRoundAudio(beat.rounds[0])
      dir.state.phaseStart = 0
      void game
    },

    update(dir, beat, game) {
      const q = dir.songQuiz
      const st = dir.state
      const round = q.rounds[q.roundIndex]
      const elapsed = st.t - (st.phaseStart ?? 0)

      // let the player hear it again — the clip restarts, the timer with it
      if (st.songReplay) {
        st.songReplay = false
        if (q.phase === 'playing') {
          st.audio?.stop()
          st.audio = startRoundAudio(round)
          st.phaseStart = st.t
          game.dirty = true
        }
      }

      if (q.phase === 'playing') {
        if (elapsed < (round.seconds ?? 7)) return false
        // cut the music before the choices go up
        st.audio?.stop()
        st.audio = null
        q.phase = 'answering'
        q.picked = null
        st.phaseStart = st.t
        dir.songQuiz = { ...q }
        sfx.select()
        game.dirty = true
        return false
      }

      if (q.phase === 'answering') {
        if (st.songPick == null) return false
        const pick = round.choices[st.songPick]
        st.songPick = null
        if (!pick) return false

        const right = pick.id === round.correct
        q.picked = pick.id
        q.wasCorrect = right
        q.phase = 'result'
        st.phaseStart = st.t

        if (right) {
          q.score += 1
          q.reaction = round.onCorrect ?? 'Lessgoooo'
          game.stats.award({ xp: MUSIC_XP_PER_ROUND, label: '+MUSIC XP' })
          sfx.quizCorrect()
        } else {
          const w = round.onWrong ?? 'Bro…'
          q.reaction = Array.isArray(w) ? w.join('\n') : w
          sfx.quizWrong()
        }
        dir.songQuiz = { ...q }
        game.dirty = true
        return false
      }

      // result — hold on the verdict, then roll on regardless of the answer
      if (q.phase === 'result') {
        if (elapsed < (beat.resultHold ?? 2.6)) return false
        if (q.roundIndex + 1 >= q.rounds.length) return true
        q.roundIndex += 1
        q.phase = 'playing'
        q.picked = null
        q.wasCorrect = null
        q.reaction = null
        st.phaseStart = st.t
        st.audio = startRoundAudio(q.rounds[q.roundIndex])
        dir.songQuiz = { ...q }
        game.dirty = true
        return false
      }

      return false
    },

    exit(dir) {
      dir.state.audio?.stop()
      dir.state.audio = null
      dir.songQuiz = null
      unduck(0.4)
    },
  },

  /** metroAmbience — the train bed: rumble, rails, air-con. */
  metroAmbience: {
    enter(dir, beat) {
      metroAmbience(beat.on !== false)
      if (beat.chime) sfx.metroChime()
    },
  },

  /** sting — fire one named one-shot from the sfx table. */
  sting: {
    enter(dir, beat) {
      sfx[beat.kind]?.()
      if (beat.shake) dir.game.world.camera.kick(beat.shake)
    },
  },

  /**
   * earphones — move the pink earphones between hanging and worn.
   *
   * They are NOT a world item. They are drawn on the character from the
   * first frame of the level (see Characters.js), looped through his shirt,
   * which is the entire setup for the punchline. This beat only changes how
   * they are worn, never whether they exist.
   */
  earphones: {
    enter(dir, beat, game) {
      const who = beat.who ?? 'player'
      const target = who === 'player' ? game.world.player : findNpc(game, who)
      if (target) target.accessory = beat.state ?? 'earphonesWorn'
      if (beat.state === 'earphonesWorn') sfx.pickup()
      game.dirty = true
    },
  },

  /**
   * musicMode — the transformation. Everything the Renderer needs is behind
   * one world flag: warmer light, a visualiser, passengers moving to the
   * beat, a harder train sway. The music itself starts here.
   */
  musicMode: {
    enter(dir, beat, game) {
      const on = beat.on !== false
      game.world.musicMode = on
      game.world.musicStart = game.now
      if (on) {
        unduck(0.3)
        startMusicMode()
        game.world.camera.kick(0.25)
        game.world.spawnParticles(
          game.world.player.x,
          game.world.player.y - 1,
          '#ff5fa2',
          40,
          2.4
        )
      }
      game.dirty = true
    },
    update(dir, beat) {
      return dir.state.t > (beat.dur ?? 0)
    },
  },

  /** complete — fire the level-complete flow. */
  complete: {
    enter(dir, beat, game) {
      game.completeLevel(beat)
    },
  },

  /**
   * nextLocation — the "NEXT LOCATION… 🎧 MUSIC DISTRICT" teaser card.
   * Pass `hold: true` when there is nothing built after it yet — the beat
   * then never completes, so the card is the last thing on screen instead
   * of clearing into blank, uncontrollable gameplay.
   */
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
      if (beat.hold) return false
      return dir.state.t > (beat.dur ?? 3.4)
    },
    exit(dir) {
      dir.cinematic = null
    },
  },
}
