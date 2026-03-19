import type { Grid, PatternName, PatternTemplate } from '../types/game'

export const PATTERN_TEMPLATES: Record<PatternName, PatternTemplate> = {
  Block: {
    name: 'Block',
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  Blinker: {
    name: 'Blinker',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  Toad: {
    name: 'Toad',
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  Beacon: {
    name: 'Beacon',
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 2],
      [2, 3],
      [3, 2],
      [3, 3],
    ],
  },
  Glider: {
    name: 'Glider',
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  LWSS: {
    name: 'LWSS',
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 0],
      [1, 4],
      [2, 4],
      [3, 0],
      [3, 3],
    ],
  },
  Pulsar: {
    name: 'Pulsar',
    cells: [
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 8],
      [0, 9],
      [0, 10],
      [2, 0],
      [2, 5],
      [2, 7],
      [2, 12],
      [3, 0],
      [3, 5],
      [3, 7],
      [3, 12],
      [4, 0],
      [4, 5],
      [4, 7],
      [4, 12],
      [5, 2],
      [5, 3],
      [5, 4],
      [5, 8],
      [5, 9],
      [5, 10],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 8],
      [7, 9],
      [7, 10],
      [8, 0],
      [8, 5],
      [8, 7],
      [8, 12],
      [9, 0],
      [9, 5],
      [9, 7],
      [9, 12],
      [10, 0],
      [10, 5],
      [10, 7],
      [10, 12],
      [12, 2],
      [12, 3],
      [12, 4],
      [12, 8],
      [12, 9],
      [12, 10],
    ],
  },
}

export const PATTERN_NAMES = Object.keys(PATTERN_TEMPLATES) as PatternName[]

const getPatternSize = (cells: ReadonlyArray<readonly [number, number]>) => {
  let maxRow = 0
  let maxCol = 0

  for (const [row, col] of cells) {
    maxRow = Math.max(maxRow, row)
    maxCol = Math.max(maxCol, col)
  }

  return { height: maxRow + 1, width: maxCol + 1 }
}

export const placePatternCentered = (grid: Grid, patternName: PatternName): Grid => {
  const template = PATTERN_TEMPLATES[patternName]
  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  if (rows === 0 || cols === 0) {
    return grid
  }

  const { height, width } = getPatternSize(template.cells)
  const startRow = Math.max(0, Math.floor((rows - height) / 2))
  const startCol = Math.max(0, Math.floor((cols - width) / 2))

  const nextGrid = grid.map((row) => [...row])

  for (const [rowOffset, colOffset] of template.cells) {
    const targetRow = startRow + rowOffset
    const targetCol = startCol + colOffset

    if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
      nextGrid[targetRow][targetCol] = 1
    }
  }

  return nextGrid
}
