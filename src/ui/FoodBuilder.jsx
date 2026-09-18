import React from 'react'
import { characterOf } from '../game/Characters.js'

/**
 * FoodBuilder.jsx — the shawarma-construction minigame.
 *
 * A full-screen overlay, same layer as Dialogue but bigger: category tabs
 * across the top, an option grid to click through, Anisha's reaction line
 * under the cards, and a live illustration of the shawarma building up on
 * the side. Finishes on a star-rating results screen with an "EAT
 * SHAWARMA" button.
 *
 * All state lives in `builder` (the Director's `foodBuilder` snapshot) —
 * this component only ever reads it and calls back into the three Director
 * methods that mutate it (toggleFoodOption / confirmFoodCategory /
 * skipFoodCategory / finishFoodBuilder).
 */

function AnishaLine({ text }) {
  const c = characterOf('anisha')
  if (!text) return <div className="fb-reaction fb-reaction-empty">&nbsp;</div>
  return (
    <div className="fb-reaction">
      <span className="fb-reaction-dot" style={{ background: c.shirt }} />
      {text.split('\n').map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  )
}

/** The live shawarma: a wrap outline with stacked bands that fill in as
 * categories are picked. Flat shapes, matches the game's flat-shaded look. */
function ShawarmaPreview({ categories, selections }) {
  const pick = (key) => selections[key] ?? []
  const chickenId = pick('chicken')[0]
  const chickenOpt = categories
    .find((c) => c.key === 'chicken')
    ?.options.find((o) => o.id === chickenId)
  const sauceOpts = (categories.find((c) => c.key === 'sauce')?.options ?? []).filter((o) =>
    pick('sauce').includes(o.id)
  )
  const fillingOpts = (categories.find((c) => c.key === 'fillings')?.options ?? []).filter((o) =>
    pick('fillings').includes(o.id)
  )
  const hasFries = pick('fillings').includes('fries') || pick('extras').includes('extraFries')
  const extraOpts = (categories.find((c) => c.key === 'extras')?.options ?? []).filter((o) =>
    pick('extras').includes(o.id)
  )

  return (
    <div className="fb-preview">
      <svg viewBox="0 0 200 260" className="fb-preview-svg">
        {/* wrap */}
        <path
          d="M40 40 Q100 10 160 40 L160 220 Q100 250 40 220 Z"
          fill="#f2e2b6"
          stroke="#d8c090"
          strokeWidth="3"
        />
        {/* chicken band */}
        {chickenOpt && (
          <rect x="48" y="60" width="104" height="34" rx="10" fill={chickenOpt.color} />
        )}
        {/* sauce drizzle */}
        {sauceOpts.map((o, i) => (
          <path
            key={o.id}
            d={`M55 ${104 + i * 10} Q100 ${94 + i * 10} 145 ${104 + i * 10}`}
            fill="none"
            stroke={o.color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
        {/* filling speckles */}
        {fillingOpts
          .filter((o) => o.id !== 'fries')
          .map((o, i) => (
            <circle
              key={o.id}
              cx={58 + ((i * 23) % 90)}
              cy={140 + Math.floor(i / 4) * 16}
              r="7"
              fill={o.color}
            />
          ))}
        {/* extras speckles, drawn a touch lower/bigger so the stack visibly grows */}
        {extraOpts.map((o, i) => (
          <circle
            key={o.id}
            cx={64 + ((i * 27) % 80)}
            cy={185 + Math.floor(i / 3) * 14}
            r="8"
            fill={o.color}
            opacity="0.9"
          />
        ))}
        {/* fold lines */}
        <path d="M40 40 Q100 10 160 40" fill="none" stroke="#c7ab78" strokeWidth="2" />
        <path d="M40 220 Q100 250 160 220" fill="none" stroke="#c7ab78" strokeWidth="2" />
      </svg>
      {hasFries && <div className="fb-preview-fries">🍟</div>}
    </div>
  )
}

function CategoryPanel({ category, selectedIds, reaction, onPick, onConfirm, onSkip }) {
  return (
    <>
      <div className="fb-cat-head">
        <div className="fb-cat-title">{category.title}</div>
        {category.subtitle && <div className="fb-cat-sub">{category.subtitle}</div>}
      </div>

      <div className="fb-options">
        {category.options.map((o, i) => {
          const on = selectedIds.includes(o.id)
          return (
            <button
              type="button"
              key={o.id}
              className={'fb-option' + (on ? ' on' : '')}
              onClick={() => onPick(i)}
            >
              {category.multi && <span className="fb-check">{on ? '✓' : ''}</span>}
              <span className="fb-emoji">{o.emoji}</span>
              <span className="fb-label">{o.label}</span>
            </button>
          )
        })}
      </div>

      <AnishaLine text={reaction} />

      {category.multi && (
        <div className="fb-actions">
          {category.optional && (
            <button type="button" className="brick-btn ghost" onClick={onSkip}>
              SKIP
            </button>
          )}
          <button
            type="button"
            className="brick-btn green"
            onClick={onConfirm}
            disabled={!category.optional && selectedIds.length === 0}
          >
            NEXT →
          </button>
        </div>
      )}
    </>
  )
}

function Stars({ n }) {
  return (
    <span className="fb-stars">
      {'★'.repeat(n)}
      <span className="fb-stars-off">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

const CATEGORY_RESULT_LABEL = {
  chicken: 'CHICKEN',
  sauce: 'SAUCE',
  fillings: 'SIDES',
  extras: 'EXTRAS',
  drink: 'DRINK',
}

function ResultsPanel({ categories, results, onEat }) {
  return (
    <>
      <div className="fb-cat-head">
        <div className="fb-cat-title">SHAWARMA COMPLETE</div>
      </div>
      <div className="fb-results">
        {categories.map((c) => (
          <div className="fb-result-row" key={c.key}>
            <span className="fb-result-label">{CATEGORY_RESULT_LABEL[c.key] ?? c.key}</span>
            <Stars n={results.stars[c.key] ?? 3} />
          </div>
        ))}
        <div className="fb-result-row fb-result-overall">
          <span className="fb-result-label">OVERALL</span>
          <Stars n={results.overall} />
        </div>
        <div className="fb-result-joke">MESS LEVEL: {results.messLevel}%</div>
        <div className="fb-result-joke">SAUCE CHAOS: {results.sauceChaos}</div>
      </div>
      <div className="fb-actions">
        <button type="button" className="brick-btn yellow" onClick={onEat}>
          🌯 EAT SHAWARMA
        </button>
      </div>
    </>
  )
}

export default function FoodBuilder({ builder, onPick, onConfirm, onSkip, onEat }) {
  if (!builder) return null
  const { categories, categoryIndex, selections, reaction, results } = builder
  const cat = categories[categoryIndex]

  return (
    <div className="fb-root">
      <div className="fb-panel">
        <div className="fb-dots">
          {categories.map((c, i) => (
            <span
              key={c.key}
              className={
                'fb-dot' +
                (i === categoryIndex && !results ? ' on' : '') +
                (i < categoryIndex || results ? ' done' : '')
              }
            />
          ))}
        </div>

        <div className="fb-body">
          <div className="fb-left">
            {results ? (
              <ResultsPanel categories={categories} results={results} onEat={onEat} />
            ) : (
              <CategoryPanel
                category={cat}
                selectedIds={selections[cat.key] ?? []}
                reaction={reaction}
                onPick={onPick}
                onConfirm={onConfirm}
                onSkip={onSkip}
              />
            )}
          </div>
          <div className="fb-right">
            <ShawarmaPreview categories={categories} selections={selections} />
          </div>
        </div>
      </div>
    </div>
  )
}
