import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Home',
    subtitle: 'Patrimonio, crescita, conti liquidi e movimenti recenti.',
  },
  '/accounts': {
    title: 'Denaro',
    subtitle: 'Conti modificabili, movimenti, budget e analisi mese per mese.',
  },
  '/investments': {
    title: 'Strumenti finanziari',
    subtitle: 'Capitale investito, andamento complessivo e dettaglio strumento su popup.',
  },
  '/expenses': {
    title: 'Mercati',
    subtitle: 'Indici globali online, top 10 gainer e watchlist personale.',
  },
  '/fx': {
    title: 'Cambio',
    subtitle: 'Valuta base personale, convertitore live e confronto acquisto vs cambio attuale.',
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
