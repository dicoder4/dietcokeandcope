/**
 * Block.js — brick shape definitions.
 *
 * A brick is a set of cell offsets. Rotation is limited to 0/90 degrees
 * (a swap of the offset axes) — deliberately NOT arbitrary rotation, per
 * the "don't overengineer physics" rule. Grid snapping does the rest.
 */

let nextId = 1
export const newBlockId = () => `b${nextId++}`

/** Generic rectangular brick footprint, w cells wide x h cells tall. */
const rect = (w, h) => {
  const cells = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push({ x, y })
  return cells
}

export const BLOCK_TYPES = {
  brick2x4: {
    id: 'brick2x4',
    label: '2×4 Beam',
    short: '2×4',
    w: 4,
    h: 2,
    color: '#e2453c',
    colorDark: '#a82b24',
    colorTop: '#ff6a5e',
    cells: rect(4, 2),
    desc: 'Long span. Great for bridges.',
  },
  brick2x2: {
    id: 'brick2x2',
    label: '2×2 Cube',
    short: '2×2',
    w: 2,
    h: 2,
    color: '#f2b230',
    colorDark: '#b87c12',
    colorTop: '#ffd166',
    cells: rect(2, 2),
    desc: 'Chunky. Good for towers and walls.',
  },
  brick1x2: {
    id: 'brick1x2',
    label: '1×2 Plate',
    short: '1×2',
    w: 2,
    h: 1,
    color: '#3fa7e0',
    colorDark: '#1f6f9c',
    colorTop: '#7ed0ff',
    cells: rect(2, 1),
    desc: 'Small. Perfect for stair steps.',
  },
  brick1x1: {
    id: 'brick1x1',
    label: '1×1 Stud',
    short: '1×1',
    w: 1,
    h: 1,
    color: '#8bd24f',
    colorDark: '#4f8c26',
    colorTop: '#b6f07f',
    cells: rect(1, 1),
    desc: 'Fills the awkward gap.',
  },
  pillar: {
    id: 'pillar',
    label: '1×4 Pillar',
    short: '1×4',
    w: 1,
    h: 4,
    color: '#b07be0',
    colorDark: '#71479c',
    colorTop: '#d7aeff',
    cells: rect(1, 4),
    desc: 'Vertical reach in one piece.',
  },
  special: {
    id: 'special',
    label: 'GOLDEN BRICK',
    short: '★',
    w: 3,
    h: 3,
    color: '#ffc63d',
    colorDark: '#c08a00',
    colorTop: '#fff2a8',
    cells: rect(3, 3),
    special: true,
    desc: 'The big one. Use it when it counts.',
  },
}

/** Footprint cells for a type at a given rotation (0 or 1 = 90deg). */
export function footprint(typeId, rot) {
  const t = BLOCK_TYPES[typeId]
  if (!t) return []
  if (rot % 2 === 0) return t.cells
  return t.cells.map((c) => ({ x: c.y, y: c.x }))
}

export function footprintSize(typeId, rot) {
  const t = BLOCK_TYPES[typeId]
  return rot % 2 === 0 ? { w: t.w, h: t.h } : { w: t.h, h: t.w }
}
