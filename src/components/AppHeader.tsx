interface AppHeaderProps {
  onOpenHelp: () => void
}

export const AppHeader = ({ onOpenHelp }: AppHeaderProps) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-graphite px-5 md:h-14 md:px-3">
      <div className="flex items-center justify-center gap-1">
        <img src="/logo.svg" alt="Game of Life Logo" width={48} height={48} />
        <h1 className="m-0 text-lg font-semibold text-platinum">Game of Life</h1>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-md border border-charcoal bg-graphite px-3 py-2 text-sm text-platinum transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grey-olive"
        onClick={onOpenHelp}
      >
        How it works
      </button>
    </header>
  )
}
