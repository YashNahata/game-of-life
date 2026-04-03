import type { SpeedMultiplier } from '../types/game'

export const DEFAULT_ROWS = 25
export const DEFAULT_COLS = 40
export const BASE_INTERVAL_MS = 300
export const BASE_CELL_SIZE = 18
export const VIEWPORT_INSET_PX = 24
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2
export const ZOOM_STEP = 0.25
export const DRAG_THRESHOLD_PX = 4

export const SPEED_OPTIONS: ReadonlyArray<SpeedMultiplier> = [1, 2, 4, 8]

export const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

export const clampZoom = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
