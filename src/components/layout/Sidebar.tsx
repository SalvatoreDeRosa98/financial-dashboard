import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/overview', label: 'Home', icon: '01' },
  { to: '/accounts', label: 'Denaro', icon: '02' },
  { to: '/investments', label: 'Portfolio', icon: '03' },
  { to: '/expenses', label: 'Mercati', icon: '04' },
  { to: '/fx', label: 'Cambio', icon: '05' },
  { to: '/calendar', label: 'Calendario', icon: '06' },
  { to: '/reports', label: 'Report', icon: '07' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">FD</div>
          <div>
            <p>FinTracker Pro</p>
            <span>Personal wealth OS</span>
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
          <p>Multi-currency ready</p>
          <strong>Portfolio, budget, FX e mercati</strong>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
