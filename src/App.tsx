import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPatternGrid, createRandomGrid } from "./lib/gridInit";
import { PATTERN_NAMES } from "./lib/patterns";
import type { PatternName, SpeedMultiplier } from "./types/game";

const DEFAULT_ROWS = 25;
const DEFAULT_COLS = 40;
const BASE_INTERVAL_MS = 300;
const BASE_CELL_SIZE = 18;
const VIEWPORT_INSET_PX = 24;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
const DRAG_THRESHOLD_PX = 4;
const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

type SeedMode = "pattern" | "random";

const SPEED_OPTIONS: ReadonlyArray<SpeedMultiplier> = [1, 2, 4, 8];

const CONWAY_RULES = [
  "Any live cell with fewer than 2 live neighbours dies (underpopulation).",
  "Any live cell with 2 or 3 live neighbours survives.",
  "Any live cell with more than 3 live neighbours dies (overpopulation).",
  "Any dead cell with exactly 3 live neighbours becomes alive (reproduction).",
];

const CONTROL_NOTES = [
  "Start/Resume/Pause controls automatic generation updates.",
  "Next advances exactly one generation while keeping simulation paused state.",
  "Speed buttons set update frequency using 1x, 2x, 4x, and 8x multipliers.",
  "Pattern selection applies instantly; random mode uses density with regenerate.",
];

const PATTERN_NOTES: Array<{ name: PatternName; description: string }> = [
  { name: "Block", description: "Still life that remains unchanged forever." },
  {
    name: "Blinker",
    description: "Period-2 oscillator flipping between rows/columns.",
  },
  { name: "Toad", description: "Period-2 oscillator with a six-cell wave." },
  {
    name: "Beacon",
    description: "Period-2 oscillator made from two 2x2 blocks.",
  },
  { name: "Glider", description: "Small spaceship that travels diagonally." },
  {
    name: "LWSS",
    description: "Lightweight spaceship that moves horizontally.",
  },
  {
    name: "Pulsar",
    description: "Large period-3 oscillator with radial symmetry.",
  },
];

const clampZoom = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));

type CellKey = `${number},${number}`;

const createCellKey = (x: number, y: number): CellKey => `${x},${y}`;

const parseCellKey = (key: CellKey): [number, number] => {
  const [x, y] = key.split(",");
  return [Number(x), Number(y)];
};

const seedAliveCells = (
  mode: SeedMode,
  patternName: PatternName,
  density: number,
): Set<CellKey> => {
  const seedGrid =
    mode === "pattern"
      ? createPatternGrid(DEFAULT_ROWS, DEFAULT_COLS, patternName)
      : createRandomGrid(DEFAULT_ROWS, DEFAULT_COLS, density);

  const centerCol = Math.floor(DEFAULT_COLS / 2);
  const centerRow = Math.floor(DEFAULT_ROWS / 2);
  const alive = new Set<CellKey>();

  for (let row = 0; row < seedGrid.length; row += 1) {
    for (let col = 0; col < seedGrid[row].length; col += 1) {
      if (seedGrid[row][col] === 1) {
        alive.add(createCellKey(col - centerCol, row - centerRow));
      }
    }
  }

  return alive;
};

const computeNextAliveCells = (currentAlive: Set<CellKey>): Set<CellKey> => {
  const neighborCounts = new Map<CellKey, number>();

  for (const key of currentAlive) {
    const [x, y] = parseCellKey(key);

    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const neighborKey = createCellKey(x + dx, y + dy);
      const count = neighborCounts.get(neighborKey) ?? 0;
      neighborCounts.set(neighborKey, count + 1);
    }
  }

  const nextAlive = new Set<CellKey>();

  for (const [cellKey, count] of neighborCounts) {
    const currentlyAlive = currentAlive.has(cellKey);
    if (count === 3 || (currentlyAlive && count === 2)) {
      nextAlive.add(cellKey);
    }
  }

  return nextAlive;
};

const toggleAliveCell = (
  currentAlive: Set<CellKey>,
  x: number,
  y: number,
): Set<CellKey> => {
  const nextAlive = new Set(currentAlive);
  const key = createCellKey(x, y);

  if (nextAlive.has(key)) {
    nextAlive.delete(key);
  } else {
    nextAlive.add(key);
  }

  return nextAlive;
};

function App() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [seedMode, setSeedMode] = useState<SeedMode>("pattern");
  const [selectedPattern, setSelectedPattern] = useState<PatternName>("Glider");
  const [density, setDensity] = useState(0.25);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [generation, setGeneration] = useState(0);
  const [aliveCells, setAliveCells] = useState<Set<CellKey>>(() =>
    seedAliveCells("pattern", "Glider", 0.25),
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    isPanning: boolean;
    moved: boolean;
  }>({
    id: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    isPanning: false,
    moved: false,
  });
  const suppressNextCellToggleRef = useRef(false);
  const viewportInnerWidth = Math.max(
    0,
    viewportSize.width - VIEWPORT_INSET_PX,
  );
  const responsiveBaseCellSize =
    viewportInnerWidth > 0
      ? Math.max(BASE_CELL_SIZE, viewportInnerWidth / DEFAULT_COLS)
      : BASE_CELL_SIZE;
  const effectiveCellSize = responsiveBaseCellSize * zoomLevel;

  const advanceGeneration = useCallback(() => {
    setAliveCells((previousAlive) => computeNextAliveCells(previousAlive));
    setGeneration((previousGeneration) => previousGeneration + 1);
  }, []);

  const regenerateGrid = useCallback(() => {
    setAliveCells(seedAliveCells(seedMode, selectedPattern, density));
    setGeneration(0);
    setIsRunning(false);
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  }, [density, seedMode, selectedPattern]);

  const applyPatternSelection = useCallback(
    (pattern: PatternName) => {
      setSelectedPattern(pattern);

      if (seedMode !== "pattern") {
        return;
      }

      setAliveCells(seedAliveCells("pattern", pattern, density));
      setGeneration(0);
      setIsRunning(false);
      setPanOffset({ x: 0, y: 0 });
      setZoomLevel(1);
    },
    [density, seedMode],
  );

  const zoomTo = useCallback(
    (nextZoom: number, origin?: { clientX: number; clientY: number }) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        setZoomLevel(nextZoom);
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const anchorX = origin ? origin.clientX - rect.left : centerX;
      const anchorY = origin ? origin.clientY - rect.top : centerY;

      const currentCellSize = responsiveBaseCellSize * zoomLevel;
      const nextCellSize = responsiveBaseCellSize * nextZoom;

      setPanOffset((previousPan) => {
        const worldX = (anchorX - centerX - previousPan.x) / currentCellSize;
        const worldY = (anchorY - centerY - previousPan.y) / currentCellSize;

        return {
          x: anchorX - centerX - worldX * nextCellSize,
          y: anchorY - centerY - worldY * nextCellSize,
        };
      });

      setZoomLevel(nextZoom);
    },
    [responsiveBaseCellSize, zoomLevel],
  );

  const zoomIn = useCallback(() => {
    const nextZoom = clampZoom(zoomLevel + ZOOM_STEP);
    if (nextZoom !== zoomLevel) {
      zoomTo(nextZoom);
    }
  }, [zoomLevel, zoomTo]);

  const zoomOut = useCallback(() => {
    const nextZoom = clampZoom(zoomLevel - ZOOM_STEP);
    if (nextZoom !== zoomLevel) {
      zoomTo(nextZoom);
    }
  }, [zoomLevel, zoomTo]);

  const onCellToggle = useCallback(
    (x: number, y: number) => {
      if (suppressNextCellToggleRef.current) {
        suppressNextCellToggleRef.current = false;
        return;
      }

      if (isRunning) {
        return;
      }

      setAliveCells((previousAlive) => toggleAliveCell(previousAlive, x, y));
    },
    [isRunning],
  );

  const onViewportPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      pointerStateRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        isPanning: false,
        moved: false,
      };
    },
    [panOffset.x, panOffset.y],
  );

  const onViewportPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const pointer = pointerStateRef.current;
      if (!viewport || pointer.id !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - pointer.startX;
      const deltaY = event.clientY - pointer.startY;

      if (!pointer.isPanning) {
        const exceededThreshold =
          Math.abs(deltaX) > DRAG_THRESHOLD_PX ||
          Math.abs(deltaY) > DRAG_THRESHOLD_PX;

        if (!exceededThreshold) {
          return;
        }

        pointerStateRef.current.isPanning = true;
        pointerStateRef.current.moved = true;
        viewport.setPointerCapture(event.pointerId);
      }

      setPanOffset({
        x: pointer.startPanX + deltaX,
        y: pointer.startPanY + deltaY,
      });
    },
    [],
  );

  const onViewportPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const pointer = pointerStateRef.current;
      if (!viewport || pointer.id !== event.pointerId) {
        return;
      }

      if (pointer.moved) {
        suppressNextCellToggleRef.current = true;
        window.setTimeout(() => {
          suppressNextCellToggleRef.current = false;
        }, 0);
      }

      if (pointer.isPanning && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      pointerStateRef.current.id = null;
      pointerStateRef.current.isPanning = false;
    },
    [],
  );

  const onViewportClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!suppressNextCellToggleRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextCellToggleRef.current = false;
    },
    [],
  );

  const onViewportWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();

      const direction = event.deltaY < 0 ? 1 : -1;
      const nextZoom = clampZoom(zoomLevel + direction * ZOOM_STEP);

      if (nextZoom !== zoomLevel) {
        zoomTo(nextZoom, { clientX: event.clientX, clientY: event.clientY });
      }
    },
    [zoomLevel, zoomTo],
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const stepInterval = window.setInterval(
      advanceGeneration,
      BASE_INTERVAL_MS / speedMultiplier,
    );

    return () => window.clearInterval(stepInterval);
  }, [advanceGeneration, isRunning, speedMultiplier]);

  useEffect(() => {
    if (!isHowItWorksOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsHowItWorksOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHowItWorksOpen]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const minVisibleX =
    Math.floor((-centerX - panOffset.x) / effectiveCellSize) - 1;
  const maxVisibleX =
    Math.ceil((viewportWidth - centerX - panOffset.x) / effectiveCellSize) + 1;
  const minVisibleY =
    Math.floor((-centerY - panOffset.y) / effectiveCellSize) - 1;
  const maxVisibleY =
    Math.ceil((viewportHeight - centerY - panOffset.y) / effectiveCellSize) + 1;
  const visibleCells = useMemo(() => {
    const cells: Array<{
      x: number;
      y: number;
      left: number;
      top: number;
      isAlive: boolean;
    }> = [];

    for (let y = minVisibleY; y <= maxVisibleY; y += 1) {
      for (let x = minVisibleX; x <= maxVisibleX; x += 1) {
        cells.push({
          x,
          y,
          left: centerX + panOffset.x + x * effectiveCellSize,
          top: centerY + panOffset.y + y * effectiveCellSize,
          isAlive: aliveCells.has(createCellKey(x, y)),
        });
      }
    }

    return cells;
  }, [
    minVisibleY,
    maxVisibleY,
    minVisibleX,
    maxVisibleX,
    centerX,
    centerY,
    panOffset.x,
    panOffset.y,
    effectiveCellSize,
    aliveCells,
  ]);
  const gridLineSize = Math.max(8, effectiveCellSize);
  const viewportGridStyle = {
    backgroundImage:
      "linear-gradient(to right, #525252 1px, transparent 1px), linear-gradient(to bottom, #525252 1px, transparent 1px)",
    backgroundSize: `${gridLineSize}px ${gridLineSize}px`,
    backgroundPosition: `${centerX + panOffset.x}px ${centerY + panOffset.y}px`,
  };
  const aliveCount = aliveCells.size;
  const canZoomOut = zoomLevel > MIN_ZOOM;
  const canZoomIn = zoomLevel < MAX_ZOOM;
  const isFirstRun = generation === 0 && !isRunning;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-between border-b border-graphite px-5 md:h-14 md:px-3">
        <div className="flex justify-center items-center gap-1">
          <img src="/logo.svg" alt="Game of Life Logo" width={48} height={48} />
          <h1 className="m-0 text-lg font-semibold text-platinum">
            Game of Life
          </h1>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
          onClick={() => setIsHowItWorksOpen(true)}
        >
          How it works
        </button>
      </header>

      <main className="grid flex-1 min-h-0 grid-rows-[1fr_1fr]">
        <section
          className="relative min-h-0 border-b border-graphite p-4 md:p-3"
          aria-label="Game grid"
        >
          <div
            ref={viewportRef}
            className="relative h-full w-full cursor-grab overflow-hidden rounded-lg border border-dashed border-grey-olive bg-carbon-black p-3 active:cursor-grabbing"
            onPointerDown={onViewportPointerDown}
            onPointerMove={onViewportPointerMove}
            onPointerUp={onViewportPointerUp}
            onPointerCancel={onViewportPointerUp}
            onWheel={onViewportWheel}
            onClickCapture={onViewportClickCapture}
            style={viewportGridStyle}
          >
            <div className="absolute inset-0 overflow-hidden">
              {visibleCells.map((cell) => (
                <button
                  key={`${cell.x},${cell.y}`}
                  type="button"
                  aria-label={`Cell ${cell.y}, ${cell.x}`}
                  aria-pressed={cell.isAlive}
                  disabled={isRunning}
                  onClick={() => onCellToggle(cell.x, cell.y)}
                  className={`absolute border border-charcoal/60 transition-colors ${
                    cell.isAlive
                      ? "bg-platinum"
                      : isRunning
                        ? "bg-graphite"
                        : "bg-graphite hover:bg-charcoal"
                  } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                  style={{
                    left: cell.left,
                    top: cell.top,
                    width: effectiveCellSize,
                    height: effectiveCellSize,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            className="absolute bottom-6 right-6 flex gap-2 md:bottom-4 md:right-4"
            aria-label="Zoom controls"
          >
            <button
              type="button"
              className="h-9 w-9 cursor-pointer rounded-lg border border-charcoal bg-graphite text-xl leading-none text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Zoom out"
              onClick={zoomOut}
              disabled={!canZoomOut}
            >
              -
            </button>
            <button
              type="button"
              className="h-9 w-9 cursor-pointer rounded-lg border border-charcoal bg-graphite text-xl leading-none text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Zoom in"
              onClick={zoomIn}
              disabled={!canZoomIn}
            >
              +
            </button>
            <span className="flex h-9 min-w-14 items-center justify-center rounded-lg border border-charcoal bg-graphite px-2 text-xs text-grey-olive">
              {zoomLevel.toFixed(2)}x
            </span>
          </div>
        </section>

        <section className="min-h-0 p-4 md:p-3" aria-label="Variables panel">
          <div className="grid h-full w-full gap-4 rounded-lg border border-dashed border-grey-olive bg-graphite p-4 text-sm text-platinum">
            <div className="grid gap-2 border-b border-charcoal pb-3 md:grid-cols-[1fr_auto] md:items-center">
              <div className="grid gap-1">
                <p className="m-0 text-grey-olive">Current generation</p>
                <p className="m-0 text-base font-semibold text-platinum">
                  {generation}
                </p>
                <p className="m-0 text-grey-olive">Alive cells: {aliveCount}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                  onClick={() => setIsRunning((previous) => !previous)}
                >
                  {isRunning ? "Pause" : isFirstRun ? "Start" : "Resume"}
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
                  const isSelected = speedMultiplier === speed;

                  return (
                    <button
                      key={speed}
                      type="button"
                      className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive ${
                        isSelected
                          ? "border-grey-olive bg-charcoal text-platinum"
                          : "border-charcoal bg-graphite text-platinum hover:bg-charcoal"
                      }`}
                      onClick={() => setSpeedMultiplier(speed)}
                    >
                      {speed}x
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-grey-olive">Start mode</span>
                <select
                  className="rounded-md border border-charcoal bg-carbon-black px-3 py-2 text-platinum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
                  value={seedMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as SeedMode;
                    setSeedMode(nextMode);

                    if (nextMode === "pattern") {
                      setAliveCells(
                        seedAliveCells("pattern", selectedPattern, density),
                      );
                      setGeneration(0);
                      setIsRunning(false);
                      setPanOffset({ x: 0, y: 0 });
                      setZoomLevel(1);
                    }
                  }}
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
                  onChange={(event) =>
                    applyPatternSelection(event.target.value as PatternName)
                  }
                  disabled={seedMode !== "pattern"}
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
              <span className="text-grey-olive">
                Random live density: {Math.round(density * 100)}%
              </span>
              <input
                type="range"
                min={5}
                max={95}
                step={1}
                value={Math.round(density * 100)}
                onChange={(event) =>
                  setDensity(Number(event.target.value) / 100)
                }
                disabled={seedMode !== "random"}
                className="accent-grey-olive disabled:cursor-not-allowed disabled:opacity-50"
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
              <span className="text-grey-olive">
                Status: {isRunning ? "Running" : "Paused"}
              </span>
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
                <h3 className="m-0 text-sm font-semibold text-platinum">
                  Conway rules
                </h3>
                <ol className="m-0 grid list-decimal gap-2 pl-5 text-grey-olive">
                  {CONWAY_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              </section>

              <section className="grid gap-2">
                <h3 className="m-0 text-sm font-semibold text-platinum">
                  Controls
                </h3>
                <ul className="m-0 grid list-disc gap-2 pl-5 text-grey-olive">
                  {CONTROL_NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>

              <section className="grid gap-2">
                <h3 className="m-0 text-sm font-semibold text-platinum">
                  Patterns included
                </h3>
                <ul className="m-0 grid gap-2 list-disc pl-5 text-grey-olive">
                  {PATTERN_NOTES.map((pattern) => (
                    <li key={pattern.name}>
                      <span className="text-platinum">{pattern.name}: </span>
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
  );
}

export default App;
