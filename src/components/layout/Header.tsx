interface HeaderProps {
  title: string
  subtitle: string
  onOpenMenu: () => void
}

export function Header({ title, subtitle, onOpenMenu }: HeaderProps) {
  const date = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="header">
      <div>
        <button className="menu-button" onClick={onOpenMenu} type="button">
          Menu
        </button>
        <p className="eyebrow">FinTracker Pro</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      <div className="header-meta">
        <div className="pill">
          <span className="status-dot" />
          Aggiornato oggi
        </div>
        <div className="date-label">{date}</div>
      </div>
    </header>
  )
}
