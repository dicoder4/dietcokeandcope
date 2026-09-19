/**
 * LEVEL 3 — BUILD THE ULTIMATE SETUP
 * A room that is somehow a gym, a PC building lab and a graphics workspace
 * at the same time. Nobody has explained why. Nobody is going to.
 *
 * ============================================================
 *  THE RUNNING GAG — the one required answer
 * ============================================================
 *
 * The Lord bursts in and asks if he wants to build a PC. The player gets
 * four ways to say yes, and only the loudest, most over-the-top one —
 * "YEAHH LESGO I LOVE YOU SO MUCH" — actually advances the script. The
 * other three are all enthusiastic too; they are just not enthusiastic
 * ENOUGH for her, so she rejects them and asks again.
 *
 * The joke is the escalation, not reluctance. He is never annoyed to see
 * her and never resists — the game simply will not accept anything short
 * of maximum energy, and she is delighted about it. He calls the line back
 * himself at the end of the level, meaning it.
 *
 * Keep every option affectionate. Nothing here plays him as put-upon.
 * The `choice` beat's re-ask behaviour (wrong answers replay their joke
 * and ask again) is what makes this land — it is load-bearing.
 *
 * ============================================================
 *
 * She then says "but first" and points at the gym. THE GYM IS A BLUFF. She
 * has no intention of making him work out. The actual toll is a graphics
 * challenge: two scrambled sitcom framebuffers (The Office, Modern Family)
 * that have to be de-scrambled. Do not rewrite this into an exercise
 * minigame — the gym is scenery and the player never lifts anything.
 *
 * DESIGN: Level 1's thesis was "you cannot jump, so you must build".
 * Level 2's was "you cannot find what you are wearing". This one's is
 * "you cannot be normal about this" — mechanically true, because the
 * dialogue will not advance until he goes all in.
 *
 * WHY HP: Level 1 gave HP, Level 2 gave HAPPINESS, and this one is back to
 * HP on purpose — the gym setting makes it the natural stat even though he
 * never actually exercises, which is itself the joke. There is NO happiness
 * award in this level. See the award beat near the end.
 *
 * Map legend: # terrain (gym floor), . empty, P player start
 *
 * Column landmarks:
 *   x2       the door he comes in through
 *   x5-15    THE GYM HALF — rack, bench, barbell, protein, mirror
 *   x16      where the Lord ambushes him
 *   x18-30   THE LAB HALF — desks, monitors, components, RGB
 *   x26      the ultimate rig, revealed once both framebuffers are fixed
 */

import { SCRANTON_PUZZLE, DUNPHY_PUZZLE } from '../config/framebuffers.js'

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

const level3 = {
  id: 3,
  name: 'BUILD THE ULTIMATE SETUP',
  location: 'THE GYM — ALSO SOMEHOW A PC LAB',
  objective: 'Build the ultimate setup',
  hint: 'You do not have to lift anything. You have to render something.',
  mechanic: 'story',
  teaches: 'GRAPHICS',
  map,

  // Windowless, underlit, and faintly purple from all the RGB.
  skyTop: '#1d1832',
  skyBottom: '#120f1e',
  interior: true,
  // NOT the metro. `shell: 'gym'` swaps the carriage walls for mirrors and
  // pegboard, drops the yellow safety line off the floor, and stops the
  // whole scene rocking like a moving train. See Renderer.drawGymShell.
  shell: 'gym',
  floor: { color: '#2f3442', colorDark: '#20242e', colorTop: '#3d4353' },
  floorAlt: { color: '#343a49', colorDark: '#242835', colorTop: '#444b5d' },

  // No startStats: he keeps the meters he earned in Levels 1 and 2.

  props: [
    // ---- the gym half ----
    { type: 'rgbStrip', x: 4, y: 9 },
    { type: 'dumbbellRack', x: 6, y: 9 },
    { type: 'proteinBottle', x: 8, y: 9, color: '#7ee08a' },
    { type: 'proteinBottle', x: 9, y: 9, color: '#e0a35c' },
    { type: 'benchPress', x: 11, y: 9 },
    { type: 'barbell', x: 14, y: 9 },
    { type: 'gymMirror', x: 15, y: 9 },

    // ---- the lab half ----
    { type: 'rgbStrip', x: 17, y: 9 },
    { type: 'monitorDesk', x: 20, y: 9, screens: 2 },
    { type: 'gpuShelf', x: 23, y: 9 },
    { type: 'ramStick', x: 24, y: 9, color: '#b07be0' },
    { type: 'ramStick', x: 25, y: 9, color: '#5ce1e6' },
    { type: 'pcCase', x: 26, y: 9 },
    { type: 'coolingFan', x: 28, y: 9 },
    { type: 'monitorDesk', x: 30, y: 9, screens: 3 },
    { type: 'rgbStrip', x: 31, y: 9 },
  ],

  // She is hidden at the start and bursts in — see the npcShow beat.
  npcs: [{ id: 'lord', x: 19, y: 9, facing: -1, hidden: true }],

  // No bricks in this level either.
  inventory: {},
  collectibles: [],

  // The finished rig. Hidden until both framebuffers are de-scrambled,
  // because the build is the REWARD for the graphics work, not a thing he
  // wanders over to and finds.
  goals: [{ x: 26, y: 9, emoji: '🖥️', label: 'ULTIMATE PC', hidden: true }],

  completeTitle: 'MISSION COMPLETE',
  completeMessage: '💻 ULTIMATE SETUP BUILT',
  rewards: ['+50 HP', '+100 XP', '+1 CUSTOM PC', '+GRAPHICS XP'],

  // ======================================================================
  // THE SCRIPT
  // ======================================================================
  beats: [
    // ---- arrival --------------------------------------------------------
    { t: 'gymAmbience', on: true },
    { t: 'camera', focus: { x: 17, y: 8 }, zoom: 0.62, dur: 3.2, ease: 0.035 },
    {
      t: 'banner',
      lines: ['THE GYM'],
      sub: '…AND ALSO A PC LAB, APPARENTLY',
      kind: 'info',
      dur: 2.6,
    },
    { t: 'camera', focus: 'player', zoom: 1, dur: 1.6, ease: 0.05, track: true },
    { t: 'cameraRelease' },

    {
      t: 'mission',
      icon: '🏋️',
      title: 'THE GYM',
      text: 'Someone in here is extremely excited to see you.',
      dur: 2.4,
      control: true,
    },

    // ---- THE AMBUSH -----------------------------------------------------
    { t: 'waitFor', cond: 'playerReachedX', x: 15 },
    { t: 'control', on: false },
    { t: 'sting', kind: 'ayyy', shake: 0.3 },
    { t: 'npcShow', id: 'lord', x: 21, y: 9, facing: -1 },
    { t: 'camera', focus: { x: 17, y: 8 }, zoom: 1.25, dur: 0.8 },
    { t: 'npcWalk', id: 'lord', to: 17, face: -1 },
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'say', who: 'lord', text: 'AYYYY' },
    { t: 'react', who: 'player', reaction: 'surprised' },
    { t: 'say', who: 'lord', text: 'Do you wanna build a PC??!!' },
    { t: 'react', who: 'player', reaction: 'excited' },

    // ---- THE CHOICE -----------------------------------------------------
    // The four options from the brief, unchanged. Every wrong answer is her
    // being unimpressed by his energy levels — none of them are punished,
    // she just asks again. The correct answer is the loudest one.
    {
      t: 'choice',
      who: 'lord',
      options: [
        {
          text: 'Yaas bestie!',
          reply: ['…that is it?', 'That is the energy you bring to a PC BUILD?'],
        },
        {
          text: 'Omg yaas queen',
          reply: ['Bro I need MORE than that.'],
        },
        {
          text: 'YEAHH LESGO I LOVE YOU SO MUCH',
          correct: true,
          reply: "THAT'S WHAT I'M TALKING ABOUT.",
        },
        {
          text: 'Maybe later',
          reply: ['MAYBE LATER??', 'MAYBE *LATER*???'],
        },
      ],
    },

    // ---- THE GYM BLUFF --------------------------------------------------
    // She is not serious. He does not know she is not serious. That gap is
    // the entire scene.
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'wait', dur: 0.5 },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'say', who: 'lord', text: 'But first…' },

    // the slow pan onto all that gym equipment
    { t: 'camera', focus: { x: 10, y: 8 }, zoom: 1.05, dur: 2.2, ease: 0.03 },
    { t: 'react', who: 'player', reaction: 'confused' },
    { t: 'wait', dur: 0.8 },
    { t: 'say', who: 'player', text: '…what?' },
    { t: 'camera', focus: { x: 16, y: 8 }, zoom: 1.3, dur: 1.0 },
    { t: 'say', who: 'lord', text: 'We gotta earn the PC.' },
    { t: 'wait', dur: 0.6 },
    { t: 'sting', kind: 'comedicFail', shake: 0.35 },
    { t: 'react', who: 'lord', reaction: 'deadpan' },
    { t: 'say', who: 'lord', text: 'GYM.' },

    // the pause where he considers his entire life
    { t: 'wait', dur: 1.6 },
    { t: 'react', who: 'player', reaction: 'panic' },
    { t: 'say', who: 'player', text: 'come da, comeee' },

    // ---- THE RELEASE ----------------------------------------------------
    { t: 'react', who: 'lord', reaction: 'happy' },
    { t: 'say', who: 'lord', text: 'AHAHAHA' },
    { t: 'react', who: 'lord', reaction: 'excited' },
    {
      t: 'say',
      who: 'lord',
      text: 'Ayyy, no even i have biceps ok, first you code graphics n show',
    },
    { t: 'react', who: 'player', reaction: 'relief' },
    { t: 'say', who: 'player', text: 'Oh thank god.' },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'say', who: 'player', text: 'Okay NOW we are talking.' },
    { t: 'react', who: 'player', reaction: null },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'cameraRelease' },

    // ---- MISSION START --------------------------------------------------
    {
      t: 'mission',
      icon: '💻',
      title: 'BUILD THE ULTIMATE SETUP',
      text: '🧠 DE-SCRAMBLE THE SHOW SCENES',
      dur: 2.8,
      checkpoint: true,
    },

    // ---- PUZZLE 1: THE OFFICE -------------------------------------------
    { t: 'camera', focus: { x: 20, y: 8 }, zoom: 1.15, dur: 1.2 },
    { t: 'say', who: 'lord', text: 'Framebuffer one. Dunder Mifflin, Scranton.' },
    { t: 'say', who: 'lord', text: 'Michael is in NINE pieces and all of them are upside down.' },
    { t: 'react', who: 'player', reaction: 'concentration' },
    { t: 'framebuffer', puzzle: SCRANTON_PUZZLE, solvedHold: 2.8 },
    { t: 'react', who: 'player', reaction: 'excited' },
    { t: 'sting', kind: 'frameRender' },
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'say', who: 'lord', text: 'Ayyy! Prison Mike would be proud. Matrix aligned!' },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'say', who: 'player', text: "World's best framebuffer." },
    { t: 'react', who: 'player', reaction: null },

    // ---- PUZZLE 2: MODERN FAMILY ----------------------------------------
    { t: 'say', who: 'lord', text: 'Okay okay…' },
    { t: 'say', who: 'lord', text: "Now let's fix the frame rate and alignment on this one!" },
    { t: 'say', who: 'lord', text: 'Phil got on a ladder again. Claire is NOT helping.' },
    { t: 'react', who: 'player', reaction: 'concentration' },
    { t: 'framebuffer', puzzle: DUNPHY_PUZZLE, solvedHold: 2.6 },
    { t: 'react', who: 'player', reaction: 'excited' },
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'say', who: 'lord', text: 'BOTH OF THEM. CLEAN.' },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    // ---- THE INSTANT BUILD ----------------------------------------------
    // No assembly minigame. The brief is explicit that the payoff is
    // instant: the framebuffers were the work, this is the fireworks.
    {
      t: 'banner',
      lines: ['🎉 FRAMEBUFFERS DE-SCRAMBLED'],
      sub: '',
      kind: 'good',
      dur: 2.0,
    },
    { t: 'camera', focus: { x: 26, y: 8 }, zoom: 1.2, dur: 1.0 },
    {
      t: 'rigBuild',
      dur: 2.8,
      banner: '⚡ ASSEMBLING ULTIMATE RIG…',
      sub: '████████████████████ 100%',
    },
    { t: 'reveal', labels: ['ULTIMATE PC'] },
    { t: 'react', who: 'player', reaction: 'realization' },
    { t: 'particles', x: 26, y: 8, color: '#5ce1e6', count: 54, spread: 3.2 },
    {
      t: 'banner',
      lines: ['🎉 YAAY YOU BUILT A PC!! 🖥️'],
      sub: '',
      kind: 'good',
      dur: 2.8,
    },
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'say', who: 'lord', text: 'YOOOOOOOO!' },
    { t: 'say', who: 'lord', text: 'WE COOKED! THE RIG IS ONLINE!' },
    { t: 'react', who: 'player', reaction: 'victory' },
    { t: 'sting', kind: 'dramaticVictory', shake: 0.4 },
    { t: 'wait', dur: 1.0 },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'react', who: 'player', reaction: null },
    { t: 'cameraRelease' },

    // ---- THE REWARD -----------------------------------------------------
    // HP ONLY. Happiness is deliberately untouched this level — Level 2 was
    // the happiness level. The award beat holds until the meter has finished
    // filling, so the HP bar visibly climbs before the script continues.
    {
      t: 'award',
      hp: 50,
      xp: 100,
      banner: 'HP RESTORED',
      sub: '+50 HP',
      dur: 3.0,
    },
    {
      t: 'banner',
      lines: ['💻 PC BUILD COMPLETE'],
      sub: '🎨 GRAPHICS RENDERED  ·  🖥️ SETUP ONLINE',
      kind: 'good',
      dur: 2.8,
      sound: false,
    },

    // ---- THE HIGH FIVE ---------------------------------------------------
    { t: 'camera', focus: { x: 24, y: 8 }, zoom: 1.35, dur: 1.2 },
    { t: 'npcWalk', id: 'lord', to: 24, face: 1 },
    { t: 'react', who: 'lord', reaction: 'surprised' },
    { t: 'sting', kind: 'codeSnap', shake: 0.2 },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'wait', dur: 0.7 },
    { t: 'say', who: 'lord', text: 'Bro…' },
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'lord', reaction: 'happy' },
    { t: 'say', who: 'lord', text: "That's actually sick." },
    { t: 'react', who: 'player', reaction: 'victory' },
    { t: 'particles', color: '#ffd166', count: 40, spread: 2.6 },
    { t: 'wait', dur: 1.2 },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    // ---- THE CALLBACK ---------------------------------------------------
    // He calls back the line the game made him say earlier, this time
    // meaning it about the build. Warm, not reluctant.
    { t: 'wait', dur: 0.6 },
    { t: 'react', who: 'player', reaction: 'happy' },
    { t: 'say', who: 'player', text: 'Okay that was actually so fun.' },
    { t: 'react', who: 'lord', reaction: 'excited' },
    { t: 'say', who: 'lord', text: 'SEE?? I TOLD YOU!' },
    { t: 'say', who: 'player', text: 'Yeahh lesgo. I love this so much.' },
    { t: 'react', who: 'lord', reaction: 'happy' },
    { t: 'say', who: 'lord', text: 'THERE IT IS AGAIN' },
    { t: 'wait', dur: 0.9 },
    { t: 'react', who: 'lord', reaction: null },
    { t: 'react', who: 'player', reaction: null },

    {
      t: 'mission',
      icon: '💻',
      title: 'MISSION COMPLETE',
      text: '💻 ULTIMATE SETUP BUILT',
      dur: 2.4,
    },

    { t: 'complete' },
  ],

  // The camera pulls back off the glowing rig to show the whole ridiculous
  // room at once: both of them, the untouched gym equipment, the new PC, and
  // the sitcom scenes running clean on every monitor.
  outroBeats: [
    { t: 'camera', focus: { x: 26, y: 8 }, zoom: 1.4, dur: 1.6, ease: 0.04 },
    { t: 'camera', focus: { x: 17, y: 8 }, zoom: 0.55, dur: 3.6, ease: 0.025 },
    { t: 'say', who: 'lord', text: 'Okay. Food next. I am STARVING.', auto: true, dur: 2.2 },
    { t: 'say', who: 'player', text: 'You coming to that one too?', auto: true, dur: 2.2 },
    { t: 'say', who: 'lord', text: 'Obviously.', auto: true, dur: 1.8 },
    { t: 'gymAmbience', on: false },
    // Level 4 does not exist yet, so this card holds — the same convention
    // Levels 1 and 2 used before the level after them was built.
    { t: 'nextLocation', icon: '🍳', title: 'THE BEAR KITCHEN', hold: true },
  ],
}

export default level3
