import { placePatternCentered } from './patterns'
import type { Grid, PatternName } from '../types/game'

const clampDensity = (value: number) => {
  return Math.min(1, Math.max(0, value))
}

export const createEmptyGrid = (rows: number, cols: number): Grid => {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
}

export const createRandomGrid = (
  rows: number,
  cols: number,
  density: number,
  random = Math.random,
): Grid => {
  const safeDensity = clampDensity(density)

  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (random() < safeDensity ? 1 : 0)),
  )
}

export const createPatternGrid = (
  rows: number,
  cols: number,
  patternName: PatternName,
): Grid => {
  const emptyGrid = createEmptyGrid(rows, cols)
  return placePatternCentered(emptyGrid, patternName)
}
