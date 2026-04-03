import type { PatternName } from '../types/game'

export const CONWAY_RULES = [
  'Any live cell with fewer than 2 live neighbours dies (underpopulation).',
  'Any live cell with 2 or 3 live neighbours survives.',
  'Any live cell with more than 3 live neighbours dies (overpopulation).',
  'Any dead cell with exactly 3 live neighbours becomes alive (reproduction).',
]

export const CONTROL_NOTES = [
  'Start/Resume/Pause controls automatic generation updates.',
  'Next advances exactly one generation while keeping simulation paused state.',
  'Speed buttons set update frequency using 1x, 2x, 4x, and 8x multipliers.',
  'Pattern selection applies instantly; random mode uses density with regenerate.',
]

export const PATTERN_NOTES: Array<{ name: PatternName; description: string }> = [
  { name: 'Block', description: 'Still life that remains unchanged forever.' },
  {
    name: 'Blinker',
    description: 'Period-2 oscillator flipping between rows/columns.',
  },
  { name: 'Toad', description: 'Period-2 oscillator with a six-cell wave.' },
  {
    name: 'Beacon',
    description: 'Period-2 oscillator made from two 2x2 blocks.',
  },
  { name: 'Glider', description: 'Small spaceship that travels diagonally.' },
  {
    name: 'LWSS',
    description: 'Lightweight spaceship that moves horizontally.',
  },
  {
    name: 'Pulsar',
    description: 'Large period-3 oscillator with radial symmetry.',
  },
]
