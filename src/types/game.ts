export type CellState = 0 | 1

export type Grid = CellState[][]

export type SpeedMultiplier = 1 | 2 | 4 | 8

export type PatternName =
  | 'Block'
  | 'Blinker'
  | 'Toad'
  | 'Beacon'
  | 'Glider'
  | 'LWSS'
  | 'Pulsar'

export interface PatternTemplate {
  name: PatternName
  cells: ReadonlyArray<readonly [row: number, col: number]>
}

export interface SimulationConfig {
  rows: number
  cols: number
  baseIntervalMs: number
  speedMultiplier: SpeedMultiplier
  density: number
  selectedPattern: PatternName
}
