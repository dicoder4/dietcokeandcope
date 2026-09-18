import React from 'react'

/**
 * Cinematic.jsx — everything that sits over the game to make a moment feel
 * like a cut rather than a frame: letterbox bars, the BIRTHDAY.EXE boot
 * sequence, the eyes-opening wipe, and the NEXT LOCATION teaser.
 *
 * All of it is driven by one `cinematic` object in the state snapshot, so
 * the canvas never has to know a cutscene is happening.
 */

function Boot({ lines, shown }) {
  return (
    <div className="cin-boot">
      {lines.slice(0, shown).map((l, i) => (
        <div key={l} className="cin-boot-line" style={{ animationDelay: `${i * 0.02}s` }}>
          <span className="cin-chev">&gt;</span> {l}
        </div>
      ))}
      <span className="cin-cursor" />
    </div>
  )
}

/**
 * The wake-up. Two eyelids sit fully shut, blink twice, then open the rest
 * of the way and stay fully open — the very first thing the player sees.
 *
 * Split into two clean phases instead of one blended formula: a blink phase
 * (lids mostly shut, flickering) and an opening phase (lids sweep 100% -> 0%
 * and stay there). This guarantees the animation reads as *finished* —
 * no residual sliver of eyelid or blur left over at progress = 1.
 */
function EyesOpen({ progress }) {
  const BLINK_END = 0.35 // first ~35% of the beat is the blink
  let lid
  if (progress < BLINK_END) {
    const t = progress / BLINK_END
    // two quick blinks: mostly shut, flickering open and closed
    const flicker = (Math.sin(t * Math.PI * 4) + 1) / 2 // 0..1
    lid = 88 - flicker * 18
  } else {
    const t = (progress - BLINK_END) / (1 - BLINK_END)
    // ease-out sweep from shut to fully open, clamped so it never overshoots
    const eased = 1 - Math.pow(1 - Math.min(1, t), 3)
    lid = Math.max(0, 88 * (1 - eased))
  }
  const blurOpacity = Math.max(0, 1 - progress / 0.7)
  return (
    <>
      <div className="cin-lid top" style={{ height: `${lid}%` }} />
      <div className="cin-lid bottom" style={{ height: `${lid}%` }} />
      {blurOpacity > 0 && <div className="cin-blur" style={{ opacity: blurOpacity }} />}
    </>
  )
}

export default function Cinematic({ cinematic }) {
  if (!cinematic) return null
  const { kind, letterbox, blackout, lines, shown, title, subtitle, progress } = cinematic

  return (
    <div className="cin-root">
      {letterbox && (
        <>
          <div className="cin-bar top" />
          <div className="cin-bar bottom" />
        </>
      )}

      {blackout && <div className="cin-black" />}

      {kind === 'boot' && <Boot lines={lines ?? []} shown={shown ?? 0} />}
      {kind === 'eyesOpen' && <EyesOpen progress={progress ?? 0} />}

      {kind === 'nextLocation' && (
        <div className="cin-next">
          <div className="cin-next-title">{title}</div>
          <div className="cin-next-sub">{subtitle}</div>
        </div>
      )}
    </div>
  )
}

/** The mission / achievement title card that slides in over gameplay. */
export function Banner({ banner }) {
  if (!banner) return null
  return (
    <div className={'cin-banner ' + (banner.kind ?? 'info')}>
      {banner.lines.map((l, i) => (
        <div key={l} className={i === 0 ? 'cin-banner-lead' : 'cin-banner-line'}>
          {l}
        </div>
      ))}
      {banner.sub ? <div className="cin-banner-sub">{banner.sub}</div> : null}
    </div>
  )
}
