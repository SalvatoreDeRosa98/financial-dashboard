import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Home',
    subtitle: 'Patrimonio, cashflow, esposizione valutaria e alert del portafoglio.',
  },
  '/accounts': {
    title: 'Denaro',
    subtitle: 'Conti, movimenti, budget per categoria e obiettivi mensili.',
  },
  '/investments': {
    title: 'Portfolio',
    subtitle: 'Posizioni multi-currency, P&L doppia valuta ed effetto cambio isolato.',
  },
  '/expenses': {
    title: 'Mercati',
    subtitle: 'Indici globali, watchlist personale e market brief della giornata.',
  },
  '/fx': {
    title: 'Cambio',
    subtitle: 'Valuta base personale, convertitore live e confronto acquisto vs cambio attuale.',
  },
  '/calendar': {
    title: 'Calendario',
    subtitle: 'Scadenze, stipendi attesi, promemoria e prossimi eventi finanziari.',
  },
  '/reports': {
    title: 'Report',
    subtitle: 'Breakdown visuale di spese, budget e patrimonio per avere il quadro annuale.',
  },
}

export function AppShell() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const page = useMemo(
    () => pageMeta[location.pathname] ?? pageMeta['/overview'],
    [location.pathname],
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header
          title={page.title}
          subtitle={page.subtitle}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  )
}
