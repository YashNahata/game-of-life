import type { CellState, Grid } from '../types/game'

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

export const countAliveNeighbors = (grid: Grid, row: number, col: number): number => {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  let alive = 0

  for (const [rowOffset, colOffset] of NEIGHBOR_OFFSETS) {
    const nextRow = row + rowOffset
    const nextCol = col + colOffset

    if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
      continue
    }

    alive += grid[nextRow][nextCol]
  }

  return alive
}

export const getNextGeneration = (grid: Grid): Grid => {
  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const aliveNeighbors = countAliveNeighbors(grid, rowIndex, colIndex)

      if (cell === 1) {
        return aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0
      }

      return aliveNeighbors === 3 ? 1 : 0
    }),
  )
}

export const countAliveCells = (grid: Grid): number => {
  return grid.reduce<number>((total, row) => {
    return total + row.reduce<number>((rowTotal, cell) => rowTotal + cell, 0)
  }, 0)
}

export const toggleCellState = (grid: Grid, row: number, col: number): Grid => {
  return grid.map((currentRow, rowIndex) => {
    if (rowIndex !== row) {
      return [...currentRow]
    }

    return currentRow.map((cell, colIndex) => {
      if (colIndex !== col) {
        return cell
      }

      return (cell === 1 ? 0 : 1) as CellState
    })
  })
}
