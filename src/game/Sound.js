/**
 * Sound.js — all audio is synthesised with WebAudio oscillators.
 *
 * No asset files, no licensing questions, no download weight. A brick click
 * is a short square blip; a pickup is a rising arpeggio. It is not a score,
 * but it makes building feel tactile, which is the point.
 */

let ctx = null
let master = null
let enabled = true

/** Resting master level. `duck()` dips below it; `unduck()` returns here. */
const MASTER_VOLUME = 0.22

function ensure() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = MASTER_VOLUME
    master.connect(ctx.destination)
  } catch {
    ctx = null
  }
  return ctx
}

export function setSfxEnabled(on) {
  enabled = on
}

export function resumeAudio() {
  const c = ensure()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

/**
 * Duck the master bus — used so metro ambience drops away under dialogue and
 * cuts out entirely the moment the song quiz starts.
 */
export function duck(to = 0.06, seconds = 0.4) {
  const c = ensure()
  if (!c || !master) return
  const t = c.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(to, t + seconds)
}

export function unduck(seconds = 0.5) {
  duck(MASTER_VOLUME, seconds)
}

function blip({ freq = 440, dur = 0.08, type = 'square', vol = 0.5, slideTo = null, delay = 0 }) {
  if (!enabled) return
  const c = ensure()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise({ dur = 0.12, vol = 0.3, delay = 0 }) {
  if (!enabled) return
  const c = ensure()
  if (!c) return
  const frames = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.value = vol
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1800
  src.connect(lp)
  lp.connect(g)
  g.connect(master)
  src.start(c.currentTime + delay)
}

export const sfx = {
  place() {
    // the satisfying "clack" of a brick seating onto studs
    blip({ freq: 320, slideTo: 180, dur: 0.06, type: 'square', vol: 0.4 })
    noise({ dur: 0.05, vol: 0.18 })
  },
  remove() {
    blip({ freq: 200, slideTo: 420, dur: 0.07, type: 'triangle', vol: 0.32 })
  },
  invalid() {
    blip({ freq: 140, dur: 0.1, type: 'sawtooth', vol: 0.18 })
  },
  select() {
    blip({ freq: 700, dur: 0.03, type: 'square', vol: 0.16 })
  },
  step() {
    blip({ freq: 150 + Math.random() * 40, dur: 0.025, type: 'triangle', vol: 0.1 })
  },
  land() {
    blip({ freq: 120, slideTo: 70, dur: 0.1, type: 'sine', vol: 0.35 })
    noise({ dur: 0.07, vol: 0.14 })
  },
  pickup() {
    blip({ freq: 660, dur: 0.07, vol: 0.3 })
    blip({ freq: 880, dur: 0.07, vol: 0.3, delay: 0.06 })
    blip({ freq: 1180, dur: 0.1, vol: 0.28, delay: 0.12 })
  },
  treat() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => blip({ freq: f, dur: 0.12, type: 'triangle', vol: 0.3, delay: i * 0.08 }))
  },
  die() {
    blip({ freq: 300, slideTo: 60, dur: 0.4, type: 'sawtooth', vol: 0.3 })
    noise({ dur: 0.3, vol: 0.2 })
  },
  gate() {
    blip({ freq: 180, slideTo: 520, dur: 0.3, type: 'square', vol: 0.3 })
  },
  win() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => blip({ freq: f, dur: 0.22, type: 'square', vol: 0.3, delay: i * 0.11 }))
  },
  fanfare() {
    const seq = [
      [523, 0],
      [659, 0.12],
      [784, 0.24],
      [1047, 0.36],
      [784, 0.54],
      [1047, 0.66],
      [1319, 0.8],
    ]
    for (const [f, d] of seq) {
      blip({ freq: f, dur: 0.3, type: 'square', vol: 0.3, delay: d })
      blip({ freq: f / 2, dur: 0.3, type: 'triangle', vol: 0.16, delay: d })
    }
  },

  // ---- Level 2: the music quiz ----------------------------------------

  /** Got it right. Bright, quick, satisfying — not a whole fanfare. */
  quizCorrect() {
    const notes = [659, 880, 1109, 1319]
    notes.forEach((f, i) =>
      blip({ freq: f, dur: 0.14, type: 'triangle', vol: 0.32, delay: i * 0.06 })
    )
  },

  /** Got it wrong. The comedy sad-trombone slide. */
  quizWrong() {
    blip({ freq: 320, slideTo: 190, dur: 0.22, type: 'sawtooth', vol: 0.24 })
    blip({ freq: 240, slideTo: 130, dur: 0.3, type: 'sawtooth', vol: 0.2, delay: 0.2 })
    blip({ freq: 180, slideTo: 90, dur: 0.42, type: 'sawtooth', vol: 0.18, delay: 0.46 })
  },

  /** HEADPHONES FOUND — huge, triumphant, completely unearned. */
  dramaticVictory() {
    const seq = [
      [392, 0],
      [523, 0.1],
      [659, 0.2],
      [784, 0.3],
      [1047, 0.42],
    ]
    for (const [f, d] of seq) {
      blip({ freq: f, dur: 0.5, type: 'square', vol: 0.32, delay: d })
      blip({ freq: f / 2, dur: 0.5, type: 'triangle', vol: 0.2, delay: d })
    }
    blip({ freq: 1319, dur: 0.9, type: 'square', vol: 0.3, delay: 0.6 })
    noise({ dur: 0.5, vol: 0.12, delay: 0.55 })
  },

  /** …and immediately the rug-pull. Slide whistle down into a sad thud. */
  comedicFail() {
    blip({ freq: 900, slideTo: 140, dur: 0.75, type: 'sine', vol: 0.3 })
    blip({ freq: 150, slideTo: 60, dur: 0.4, type: 'sawtooth', vol: 0.26, delay: 0.7 })
    noise({ dur: 0.35, vol: 0.28, delay: 0.72 })
  },

  /** The two-tone BMRCL station chime. */
  metroChime() {
    blip({ freq: 988, dur: 0.38, type: 'sine', vol: 0.26 })
    blip({ freq: 740, dur: 0.55, type: 'sine', vol: 0.24, delay: 0.34 })
  },
}

// ======================================================================
//  LEVEL 2 — MUSIC
//
//  Three things live down here: a looping metro ambience bed, the
//  procedural song melodies the quiz falls back on when no audio files
//  are present, and the upbeat loop that starts when the earphones
//  finally go in. All of it is oscillators and filtered noise — the repo
//  ships no audio files, so nothing here can 404.
// ======================================================================

/** Handle for whatever long-running sound is currently playing. */
let ambience = null
let musicLoop = null
let currentClip = null

/**
 * Metro ambience: a low rumble plus filtered noise for the air-con and the
 * rails. Loops until stopped. Cheap — two nodes and one noise buffer.
 */
function startAmbience() {
  const c = ensure()
  if (!c || ambience) return
  const g = c.createGain()
  g.gain.value = 0
  g.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.2)
  g.connect(master)

  // rolling-stock rumble
  const rumble = c.createOscillator()
  rumble.type = 'sine'
  rumble.frequency.value = 48
  const rg = c.createGain()
  rg.gain.value = 0.32
  rumble.connect(rg)
  rg.connect(g)
  rumble.start()

  // rail/air noise, band-limited so it sits under everything
  const frames = Math.floor(c.sampleRate * 2)
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * 0.5
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  const ng = c.createGain()
  ng.gain.value = 0.16
  src.connect(lp)
  lp.connect(ng)
  ng.connect(g)
  src.start()

  ambience = { g, stop: () => { try { rumble.stop() } catch { /* already stopped */ } try { src.stop() } catch { /* already stopped */ } } }
}

function stopAmbience(fade = 0.6) {
  const c = ensure()
  if (!c || !ambience) return
  const a = ambience
  ambience = null
  a.g.gain.cancelScheduledValues(c.currentTime)
  a.g.gain.setValueAtTime(a.g.gain.value, c.currentTime)
  a.g.gain.linearRampToValueAtTime(0.0001, c.currentTime + fade)
  setTimeout(() => a.stop(), fade * 1000 + 60)
}

export function metroAmbience(on) {
  if (!enabled) return
  if (on) startAmbience()
  else stopAmbience()
}

/**
 * The procedural stand-in songs. Each is a note list in semitone-ish
 * frequencies with a bassline, chosen so the three rounds sound genuinely
 * different from each other: an anthem, something chill, and a fast one.
 */
const SYNTH_SONGS = {
  anthem: {
    tempo: 0.28,
    type: 'square',
    notes: [523, 523, 659, 784, 784, 659, 587, 523, 587, 659, 659, 587, 523, 523, 784, 659],
    bass: [131, 0, 196, 0, 165, 0, 196, 0],
  },
  chill: {
    tempo: 0.42,
    type: 'sine',
    notes: [440, 523, 587, 523, 494, 440, 392, 440, 523, 587, 659, 587, 523, 494],
    bass: [110, 0, 147, 0, 123, 0, 98, 0],
  },
  bossfinal: {
    tempo: 0.19,
    type: 'sawtooth',
    notes: [330, 392, 440, 523, 494, 440, 392, 330, 392, 523, 587, 523, 440, 392, 330, 294],
    bass: [82, 98, 110, 98, 82, 98, 123, 110],
  },
}

/**
 * Play one of the fallback melodies. Returns a stop handle shaped like the
 * clip player's, so the quiz beat can treat both identically.
 */
export function playSynthSong(name, seconds = 8) {
  const c = ensure()
  if (!c || !enabled) return { stop() {} }
  const song = SYNTH_SONGS[name] ?? SYNTH_SONGS.anthem
  const { tempo, notes, bass, type } = song

  let stopped = false
  const count = Math.ceil(seconds / tempo)
  for (let i = 0; i < count; i++) {
    const at = i * tempo
    if (at > seconds) break
    blip({ freq: notes[i % notes.length], dur: tempo * 0.85, type, vol: 0.26, delay: at })
    const b = bass[i % bass.length]
    if (b) blip({ freq: b, dur: tempo * 1.6, type: 'triangle', vol: 0.2, delay: at })
  }
  // Oscillator blips are fire-and-forget; "stopping" means muting the bus
  // briefly, which is what the quiz wants when it cuts a clip short.
  return {
    stop() {
      if (stopped) return
      stopped = true
      duck(0.0001, 0.12)
      setTimeout(() => unduck(0.25), 160)
    },
  }
}

/**
 * Play a real audio file from public/. Resolves nothing and throws nothing:
 * if the file is missing, undecodable, or the fetch fails, `onMissing` is
 * called so the caller can fall back to a synth melody. A wrong filename in
 * songs.js costs the joke, never the game.
 */
export function playClip(url, { seconds = 8, onMissing } = {}) {
  const c = ensure()
  const handle = { stop() { handle._stopped = true } }
  if (!c || !enabled) {
    onMissing?.()
    return handle
  }

  const base = import.meta.env?.BASE_URL ?? '/'
  const full = `${base}${url}`.replace(/([^:])\/\/+/g, '$1/')

  fetch(full)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('missing'))))
    .then((buf) => c.decodeAudioData(buf))
    .then((audio) => {
      if (handle._stopped) return
      const src = c.createBufferSource()
      src.buffer = audio
      const g = c.createGain()
      g.gain.value = 0.9
      src.connect(g)
      g.connect(master)
      // Start somewhere in the middle so repeat plays aren't identical, but
      // never so late that the clip runs out before the timer does.
      const offset = Math.max(0, Math.min(audio.duration - seconds, Math.random() * audio.duration * 0.5))
      src.start(0, offset)
      currentClip = { src, g }
      handle.stop = () => {
        handle._stopped = true
        try {
          g.gain.setValueAtTime(g.gain.value, c.currentTime)
          g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.18)
          src.stop(c.currentTime + 0.2)
        } catch { /* already stopped */ }
        currentClip = null
      }
      if (handle._stopped) handle.stop()
    })
    .catch(() => {
      onMissing?.()
    })

  return handle
}

export function stopAllClips() {
  if (!currentClip) return
  try { currentClip.src.stop() } catch { /* already stopped */ }
  currentClip = null
}

/**
 * MUSIC RESTORED. An upbeat loop that runs until the level ends — this is
 * the payoff the whole level is built toward, so it is busier than anything
 * else in the game: a bassline, a chord stab on the offbeat, and a melody.
 */
const MUSIC_MODE_BPM = 124
export const MUSIC_MODE_BEAT = 60 / MUSIC_MODE_BPM

export function startMusicMode() {
  const c = ensure()
  if (!c || !enabled || musicLoop) return
  const beat = MUSIC_MODE_BEAT
  const melody = [659, 784, 880, 784, 659, 587, 659, 880, 1047, 880, 784, 659, 587, 659, 784, 587]
  const bass = [110, 110, 165, 110, 147, 147, 196, 147]
  let i = 0

  const tick = () => {
    if (!musicLoop) return
    // schedule one bar ahead so timing survives a busy frame
    for (let k = 0; k < 4; k++) {
      const at = k * beat
      blip({ freq: melody[(i + k) % melody.length], dur: beat * 0.8, type: 'square', vol: 0.2, delay: at })
      blip({ freq: bass[(i + k) % bass.length], dur: beat * 1.2, type: 'triangle', vol: 0.22, delay: at })
      if ((i + k) % 2 === 1) noise({ dur: 0.05, vol: 0.1, delay: at })
    }
    i += 4
  }

  musicLoop = { id: setInterval(tick, beat * 4 * 1000) }
  tick()
}

export function stopMusicMode() {
  if (!musicLoop) return
  clearInterval(musicLoop.id)
  musicLoop = null
}

/** Tear down every long-running sound. Called when a level unloads. */
export function stopAllAudio() {
  stopAmbience(0.2)
  stopMusicMode()
  stopAllClips()
  unduck(0.3)
}
