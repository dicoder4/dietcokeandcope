import React from 'react'

/**
 * Meters.jsx — HP / HAPPINESS / XP.
 *
 * Drawn as segmented blocks rather than a smooth bar, because the brief
 * asks for `HP: ████████░░` and a console game's meter should read as
 * countable units, not a percentage.
 */

const SEGMENTS = 10

function Bar({ label, value, shown, max, color }) {
  const filled = Math.round((shown / max) * SEGMENTS)
  const target = Math.round((value / max) * SEGMENTS)
  return (
    <div className="meter">
      <div className="meter-label">{label}</div>
      <div className="meter-track">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={label + i}
            className={
              'meter-seg' +
              (i < filled ? ' on' : '') +
              // the segment currently being won pulses, so a gain is legible
              (i >= filled && i < target ? ' gaining' : '')
            }
            style={i < filled ? { background: color, boxShadow: `0 0 8px ${color}` } : undefined}
          />
        ))}
      </div>
      <div className="meter-num">{Math.round(shown)}</div>
    </div>
  )
}

export default function Meters({ stats, playerName, location }) {
  if (!stats) return null
  return (
    <div className="panel meters">
      <div className="meter-head">
        <span className="meter-player">{playerName}</span>
        <span className="meter-xp">XP {Math.round(stats.xpShown)}</span>
      </div>

      <Bar
        label="HP"
        value={stats.hp}
        shown={stats.hpShown}
        max={stats.max}
        color="var(--good)"
      />
      <Bar
        label="HAPPINESS"
        value={stats.happiness}
        shown={stats.happinessShown}
        max={stats.max}
        color="var(--brick-yellow)"
      />

      {location && <div className="meter-loc">📍 {location}</div>}

      <div className="meter-floats">
        {stats.floats.map((f) => (
          <div key={f.id} className={'meter-float ' + f.kind}>
            {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}
