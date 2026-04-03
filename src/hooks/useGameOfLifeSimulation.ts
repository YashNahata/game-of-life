import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPatternGrid, createRandomGrid } from '../lib/gridInit'
import {
  BASE_INTERVAL_MS,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  NEIGHBOR_OFFSETS,
} from '../constants/gameConfig'
import type { PatternName, SpeedMultiplier } from '../types/game'

export type SeedMode = 'pattern' | 'random'

export type CellKey = `${number},${number}`

const createCellKey = (x: number, y: number): CellKey => `${x},${y}`

const parseCellKey = (key: CellKey): [number, number] => {
  const [x, y] = key.split(',')
  return [Number(x), Number(y)]
}

const seedAliveCells = (
  mode: SeedMode,
  patternName: PatternName,
  density: number,
): Set<CellKey> => {
  const seedGrid =
    mode === 'pattern'
      ? createPatternGrid(DEFAULT_ROWS, DEFAULT_COLS, patternName)
      : createRandomGrid(DEFAULT_ROWS, DEFAULT_COLS, density)

  const centerCol = Math.floor(DEFAULT_COLS / 2)
  const centerRow = Math.floor(DEFAULT_ROWS / 2)
  const alive = new Set<CellKey>()

  for (let row = 0; row < seedGrid.length; row += 1) {
    for (let col = 0; col < seedGrid[row].length; col += 1) {
      if (seedGrid[row][col] === 1) {
        alive.add(createCellKey(col - centerCol, row - centerRow))
      }
    }
  }

  return alive
}

const computeNextAliveCells = (currentAlive: Set<CellKey>): Set<CellKey> => {
  const neighborCounts = new Map<CellKey, number>()

  for (const key of currentAlive) {
    const [x, y] = parseCellKey(key)

    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const neighborKey = createCellKey(x + dx, y + dy)
      const count = neighborCounts.get(neighborKey) ?? 0
      neighborCounts.set(neighborKey, count + 1)
    }
  }

  const nextAlive = new Set<CellKey>()

  for (const [cellKey, count] of neighborCounts) {
    const currentlyAlive = currentAlive.has(cellKey)
    if (count === 3 || (currentlyAlive && count === 2)) {
      nextAlive.add(cellKey)
    }
  }

  return nextAlive
}

const toggleAliveCell = (
  currentAlive: Set<CellKey>,
  x: number,
  y: number,
): Set<CellKey> => {
  const nextAlive = new Set(currentAlive)
  const key = createCellKey(x, y)

  if (nextAlive.has(key)) {
    nextAlive.delete(key)
  } else {
    nextAlive.add(key)
  }

  return nextAlive
}

export const useGameOfLifeSimulation = () => {
  const [seedMode, setSeedModeState] = useState<SeedMode>('pattern')
  const [selectedPattern, setSelectedPattern] = useState<PatternName>('Glider')
  const [density, setDensity] = useState(0.25)
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1)
  const [isRunning, setIsRunning] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [aliveCells, setAliveCells] = useState<Set<CellKey>>(() =>
    seedAliveCells('pattern', 'Glider', 0.25),
  )
  const [viewResetVersion, setViewResetVersion] = useState(0)

  const resetBoard = useCallback((nextAliveCells: Set<CellKey>) => {
    setAliveCells(nextAliveCells)
    setGeneration(0)
    setIsRunning(false)
    setViewResetVersion((previous) => previous + 1)
  }, [])

  const advanceGeneration = useCallback(() => {
    setAliveCells((previousAlive) => computeNextAliveCells(previousAlive))
    setGeneration((previousGeneration) => previousGeneration + 1)
  }, [])

  const regenerateGrid = useCallback(() => {
    resetBoard(seedAliveCells(seedMode, selectedPattern, density))
  }, [density, resetBoard, seedMode, selectedPattern])

  const applyPatternSelection = useCallback(
    (pattern: PatternName) => {
      setSelectedPattern(pattern)

      if (seedMode !== 'pattern') {
        return
      }

      resetBoard(seedAliveCells('pattern', pattern, density))
    },
    [density, resetBoard, seedMode],
  )

  const setSeedMode = useCallback(
    (nextMode: SeedMode) => {
      setSeedModeState(nextMode)

      if (nextMode === 'pattern') {
        resetBoard(seedAliveCells('pattern', selectedPattern, density))
      }
    },
    [density, resetBoard, selectedPattern],
  )

  const onCellToggle = useCallback(
    (x: number, y: number) => {
      if (isRunning) {
        return
      }

      setAliveCells((previousAlive) => toggleAliveCell(previousAlive, x, y))
    },
    [isRunning],
  )

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const stepInterval = window.setInterval(
      advanceGeneration,
      BASE_INTERVAL_MS / speedMultiplier,
    )

    return () => window.clearInterval(stepInterval)
  }, [advanceGeneration, isRunning, speedMultiplier])

  const aliveCount = useMemo(() => aliveCells.size, [aliveCells])
  const isFirstRun = generation === 0 && !isRunning

  return {
    seedMode,
    selectedPattern,
    density,
    speedMultiplier,
    isRunning,
    generation,
    aliveCells,
    aliveCount,
    isFirstRun,
    viewResetVersion,
    setSpeedMultiplier,
    setDensity,
    setSeedMode,
    setIsRunning,
    advanceGeneration,
    regenerateGrid,
    applyPatternSelection,
    onCellToggle,
  }
}
