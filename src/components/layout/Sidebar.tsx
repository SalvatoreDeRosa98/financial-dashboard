import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navSections = [
  {
    label: 'Vista generale',
    items: [{ to: '/overview', label: 'Home', icon: 'HM' }],
  },
  {
    label: 'Gestione denaro',
    items: [
      { to: '/month', label: 'Mese', icon: 'MS' },
      { to: '/transactions', label: 'Movimenti', icon: 'MV' },
      { to: '/accounts', label: 'Conti', icon: 'CA' },
      { to: '/budget', label: 'Budget', icon: 'BG' },
      { to: '/calendar', label: 'Ricorrenze', icon: 'RC' },
    ],
  },
  {
    label: 'Finanza e investimenti',
    items: [
      { to: '/investments', label: 'Portafoglio', icon: 'PF' },
      { to: '/markets', label: 'Mercati', icon: 'MK' },
      { to: '/fx', label: 'Valute', icon: 'FX' },
      { to: '/reports', label: 'Report', icon: 'RP' },
    ],
  },
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

        <nav className="nav-list" aria-label="Navigazione principale">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="nav-section-label">{section.label}</p>
              <div className="nav-section-links">
                {section.items.map((item) => (
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
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-card">
          <p>Workspace</p>
          <strong>Denaro quotidiano separato da finanza, mercati e report.</strong>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
