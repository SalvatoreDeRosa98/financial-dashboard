import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppShell } from './components/layout/AppShell'
import { FinanceDataProvider } from './hooks/useFinanceData'

const OverviewPage = lazy(() =>
  import('./pages/Overview').then((module) => ({ default: module.OverviewPage })),
)
const AccountsPage = lazy(() =>
  import('./pages/Accounts').then((module) => ({ default: module.AccountsPage })),
)
const InvestmentsPage = lazy(() =>
  import('./pages/Investments').then((module) => ({ default: module.InvestmentsPage })),
)
const ExpensesPage = lazy(() =>
  import('./pages/Expenses').then((module) => ({ default: module.ExpensesPage })),
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
                <Route path="/expenses" element={<ExpensesPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </FinanceDataProvider>
    </ThemeProvider>
  )
}

export default App
