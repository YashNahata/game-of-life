import { useCallback, useEffect, useMemo, useState } from 'react'
import { countAliveCells, getNextGeneration } from './lib/gameOfLife'
import { createPatternGrid, createRandomGrid } from './lib/gridInit'
import { PATTERN_NAMES } from './lib/patterns'
import type { PatternName, SpeedMultiplier } from './types/game'

const DEFAULT_ROWS = 25
const DEFAULT_COLS = 40
const BASE_INTERVAL_MS = 300

type SeedMode = 'pattern' | 'random'

const SPEED_OPTIONS: ReadonlyArray<SpeedMultiplier> = [1, 2, 4, 8]

const CONWAY_RULES = [
  'Any live cell with fewer than 2 live neighbours dies (underpopulation).',
  'Any live cell with 2 or 3 live neighbours survives.',
  'Any live cell with more than 3 live neighbours dies (overpopulation).',
  'Any dead cell with exactly 3 live neighbours becomes alive (reproduction).',
]

const CONTROL_NOTES = [
  'Resume/Pause starts or stops automatic generation updates.',
  'Next advances exactly one generation while keeping simulation paused state.',
  'Speed buttons set update frequency using 1x, 2x, 4x, and 8x multipliers.',
  'Start mode lets you regenerate from a preset pattern or random density.',
]

const PATTERN_NOTES: Array<{ name: PatternName; description: string }> = [
  { name: 'Block', description: 'Still life that remains unchanged forever.' },
  { name: 'Blinker', description: 'Period-2 oscillator flipping between rows/columns.' },
  { name: 'Toad', description: 'Period-2 oscillator with a six-cell wave.' },
  { name: 'Beacon', description: 'Period-2 oscillator made from two 2x2 blocks.' },
  { name: 'Glider', description: 'Small spaceship that travels diagonally.' },
  { name: 'LWSS', description: 'Lightweight spaceship that moves horizontally.' },
  { name: 'Pulsar', description: 'Large period-3 oscillator with radial symmetry.' },
]

function App() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)
  const [seedMode, setSeedMode] = useState<SeedMode>('pattern')
  const [selectedPattern, setSelectedPattern] = useState<PatternName>('Glider')
  const [density, setDensity] = useState(0.25)
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1)
  const [isRunning, setIsRunning] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [grid, setGrid] = useState(() =>
    createPatternGrid(DEFAULT_ROWS, DEFAULT_COLS, 'Glider'),
  )

  const advanceGeneration = useCallback(() => {
    setGrid((previousGrid) => getNextGeneration(previousGrid))
    setGeneration((previousGeneration) => previousGeneration + 1)
  }, [])

  const regenerateGrid = useCallback(() => {
    const nextGrid =
      seedMode === 'pattern'
        ? createPatternGrid(DEFAULT_ROWS, DEFAULT_COLS, selectedPattern)
        : createRandomGrid(DEFAULT_ROWS, DEFAULT_COLS, density)

    setGrid(nextGrid)
    setGeneration(0)
    setIsRunning(false)
  }, [density, seedMode, selectedPattern])

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

  useEffect(() => {
    if (!isHowItWorksOpen) {
      return undefined
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHowItWorksOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isHowItWorksOpen])

  const aliveCells = useMemo(() => countAliveCells(grid), [grid])

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-between border-b border-graphite px-5 md:h-14 md:px-3">
        <h1 className="m-0 text-lg font-semibold text-platinum">Game of Life</h1>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
          onClick={() => setIsHowItWorksOpen(true)}
        >
          How it works
        </button>
      </header>

      <main className="grid flex-1 min-h-0 grid-rows-[3fr_1fr]">
        <section
          className="relative min-h-0 border-b border-graphite p-4 md:p-3"
          aria-label="Game grid"
        >
          <div className="grid h-full w-full gap-3 rounded-lg border border-dashed border-grey-olive bg-graphite p-4 text-sm text-grey-olive">
            <p className="m-0">Grid rendering lands in Phase 4.</p>
            <p className="m-0 text-platinum">
              Size: {DEFAULT_COLS} × {DEFAULT_ROWS} · Alive cells: {aliveCells}
            </p>
            <p className="m-0">
              Seed mode: {seedMode === 'pattern' ? `Pattern (${selectedPattern})` : `Random (${Math.round(density * 100)}%)`}
            </p>
          </div>
          <div className="absolute bottom-6 right-6 flex gap-2 md:bottom-4 md:right-4" aria-label="Zoom controls">
            <button
              type="button"
              className="h-9 w-9 cursor-pointer rounded-lg border border-charcoal bg-graphite text-xl leading-none text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              className="h-9 w-9 cursor-pointer rounded-lg border border-charcoal bg-graphite text-xl leading-none text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </section>

        <section className="min-h-0 p-4 md:p-3" aria-label="Variables panel">
          <div className="grid h-full w-full gap-4 rounded-lg border border-dashed border-grey-olive bg-graphite p-4 text-sm text-platinum">
            <div className="grid gap-2 border-b border-charcoal pb-3 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-1">
                <p className="m-0 text-grey-olive">Current generation</p>
                <p className="m-0 text-base font-semibold text-platinum">{generation}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                  onClick={() => setIsRunning((previous) => !previous)}
                >
                  {isRunning ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                  onClick={advanceGeneration}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <p className="m-0 text-grey-olive">Speed multiplier</p>
              <div className="flex flex-wrap items-center gap-3">
              {SPEED_OPTIONS.map((speed) => {
                const isSelected = speedMultiplier === speed

                return (
                  <button
                    key={speed}
                    type="button"
                    className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive ${
                      isSelected
                        ? 'border-grey-olive bg-charcoal text-platinum'
                        : 'border-charcoal bg-graphite text-platinum hover:bg-charcoal'
                    }`}
                    onClick={() => setSpeedMultiplier(speed)}
                  >
                    {speed}x
                  </button>
                )
              })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-grey-olive">Start mode</span>
                <select
                  className="rounded-md border border-charcoal bg-carbon-black px-3 py-2 text-platinum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                  value={seedMode}
                  onChange={(event) => setSeedMode(event.target.value as SeedMode)}
                >
                  <option value="pattern">Pattern</option>
                  <option value="random">Random</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-grey-olive">Pattern</span>
                <select
                  className="rounded-md border border-charcoal bg-carbon-black px-3 py-2 text-platinum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive disabled:cursor-not-allowed disabled:opacity-60"
                  value={selectedPattern}
                  onChange={(event) => setSelectedPattern(event.target.value as PatternName)}
                  disabled={seedMode !== 'pattern'}
                >
                  {PATTERN_NAMES.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-grey-olive">Random live density: {Math.round(density * 100)}%</span>
              <input
                type="range"
                min={5}
                max={95}
                step={1}
                value={Math.round(density * 100)}
                onChange={(event) => setDensity(Number(event.target.value) / 100)}
                className="accent-grey-olive"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                onClick={regenerateGrid}
              >
                Regenerate board
              </button>
              <span className="text-grey-olive">Status: {isRunning ? 'Running' : 'Paused'}</span>
            </div>
          </div>
        </section>
      </main>

      {isHowItWorksOpen && (
        <div
          className="fixed inset-0 grid place-items-center bg-carbon-black/70 p-4"
          role="presentation"
          onClick={() => setIsHowItWorksOpen(false)}
        >
          <div
            className="w-full max-w-140 rounded-[10px] border border-charcoal bg-graphite p-4 text-platinum"
            role="dialog"
            aria-modal="true"
            aria-label="How it works"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-charcoal pb-3">
              <h2 className="m-0 text-base text-platinum">How it works</h2>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                onClick={() => setIsHowItWorksOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid max-h-[70svh] gap-4 overflow-y-auto pr-1">
              <section className="grid gap-2">
                <h3 className="m-0 text-sm font-semibold text-platinum">Conway rules</h3>
                <ol className="m-0 grid list-decimal gap-2 pl-5 text-grey-olive">
                  {CONWAY_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              </section>

              <section className="grid gap-2">
                <h3 className="m-0 text-sm font-semibold text-platinum">Controls</h3>
                <ul className="m-0 grid list-disc gap-2 pl-5 text-grey-olive">
                  {CONTROL_NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>

              <section className="grid gap-2">
                <h3 className="m-0 text-sm font-semibold text-platinum">Patterns included</h3>
                <ul className="m-0 grid gap-2 text-grey-olive">
                  {PATTERN_NOTES.map((pattern) => (
                    <li key={pattern.name}>
                      <span className="font-semibold text-platinum">{pattern.name}: </span>
                      {pattern.description}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
