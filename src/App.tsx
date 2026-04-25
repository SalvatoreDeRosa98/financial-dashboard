import { lazy, Suspense } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppShell } from './components/layout/AppShell'
import { FinanceDataProvider, useFinanceData } from './hooks/useFinanceData'
import { OnboardingPage } from './pages/Onboarding'

const OverviewPage = lazy(() =>
  import('./pages/Home').then((module) => ({ default: module.HomePage })),
)
const MonthPage = lazy(() =>
  import('./pages/Month').then((module) => ({ default: module.MonthPage })),
)
const TransactionsPage = lazy(() =>
  import('./pages/Transactions').then((module) => ({ default: module.TransactionsPage })),
)
const AccountsPage = lazy(() =>
  import('./pages/Accounts').then((module) => ({ default: module.AccountsPage })),
)
const BudgetPage = lazy(() =>
  import('./pages/Budget').then((module) => ({ default: module.BudgetPage })),
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
  const Router = import.meta.env.TAURI_ENV_PLATFORM ? HashRouter : BrowserRouter

  if (!isHydrated) {
    return <div className="route-loading">Caricamento dati...</div>
  }

  if (!userName) {
    return <OnboardingPage onComplete={completeOnboarding} />
  }

  return (
    <Router>
      <Suspense fallback={<div className="route-loading">Caricamento dashboard...</div>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/fx" element={<FxPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/expenses" element={<Navigate to="/markets" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
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
