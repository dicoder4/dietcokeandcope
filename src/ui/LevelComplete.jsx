import React from 'react'
import gameConfig from '../config/gameConfig.js'
import { rand } from '../config/quips.js'
import { LEVELS } from '../game/Game.js'

export default function LevelComplete({ result, treats, onNext, onReplay }) {
  const [joke] = React.useState(() => rand(gameConfig.insideJokes))
  const rewards = result.rewards?.length ? result.rewards : [`${result.bricksUsed} bricks used`]

  return (
    <div className="overlay">
      <div className="panel card">
        <h2>{result.title}</h2>
        <h1 style={{ fontSize: 'clamp(20px,3.4vw,30px)' }}>{result.message}</h1>

        <div className="stat-grid">
          <div className="stat">
            <div className="v">{result.bricksUsed}</div>
            <div className="k">BRICKS USED</div>
          </div>
          <div className="stat">
            <div className="v">{result.deaths}</div>
            <div className="k">RESPAWNS</div>
          </div>
          <div className="stat">
            <div className="v">
              {result.levelIndex + 1}/{LEVELS.length}
            </div>
            <div className="k">LEVELS DONE</div>
          </div>
        </div>

        <div className="treat-list" style={{ flexWrap: 'wrap', gap: '4px 10px' }}>
          {rewards.map((r) => (
            <span key={r} className="got" style={{ fontSize: 13, letterSpacing: '0.04em' }}>
              {r}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', marginTop: 6 }} className="dim">
          REWARDS
        </p>

        <p className="menu-joke">“{joke}”</p>

        <div className="row">
          <button className="brick-btn green" onClick={onNext}>
            {result.isFinal ? 'FINAL CONSTRUCTION →' : 'NEXT LOCATION →'}
          </button>
          <button className="brick-btn ghost" onClick={onReplay}>
            REPLAY LEVEL
          </button>
        </div>
        {!result.isFinal && (
          <p style={{ fontSize: 11, marginTop: 14 }} className="dim">
            Tip: there is always another way to build it. Try beating it with fewer bricks.
          </p>
        )}
        {treats?.size > 0 && (
          <p style={{ fontSize: 11, marginTop: 6 }} className="dim">
            Optional treats found: {treats.size}
          </p>
        )}
      </div>
    </div>
  )
}
