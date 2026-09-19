import React from 'react'
import { characterOf } from '../game/Characters.js'

/**
 * SongQuiz.jsx — 🎧 GUESS THE SONG, Level 2's minigame.
 *
 * Structural twin of FoodBuilder.jsx: a full-screen overlay that owns no
 * state of its own. Everything it draws comes from the Director's `songQuiz`
 * snapshot, and every interaction goes back through two Director methods
 * (pickSong / replaySong). The beat in Beats.js is the state machine.
 *
 * Three phases, one per screen:
 *   playing   — equaliser bars + a countdown while the clip runs
 *   answering — the four choices, A-D
 *   result    — ✓ / ✗ and whatever Diya has to say about it
 */

const LETTERS = ['A', 'B', 'C', 'D']

/** Diya's line, styled to match Anisha's in the shawarma builder. */
function FriendLine({ text, who = 'diya' }) {
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

/**
 * The equaliser. Purely decorative — the bars are CSS-animated with
 * staggered delays rather than driven off real audio analysis, which keeps
 * this component free of any dependency on how the sound is produced (a
 * real clip and a synth fallback look identical here, as they should).
 */
function Equalizer() {
  return (
    <div className="sq-bars" aria-hidden="true">
      {Array.from({ length: 13 }, (_, i) => (
        <span className="sq-bar" key={i} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

function PlayingPanel({ round, onReplay }) {
  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🎧 GUESS THE SONG</div>
        <div className="sq-sub">Listen…</div>
      </div>

      <Equalizer />

      <FriendLine text={round.taunt} />

      <div className="sq-actions">
        <button type="button" className="brick-btn ghost" onClick={onReplay}>
          ↻ AGAIN
        </button>
      </div>
    </>
  )
}

function AnsweringPanel({ round, onPick }) {
  return (
    <>
      <div className="sq-head">
        <div className="sq-title">🎧 GUESS THE SONG</div>
        <div className="sq-sub">Which one was it?</div>
      </div>

      <div className="sq-choices">
        {round.choices.map((c, i) => (
          <button
            type="button"
            key={c.id}
            className="sq-choice"
            onClick={() => onPick(i)}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="sq-letter">{LETTERS[i]}</span>
            <span className="sq-choice-label">{c.label}</span>
            <span className="sq-key">{i + 1}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function ResultPanel({ round, quiz }) {
  const right = quiz.wasCorrect
  const answer = round.choices.find((c) => c.id === round.correct)
  return (
    <>
      <div className="sq-head">
        <div className={'sq-verdict ' + (right ? 'good' : 'bad')}>
          {right ? '✓ CORRECT' : '✗ WRONG'}
        </div>
        {right ? (
          <div className="sq-xp">+10 MUSIC XP</div>
        ) : (
          <div className="sq-sub">It was {answer?.label}.</div>
        )}
      </div>

      <FriendLine text={quiz.reaction} />
    </>
  )
}

export default function SongQuiz({ quiz, onPick, onReplay }) {
  if (!quiz) return null
  const { rounds, roundIndex, phase } = quiz
  const round = rounds[roundIndex]
  if (!round) return null

  return (
    <div className="sq-root">
      <div className={'sq-panel' + (phase === 'result' ? ' sq-panel-' + (quiz.wasCorrect ? 'good' : 'bad') : '')}>
        <div className="sq-dots">
          {rounds.map((r, i) => (
            <span
              key={r.id}
              className={
                'sq-dot' + (i === roundIndex ? ' on' : '') + (i < roundIndex ? ' done' : '')
              }
            />
          ))}
          <span className="sq-round">
            ROUND {roundIndex + 1}/{rounds.length}
          </span>
        </div>

        <div className="sq-body">
          {phase === 'playing' && <PlayingPanel round={round} onReplay={onReplay} />}
          {phase === 'answering' && <AnsweringPanel round={round} onPick={onPick} />}
          {phase === 'result' && <ResultPanel round={round} quiz={quiz} />}
        </div>
      </div>
    </div>
  )
}
