import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Panoramica',
    subtitle: 'Stato generale del patrimonio, cashflow e trend degli ultimi 12 mesi.',
  },
  '/accounts': {
    title: 'Dove Sono I Soldi',
    subtitle: 'Conti, carte, contanti e wallet con andamento recente.',
  },
  '/investments': {
    title: 'Investimenti',
    subtitle: 'Asset allocation, performance e visione del portafoglio.',
  },
  '/expenses': {
    title: 'Spese',
    subtitle: 'Monitoraggio categorie, trend mensile e ultime transazioni.',
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
