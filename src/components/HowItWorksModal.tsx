import { useEffect } from 'react'
import { CONWAY_RULES, CONTROL_NOTES, PATTERN_NOTES } from '../constants/helpContent'

interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HowItWorksModal = ({ isOpen, onClose }: HowItWorksModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 grid place-items-center bg-carbon-black/70 p-4"
      role="presentation"
      onClick={onClose}
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
            onClick={onClose}
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
            <ul className="m-0 grid list-disc gap-2 pl-5 text-grey-olive">
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
  )
}
