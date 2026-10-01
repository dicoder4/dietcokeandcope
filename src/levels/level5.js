/**
 * LEVEL 5 — THE FINAL QUEST / EMOTIONAL ENDING
 * 
 * Flow:
 * Final World Complete → Quiet Transition → Familiar College Location → Friends Appear 
 * → Memory Flashes → All Friends Together → Final Quest → Birthday Reveal 
 * → Real Photo Montage → Friend Messages → Final Group Photo → Game Complete.
 */

import LEVEL5_CONFIG from '../config/level5Config.js'

const map = [
    '.................................',
    '.................................',
    '.................................',
    '.................................',
    '.................................',
    '.................................',
    '.................................',
    '#...............................#',
    '#...............................#',
    '#.P.............................#',
    '#################################',
    '#################################',
    '#################################',
]

const level5 = {
    id: 5,
    name: 'THE FINAL QUEST',
    location: 'MSRIT CAMPUS — NOSTALGIC EVENING',
    objective: 'Find out where everyone is',
    hint: 'Look around the campus courtyard.',
    mechanic: 'story',
    teaches: 'FRIENDSHIP',
    map,

    // Warm golden evening sunset aesthetic
    skyTop: '#e66b3b',
    skyBottom: '#2d1b36',
    interior: false,
    shell: 'campus',
    floor: { color: '#4a3b32', colorDark: '#2f241e', colorTop: '#5c4a3f' },
    floorAlt: { color: '#524238', colorDark: '#362a23', colorTop: '#665346' },

    props: [
        { type: 'steelCounter', x: 4, y: 9, w: 2 },
        { type: 'spiceRack', x: 5, y: 9 },
        { type: 'cuttingBoard', x: 8, y: 9, color: '#8bd24f' },
        { type: 'biryaniPot', x: 15, y: 9 },
        { type: 'steelCounter', x: 22, y: 9, w: 2 },
        { type: 'knifeBlock', x: 25, y: 9 },
    ],

    // All 5 friends from previous levels (initially hidden, popping up naturally)
    npcs: [
        { id: 'anisha', x: 8, y: 9, facing: 1, hidden: true },
        { id: 'diya', x: 22, y: 9, facing: -1, hidden: true },
        { id: 'lord', x: 12, y: 9, facing: 1, hidden: true },
        { id: 'chirantan', x: 17, y: 9, facing: -1, hidden: true },
        { id: 'amogh', x: 19, y: 9, facing: -1, hidden: true },
    ],

    inventory: {},
    collectibles: [],
    goals: [],

    completeTitle: 'ALL WORLDS COMPLETE',
    completeMessage: '🎂 HAPPY BIRTHDAY ADITYA ❤️',
    rewards: ['+100% MEMORIES', 'FRIENDSHIP: MAX', 'LEVEL 22 UNLOCKED'],

    // ======================================================================
    // THE SCRIPT
    // ======================================================================
    beats: [
        // ---- COLD TRANSITION ------------------------------------------------
        { t: 'letterbox', on: true },
        { t: 'banner', lines: ['ALL WORLDS COMPLETE.'], sub: '', kind: 'good', dur: 2.2, sound: false },
        { t: 'sting', kind: 'dramaticVictory', shake: 0.2 },
        { t: 'banner', lines: ['YOU MADE IT.'], sub: '✨', kind: 'good', dur: 2.0, sound: false },
        { t: 'banner', lines: ['LEVEL 5'], sub: '', kind: 'info', dur: 1.4, sound: false },
        { t: 'banner', lines: ['THE FINAL QUEST'], sub: '🌅', kind: 'info', dur: 2.2, sound: false },

        { t: 'camera', focus: { x: 15, y: 8 }, zoom: 0.65, dur: 3.2, ease: 0.03 },
        { t: 'camera', focus: 'player', zoom: 1.1, dur: 1.8, ease: 0.05, track: true },
        { t: 'cameraRelease' },
        { t: 'letterbox', on: false },

        // ---- QUIET TRANSITION & PLAYER MONOLOGUE ----------------------------
        { t: 'control', on: true },
        {
            t: 'mission',
            icon: '🏛️',
            title: 'CAMPUS COURTYARD',
            text: 'The evening is quiet. Where is everyone?',
            dur: 2.8,
            control: true,
        },
        { t: 'waitFor', cond: 'playerReachedX', x: 7 },
        { t: 'control', on: false },
        { t: 'react', who: 'player', reaction: 'confused' },
        { t: 'say', who: 'player', text: 'Where is everyone?' },
        { t: 'wait', dur: 0.8 },
        { t: 'say', who: 'player', text: 'Did everyone already head home...?' },
        { t: 'wait', dur: 1.0 },

        // ---- FRIEND 1: ANISHA APPEARS (SHAWARMA / DIET COKE) -----------------
        { t: 'npcShow', id: 'anisha', x: 8, y: 9, facing: 1 },
        { t: 'sting', kind: 'select' },
        { t: 'react', who: 'anisha', reaction: 'happy' },
        { t: 'react', who: 'player', reaction: 'surprised' },
        { t: 'camera', focus: { x: 10, y: 8 }, zoom: 1.25, dur: 1.0 },
        { t: 'say', who: 'anisha', text: 'Did you really think we would leave without saying goodbye? 😄' },
        { t: 'react', who: 'anisha', reaction: 'excited' },
        { t: 'say', who: 'anisha', text: LEVEL5_CONFIG.memoryCallbacks[0].text },
        { t: 'wait', dur: 1.0 },

        // ---- FRIEND 2: DIYA APPEARS (METRO / MUSIC) -----------------------
        { t: 'npcShow', id: 'diya', x: 22, y: 9, facing: -1 },
        { t: 'sting', kind: 'metroChime' },
        { t: 'react', who: 'diya', reaction: 'hearts' },
        { t: 'camera', focus: { x: 18, y: 8 }, zoom: 1.15, dur: 1.0 },
        { t: 'npcWalk', id: 'diya', to: 19, face: -1 },
        { t: 'say', who: 'diya', text: 'We’ve been planning this surprise the whole time!' },
        { t: 'say', who: 'diya', text: LEVEL5_CONFIG.memoryCallbacks[1].text },
        { t: 'headphones', who: 'diya', on: true },
        { t: 'wait', dur: 1.0 },

        // ---- FRIEND 3: LORD APPEARS (GYM / PC / C++) ----------------------
        { t: 'npcShow', id: 'lord', x: 12, y: 9, facing: 1 },
        { t: 'sting', kind: 'dramaticVictory' },
        { t: 'react', who: 'lord', reaction: 'victory' },
        { t: 'say', who: 'lord', text: 'Bro! Did you think you were soloing this final quest?' },
        { t: 'say', who: 'lord', text: LEVEL5_CONFIG.memoryCallbacks[2].text },
        { t: 'wait', dur: 1.0 },

        // ---- FRIENDS 4 & 5: CHIRANTAN & AMOGH (KITCHEN / BIRYANI) ----------
        { t: 'npcShow', id: 'chirantan', x: 16, y: 9, facing: -1 },
        { t: 'npcShow', id: 'amogh', x: 14, y: 9, facing: 1 },
        { t: 'sting', kind: 'panClang', shake: 0.3 },
        { t: 'react', who: 'chirantan', reaction: 'hearts' },
        { t: 'react', who: 'amogh', reaction: 'smirk' },
        { t: 'say', who: 'chirantan', text: 'Macha! We brought the kitchen crew!' },
        { t: 'say', who: 'amogh', text: 'Even if you made us vegetarian biryani... you are still our favorite engineer.' },
        { t: 'say', who: 'chirantan', text: LEVEL5_CONFIG.memoryCallbacks[3].text },
        { t: 'wait', dur: 1.2 },

        // ---- ALL FRIENDS TOGETHER ------------------------------------------
        { t: 'camera', focus: { x: 14, y: 8 }, zoom: 0.9, dur: 1.8 },
        { t: 'react', who: 'player', reaction: 'hearts' },
        { t: 'react', who: 'anisha', reaction: 'hearts' },
        { t: 'react', who: 'diya', reaction: 'happy' },
        { t: 'react', who: 'lord', reaction: 'victory' },
        { t: 'react', who: 'chirantan', reaction: 'hearts' },
        { t: 'react', who: 'amogh', reaction: 'excited' },
        { t: 'wait', dur: 1.4 },

        // ---- STAT SUMMARY OVERLAY ------------------------------------------
        { t: 'banner', lines: ['ALL MISSIONS COMPLETE'], sub: '✨', kind: 'good', dur: 2.2, sound: false },
        { t: 'banner', lines: ['MEMORIES RECOVERED: 100%'], sub: '🧠 ❤️', kind: 'good', dur: 2.2, sound: false },
        { t: 'banner', lines: ['FRIENDSHIP LEVEL: MAX'], sub: '⭐ ⭐ ⭐ ⭐ ⭐', kind: 'good', dur: 2.2, sound: false },
        { t: 'banner', lines: ['PLAYER LEVEL: 22'], sub: '🎉', kind: 'good', dur: 2.2, sound: false },
        { t: 'wait', dur: 1.0 },

        // ---- FINAL QUEST: LOOK BEHIND YOU. ---------------------------------
        { t: 'letterbox', on: true },
        { t: 'sting', kind: 'dramaticVictory', shake: 0.4 },
        {
            t: 'banner',
            lines: ['FINAL QUEST: LOOK BEHIND YOU.'],
            sub: '👀 ❤️',
            kind: 'good',
            dur: 3.2,
            sound: false,
        },
        { t: 'wait', dur: 1.6 },

        // ---- BIRTHDAY REVEAL -----------------------------------------------
        { t: 'camera', focus: { x: 14, y: 7 }, zoom: 1.35, dur: 2.0, ease: 0.03 },
        { t: 'particles', x: 14, y: 8, color: '#ffcf5c', count: 64, spread: 3.5 },
        { t: 'particles', x: 14, y: 8, color: '#e8456b', count: 48, spread: 3.0 },
        { t: 'sting', kind: 'fanfare', shake: 0.5 },
        {
            t: 'banner',
            lines: [LEVEL5_CONFIG.birthdayRevealTitle],
            sub: LEVEL5_CONFIG.birthdayRevealSub,
            kind: 'good',
            dur: 3.8,
            sound: false,
        },
        { t: 'react', who: 'player', reaction: 'victory' },
        { t: 'react', who: 'anisha', reaction: 'victory' },
        { t: 'react', who: 'diya', reaction: 'victory' },
        { t: 'react', who: 'lord', reaction: 'victory' },
        { t: 'react', who: 'chirantan', reaction: 'hearts' },
        { t: 'react', who: 'amogh', reaction: 'excited' },
        { t: 'wait', dur: 2.4 },

        // ---- HANDOVER TO MONTAGE -------------------------------------------
        { t: 'level5Montage' },
    ],

    outroBeats: [
        { t: 'complete' },
    ],
}

export default level5
