import React from 'react'
import { rand, IDLE_HINTS } from '../config/quips.js'

export default function PauseMenu({ state, onResume, onRestart, onMenu }) {
  const [tip] = React.useState(() => rand(IDLE_HINTS))
  return (
    <div className="overlay">
      <div className="panel card">
        <h1>PAUSED</h1>
        <p className="dim">Level {state.levelIndex + 1} — {state.levelName}</p>

        <div className="stat-grid">
          <div className="stat">
            <div className="v">{state.stats.placed}</div>
            <div className="k">PLACED</div>
          </div>
          <div className="stat">
            <div className="v">{state.stats.removed}</div>
            <div className="k">RECLAIMED</div>
          </div>
          <div className="stat">
            <div className="v">{state.stats.deaths}</div>
            <div className="k">RESPAWNS</div>
          </div>
          <div className="stat">
            <div className="v">{state.totalRemaining}</div>
            <div className="k">IN THE BOX</div>
          </div>
        </div>

        <p style={{ marginTop: 20 }}>
          <b className="gold">OBJECTIVE:</b> {state.objective}
        </p>
        <p style={{ fontSize: 13 }}>
          <b className="gold">HINT:</b> {state.hint}
        </p>
        <p style={{ fontSize: 12, fontStyle: 'italic' }}>{tip}</p>

        <div className="row">
          <button className="brick-btn green" onClick={onResume}>
            RESUME
          </button>
          <button className="brick-btn yellow" onClick={onRestart}>
            RESTART LEVEL
          </button>
          <button className="brick-btn ghost" onClick={onMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}
