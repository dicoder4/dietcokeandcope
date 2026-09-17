import React from 'react'
import gameConfig from '../config/gameConfig.js'
import { LEVELS } from '../game/Game.js'
import { rand } from '../config/quips.js'

export default function MainMenu({ onStart, onPickLevel, unlocked }) {
  const [joke] = React.useState(() => rand(gameConfig.insideJokes))

  return (
    <div className="overlay">
      <div className="panel card">
        <h1 className="menu-logo">
          SHAWARMA
          <br />
          GEDDOT
        </h1>
        <p className="menu-sub">A BIRTHDAY ADVENTURE FOR {gameConfig.playerName}</p>

        <p className="menu-tag">
          You cannot jump. You cannot climb. You cannot fight.
          <br />
          You can <b>build</b>, and you have a shawarma to find.
          <br />
          That is most of the game.
        </p>

        <div className="row">
          <button className="brick-btn yellow" onClick={onStart}>
            START
          </button>
        </div>

        <div className="level-pick">
          {LEVELS.map((l, i) => (
            <button
              key={l.id}
              className={'level-chip' + (i > unlocked ? ' locked' : '')}
              disabled={i > unlocked}
              onClick={() => onPickLevel(i)}
            >
              {i > unlocked ? '🔒' : '🧱'} {i + 1}. {l.name}
            </button>
          ))}
        </div>

        <div className="ctrl-table">
          <div>
            <kbd>A</kbd>
            <kbd>D</kbd> walk
          </div>
          <div>
            <kbd>LMB</kbd> place brick
          </div>
          <div>
            <kbd>RMB</kbd> remove brick
          </div>
          <div>
            <kbd>R</kbd> rotate brick
          </div>
          <div>
            <kbd>1-6</kbd> pick brick
          </div>
          <div>
            <kbd>wheel</kbd> cycle bricks
          </div>
          <div>
            <kbd>Q</kbd> reclaim all
          </div>
          <div>
            <kbd>B</kbd> build / walk mode
          </div>
          <div>
            <kbd>H</kbd> hint
          </div>
          <div>
            <kbd>ESC</kbd> pause
          </div>
        </div>

        <p className="menu-joke">“{joke}”</p>
      </div>
    </div>
  )
}
