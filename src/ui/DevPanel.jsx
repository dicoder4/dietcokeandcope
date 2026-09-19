import React from 'react'
import { LEVELS } from '../game/Game.js'

/**
 * DevPanel.jsx — jump anywhere in the game while building it.
 *
 * DEV BUILDS ONLY. `state.dev` is `import.meta.env.DEV`, so in the
 * production build this component is never rendered and its keybinds are
 * dead code — the birthday build cannot be fast-forwarded by accident.
 *
 * Why this exists: Level 2's punchline sits about six minutes of dialogue
 * and three song rounds deep. Testing a change to the final reveal by
 * replaying all of that every time is how you stop testing it.
 *
 * Keys:  `  panel     .  skip one beat     N  next level
 */
export default function DevPanel({ state, onGotoLevel, onSkipMission, onSkipBeat, onClose }) {
  if (!state?.dev) return null

  return (
    <div className="overlay dev-overlay">
      <div className="panel card dev-card">
        <h1 className="dev-title">DEV TOOLS</h1>
        <p className="dim dev-note">
          Dev build only — this panel does not exist in the real game.
        </p>

        <div className="dev-section">
          <div className="dev-label">JUMP TO LEVEL</div>
          <div className="dev-row">
            {LEVELS.map((lv, i) => (
              <button
                key={lv.id}
                className={'brick-btn small ' + (i === state.levelIndex ? 'yellow' : 'ghost')}
                onClick={() => onGotoLevel(i)}
              >
                {i + 1}. {lv.name}
              </button>
            ))}
          </div>
        </div>

        {state.devMissions?.length > 0 && (
          <div className="dev-section">
            <div className="dev-label">SKIP TO POINT IN THIS LEVEL</div>
            <div className="dev-row dev-missions">
              {state.devMissions.map((m) => (
                <button
                  key={m.i}
                  className="brick-btn ghost small"
                  onClick={() => onSkipMission(m.i)}
                >
                  {m.icon} {m.title}
                </button>
              ))}
            </div>
            <p className="dim dev-hint">
              Every beat in between still runs, so the world arrives in the
              right state — NPCs moved, items revealed, earphones flipped.
            </p>
          </div>
        )}

        <div className="dev-section">
          <div className="dev-label">SCRIPT</div>
          <p className="mono dev-beat">
            beat {state.devBeatIndex} · {state.devBeatType ?? 'done'}
          </p>
          <div className="dev-row">
            <button className="brick-btn ghost small" onClick={onSkipBeat}>
              SKIP ONE BEAT →
            </button>
          </div>
        </div>

        <div className="dev-section dev-keys">
          <span>
            <kbd>`</kbd> this panel
          </span>
          <span>
            <kbd>.</kbd> skip beat
          </span>
          <span>
            <kbd>N</kbd> next level
          </span>
        </div>

        <div className="row">
          <button className="brick-btn green" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
