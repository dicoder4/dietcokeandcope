import React from 'react'
import { characterOf } from '../game/Characters.js'

/**
 * Kitchen.jsx — 🍳 Level 4's biryani minigame.
 *
 * Fourth in the line that runs FoodBuilder → SongQuiz → Framebuffer: a
 * full-screen overlay that owns no state of its own. Everything it draws
 * comes from the Director's `kitchen` snapshot, and every interaction goes
 * back through three Director methods (pickDish / confirmDish / pickPiece).
 * The beat in Beats.js is the state machine.
 *
 * Built on the .sq-* panel vocabulary like Framebuffer is, so all four
 * minigames read as one game. Only genuinely new things get a .kc- rule —
 * and the prefix is NOT .fb-, which FoodBuilder and Framebuffer already
 * share between them.
 *
 * Two phases, one per screen:
 *   dish    what are we making? Nobody else can see this.
 *   jigsaw  a real jigsaw of a plate of biryani — tap two pieces to swap
 *
 * The jigsaw keys its tiles by SLOT index, not by piece. That is correct
 * here: slots never reorder, pieces move between them, so the slot is the
 * stable identity and keying by piece would animate the wrong things.
 */

/** The player is alone at the stove here, so lines default to him. */
function KitchenLine({ text, who = 'aditya' }) {
  const c = characterOf(who)
  if (!text) return <div className="sq-line sq-line-empty">&nbsp;</div>
  return (
    <div className="sq-line">
      <span className="sq-line-dot" style={{ background: c.shirt }} />
      <div>
        {text.split('\n').map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  )
}

function DishPanel({ kitchen, onPick, onConfirm }) {
  const { dishes, confirmText, note } = kitchen

  // He knows exactly what he wants to cook, so a wrong pick is not a
  // question — it is him dismissing the idea and going back to the board.
  if (confirmText) {
    return (
      <>
        <div className="sq-head">
          <div className="sq-title">🤨 NO</div>
        </div>
        <div className="kc-confirm">
          <div className="kc-confirm-text">{confirmText}</div>
          <div className="sq-actions">
            <button type="button" className="brick-btn green" onClick={() => onConfirm(false)}>
              ↩ PICK AGAIN
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🍳 WHAT ARE WE MAKING?</div>
        <div className="sq-sub">They cannot see this from over there.</div>
      </div>

      <div className="kc-dishes">
        {dishes.map((d, i) => (
          <button
            type="button"
            key={d.id}
            className="kc-dish"
            onClick={() => onPick(d.id)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="kc-dish-emoji">{d.emoji}</span>
            <span className="kc-dish-label">{d.label}</span>
            <span className="sq-key">{i + 1}</span>
          </button>
        ))}
      </div>

      <KitchenLine text={note} />
    </>
  )
}

/**
 * A fallback tile for when the photo is missing (see public/food/README).
 * Warm rice-ish colours keyed off the piece index, so the puzzle is still
 * solvable — different tiles look different — without any image at all.
 */
function fallbackTile(piece) {
  const hue = 28 + ((piece * 37) % 26)
  const light = 52 + ((piece * 13) % 22)
  return `hsl(${hue}, ${58 + (piece % 3) * 8}%, ${light}%)`
}

function JigsawPanel({ kitchen, onPick }) {
  const { image, grid, order, selected, solved } = kitchen
  const home = order.filter((piece, i) => piece === i).length
  // the published path is relative, so it resolves under any base URL
  const url = image ? import.meta.env.BASE_URL + image : null

  let hint = null
  if (solved) hint = 'That is the one.'
  else if (selected != null) hint = 'Now pick the one it swaps with.'

  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🍲 PLATE THE BIRYANI</div>
        <div className="sq-sub">
          {home}/{order.length} in place · tap two pieces to swap
        </div>
      </div>

      <div
        className={'kc-jigsaw' + (solved ? ' solved' : '')}
        style={{ '--kc-grid': grid }}
      >
        {order.map((piece, slot) => {
          const correct = piece === slot
          const col = piece % grid
          const row = Math.floor(piece / grid)
          // background-position as a percentage of the over-sized sheet is
          // the standard CSS way to window one cell of a sprite grid
          const pos = grid > 1
            ? `${(col / (grid - 1)) * 100}% ${(row / (grid - 1)) * 100}%`
            : '0% 0%'
          return (
            <button
              type="button"
              key={slot}
              className={
                'kc-piece' +
                (selected === slot ? ' picked' : '') +
                (correct ? ' home' : '')
              }
              onClick={() => onPick(slot)}
              aria-label={`piece ${piece + 1} in slot ${slot + 1}`}
              style={
                url
                  ? {
                      backgroundImage: `url("${url}")`,
                      backgroundSize: `${grid * 100}% ${grid * 100}%`,
                      backgroundPosition: pos,
                    }
                  : { background: fallbackTile(piece) }
              }
            >
              {!url && <span className="kc-piece-num">{piece + 1}</span>}
            </button>
          )
        })}
      </div>

      <KitchenLine text={hint} />
    </>
  )
}

export default function Kitchen({ kitchen, onPickDish, onConfirmDish, onPickPiece }) {
  if (!kitchen) return null
  const { phase } = kitchen
  if (phase !== 'dish' && phase !== 'jigsaw') return null

  return (
    <div className="kc-root">
      <div className="sq-panel kc-panel">
        <div className="sq-dots">
          <span className={'sq-dot' + (phase === 'dish' ? ' on' : ' done')} />
          <span className={'sq-dot' + (phase === 'jigsaw' ? ' on' : '')} />
          <span className="sq-round">{phase === 'dish' ? 'DECIDE' : 'PLATE'}</span>
        </div>

        <div className="sq-body">
          {phase === 'dish' && (
            <DishPanel kitchen={kitchen} onPick={onPickDish} onConfirm={onConfirmDish} />
          )}
          {phase === 'jigsaw' && <JigsawPanel kitchen={kitchen} onPick={onPickPiece} />}
        </div>
      </div>
    </div>
  )
}
