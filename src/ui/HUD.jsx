import React from 'react'
import { BLOCK_TYPES } from '../entities/Block.js'
import Meters from './Meters.jsx'

/**
 * HUD.jsx — the on-screen overlay.
 *
 * Meters top-left, current mission top-centre, brick inventory top-right,
 * selected brick + controls along the bottom. Everything is driven by the
 * snapshot Game.pushState() emits, so React re-renders only when something
 * meaningful changed, not every frame.
 *
 * The inventory and the control legend only appear during a build phase —
 * showing brick slots during a conversation just adds noise.
 */

function Swatch({ typeId }) {
  const t = BLOCK_TYPES[typeId]
  if (!t) return null
  return (
    <span
      className="inv-swatch"
      style={{
        background: t.color,
        width: 12 + Math.min(4, t.w) * 6,
        height: 10 + Math.min(4, t.h) * 4,
      }}
    />
  )
}

export default function HUD({ state, onSelect, onToggleBuild, onPause, onHint }) {
  if (!state) return null
  const {
    buildMode,
    buildAllowed,
    inventory,
    selected,
    rot,
    toasts,
    dead,
    deathQuip,
    placedCount,
    mission,
    stats,
    playerName,
    location,
    dialogue,
  } = state

  const sel = selected ? BLOCK_TYPES[selected] : null
  const invKeys = Object.keys(inventory)
  // during dialogue the overlay steps back so the conversation reads clearly
  const quiet = !!dialogue

  return (
    <>
      <div className={'hud' + (quiet ? ' quiet' : '')}>
        {/* --- top-left: player meters + build state --- */}
        <div className="hud-tl">
          <Meters stats={stats} playerName={playerName} location={location} />

          {buildAllowed && (
            <>
              <button
                type="button"
                className={'panel build-badge' + (buildMode ? '' : ' off')}
                onClick={onToggleBuild}
                title="Toggle build mode (B)"
              >
                <span className="dot" />
                {buildMode ? 'BUILD MODE' : 'WALK MODE'}
              </button>
              <div className="panel build-badge off">🧱 {placedCount} PLACED</div>
            </>
          )}
        </div>

        {/* --- top-centre: the current mission --- */}
        {mission && (
          <div className="hud-tc panel objective">
            <div className="lv">CURRENT MISSION</div>
            <div className="txt">
              <span className="obj-icon">{mission.icon}</span> {mission.title}
            </div>
            {mission.text ? <div className="teaches">{mission.text}</div> : null}
          </div>
        )}

        {/* --- top-right: inventory, build phases only --- */}
        {buildAllowed && (
          <div className="hud-tr panel inv">
            <div className="inv-title">
              <span>LEGO INVENTORY</span>
              <span className="mono">
                {Object.values(inventory).reduce((a, b) => a + b, 0)}
              </span>
            </div>
            {invKeys.map((k, i) => {
              const t = BLOCK_TYPES[k]
              const n = inventory[k]
              return (
                <button
                  type="button"
                  key={k}
                  className={
                    'inv-row' + (selected === k ? ' sel' : '') + (n <= 0 ? ' empty' : '')
                  }
                  onClick={() => n > 0 && onSelect(k)}
                  title={t.desc}
                >
                  <Swatch typeId={k} />
                  <span className="inv-label">{t.short}</span>
                  <span className="inv-count">×{n}</span>
                  <span className="inv-key">{i + 1}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* --- bottom: selected brick + controls --- */}
        {buildAllowed && !quiet && (
          <div className="hud-bc bottom-bar">
            <div className="panel sel-card">
              {sel ? (
                <>
                  <Swatch typeId={selected} />
                  <div>
                    <div className="nm">
                      {sel.label} {rot ? <span className="gold">↻</span> : null}
                    </div>
                    <div className="ds">{sel.desc}</div>
                  </div>
                </>
              ) : (
                <div className="ds">No bricks selected</div>
              )}
            </div>
            <div className="panel controls">
              <span>
                <kbd>A</kbd>
                <kbd>D</kbd> move
              </span>
              <span>
                <kbd>LMB</kbd> place
              </span>
              <span>
                <kbd>RMB</kbd>/<kbd>X</kbd> remove
              </span>
              <span>
                <kbd>R</kbd> rotate
              </span>
              <span>
                <kbd>Q</kbd> clear build
              </span>
              <span>
                <kbd>H</kbd> hint
              </span>
              <span>
                <kbd>ESC</kbd> pause
              </span>
            </div>
            <button className="brick-btn ghost small" onClick={onHint}>
              HINT
            </button>
            <button className="brick-btn ghost small" onClick={onPause}>
              ❚❚
            </button>
          </div>
        )}

        {/* walking-only phases still need a way to pause */}
        {!buildAllowed && !quiet && (
          <div className="hud-bc bottom-bar">
            <div className="panel controls">
              <span>
                <kbd>A</kbd>
                <kbd>D</kbd> walk
              </span>
              <span>
                <kbd>ESC</kbd> pause
              </span>
            </div>
            <button className="brick-btn ghost small" onClick={onPause}>
              ❚❚
            </button>
          </div>
        )}
      </div>

      {/* --- toasts --- */}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={'panel toast ' + t.kind}>
            <div className="t">{t.title}</div>
            {t.body ? <div className="b">{t.body}</div> : null}
          </div>
        ))}
      </div>

      {/* --- death veil: brief, funny, then you're back --- */}
      {dead && (
        <div className="death-veil">
          <div>
            <div className="q">{deathQuip ?? 'LEGO PHYSICS HAS SPOKEN.'}</div>
            <div className="sub">REBUILDING… YOUR BRICKS ARE SAFE</div>
          </div>
        </div>
      )}
    </>
  )
}
