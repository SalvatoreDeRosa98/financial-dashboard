import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppShell } from './components/layout/AppShell'
import { FinanceDataProvider, useFinanceData } from './hooks/useFinanceData'
import { OnboardingPage } from './pages/Onboarding'

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
const CalendarPage = lazy(() =>
  import('./pages/Recurring').then((module) => ({ default: module.RecurringPage })),
)
const ReportsPage = lazy(() => import('./pages/Reports').then((module) => ({ default: module.ReportsPage })))

function AppContent() {
  const { completeOnboarding, isHydrated, userName } = useFinanceData()

  if (!isHydrated) {
    return <div className="route-loading">Caricamento dati...</div>
  }

  if (!userName) {
    return <OnboardingPage onComplete={completeOnboarding} />
  }

  return (
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
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FinanceDataProvider>
        <AppContent />
      </FinanceDataProvider>
    </ThemeProvider>
  )
}

export default App
