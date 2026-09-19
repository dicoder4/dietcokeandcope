/**
 * Input.js — keyboard + mouse state, kept deliberately dumb.
 *
 * The game reads `input.left` etc. each frame; one-shot actions (rotate,
 * pause) are queued as edges so a held key doesn't fire repeatedly.
 */

export class Input {
  constructor() {
    this.left = false
    this.right = false
    this.up = false
    this.down = false
    this.mouseX = 0
    this.mouseY = 0
    this.mouseInside = false
    this.placeHeld = false
    this.removeHeld = false
    this.edges = [] // one-shot named actions
    this._bound = false
  }

  drainEdges() {
    const e = this.edges
    this.edges = []
    return e
  }

  attach(canvas) {
    if (this._bound) return
    this._bound = true

    const KEYMAP = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
    }

    this.onKeyDown = (e) => {
      const m = KEYMAP[e.code]
      if (m) {
        this[m] = true
        e.preventDefault()
        return
      }
      switch (e.code) {
        case 'KeyR':
          this.edges.push('rotate')
          break
        case 'KeyE':
          this.edges.push('interact')
          break
        case 'KeyX':
          this.edges.push('removeAtCursor')
          break
        case 'KeyQ':
          this.edges.push('clearAll')
          break
        case 'KeyB':
          this.edges.push('toggleBuild')
          break
        case 'Escape':
          this.edges.push('pause')
          break
        case 'Enter':
          this.edges.push('confirm')
          break
        case 'KeyH':
          this.edges.push('hint')
          break
        // ---- dev tools ----
        // Bare `import.meta.env.DEV` so Vite folds this to `false` and drops
        // the whole block from the production bundle. These are ordinary
        // keys a player might well press; queueing dead edges for them in
        // the shipped game would be sloppy.
        case 'Backquote':
        case 'Period':
        case 'KeyN':
          if (import.meta.env.DEV) {
            this.edges.push(
              { Backquote: 'devPanel', Period: 'devSkipBeat', KeyN: 'devSkipLevel' }[e.code]
            )
          }
          break
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
          this.edges.push('slot' + e.code.slice(-1))
          break
        default:
          break
      }
    }

    this.onKeyUp = (e) => {
      const m = KEYMAP[e.code]
      if (m) this[m] = false
    }

    this.onMouseMove = (e) => {
      const r = canvas.getBoundingClientRect()
      this.mouseX = e.clientX - r.left
      this.mouseY = e.clientY - r.top
      this.mouseInside = true
    }

    this.onMouseDown = (e) => {
      if (e.button === 0) {
        this.placeHeld = true
        this.edges.push('place')
      } else if (e.button === 2) {
        this.removeHeld = true
        this.edges.push('remove')
      }
    }

    this.onMouseUp = (e) => {
      if (e.button === 0) this.placeHeld = false
      if (e.button === 2) this.removeHeld = false
    }

    this.onWheel = (e) => {
      this.edges.push(e.deltaY > 0 ? 'nextBlock' : 'prevBlock')
      e.preventDefault()
    }

    this.onContextMenu = (e) => e.preventDefault()
    this.onLeave = () => {
      this.mouseInside = false
      this.placeHeld = false
      this.removeHeld = false
    }
    this.onBlur = () => {
      this.left = this.right = this.up = this.down = false
      this.placeHeld = this.removeHeld = false
    }

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    canvas.addEventListener('contextmenu', this.onContextMenu)
    canvas.addEventListener('mouseleave', this.onLeave)
    this._canvas = canvas
  }

  detach() {
    if (!this._bound) return
    const canvas = this._canvas
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    canvas.removeEventListener('mousemove', this.onMouseMove)
    canvas.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup', this.onMouseUp)
    canvas.removeEventListener('wheel', this.onWheel)
    canvas.removeEventListener('contextmenu', this.onContextMenu)
    canvas.removeEventListener('mouseleave', this.onLeave)
    this._bound = false
  }
}
