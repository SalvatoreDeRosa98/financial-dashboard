import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  seedAccountBalanceTrend,
  seedAccounts,
  seedExpenseCategories,
  seedInvestmentAssets,
  seedMonthlyExpenses,
  seedNetWorthTrend,
  seedPortfolioSeries,
  seedTransactions,
} from '../data/seed'
import type {
  AccountBalancePoint,
  AccountItem,
  AllocationItem,
  ExpenseCategory,
  InvestmentAsset,
  MonthlyExpensePoint,
  NetWorthPoint,
  PeriodOption,
  PortfolioPoint,
  SummaryMetric,
  TransactionItem,
} from '../data/types'

const STORAGE_KEY = 'financial-dashboard-state-v1'

interface FinanceState {
  accounts: AccountItem[]
  accountBalanceTrend: AccountBalancePoint[]
  investmentAssets: InvestmentAsset[]
  monthlyExpenses: MonthlyExpensePoint[]
  expenseCategories: ExpenseCategory[]
  recentTransactions: TransactionItem[]
  netWorthTrend: NetWorthPoint[]
  portfolioSeries: Record<PeriodOption['key'], PortfolioPoint[]>
}

interface TransactionInput {
  merchant: string
  category: string
  amount: number
}

interface FinanceContextValue extends FinanceState {
  summaryMetrics: SummaryMetric[]
  moneyAllocation: AllocationItem[]
  investmentPeriods: PeriodOption[]
  updateAccountBalance: (name: string, balance: number) => void
  updateInvestmentValue: (symbol: string, value: number) => void
  addTransaction: (input: TransactionInput) => void
  resetData: () => void
}

const defaultState: FinanceState = {
  accounts: seedAccounts,
  accountBalanceTrend: seedAccountBalanceTrend,
  investmentAssets: seedInvestmentAssets,
  monthlyExpenses: seedMonthlyExpenses,
  expenseCategories: seedExpenseCategories,
  recentTransactions: seedTransactions,
  netWorthTrend: seedNetWorthTrend,
  portfolioSeries: seedPortfolioSeries,
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function readState(): FinanceState {
  if (typeof window === 'undefined') return defaultState

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

const investmentPeriods: PeriodOption[] = [
  { label: '1M', key: '1M' },
  { label: '3M', key: '3M' },
  { label: 'YTD', key: 'YTD' },
  { label: '1A', key: '1A' },
]

export function FinanceDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinanceState>(readState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const moneyAllocation = useMemo<AllocationItem[]>(() => {
    const [checking, savings, card, wallet] = state.accounts
    const investments = state.investmentAssets.reduce((sum, asset) => sum + asset.value, 0)

    return [
      { label: 'Conti correnti', value: checking?.balance ?? 0, color: '#2dd4bf' },
      { label: 'Conto risparmio', value: savings?.balance ?? 0, color: '#38bdf8' },
      { label: 'Carte', value: card?.balance ?? 0, color: '#f59e0b' },
      { label: 'Wallet', value: wallet?.balance ?? 0, color: '#a78bfa' },
      { label: 'Investimenti', value: investments, color: '#10b981' },
    ]
  }, [state.accounts, state.investmentAssets])

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    const totalCash = state.accounts.reduce((sum, account) => sum + account.balance, 0)
    const totalInvestments = state.investmentAssets.reduce((sum, asset) => sum + asset.value, 0)
    const latestExpense = state.monthlyExpenses[state.monthlyExpenses.length - 1]?.amount ?? 0
    const latestIncome = state.netWorthTrend[state.netWorthTrend.length - 1]?.income ?? 0
    const previousNetWorth = state.netWorthTrend[state.netWorthTrend.length - 2]?.netWorth ?? 1
    const currentNetWorth = totalCash + totalInvestments + 145000
    const netWorthChange = ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100

    return [
      { label: 'Saldo totale', value: totalCash + totalInvestments, change: 6.2, accent: 'teal' },
      { label: 'Entrate mensili', value: latestIncome, change: 3.8, accent: 'blue' },
      { label: 'Uscite mensili', value: latestExpense, change: -4.1, accent: 'amber' },
      { label: 'Patrimonio netto', value: currentNetWorth, change: netWorthChange, accent: 'violet' },
    ]
  }, [state.accounts, state.investmentAssets, state.monthlyExpenses, state.netWorthTrend])

  const updateAccountBalance = (name: string, balance: number) => {
    setState((current) => {
      const accounts = current.accounts.map((account) =>
        account.name === name ? { ...account, balance } : account,
      )

      const latestTrend = current.accountBalanceTrend[current.accountBalanceTrend.length - 1]
      const accountMap = new Map(accounts.map((account) => [account.name, account.balance]))
      const updatedTrend = current.accountBalanceTrend.map((point, index, all) =>
        index === all.length - 1
          ? {
              ...latestTrend,
              checking: accountMap.get('Conto principale') ?? latestTrend.checking,
              savings: accountMap.get('Conto risparmio') ?? latestTrend.savings,
              card: accountMap.get('Carta aziendale') ?? latestTrend.card,
              wallet: accountMap.get('Wallet digitale') ?? latestTrend.wallet,
            }
          : point,
      )

      return { ...current, accounts, accountBalanceTrend: updatedTrend }
    })
  }

  const updateInvestmentValue = (symbol: string, value: number) => {
    setState((current) => {
      const investmentAssets = current.investmentAssets.map((asset) =>
        asset.symbol === symbol ? { ...asset, value } : asset,
      )
      const total = investmentAssets.reduce((sum, asset) => sum + asset.value, 0)
      const withAllocation = investmentAssets.map((asset) => ({
        ...asset,
        allocation: total > 0 ? Math.round((asset.value / total) * 100) : 0,
      }))
      const portfolioSeries = { ...current.portfolioSeries }

      for (const key of Object.keys(portfolioSeries) as PeriodOption['key'][]) {
        const series = [...portfolioSeries[key]]
        const lastIndex = series.length - 1
        series[lastIndex] = { ...series[lastIndex], value: total }
        portfolioSeries[key] = series
      }

      return { ...current, investmentAssets: withAllocation, portfolioSeries }
    })
  }

  const addTransaction = ({ merchant, category, amount }: TransactionInput) => {
    setState((current) => {
      const date = new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
      }).format(new Date())
      const icon = merchant.slice(0, 2).toUpperCase()
      const entry: TransactionItem = { merchant, category, amount, date, icon }
      const recentTransactions = [entry, ...current.recentTransactions].slice(0, 8)
      const accounts = current.accounts.map((account, index) =>
        index === 0 ? { ...account, balance: account.balance + amount } : account,
      )

      let expenseCategories = current.expenseCategories
      let monthlyExpenses = current.monthlyExpenses
      let netWorthTrend = current.netWorthTrend

      if (amount < 0) {
        expenseCategories = current.expenseCategories.map((item) =>
          item.name === category ? { ...item, amount: item.amount + Math.abs(amount) } : item,
        )
        monthlyExpenses = current.monthlyExpenses.map((item, index, all) =>
          index === all.length - 1 ? { ...item, amount: item.amount + Math.abs(amount) } : item,
        )
        netWorthTrend = current.netWorthTrend.map((item, index, all) =>
          index === all.length - 1 ? { ...item, expenses: item.expenses + Math.abs(amount) } : item,
        )
      } else {
        netWorthTrend = current.netWorthTrend.map((item, index, all) =>
          index === all.length - 1 ? { ...item, income: item.income + amount } : item,
        )
      }

      return {
        ...current,
        accounts,
        recentTransactions,
        expenseCategories,
        monthlyExpenses,
        netWorthTrend,
      }
    })
  }

  const resetData = () => setState(defaultState)

  const value = useMemo(
    () => ({
      ...state,
      summaryMetrics,
      moneyAllocation,
      investmentPeriods,
      updateAccountBalance,
      updateInvestmentValue,
      addTransaction,
      resetData,
    }),
    [state, summaryMetrics, moneyAllocation],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinanceData() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinanceData must be used within FinanceDataProvider')
  }
  return context
}
