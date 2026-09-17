import React from 'react'
import { characterOf } from '../game/Characters.js'

/**
 * Dialogue.jsx — the speech box.
 *
 * Typewriter text, a portrait, and either a "continue" affordance or a list
 * of choices. Clicking anywhere on the box finishes the typewriter first and
 * advances second, which is the convention every console game uses and the
 * one people reach for without being told.
 */

const CHAR_MS = 22

function Portrait({ id }) {
  const c = characterOf(id)
  const [src, setSrc] = React.useState(null)

  React.useEffect(() => {
    if (!id) return
    let live = true
    const base = import.meta.env?.BASE_URL ?? '/'
    const url = `${base}faces/${id}.png`.replace('//faces', '/faces')
    const img = new Image()
    img.onload = () => live && setSrc(url)
    img.onerror = () => live && setSrc(null)
    img.src = url
    return () => {
      live = false
    }
  }, [id])

  return (
    <div className="dlg-portrait" style={{ background: c.shirt, borderColor: c.shirtAlt }}>
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span className="dlg-initial" style={{ color: '#fff' }}>
          {c.name.slice(0, 1)}
        </span>
      )}
    </div>
  )
}

export default function Dialogue({ dialogue, onAdvance, onChoose }) {
  const { text, name, portraitId, options } = dialogue
  const [typed, setTyped] = React.useState(0)

  // restart the typewriter whenever the line changes
  React.useEffect(() => {
    setTyped(0)
    if (!text) return
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= text.length) {
          clearInterval(id)
          return n
        }
        return n + 1
      })
    }, CHAR_MS)
    return () => clearInterval(id)
  }, [text])

  const full = !text || typed >= text.length

  const advance = React.useCallback(() => {
    if (!full) {
      setTyped(text.length) // first click: finish the line
      return
    }
    if (!options) onAdvance()
  }, [full, text, options, onAdvance])

  // keyboard: Enter/Space steps a line, 1-4 pick an option
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        advance()
        return
      }
      const m = /^Digit([1-9])$/.exec(e.code)
      if (m && options) {
        const i = Number(m[1]) - 1
        if (i < options.length) onChoose(i)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, options, onChoose])

  return (
    <div className="dlg-wrap">
      <button
        type="button"
        className="dlg-box"
        onClick={advance}
        aria-label={options ? 'Dialogue' : 'Continue'}
      >
        <Portrait id={portraitId} />
        <div className="dlg-body">
          <div className="dlg-name">{name}</div>
          {text && (
            <div className="dlg-text">
              {text.slice(0, typed)}
              {!full && <span className="dlg-caret" />}
            </div>
          )}
          {!options && full && <div className="dlg-next">▾ CONTINUE</div>}
        </div>
      </button>

      {options && full && (
        <div className="dlg-options">
          {options.map((o, i) => (
            <button
              key={o}
              type="button"
              className="dlg-option"
              onClick={() => onChoose(i)}
            >
              <span className="dlg-optnum">{i + 1}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
