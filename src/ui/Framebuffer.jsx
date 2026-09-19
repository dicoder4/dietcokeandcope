import React from 'react'
import { characterOf } from '../game/Characters.js'

/**
 * Framebuffer.jsx — 🧠 DE-SCRAMBLE THE SHOW SCENES, Level 3's minigame.
 *
 * Third in the line of FoodBuilder -> SongQuiz: a full-screen overlay that
 * owns no state of its own. Everything it draws comes from the Director's
 * `framebuffer` snapshot, and every interaction goes back through four thin
 * Director methods. The beat in Beats.js is the state machine.
 *
 * Two puzzles share this component because they share a frame — a monitor
 * showing a broken picture, with controls underneath:
 *
 *   scranton — pick the code block that un-scrambles the tile matrix
 *   dunphy   — drag the strips into alignment, then pick a frame rate
 *
 * NO IMAGE FILES. Both "framebuffers" are coloured divs and emoji (see
 * src/config/framebuffers.js). A scrambled picture reads perfectly well as
 * nine squares that snap into a face, and the repo ships no binary art.
 */

const LETTERS = ['A', 'B', 'C', 'D']

/** The friend's line, styled to match Diya's in the song quiz. */
function FriendLine({ text, who = 'lord' }) {
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

/** The CRT bezel header every framebuffer sits inside. */
function MonitorHead({ label, caption, status }) {
  return (
    <div className="fb-monitor-head">
      <span className="fb-led" />
      <span className="fb-label">{label}</span>
      {status && <span className="fb-status">{status}</span>}
      {caption && <span className="fb-caption">{caption}</span>}
    </div>
  )
}

// =======================================================================
//  PUZZLE 1 — THE OFFICE
// =======================================================================

/**
 * The 3x3 tile matrix. While scrambled, `scrambled[i]` says which tile is
 * sitting in slot i and every tile is rotated 180°; once solved, each tile
 * goes home and un-flips. Both are the same DOM with different transforms,
 * so the CSS transition does the sliding for free.
 */
function TileGrid({ puzzle, solved }) {
  const order = solved ? puzzle.tiles.map((_, i) => i) : puzzle.scrambled
  return (
    <div className={'fb-tiles' + (solved ? ' solved' : '')}>
      {order.map((tileIndex, slot) => {
        const tile = puzzle.tiles[tileIndex]
        return (
          <div
            className="fb-tile"
            key={slot}
            style={{
              background: tile.bg,
              color: tile.fg,
              transform: solved ? 'rotate(0deg)' : 'rotate(180deg)',
              transitionDelay: `${slot * 0.05}s`,
            }}
          >
            <span className="fb-tile-glyph">{tile.glyph}</span>
          </div>
        )
      })}
      {/* the warm Dunder Mifflin fluorescent sweep, on solve only */}
      {solved && <div className="fb-warmth" />}
    </div>
  )
}

/** The C++ listing, with the chosen block dropped into the blank line. */
function CodeSnippet({ puzzle, filled, dragOver, onDrop, onDragOver, onDragLeave }) {
  return (
    <pre className="fb-code">
      {puzzle.snippet.map((line, i) => {
        if (i !== puzzle.blankIndex) {
          return (
            <div className="fb-code-line" key={i}>
              {line || ' '}
            </div>
          )
        }
        return (
          <div className="fb-code-line" key={i}>
            {'  '}
            <span
              className={
                'fb-slot' + (filled ? ' filled' : '') + (dragOver ? ' over' : '')
              }
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              {filled ? filled.code : '______________________________;'}
            </span>
          </div>
        )
      })}
    </pre>
  )
}

function ScrantonPanel({ fb, onPick, onRetry }) {
  const p = fb.puzzle
  const [dragOver, setDragOver] = React.useState(false)
  const picked = p.blocks.find((b) => b.id === fb.pickedBlock) ?? null
  const solved = fb.phase === 'solved'
  const failed = fb.phase === 'failed'
  const compiling = fb.phase === 'compiling'

  // The blank shows the picked block from the moment it is chosen, through
  // the compile, and stays there when it worked.
  const filled = fb.phase === 'picking' ? null : picked

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('text/plain')
    const i = p.blocks.findIndex((b) => b.id === id)
    if (i >= 0) onPick(i)
  }

  const status = compiling
    ? fb.compileStage === 'compiling'
      ? 'COMPILING'
      : fb.compileStage === 'success'
        ? 'BUILD OK'
        : 'RUNNING'
    : solved
      ? 'RENDERED'
      : failed
        ? 'ERROR'
        : 'SCRAMBLED'

  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🧠 DE-SCRAMBLE THE OFFICE</div>
        <div className="sq-sub">
          Dunder Mifflin, Scranton · Drag the right block into the empty line — or click it.
        </div>
      </div>

      <div className="fb-stage">
        <div className="fb-monitor">
          <MonitorHead label={p.monitorLabel} caption={p.caption} status={status} />
          <TileGrid puzzle={p} solved={solved} />
        </div>

        <div className="fb-side">
          <CodeSnippet
            puzzle={p}
            filled={filled}
            dragOver={dragOver}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
          />

          {compiling && (
            <div className="fb-console">
              <div className="fb-console-line">COMPILING SHADER...</div>
              <div className="fb-bar">
                <div className="fb-bar-fill" style={{ width: `${fb.progress * 100}%` }} />
              </div>
              {fb.compileStage !== 'compiling' && (
                <div className="fb-console-line good">BUILD SUCCESSFUL</div>
              )}
              {fb.compileStage === 'running' && <div className="fb-console-line">RUNNING...</div>}
            </div>
          )}

          {failed && (
            <div className="fb-console">
              <div className="fb-console-line bad">COMPILATION FAILED 💀</div>
            </div>
          )}
        </div>
      </div>

      {fb.phase === 'picking' && (
        <div className="fb-blocks">
          {p.blocks.map((b, i) => (
            <button
              type="button"
              key={b.id}
              className="fb-block"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', b.id)}
              onClick={() => onPick(i)}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="sq-letter">{LETTERS[i]}</span>
              <code className="fb-block-code">{b.code}</code>
              <span className="sq-key">{i + 1}</span>
            </button>
          ))}
        </div>
      )}

      {failed && (
        <div className="sq-actions">
          <button type="button" className="brick-btn yellow" onClick={onRetry}>
            ↻ TRY AGAIN
          </button>
        </div>
      )}

      <FriendLine text={fb.reaction} />
    </>
  )
}

// =======================================================================
//  PUZZLE 2 — MODERN FAMILY
// =======================================================================

/**
 * The strip stack. Each strip slides by `offset * shear`, so ONE slider
 * value moves all six by different amounts and exactly one value brings
 * them flush. Motion blur falls off as the picture converges, which is the
 * visual feedback the brief asks for — you can always see what you did.
 */
function StripStack({ puzzle, offset, aligned, fps }) {
  const target = puzzle.targetOffset ?? 0
  const err = Math.abs(offset - target)
  const blur = aligned ? 0 : Math.min(4, err * 0.06)
  const vibrating = fps != null && fps >= 999999
  const stuttering = fps === 1

  return (
    <div
      className={
        'fb-strips' +
        (aligned ? ' aligned' : '') +
        (vibrating ? ' vibrating' : '') +
        (stuttering ? ' stuttering' : '')
      }
    >
      {puzzle.strips.map((s, i) => (
        <div
          className="fb-strip"
          key={i}
          style={{
            background: s.bg,
            transform: `translateX(${(offset - target) * s.shear}px)`,
            filter: blur ? `blur(${blur}px)` : 'none',
          }}
        >
          <span className="fb-strip-glyph">{s.glyph}</span>
        </div>
      ))}
      {aligned && <div className="fb-aligned-chip">✓ ALIGNED</div>}
    </div>
  )
}

function DunphyPanel({ fb, onOffset, onFps }) {
  const p = fb.puzzle
  const solved = fb.phase === 'solved'

  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🧠 ALIGN MODERN FAMILY</div>
        <div className="sq-sub">
          {solved
            ? 'Buttery. Phil has never looked smoother.'
            : fb.aligned
              ? 'Now pick a frame rate.'
              : 'Phil is on the ladder again · Slide the strips flush.'}
        </div>
      </div>

      <div className="fb-monitor wide">
        <MonitorHead
          label={p.monitorLabel}
          caption={p.caption}
          status={solved ? '60 FPS' : fb.aligned ? 'ALIGNED' : 'TORN'}
        />
        <StripStack puzzle={p} offset={fb.offset} aligned={fb.aligned} fps={fb.fps} />
      </div>

      <div className="fb-control">
        <div className="fb-control-row">
          <span className="fb-control-label">SHIFT_OFFSET</span>
          <span className="fb-control-value">
            {fb.offset > 0 ? '+' : ''}
            {Math.round(fb.offset)}px
          </span>
        </div>
        {/* A real range input: drag, click-track and arrow keys all work,
            and the browser gives us keyboard accessibility for nothing. */}
        <input
          className="fb-slider"
          type="range"
          min={p.sliderMin ?? -100}
          max={p.sliderMax ?? 100}
          value={fb.offset}
          disabled={solved}
          onChange={(e) => onOffset(Number(e.target.value))}
          aria-label="Shift offset"
        />
        <div className="fb-slider-ends">
          <span>−100px</span>
          <span>+100px</span>
        </div>
      </div>

      <div className={'fb-fps' + (fb.aligned ? '' : ' locked')}>
        <span className="fb-control-label">FRAME_RATE</span>
        <div className="fb-fps-row">
          {p.fpsOptions.map((f) => (
            <button
              type="button"
              key={f}
              className={'fb-fps-btn' + (fb.fps === f ? ' on' : '')}
              disabled={!fb.aligned || solved}
              onClick={() => onFps(f)}
            >
              {f.toLocaleString()} FPS
            </button>
          ))}
        </div>
      </div>

      <FriendLine text={fb.reaction} />
    </>
  )
}

// =======================================================================

export default function Framebuffer({ fb, onPick, onRetry, onOffset, onFps }) {
  if (!fb) return null
  const tone =
    fb.phase === 'solved' ? ' sq-panel-good' : fb.phase === 'failed' ? ' sq-panel-bad' : ''

  return (
    <div className="sq-root">
      <div className={'sq-panel fb-panel' + tone}>
        {fb.kind === 'scranton' ? (
          <ScrantonPanel fb={fb} onPick={onPick} onRetry={onRetry} />
        ) : (
          <DunphyPanel fb={fb} onOffset={onOffset} onFps={onFps} />
        )}
      </div>
    </div>
  )
}
