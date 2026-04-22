import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppShell } from './components/layout/AppShell'
import { FinanceDataProvider } from './hooks/useFinanceData'

const OverviewPage = lazy(() =>
  import('./pages/Home').then((module) => ({ default: module.HomePage })),
)
const AccountsPage = lazy(() =>
  import('./pages/Money').then((module) => ({ default: module.MoneyPage })),
)
const InvestmentsPage = lazy(() =>
  import('./pages/Portfolio').then((module) => ({ default: module.PortfolioPage })),
)
const MarketsPage = lazy(() =>
  import('./pages/Markets').then((module) => ({ default: module.MarketsPage })),
)
const FxPage = lazy(() =>
  import('./pages/FX').then((module) => ({ default: module.FXPage })),
)
const ReportsPage = lazy(() =>
  import('./pages/Reports').then((module) => ({ default: module.ReportsPage })),
)

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FinanceDataProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="route-loading">Caricamento dashboard...</div>}>
            <Routes>
              <Route element={<AppShell />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/expenses" element={<MarketsPage />} />
              <Route path="/fx" element={<FxPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/calendar" element={<Navigate to="/reports" replace />} />
            </Route>
          </Routes>
        </Suspense>
        </BrowserRouter>
      </FinanceDataProvider>
    </ThemeProvider>
  )
}

export default App
