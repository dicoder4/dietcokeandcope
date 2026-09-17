import React from 'react'
import gameConfig from '../config/gameConfig.js'
import { sfx, resumeAudio } from '../game/Sound.js'

/**
 * Ending.jsx — the final birthday build.
 *
 * The player places the last bricks themselves, one per click, into a
 * blueprint of a cake. As the structure fills in, the camera pulls back and
 * the whole thing resolves into a celebration scene. Then the reveal.
 *
 * It is the same verb as the rest of the game — click to place a brick — which
 * is the point: the emotional payoff is delivered through the mechanic, not
 * instead of it.
 */

// ---------------------------------------------------------------------------
// The cake blueprint, in cell coordinates. Rows are drawn bottom-up so the
// build feels like it rises. Each entry is one brick the player places.
// ---------------------------------------------------------------------------
const CAKE = (() => {
  const b = []
  const add = (x, y, w, h, c) => b.push({ x, y, w, h, c })

  // plate
  add(-9, 1, 18, 1, '#d8dee8')
  // bottom tier (widest)
  for (let i = 0; i < 4; i++) add(-8 + i * 4, 0, 4, 1, i % 2 ? '#e2453c' : '#f2663c')
  for (let i = 0; i < 4; i++) add(-8 + i * 4, -1, 4, 1, i % 2 ? '#f2663c' : '#e2453c')
  // frosting band
  for (let i = 0; i < 4; i++) add(-8 + i * 4, -2, 4, 1, '#fff1d6')
  // middle tier
  for (let i = 0; i < 3; i++) add(-6 + i * 4, -3, 4, 1, i % 2 ? '#f2b230' : '#ffc63d')
  for (let i = 0; i < 3; i++) add(-6 + i * 4, -4, 4, 1, i % 2 ? '#ffc63d' : '#f2b230')
  for (let i = 0; i < 3; i++) add(-6 + i * 4, -5, 4, 1, '#fff1d6')
  // top tier
  for (let i = 0; i < 2; i++) add(-4 + i * 4, -6, 4, 1, i % 2 ? '#3fa7e0' : '#7ed0ff')
  for (let i = 0; i < 2; i++) add(-4 + i * 4, -7, 4, 1, i % 2 ? '#7ed0ff' : '#3fa7e0')
  for (let i = 0; i < 2; i++) add(-4 + i * 4, -8, 4, 1, '#fff1d6')
  // candles
  add(-3, -9, 1, 2, '#8bd24f')
  add(0, -9, 1, 2, '#e2453c')
  add(3, -9, 1, 2, '#3fa7e0')
  return b
})()

const CANDLE_FLAMES = [
  { x: -3, y: -10 },
  { x: 0, y: -10 },
  { x: 3, y: -10 },
]

const TILE = 26
const SKEW = 0.34
const DEPTH = 10

export default function Ending({ stats, treats, onRestart }) {
  const canvasRef = React.useRef(null)
  const [placed, setPlaced] = React.useState(0)
  const [phase, setPhase] = React.useState('build') // build -> reveal -> messages
  const [msgCount, setMsgCount] = React.useState(0)
  const stateRef = React.useRef({ placed: 0, zoom: 2.3, targetZoom: 2.3, t: 0, particles: [], flash: 0 })

  const total = CAKE.length
  const done = placed >= total

  // ---- place a brick on click / key ---------------------------------------
  const placeOne = React.useCallback(() => {
    resumeAudio()
    setPlaced((n) => {
      if (n >= total) return n
      const next = n + 1
      stateRef.current.placed = next
      stateRef.current.flash = 1
      sfx.place()
      // zoom out gradually as the structure grows
      stateRef.current.targetZoom = 2.3 - 1.5 * (next / total)
      const brick = CAKE[n]
      for (let i = 0; i < 7; i++) {
        stateRef.current.particles.push({
          x: brick.x + brick.w / 2,
          y: brick.y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3 - 0.5,
          life: 0.5 + Math.random() * 0.4,
          color: brick.c,
          size: 2 + Math.random() * 3,
        })
      }
      if (next >= total) {
        sfx.fanfare()
        setTimeout(() => setPhase('status'), 700)
        setTimeout(() => setPhase('reveal'), 3100)
        setTimeout(() => setPhase('messages'), 4500)
      }
      return next
    })
  }, [total])

  // reveal messages one at a time
  React.useEffect(() => {
    if (phase !== 'messages') return
    const msgs = gameConfig.customMessages ?? []
    if (msgCount >= msgs.length) return
    const id = setTimeout(() => setMsgCount((c) => c + 1), 900)
    return () => clearTimeout(id)
  }, [phase, msgCount])

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        if (!done) placeOne()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placeOne, done])

  // ---- render loop --------------------------------------------------------
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const drawBrick = (x, y, w, h, color, alpha = 1, lift = 0) => {
      const px = x * TILE + y * TILE * SKEW
      const py = y * TILE - lift
      const bw = w * TILE
      const bh = h * TILE
      const sk = TILE * SKEW * h
      ctx.save()
      ctx.globalAlpha = alpha
      // front
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + bw, py)
      ctx.lineTo(px + bw + sk, py + bh)
      ctx.lineTo(px + sk, py + bh)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      // top
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + bw, py)
      ctx.lineTo(px + bw + DEPTH * 0.9, py - DEPTH)
      ctx.lineTo(px + DEPTH * 0.9, py - DEPTH)
      ctx.closePath()
      ctx.fillStyle = shade(color, 40)
      ctx.fill()
      // right
      ctx.beginPath()
      ctx.moveTo(px + bw, py)
      ctx.lineTo(px + bw + DEPTH * 0.9, py - DEPTH)
      ctx.lineTo(px + bw + DEPTH * 0.9 + sk, py - DEPTH + bh)
      ctx.lineTo(px + bw + sk, py + bh)
      ctx.closePath()
      ctx.fillStyle = shade(color, -42)
      ctx.fill()
      // studs
      for (let i = 0; i < w; i++) {
        const sx = px + (i + 0.5) * TILE + DEPTH * 0.45
        const sy = py - DEPTH * 0.5
        ctx.beginPath()
        ctx.ellipse(sx, sy, TILE * 0.2, DEPTH * 0.34, 0, 0, Math.PI * 2)
        ctx.fillStyle = shade(color, 62)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + bw, py)
      ctx.lineTo(px + bw + sk, py + bh)
      ctx.lineTo(px + sk, py + bh)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const S = stateRef.current
      S.t += dt
      S.zoom += (S.targetZoom - S.zoom) * (1 - Math.pow(0.02, dt))
      if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 3)

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      // sky
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#120a22')
      g.addColorStop(0.55, '#2a1240')
      g.addColorStop(1, '#5c1f3c')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // stars
      ctx.save()
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 7919) % 1000) / 1000 * w
        const sy = ((i * 104729) % 700) / 700 * h * 0.75
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(S.t * 1.4 + i))
        ctx.globalAlpha = tw * 0.7
        ctx.fillStyle = '#fff'
        ctx.fillRect(sx, sy, 1.8, 1.8)
      }
      ctx.restore()

      ctx.save()
      ctx.translate(w / 2, h * 0.68)
      ctx.scale(S.zoom, S.zoom)

      // ground shadow
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.ellipse(0, TILE * 2.4, TILE * 11, TILE * 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // ghost blueprint of what's left to build
      for (let i = S.placed; i < CAKE.length; i++) {
        const b = CAKE[i]
        ctx.save()
        ctx.globalAlpha = i === S.placed ? 0.3 + Math.sin(S.t * 6) * 0.12 : 0.09
        drawBrick(b.x, b.y, b.w, b.h, '#ffffff', 1, 0)
        ctx.restore()
      }

      // the cake so far
      for (let i = 0; i < S.placed; i++) {
        const b = CAKE[i]
        const age = i === S.placed - 1 ? S.flash : 0
        drawBrick(b.x, b.y, b.w, b.h, b.c, 1, age * 8)
      }

      // candle flames once the candles are up
      if (S.placed >= CAKE.length) {
        for (const f of CANDLE_FLAMES) {
          const px = f.x * TILE + f.y * TILE * SKEW + TILE * 0.5
          const py = f.y * TILE + TILE * 0.5
          const fl = 1 + Math.sin(S.t * 9 + f.x) * 0.18
          ctx.save()
          ctx.shadowColor = 'rgba(255,190,80,0.95)'
          ctx.shadowBlur = 26
          const fg = ctx.createRadialGradient(px, py, 0, px, py, TILE * 0.5 * fl)
          fg.addColorStop(0, '#fffbe8')
          fg.addColorStop(0.45, '#ffcf5c')
          fg.addColorStop(1, 'rgba(255,120,40,0)')
          ctx.fillStyle = fg
          ctx.beginPath()
          ctx.ellipse(px, py, TILE * 0.26 * fl, TILE * 0.46 * fl, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        // confetti
        if (Math.random() < 0.5) {
          S.particles.push({
            x: (Math.random() - 0.5) * 24,
            y: -16 - Math.random() * 6,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 1.2 + 0.4,
            life: 2.6,
            color: ['#e2453c', '#f2b230', '#3fa7e0', '#8bd24f', '#ffc63d'][
              Math.floor(Math.random() * 5)
            ],
            size: 2 + Math.random() * 3,
            spin: Math.random() * 6,
          })
        }
      }

      // particles
      for (const p of S.particles) {
        p.life -= dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 2.4 * dt
        const px = p.x * TILE + p.y * TILE * SKEW
        const py = p.y * TILE
        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
        ctx.fillStyle = p.color
        ctx.translate(px, py)
        if (p.spin) ctx.rotate(S.t * p.spin)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
        ctx.restore()
      }
      S.particles = S.particles.filter((p) => p.life > 0)

      ctx.restore()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const msgs = gameConfig.customMessages ?? []
  const name = gameConfig.playerName || 'FRIEND'

  return (
    <div className="ending-root">
      <canvas
        ref={canvasRef}
        className="ending-canvas"
        onClick={() => !done && placeOne()}
        style={{ cursor: done ? 'default' : 'pointer' }}
      />

      {/* ---- build stage ---- */}
      {phase === 'build' && (
        <div className="cake-hud">
          <div className="cake-instr">
            {placed === 0 ? 'ALL REQUIRED MATERIALS ACQUIRED' : 'FINAL CONSTRUCTION IN PROGRESS'}
          </div>
          <div className="cake-sub">
            {placed === 0
              ? 'One last build. Click to place a brick.'
              : 'Keep clicking. ' + (total - placed) + ' bricks to go.'}
          </div>
          <div className="cake-progress">
            <i style={{ width: (placed / total) * 100 + '%' }} />
          </div>
        </div>
      )}

      {/* ---- status readout: the game closing itself out ---- */}
      {phase === 'status' && (
        <div className="ending-status">
          <div className="status-line">ALL MISSIONS COMPLETE.</div>
          <div className="status-line">MEMORIES RECOVERED: 100%</div>
          <div className="status-line">FRIENDSHIP LEVEL: MAX</div>
          <div className="status-line">
            PLAYER LEVEL: {gameConfig.birthdayAge ?? gameConfig.age ?? '??'}
          </div>
          <div className="status-line status-quest">FINAL QUEST: Look behind you.</div>
        </div>
      )}

      {/* ---- the reveal ---- */}
      {(phase === 'reveal' || phase === 'messages') && (
        <div className="ending-ui">
          <div className="ending-prompt">FINAL CONSTRUCTION COMPLETE</div>
          <h1 className="ending-title">HAPPY BIRTHDAY {name} 🎂</h1>
          <p className="ending-line">{gameConfig.birthdayMessage}</p>

          {phase === 'messages' && (
            <>
              <div className="ending-msgs">
                {msgs.slice(0, msgCount).map((m, i) => (
                  <div className="ending-msg" key={i} style={{ animationDelay: '0.05s' }}>
                    {m}
                  </div>
                ))}
              </div>

              {msgCount >= msgs.length && (
                <>
                  <div className="stat-grid" style={{ marginTop: 22 }}>
                    <div className="stat">
                      <div className="v">{stats.placed}</div>
                      <div className="k">BRICKS PLACED</div>
                    </div>
                    <div className="stat">
                      <div className="v">{stats.removed}</div>
                      <div className="k">REBUILT</div>
                    </div>
                    <div className="stat">
                      <div className="v">{stats.deaths}</div>
                      <div className="k">RESPAWNS</div>
                    </div>
                    <div className="stat">
                      <div className="v">{treats?.size ?? 0}</div>
                      <div className="k">TREATS FOUND</div>
                    </div>
                  </div>

                  {gameConfig.friends?.length > 0 && (
                    <p className="ending-friends">
                      With love from {gameConfig.friends.join(', ')}.
                    </p>
                  )}
                  {gameConfig.birthdayAge ?? gameConfig.age ? (
                    <p className="ending-friends">
                      {gameConfig.birthdayAge ?? gameConfig.age} years of structural integrity.
                    </p>
                  ) : null}
                  <p className="ending-sig">{gameConfig.signature}</p>

                  <div className="row" style={{ marginTop: 20 }}>
                    <button className="brick-btn yellow" onClick={onRestart}>
                      PLAY AGAIN
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  r = Math.max(0, Math.min(255, r + amt))
  g = Math.max(0, Math.min(255, g + amt))
  b = Math.max(0, Math.min(255, b + amt))
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}
