// Colors for each Camelot position — A (minor) is the deeper shade, B (major) lighter
export const CAMELOT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1A':  { bg: 'rgba(59,100,180,0.15)',  text: '#6b9ff5', border: 'rgba(59,100,180,0.35)' },
  '1B':  { bg: 'rgba(80,130,220,0.15)',  text: '#82b0ff', border: 'rgba(80,130,220,0.35)' },
  '2A':  { bg: 'rgba(30,140,175,0.15)',  text: '#4ac4e8', border: 'rgba(30,140,175,0.35)' },
  '2B':  { bg: 'rgba(40,165,200,0.15)',  text: '#5ddaf5', border: 'rgba(40,165,200,0.35)' },
  '3A':  { bg: 'rgba(25,155,150,0.15)',  text: '#3dd9d0', border: 'rgba(25,155,150,0.35)' },
  '3B':  { bg: 'rgba(35,185,175,0.15)',  text: '#4df0e5', border: 'rgba(35,185,175,0.35)' },
  '4A':  { bg: 'rgba(25,150,95,0.15)',   text: '#3dcf88', border: 'rgba(25,150,95,0.35)'  },
  '4B':  { bg: 'rgba(35,180,110,0.15)',  text: '#4de89e', border: 'rgba(35,180,110,0.35)' },
  '5A':  { bg: 'rgba(60,160,50,0.15)',   text: '#6dce5e', border: 'rgba(60,160,50,0.35)'  },
  '5B':  { bg: 'rgba(80,195,65,0.15)',   text: '#84e070', border: 'rgba(80,195,65,0.35)'  },
  '6A':  { bg: 'rgba(135,170,25,0.15)',  text: '#b8d838', border: 'rgba(135,170,25,0.35)' },
  '6B':  { bg: 'rgba(165,205,30,0.15)',  text: '#d4f040', border: 'rgba(165,205,30,0.35)' },
  '7A':  { bg: 'rgba(200,165,0,0.15)',   text: '#e8c820', border: 'rgba(200,165,0,0.35)'  },
  '7B':  { bg: 'rgba(225,185,0,0.15)',   text: '#f5d800', border: 'rgba(225,185,0,0.35)'  },
  '8A':  { bg: 'rgba(210,120,20,0.15)',  text: '#f0922a', border: 'rgba(210,120,20,0.35)' },
  '8B':  { bg: 'rgba(235,140,35,0.15)',  text: '#ffaa40', border: 'rgba(235,140,35,0.35)' },
  '9A':  { bg: 'rgba(210,65,40,0.15)',   text: '#f07060', border: 'rgba(210,65,40,0.35)'  },
  '9B':  { bg: 'rgba(235,80,55,0.15)',   text: '#ff8878', border: 'rgba(235,80,55,0.35)'  },
  '10A': { bg: 'rgba(185,25,65,0.15)',   text: '#e83870', border: 'rgba(185,25,65,0.35)'  },
  '10B': { bg: 'rgba(215,40,80,0.15)',   text: '#ff4f88', border: 'rgba(215,40,80,0.35)'  },
  '11A': { bg: 'rgba(165,25,155,0.15)',  text: '#d840c8', border: 'rgba(165,25,155,0.35)' },
  '11B': { bg: 'rgba(195,40,185,0.15)',  text: '#ee55dc', border: 'rgba(195,40,185,0.35)' },
  '12A': { bg: 'rgba(105,40,200,0.15)',  text: '#9d60f0', border: 'rgba(105,40,200,0.35)' },
  '12B': { bg: 'rgba(130,60,225,0.15)',  text: '#b478ff', border: 'rgba(130,60,225,0.35)' },
}

// Conic gradient string for the Camelot wheel (12 segments, each 30°)
export const CAMELOT_WHEEL_GRADIENT =
  'conic-gradient(#6b9ff5 0deg, #4ac4e8 30deg, #3dd9d0 60deg, #3dcf88 90deg, #6dce5e 120deg, #b8d838 150deg, #e8c820 180deg, #f0922a 210deg, #f07060 240deg, #e83870 270deg, #d840c8 300deg, #9d60f0 330deg, #6b9ff5 360deg)'

// Camelot lookup: [major, minor] indexed by Spotify key (0-11)
const CAMELOT: Record<number, [string, string]> = {
  0:  ['8B', '5A'],
  1:  ['3B', '12A'],
  2:  ['10B', '7A'],
  3:  ['5B', '2A'],
  4:  ['12B', '9A'],
  5:  ['7B', '4A'],
  6:  ['2B', '11A'],
  7:  ['9B', '6A'],
  8:  ['4B', '1A'],
  9:  ['11B', '8A'],
  10: ['6B', '3A'],
  11: ['1B', '10A'],
}

// Returns Camelot notation, or null if key is -1 (undetected)
export function toCamelot(key: number, mode: number): string | null {
  if (key === -1) return null
  const entry = CAMELOT[key]
  if (!entry) throw new Error(`Invalid Spotify key: ${key}`)
  return mode === 1 ? entry[0] : entry[1]
}

function parseCamelot(key: string): { number: number; letter: 'A' | 'B' } {
  const match = key.match(/^(\d+)([AB])$/)
  if (!match) throw new Error(`Invalid Camelot key: ${key}`)
  return { number: parseInt(match[1], 10), letter: match[2] as 'A' | 'B' }
}

function adjacentNumber(n: number, delta: -1 | 1): number {
  const result = n + delta
  if (result < 1) return 12
  if (result > 12) return 1
  return result
}

// Returns compatibility result. If either key is null/"unknown", returns incompatible.
export function checkCompatibility(
  keyA: string | null,
  keyB: string | null,
): {
  compatible: boolean
  relationship:
    | 'same key'
    | 'adjacent (energy boost)'
    | 'adjacent (energy drop)'
    | 'relative major/minor'
    | 'incompatible'
} {
  if (keyA === null || keyB === null) {
    return { compatible: false, relationship: 'incompatible' }
  }

  const a = parseCamelot(keyA)
  const b = parseCamelot(keyB)

  if (a.number === b.number && a.letter === b.letter) {
    return { compatible: true, relationship: 'same key' }
  }

  if (a.number === b.number && a.letter !== b.letter) {
    return { compatible: true, relationship: 'relative major/minor' }
  }

  if (a.letter === b.letter) {
    if (b.number === adjacentNumber(a.number, 1)) {
      return { compatible: true, relationship: 'adjacent (energy boost)' }
    }
    if (b.number === adjacentNumber(a.number, -1)) {
      return { compatible: true, relationship: 'adjacent (energy drop)' }
    }
  }

  return { compatible: false, relationship: 'incompatible' }
}
