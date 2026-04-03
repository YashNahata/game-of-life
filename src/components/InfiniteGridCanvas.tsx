import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {
  BASE_CELL_SIZE,
  DEFAULT_COLS,
  DRAG_THRESHOLD_PX,
  VIEWPORT_INSET_PX,
  ZOOM_STEP,
  clampZoom,
} from '../constants/gameConfig'
import type { CellKey } from '../hooks/useGameOfLifeSimulation'

interface InfiniteGridCanvasProps {
  aliveCells: Set<CellKey>
  isRunning: boolean
  onCellToggle: (x: number, y: number) => void
}

export const InfiniteGridCanvas = ({
  aliveCells,
  isRunning,
  onCellToggle,
}: InfiniteGridCanvasProps) => {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const pointerStateRef = useRef<{
    id: number | null
    startX: number
    startY: number
    startPanX: number
    startPanY: number
    isPanning: boolean
    moved: boolean
  }>({
    id: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    isPanning: false,
    moved: false,
  })
  const suppressNextCellToggleRef = useRef(false)

  const viewportInnerWidth = Math.max(0, viewportSize.width - VIEWPORT_INSET_PX)
  const responsiveBaseCellSize =
    viewportInnerWidth > 0
      ? Math.max(BASE_CELL_SIZE, viewportInnerWidth / DEFAULT_COLS)
      : BASE_CELL_SIZE
  const effectiveCellSize = responsiveBaseCellSize * zoomLevel

  const zoomTo = useCallback(
    (nextZoom: number, origin?: { clientX: number; clientY: number }) => {
      const viewport = viewportRef.current
      if (!viewport) {
        setZoomLevel(nextZoom)
        return
      }

      const rect = viewport.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const anchorX = origin ? origin.clientX - rect.left : centerX
      const anchorY = origin ? origin.clientY - rect.top : centerY

      const currentCellSize = responsiveBaseCellSize * zoomLevel
      const nextCellSize = responsiveBaseCellSize * nextZoom

      setPanOffset((previousPan) => {
        const worldX = (anchorX - centerX - previousPan.x) / currentCellSize
        const worldY = (anchorY - centerY - previousPan.y) / currentCellSize

        return {
          x: anchorX - centerX - worldX * nextCellSize,
          y: anchorY - centerY - worldY * nextCellSize,
        }
      })

      setZoomLevel(nextZoom)
    },
    [responsiveBaseCellSize, zoomLevel],
  )

  const zoomIn = useCallback(() => {
    const nextZoom = clampZoom(zoomLevel + ZOOM_STEP)
    if (nextZoom !== zoomLevel) {
      zoomTo(nextZoom)
    }
  }, [zoomLevel, zoomTo])

  const zoomOut = useCallback(() => {
    const nextZoom = clampZoom(zoomLevel - ZOOM_STEP)
    if (nextZoom !== zoomLevel) {
      zoomTo(nextZoom)
    }
  }, [zoomLevel, zoomTo])

  const onViewportPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      pointerStateRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        isPanning: false,
        moved: false,
      }
    },
    [panOffset.x, panOffset.y],
  )

  const onViewportPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      const pointer = pointerStateRef.current
      if (!viewport || pointer.id !== event.pointerId) {
        return
      }

      const deltaX = event.clientX - pointer.startX
      const deltaY = event.clientY - pointer.startY

      if (!pointer.isPanning) {
        const exceededThreshold =
          Math.abs(deltaX) > DRAG_THRESHOLD_PX || Math.abs(deltaY) > DRAG_THRESHOLD_PX

        if (!exceededThreshold) {
          return
        }

        pointerStateRef.current.isPanning = true
        pointerStateRef.current.moved = true
        viewport.setPointerCapture(event.pointerId)
      }

      setPanOffset({
        x: pointer.startPanX + deltaX,
        y: pointer.startPanY + deltaY,
      })
    },
    [],
  )

  const onViewportPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current
    const pointer = pointerStateRef.current
    if (!viewport || pointer.id !== event.pointerId) {
      return
    }

    if (pointer.moved) {
      suppressNextCellToggleRef.current = true
      window.setTimeout(() => {
        suppressNextCellToggleRef.current = false
      }, 0)
    }

    if (pointer.isPanning && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }

    pointerStateRef.current.id = null
    pointerStateRef.current.isPanning = false
  }, [])

  const onViewportClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressNextCellToggleRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    suppressNextCellToggleRef.current = false
  }, [])

  const onViewportWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault()

      const direction = event.deltaY < 0 ? 1 : -1
      const nextZoom = clampZoom(zoomLevel + direction * ZOOM_STEP)

      if (nextZoom !== zoomLevel) {
        zoomTo(nextZoom, { clientX: event.clientX, clientY: event.clientY })
      }
    },
    [zoomLevel, zoomTo],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return undefined
    }

    const updateSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(viewport)

    return () => observer.disconnect()
  }, [])

  const viewportWidth = viewportSize.width
  const viewportHeight = viewportSize.height
  const centerX = viewportWidth / 2
  const centerY = viewportHeight / 2
  const minVisibleX = Math.floor((-centerX - panOffset.x) / effectiveCellSize) - 1
  const maxVisibleX = Math.ceil((viewportWidth - centerX - panOffset.x) / effectiveCellSize) + 1
  const minVisibleY = Math.floor((-centerY - panOffset.y) / effectiveCellSize) - 1
  const maxVisibleY = Math.ceil((viewportHeight - centerY - panOffset.y) / effectiveCellSize) + 1

  const visibleCells = useMemo(() => {
    const cells: Array<{
      x: number
      y: number
      left: number
      top: number
      isAlive: boolean
    }> = []

    for (let y = minVisibleY; y <= maxVisibleY; y += 1) {
      for (let x = minVisibleX; x <= maxVisibleX; x += 1) {
        cells.push({
          x,
          y,
          left: centerX + panOffset.x + x * effectiveCellSize,
          top: centerY + panOffset.y + y * effectiveCellSize,
          isAlive: aliveCells.has(`${x},${y}` as CellKey),
        })
      }
    }

    return cells
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
  ])

  const gridLineSize = Math.max(8, effectiveCellSize)
  const viewportGridStyle = {
    backgroundImage:
      'linear-gradient(to right, #525252 1px, transparent 1px), linear-gradient(to bottom, #525252 1px, transparent 1px)',
    backgroundSize: `${gridLineSize}px ${gridLineSize}px`,
    backgroundPosition: `${centerX + panOffset.x}px ${centerY + panOffset.y}px`,
  }

  const canZoomOut = zoomLevel > 0.5
  const canZoomIn = zoomLevel < 2

  return (
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
                  ? 'bg-platinum'
                  : isRunning
                    ? 'bg-graphite'
                    : 'bg-graphite hover:bg-charcoal'
              } ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
  )
}
