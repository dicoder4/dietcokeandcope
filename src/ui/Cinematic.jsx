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
 * The wake-up. Two eyelids close in from top and bottom and then part —
 * a blink the player is on the inside of.
 */
function EyesOpen({ progress }) {
  // 0 -> fully shut, 1 -> fully open. Blink twice on the way.
  const blink = Math.sin(progress * Math.PI * 3) * 0.12
  const lid = Math.max(0, (1 - progress) * 50 + blink * 40)
  return (
    <>
      <div className="cin-lid top" style={{ height: `${lid}%` }} />
      <div className="cin-lid bottom" style={{ height: `${lid}%` }} />
      <div className="cin-blur" style={{ opacity: Math.max(0, 1 - progress * 1.6) }} />
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
