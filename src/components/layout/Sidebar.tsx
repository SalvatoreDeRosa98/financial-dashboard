import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/overview', label: 'Home', icon: 'HM' },
  { to: '/accounts', label: 'Denaro', icon: 'CA' },
  { to: '/investments', label: 'Portafoglio', icon: 'PF' },
  { to: '/expenses', label: 'Mercati', icon: 'MK' },
  { to: '/fx', label: 'Valute', icon: 'FX' },
  { to: '/reports', label: 'Report', icon: 'RP' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p>Tracker Finance</p>
            <span>Workspace personale per patrimonio, liquidita e mercati</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'is-active' : ''}`
              }
              to={item.to}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-card">
          <p>Database locale</p>
          <strong>Dati salvati nel browser con persistenza IndexedDB</strong>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
