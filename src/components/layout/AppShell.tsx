import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Home',
    subtitle: 'Panoramica giornaliera di patrimonio, liquidita, investimenti e flussi principali.',
  },
  '/month': {
    title: 'Mese',
    subtitle: 'Entrate, spese, saldo e lettura operativa del mese selezionato.',
  },
  '/transactions': {
    title: 'Movimenti',
    subtitle: 'Registrazione, ricerca, filtri e modifica completa dello storico.',
  },
  '/accounts': {
    title: 'Conti',
    subtitle: 'Gestione dei conti operativi, dei saldi e delle istituzioni collegate.',
  },
  '/budget': {
    title: 'Budget',
    subtitle: 'Soglie mensili, residuo disponibile e copertura delle spese ricorrenti.',
  },
  '/investments': {
    title: 'Portafoglio',
    subtitle: 'Posizioni aperte, performance, note operative e liquidita broker.',
  },
  '/markets': {
    title: 'Mercati',
    subtitle: 'Indici, watchlist e segnali di mercato da monitorare.',
  },
  '/fx': {
    title: 'Valute',
    subtitle: 'Valuta base, conversioni e impatto del cambio sul portafoglio.',
  },
  '/calendar': {
    title: 'Ricorrenze',
    subtitle: 'Spese ricorrenti, prossime scadenze e fabbisogno di budget futuro.',
  },
  '/reports': {
    title: 'Report',
    subtitle: 'Sintesi di spese, dividendi, crediti fiscali ed esposizione valutaria.',
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
