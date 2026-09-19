import React from 'react'
import { Game, LEVELS, TOTAL_LEVELS } from './game/Game.js'
import HUD from './ui/HUD.jsx'
import MainMenu from './ui/MainMenu.jsx'
import PauseMenu from './ui/PauseMenu.jsx'
import LevelComplete from './ui/LevelComplete.jsx'
import Ending from './ui/Ending.jsx'
import Dialogue from './ui/Dialogue.jsx'
import FoodBuilder from './ui/FoodBuilder.jsx'
import SongQuiz from './ui/SongQuiz.jsx'
import Framebuffer from './ui/Framebuffer.jsx'
/**
 * The dev panel is excluded from production builds at the MODULE level, not
 * merely hidden behind a runtime flag. `import.meta.env.DEV` written bare
 * like this is the one spelling Vite substitutes a literal `false` for, so
 * the dynamic import below is unreachable and DevPanel.jsx never enters the
 * bundle. A runtime `if (DEV)` inside the component is NOT enough — the
 * module still ships, strings and all. Nobody opening the birthday build
 * should find a level-skip menu.
 */
const DevPanel = import.meta.env.DEV
  ? React.lazy(() => import('./ui/DevPanel.jsx'))
  : null
import Cinematic, { Banner } from './ui/Cinematic.jsx'
import gameConfig from './config/gameConfig.js'
import { setSfxEnabled, resumeAudio } from './game/Sound.js'

/**
 * App.jsx — screen flow and the React/canvas boundary.
 *
 * Screens: menu -> playing -> levelComplete -> (next level) ... -> ending.
 * The Game instance lives in a ref and survives re-renders; React only ever
 * reads the snapshots it pushes.
 */

export default function App() {
  const canvasRef = React.useRef(null)
  const gameRef = React.useRef(null)
  // The game opens directly into the world — loading the page IS starting
  // the game. There is no title screen; BIRTHDAY.EXE and the eyes-opening
  // cutscene (level1's own opening beats) are what the player sees first.
  const [screen, setScreen] = React.useState('playing')
  const [state, setState] = React.useState(null)
  const [complete, setComplete] = React.useState(null)
  const [unlocked, setUnlocked] = React.useState(0)
  const [achievements, setAchievements] = React.useState([])
  const [finalStats, setFinalStats] = React.useState({ placed: 0, removed: 0, deaths: 0 })
  // after LevelComplete is dismissed, the level's outro beats play over the
  // world before the next level loads
  const [outro, setOutro] = React.useState(false)
  const [treats, setTreats] = React.useState(new Set())
  // which level to load when the canvas mounts; read by the effect below
  const pendingLevelRef = React.useRef(0)

  setSfxEnabled(gameConfig.sfxEnabled !== false)

  // ---- create the game once the canvas exists -----------------------------
  React.useEffect(() => {
    if (screen !== 'playing' || gameRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new Game(canvas, {
      onState: setState,
      onLevelComplete: (res) => {
        setComplete(res)
        setUnlocked((u) => Math.max(u, Math.min(LEVELS.length - 1, res.levelIndex + 1)))
        setFinalStats({ ...game.counters })
        setTreats(new Set(game.treatsFound))
        game.setPaused(true)
      },
      onAchievement: (name, desc) => {
        setAchievements((prev) => {
          if (prev.some((a) => a.name === name)) return prev
          const card = { name, desc, id: Math.random().toString(36).slice(2) }
          setTimeout(() => {
            setAchievements((cur) => cur.filter((c) => c.id !== card.id))
          }, 4200)
          return [...prev, card]
        })
      },
    })
    gameRef.current = game
    // Dev-only: bolt on level skipping and script fast-forward. The import
    // is unreachable in a production build (see the DevPanel note above), so
    // DevTools.js never enters the bundle.
    if (import.meta.env.DEV) {
      import('./game/DevTools.js').then((m) => m.attachDevTools(game))
    }
    game.loadLevel(pendingLevelRef.current ?? 0)
    game.start()
    resumeAudio()

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [screen])

  const startGame = (levelIndex = 0) => {
    pendingLevelRef.current = levelIndex
    setComplete(null)
    setScreen('playing')
  }

  const backToMenu = () => {
    gameRef.current?.destroy()
    gameRef.current = null
    setState(null)
    setComplete(null)
    setScreen('menu')
  }

  const finishLevel = React.useCallback(() => {
    const game = gameRef.current
    if (!game) return
    setOutro(false)

    // Only route into the birthday-cake Ending once all four worlds exist.
    // Right now Level 1 is the only one built: finishing it should land on
    // its own "NEXT LOCATION" teaser and stop there, not jump to the ending.
    if (game.levelIndex + 1 >= TOTAL_LEVELS) {
      setFinalStats({ ...game.counters })
      setTreats(new Set(game.treatsFound))
      game.destroy()
      gameRef.current = null
      setComplete(null)
      setScreen('ending')
      return
    }
    if (game.levelIndex + 1 >= LEVELS.length) {
      // Built levels ran out before the adventure did — nothing further to
      // load yet. Leave the world exactly as its outro left it (mid
      // "NEXT LOCATION" card) rather than tearing the game down.
      setComplete(null)
      return
    }
    setComplete(null)
    game.nextLevel()
  }, [])

  const onNext = () => {
    const game = gameRef.current
    if (!game) return
    const def = LEVELS[game.levelIndex]
    game.setPaused(false)
    // Play the level's send-off over the world before moving on, so the
    // transition is a scene rather than a screen swap.
    if (def?.outroBeats?.length) {
      setComplete(null)
      setOutro(true)
      game.director.load(def.outroBeats)
      return
    }
    finishLevel()
  }

  // the outro script finishing is what advances us
  React.useEffect(() => {
    if (outro && state?.storyDone) finishLevel()
  }, [outro, state?.storyDone, finishLevel])

  const onReplay = () => {
    const game = gameRef.current
    if (!game) return
    setComplete(null)
    game.setPaused(false)
    game.restartLevel()
  }

  // ---- screens ------------------------------------------------------------
  if (screen === 'menu') {
    return <MainMenu onStart={() => startGame(0)} onPickLevel={startGame} unlocked={unlocked} />
  }

  if (screen === 'ending') {
    return (
      <Ending
        stats={finalStats}
        treats={treats}
        onRestart={() => {
          setUnlocked(0)
          setAchievements([])
          setTreats(new Set())
          backToMenu()
        }}
      />
    )
  }

  // The dev panel takes over the pause overlay while it is open, so the two
  // never stack on top of each other.
  const devOpen = state?.devPanelOpen && !complete
  const paused = state?.paused && !complete && !devOpen

  return (
    <div className="game-root">
      <canvas
        ref={canvasRef}
        className={'game-canvas' + (state?.buildMode ? '' : ' no-build')}
      />

      {state && !complete && (
        <HUD
          state={state}
          onSelect={(k) => {
            gameRef.current?.world.building.select(k)
            gameRef.current?.pushState()
          }}
          onToggleBuild={() => {
            const g = gameRef.current
            if (!g) return
            g.buildMode = !g.buildMode
            g.pushState()
          }}
          onPause={() => gameRef.current?.setPaused(true)}
          onHint={() => {
            const g = gameRef.current
            if (g) g.toast('Hint', LEVELS[g.levelIndex].hint, 'hint', 6)
          }}
        />
      )}

      {/* cinematics: letterbox, boot sequence, next-location card */}
      {state?.cinematic && !complete && <Cinematic cinematic={state.cinematic} />}

      {/* mission / achievement title cards */}
      {state?.banner && !complete && <Banner banner={state.banner} />}

      {/* dialogue */}
      {state?.dialogue && !complete && (
        <Dialogue
          dialogue={state.dialogue}
          onAdvance={() => {
            const g = gameRef.current
            if (!g) return
            g.director.advanceDialogue()
            g.pushState()
          }}
          onChoose={(i) => {
            const g = gameRef.current
            if (!g) return
            g.director.choose(i)
            g.pushState()
          }}
        />
      )}

      {/* shawarma builder */}
      {state?.foodBuilder && !complete && (
        <FoodBuilder
          builder={state.foodBuilder}
          onPick={(i) => {
            const g = gameRef.current
            if (!g) return
            g.director.toggleFoodOption(i)
            g.pushState()
          }}
          onConfirm={() => {
            const g = gameRef.current
            if (!g) return
            g.director.confirmFoodCategory()
            g.pushState()
          }}
          onSkip={() => {
            const g = gameRef.current
            if (!g) return
            g.director.skipFoodCategory()
            g.pushState()
          }}
          onEat={() => {
            const g = gameRef.current
            if (!g) return
            g.director.finishFoodBuilder()
            g.pushState()
          }}
        />
      )}

      {/* guess the song */}
      {state?.songQuiz && !complete && (
        <SongQuiz
          quiz={state.songQuiz}
          onPick={(i) => {
            const g = gameRef.current
            if (!g) return
            g.director.pickSong(i)
            g.pushState()
          }}
          onReplay={() => {
            const g = gameRef.current
            if (!g) return
            g.director.replaySong()
            g.pushState()
          }}
        />
      )}

      {/* de-scramble the show scenes */}
      {state?.framebuffer && !complete && (
        <Framebuffer
          fb={state.framebuffer}
          onPick={(i) => {
            const g = gameRef.current
            if (!g) return
            g.director.pickCodeBlock(i)
            g.pushState()
          }}
          onRetry={() => {
            const g = gameRef.current
            if (!g) return
            g.director.retryFramebuffer()
            g.pushState()
          }}
          onOffset={(v) => {
            const g = gameRef.current
            if (!g) return
            g.director.setStripOffset(v)
            g.pushState()
          }}
          onFps={(f) => {
            const g = gameRef.current
            if (!g) return
            g.director.pickFrameRate(f)
            g.pushState()
          }}
        />
      )}

      {/* achievement pop-ups */}
      <div className="achv">
        {achievements.map((a) => (
          <div className="panel achv-card" key={a.id}>
            <span className="ic">🏆</span>
            <div>
              <div className="nm">{a.name}</div>
              <div className="ds">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {paused && (
        <PauseMenu
          state={state}
          onResume={() => gameRef.current?.setPaused(false)}
          onRestart={() => {
            gameRef.current?.setPaused(false)
            gameRef.current?.restartLevel()
          }}
          onMenu={backToMenu}
        />
      )}

      {complete && (
        <LevelComplete result={complete} treats={treats} onNext={onNext} onReplay={onReplay} />
      )}

      {/* dev tools — DevPanel is null in production, so this never renders */}
      {devOpen && DevPanel && (
        <React.Suspense fallback={null}>
        <DevPanel
          state={state}
          onGotoLevel={(i) => {
            const g = gameRef.current
            if (!g) return
            setComplete(null)
            setOutro(false)
            setUnlocked((u) => Math.max(u, i))
            g.devGotoLevel(i)
          }}
          onSkipMission={(i) => gameRef.current?.devSkipToMission(i)}
          onSkipBeat={() => {
            const g = gameRef.current
            if (!g) return
            g.director.devSkipBeat()
            g.pushState()
          }}
          onClose={() => {
            const g = gameRef.current
            if (!g) return
            g.devPanelOpen = false
            g.setPaused(false)
          }}
        />
        </React.Suspense>
      )}
    </div>
  )
}
