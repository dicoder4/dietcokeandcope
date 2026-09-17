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

function ensure() {
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.22
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
}
