import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/overview', label: 'Home' },
  { to: '/month', label: 'Mese' },
  { to: '/transactions', label: 'Movimenti' },
  { to: '/accounts', label: 'Conti' },
  { to: '/budget', label: 'Budget' },
  { to: '/investments', label: 'Portafoglio' },
  { to: '/markets', label: 'Mercati' },
  { to: '/fx', label: 'Valute' },
  { to: '/calendar', label: 'Ricorrenze' },
  { to: '/reports', label: 'Report' },
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
          {navItems.map((item) => (
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

        <ThemeToggle />
      </div>
    </div>
  )
}
