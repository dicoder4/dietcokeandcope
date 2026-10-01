import React, { useState, useEffect } from 'react'
import gameConfig from '../config/gameConfig.js'
import LEVEL5_CONFIG from '../config/level5Config.js'
import { sfx, resumeAudio } from '../game/Sound.js'

export default function Level5Montage({ onRestart }) {
    const [photoIndex, setPhotoIndex] = useState(0)
    const [stage, setStage] = useState('montage') // 'montage' | 'group' | 'final'
    const [autoPlay, setAutoPlay] = useState(true)

    const photos = LEVEL5_CONFIG.montagePhotos || []
    const groupPhoto = LEVEL5_CONFIG.groupPhoto
    const finalScreen = LEVEL5_CONFIG.finalScreen

    // Auto-advance photos in montage stage
    useEffect(() => {
        if (stage !== 'montage' || !autoPlay) return
        const timer = setTimeout(() => {
            if (photoIndex < photos.length - 1) {
                setPhotoIndex((i) => i + 1)
            } else {
                setStage('group')
                sfx.fanfare()
            }
        }, 3800)
        return () => clearTimeout(timer)
    }, [stage, photoIndex, autoPlay, photos.length])

    const nextPhoto = () => {
        resumeAudio()
        sfx.select()
        if (photoIndex < photos.length - 1) {
            setPhotoIndex((i) => i + 1)
        } else {
            setStage('group')
            sfx.fanfare()
        }
    }

    const prevPhoto = () => {
        resumeAudio()
        sfx.select()
        if (photoIndex > 0) {
            setPhotoIndex((i) => i - 1)
        }
    }

    const currentPhoto = photos[photoIndex] || photos[0]

    return (
        <div className="ending-root level5-montage-root">
            <div className="montage-backdrop" />

            {/* ---- STAGE 1: REAL PHOTO MONTAGE ---- */}
            {stage === 'montage' && currentPhoto && (
                <div className="montage-card">
                    <div className="montage-header">
                        <span className="montage-badge">REAL-LIFE MEMORY FLASH</span>
                        <span className="montage-counter">
                            {photoIndex + 1} / {photos.length}
                        </span>
                    </div>

                    <div className="montage-frame">
                        <img
                            key={currentPhoto.src}
                            src={currentPhoto.src}
                            alt={currentPhoto.caption}
                            className="montage-img"
                        />
                        <div className="montage-glow" />
                    </div>

                    <div className="montage-caption-box">
                        <p className="montage-caption">"{currentPhoto.caption}"</p>
                        <p className="montage-author">— {currentPhoto.author}</p>
                    </div>

                    <div className="montage-progress-bar">
                        <div
                            className="montage-progress-fill"
                            style={{ width: `${((photoIndex + 1) / photos.length) * 100}%` }}
                        />
                    </div>

                    <div className="montage-controls">
                        <button
                            className="brick-btn"
                            onClick={prevPhoto}
                            disabled={photoIndex === 0}
                        >
                            ◀ PREV
                        </button>
                        <button
                            className="brick-btn yellow"
                            onClick={() => setAutoPlay(!autoPlay)}
                        >
                            {autoPlay ? '⏸ PAUSE' : '▶ PLAY'}
                        </button>
                        <button className="brick-btn yellow" onClick={nextPhoto}>
                            NEXT ▶
                        </button>
                        <button
                            className="brick-btn"
                            onClick={() => setStage('group')}
                            style={{ marginLeft: 'auto' }}
                        >
                            SKIP TO FINALE ⏩
                        </button>
                    </div>
                </div>
            )}

            {/* ---- STAGE 2: FINAL GROUP PHOTO ---- */}
            {stage === 'group' && (
                <div className="montage-card group-photo-card">
                    <div className="montage-badge">BEST GROUP PHOTO</div>
                    <h2 className="group-title">{groupPhoto.title}</h2>

                    <div className="montage-frame group-frame">
                        <img
                            src={groupPhoto.src}
                            alt="Final Group Photo"
                            className="group-img"
                        />
                    </div>

                    <div className="group-messages">
                        {groupPhoto.lines.map((line, idx) => (
                            <h3 key={idx} className="group-line">
                                {line}
                            </h3>
                        ))}
                    </div>

                    <button
                        className="brick-btn yellow big-btn"
                        onClick={() => {
                            sfx.fanfare()
                            setStage('final')
                        }}
                    >
                        VIEW FINAL GAME STATUS ▶
                    </button>
                </div>
            )}

            {/* ---- STAGE 3: GAME COMPLETE FINAL SCREEN ---- */}
            {stage === 'final' && (
                <div className="ending-ui final-screen-card">
                    <div className="ending-prompt">FINAL QUEST COMPLETE</div>
                    <h1 className="ending-title">{finalScreen.title}</h1>

                    <div className="final-stats-box">
                        <div className="final-stat-row">
                            <span className="stat-label">STATUS</span>
                            <span className="stat-val highlight">{finalScreen.memories}</span>
                        </div>
                        <div className="final-stat-row">
                            <span className="stat-label">FRIENDSHIP</span>
                            <span className="stat-val highlight">{finalScreen.friendship}</span>
                        </div>
                        <div className="final-stat-row">
                            <span className="stat-label">PLAYER LEVEL</span>
                            <span className="stat-val">
                                LEVEL {gameConfig.birthdayAge ?? 22}
                            </span>
                        </div>
                        <div className="final-stat-row boss-joke">
                            <span className="stat-label">NEXT OBJECTIVE</span>
                            <span className="stat-val boss">{finalScreen.bossJoke}</span>
                        </div>
                    </div>

                    <div className="final-completion-banner">
                        <span className="complete-emoji">🏆</span>
                        <span className="complete-text">{finalScreen.status}</span>
                    </div>

                    <p className="ending-sig">{gameConfig.signature}</p>

                    <div className="row" style={{ marginTop: 24, gap: 16 }}>
                        <button
                            className="brick-btn yellow"
                            onClick={() => {
                                setPhotoIndex(0)
                                setStage('montage')
                            }}
                        >
                            🔄 REPLAY MONTAGE
                        </button>
                        <button className="brick-btn" onClick={onRestart}>
                            🏠 MAIN MENU
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
