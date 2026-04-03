import { PATTERN_NAMES } from '../lib/patterns'
import { SPEED_OPTIONS } from '../constants/gameConfig'
import type { PatternName, SpeedMultiplier } from '../types/game'
import type { SeedMode } from '../hooks/useGameOfLifeSimulation'

interface ControlPanelProps {
  generation: number
  aliveCount: number
  isRunning: boolean
  isFirstRun: boolean
  speedMultiplier: SpeedMultiplier
  seedMode: SeedMode
  selectedPattern: PatternName
  density: number
  onToggleRunning: () => void
  onNext: () => void
  onSpeedChange: (speed: SpeedMultiplier) => void
  onSeedModeChange: (mode: SeedMode) => void
  onPatternChange: (pattern: PatternName) => void
  onDensityChange: (density: number) => void
  onRegenerate: () => void
}

export const ControlPanel = ({
  generation,
  aliveCount,
  isRunning,
  isFirstRun,
  speedMultiplier,
  seedMode,
  selectedPattern,
  density,
  onToggleRunning,
  onNext,
  onSpeedChange,
  onSeedModeChange,
  onPatternChange,
  onDensityChange,
  onRegenerate,
}: ControlPanelProps) => {
  return (
    <section className="min-h-0 p-4 md:p-3" aria-label="Variables panel">
      <div className="grid h-full w-full gap-4 rounded-lg border border-dashed border-grey-olive bg-graphite p-4 text-sm text-platinum">
        <div className="grid gap-2 border-b border-charcoal pb-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-1">
            <p className="m-0 text-grey-olive">Current generation</p>
            <p className="m-0 text-base font-semibold text-platinum">{generation}</p>
            <p className="m-0 text-grey-olive">Alive cells: {aliveCount}</p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
              onClick={onToggleRunning}
            >
              {isRunning ? 'Pause' : isFirstRun ? 'Start' : 'Resume'}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
              onClick={onNext}
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
                  onClick={() => onSpeedChange(speed)}
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
              onChange={(event) => onSeedModeChange(event.target.value as SeedMode)}
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
              onChange={(event) => onPatternChange(event.target.value as PatternName)}
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
            onChange={(event) => onDensityChange(Number(event.target.value) / 100)}
            disabled={seedMode !== 'random'}
            className="accent-grey-olive disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
            onClick={onRegenerate}
          >
            Regenerate board
          </button>
          <span className="text-grey-olive">Status: {isRunning ? 'Running' : 'Paused'}</span>
        </div>
      </div>
    </section>
  )
}
