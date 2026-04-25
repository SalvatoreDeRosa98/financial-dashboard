import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

const navSections = [
  {
    label: 'Vista generale',
    items: [{ to: '/overview', label: 'Home' }],
  },
  {
    label: 'Gestione denaro',
    items: [
      { to: '/month', label: 'Mese' },
      { to: '/transactions', label: 'Movimenti' },
      { to: '/accounts', label: 'Conti' },
      { to: '/budget', label: 'Budget' },
      { to: '/calendar', label: 'Ricorrenze' },
    ],
  },
  {
    label: 'Finanza e investimenti',
    items: [
      { to: '/investments', label: 'Portafoglio' },
      { to: '/markets', label: 'Mercati' },
      { to: '/fx', label: 'Valute' },
      { to: '/reports', label: 'Report' },
    ],
  },
]

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
      <div className="mobile-menu-panel">
        <div className="mobile-menu-header">
          <div className="mobile-brand">
            <strong>Tracker Finance</strong>
            <span>Navigazione</span>
          </div>
          <button onClick={onClose} type="button">
            Chiudi
          </button>
        </div>

        <div className="mobile-menu-links">
          {navSections.map((section) => (
            <div className="mobile-nav-section" key={section.label}>
              <p className="nav-section-label">{section.label}</p>
              <div className="nav-section-links">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      `mobile-link ${isActive ? 'is-active' : ''}`
                    }
                    onClick={onClose}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ThemeToggle />
      </div>
    </div>
  )
}
