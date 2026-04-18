import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/overview', label: 'Panoramica', icon: '01' },
  { to: '/accounts', label: 'Dove sono i soldi', icon: '02' },
  { to: '/investments', label: 'Investimenti', icon: '03' },
  { to: '/expenses', label: 'Spese', icon: '04' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">FD</div>
          <div>
            <p>Finance Desk</p>
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
          <p>Cashflow positivo</p>
          <strong>+4.060 EUR questo mese</strong>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
