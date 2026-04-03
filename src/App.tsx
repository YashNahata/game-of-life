import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ControlPanel } from './components/ControlPanel'
import { HowItWorksModal } from './components/HowItWorksModal'
import { InfiniteGridCanvas } from './components/InfiniteGridCanvas'
import { useGameOfLifeSimulation } from './hooks/useGameOfLifeSimulation'

function App() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false)

  const {
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
  } = useGameOfLifeSimulation()

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader onOpenHelp={() => setIsHowItWorksOpen(true)} />

      <main className="grid flex-1 min-h-0 grid-rows-[1fr_1fr]">
        <InfiniteGridCanvas
          key={viewResetVersion}
          aliveCells={aliveCells}
          isRunning={isRunning}
          onCellToggle={onCellToggle}
        />

        <ControlPanel
          generation={generation}
          aliveCount={aliveCount}
          isRunning={isRunning}
          isFirstRun={isFirstRun}
          speedMultiplier={speedMultiplier}
          seedMode={seedMode}
          selectedPattern={selectedPattern}
          density={density}
          onToggleRunning={() => setIsRunning((previous) => !previous)}
          onNext={advanceGeneration}
          onSpeedChange={setSpeedMultiplier}
          onSeedModeChange={setSeedMode}
          onPatternChange={applyPatternSelection}
          onDensityChange={setDensity}
          onRegenerate={regenerateGrid}
        />
      </main>

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  )
}

export default App
