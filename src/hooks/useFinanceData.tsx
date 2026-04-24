/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  currencyColors,
  periodOptions,
  seedFxRates,
  seedIndices,
  seedNews,
  seedOpportunities,
  supportedCurrencies,
} from '../data/seed'
import {
  createStarterFinanceState,
  type FinanceState,
} from '../data/state'
import type {
  AccountItem,
  CalendarItem,
  CashflowPoint,
  CurrencyCode,
  ExposureItem,
  FxRateMap,
  GoalItem,
  LiabilityItem,
  MarketIndex,
  NewsItem,
  OpportunityItem,
  PortfolioPosition,
  RecurringExpenseItem,
  SaleSimulation,
  SimulatedSaleLot,
  SummaryMetric,
  TaxCreditBucket,
  TransactionCategory,
  TransactionItem,
  TransactionStatus,
} from '../data/types'
import {
  bootstrapFinanceState,
  saveFinanceState,
  saveUserName,
} from '../lib/database'
import { convertWithEuroBaseRates, monthKey, monthLabelFromKey } from '../lib/utils'
import { getHistoricalFxRate, getLatestFxRates, getMarketSnapshot } from '../services/api'

interface PositionDraft {
  symbol: string
  name: string
  assetType: PortfolioPosition['assetType']
  quantity: number
  buyPrice: number
  currentPrice: number
  currency: CurrencyCode
  purchaseDate: string
  hedged: boolean
  annualDividendPerShare?: number
  thesis?: string
}

interface TransactionDraft {
  title: string
  category: string
  subcategory: string
  amount: number
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  transferAccountId: string | null
  status: TransactionStatus
  tags: string[]
  notes: string
  attachmentName: string
  attachmentUrl: string
  linkedRecurringExpenseId?: string | null
}

interface RecurringExpenseDraft {
  title: string
  category: string
  amount: number
  currency: CurrencyCode
  frequency: RecurringExpenseItem['frequency']
  nextDate: string
  notes: string
  kind: 'mandatory' | 'optional'
}

interface CategoryDraft {
  name: string
  type: TransactionCategory['type']
  subcategories: string[]
  color: string
}

interface GoalDraft {
  title: string
  category: string
  target: number
  current: number
  dueDate: string
}

interface LiabilityDraft {
  title: string
  balance: number
  dueDate: string
  kind: LiabilityItem['kind']
}

interface WatchlistDraft {
  symbol: string
  name: string
  category: string
  currency: CurrencyCode
  notes: string
}

interface CalendarDraft {
  title: string
  date: string
  kind: CalendarItem['kind']
  amount?: number
  currency?: CurrencyCode
}

interface PositionInsight extends PortfolioPosition {
  costOriginal: number
  marketValueOriginal: number
  pnlOriginal: number
  pnlOriginalPct: number
  currentFxRate: number
  costBase: number
  marketValueBase: number
  pnlBase: number
  pnlBasePct: number
  fxImpactBase: number
}

interface RecurringExpenseInsight extends RecurringExpenseItem {
  amountBase: number
  monthlyEquivalentBase: number
  occurrences30: number
  occurrences90: number
  occurrences365: number
}

interface RecurringExpenseForecastItem {
  expenseId: string
  title: string
  category: string
  date: string
  amount: number
  amountBase: number
  currency: CurrencyCode
  frequency: RecurringExpenseItem['frequency']
}

interface FinanceContextValue extends FinanceState {
  isHydrated: boolean
  supportedCurrencies: CurrencyCode[]
  fxRates: FxRateMap
  fxUpdatedAt: string
  fxSource: string
  fxStatus: 'live' | 'fallback'
  marketIndices: MarketIndex[]
  marketStatus: 'live' | 'fallback'
  newsItems: NewsItem[]
  opportunities: OpportunityItem[]
  summaryMetrics: SummaryMetric[]
  cashflowSeries: CashflowPoint[]
  exposure: ExposureItem[]
  positionInsights: PositionInsight[]
  basePortfolioValue: number
  totalLiquidBase: number
  portfolioTimeline: Array<{ month: string; total: number }>
  hedgingAlert: string | null
  strategyAlert: string | null
  dividendMonthlyAverageBase: number
  dividendCoveragePct: number
  annualDividendIncomeBase: number
  taxCreditRemaining: number
  taxCreditExpiring: TaxCreditBucket[]
  recurringExpenseInsights: RecurringExpenseInsight[]
  recurringExpenseForecast: {
    next30DaysBase: number
    next90DaysBase: number
    next365DaysBase: number
    monthlyRequiredBase: number
    upcoming: RecurringExpenseForecastItem[]
  }
  periodOptions: typeof periodOptions
  userName: string
  setUserName: (name: string) => void
  completeOnboarding: (name: string) => void
  setBaseCurrency: (currency: CurrencyCode) => void
  addAccount: () => void
  addTransaction: (input: TransactionDraft) => void
  updateTransaction: (id: string, input: TransactionDraft) => void
  duplicateTransaction: (id: string) => void
  updateBudget: (id: string, budget: number) => void
  updateAccount: (
    id: string,
    patch: Partial<Pick<AccountItem, 'name' | 'institution' | 'balance' | 'kind'>>,
  ) => void
  addCategory: (input: CategoryDraft) => void
  updateCategory: (id: string, patch: Partial<Pick<TransactionCategory, 'name' | 'subcategories' | 'color'>>) => void
  addRecurringExpense: (input: RecurringExpenseDraft) => void
  updateRecurringExpense: (
    id: string,
    patch: Partial<
      Pick<RecurringExpenseItem, 'title' | 'category' | 'amount' | 'currency' | 'frequency' | 'nextDate' | 'notes' | 'active' | 'kind'>
    >,
  ) => void
  removeRecurringExpense: (id: string) => void
  recordRecurringExpense: (id: string, accountId?: string) => void
  addGoal: (input: GoalDraft) => void
  updateGoal: (id: string, patch: Partial<Omit<GoalItem, 'id'>>) => void
  addLiability: (input: LiabilityDraft) => void
  updateLiability: (id: string, patch: Partial<Omit<LiabilityItem, 'id'>>) => void
  addPosition: (input: PositionDraft) => Promise<void>
  updatePositionPrice: (id: string, price: number) => void
  addWatchlistItem: (input: WatchlistDraft) => void
  addCalendarItem: (input: CalendarDraft) => void
  updatePositionNotes: (id: string, thesis: string) => void
  updateStrategyTarget: (
    assetType: PortfolioPosition['assetType'],
    targetPct: number,
  ) => void
  simulateSale: (
    symbol: string,
    quantity: number,
    method: 'FIFO' | 'LIFO',
  ) => SaleSimulation | null
  exportFiscalCsv: () => string
  refreshFxRates: () => Promise<void>
  refreshMarketData: () => Promise<void>
  resetData: () => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

const ACCOUNT_TONES: AccountItem['tone'][] = ['teal', 'blue', 'amber', 'violet']

function parseStoredDate(date: string) {
  return new Date(`${date}T12:00:00`)
}

function formatStoredDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function advanceRecurringDate(date: Date, frequency: RecurringExpenseItem['frequency']) {
  const next = new Date(date)

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7)
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1)
  } else if (frequency === 'quarterly') {
    next.setMonth(next.getMonth() + 3)
  } else {
    next.setFullYear(next.getFullYear() + 1)
  }

  return next
}

function getAlignedRecurringDate(date: string, frequency: RecurringExpenseItem['frequency']) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  let cursor = parseStoredDate(date)
  let safety = 0

  while (cursor < today && safety < 500) {
    cursor = advanceRecurringDate(cursor, frequency)
    safety += 1
  }

  return cursor
}

function countOccurrencesWithinHorizon(
  startDate: string,
  frequency: RecurringExpenseItem['frequency'],
  horizonDays: number,
) {
  const start = getAlignedRecurringDate(startDate, frequency)
  const horizon = new Date()
  horizon.setHours(12, 0, 0, 0)
  horizon.setDate(horizon.getDate() + horizonDays)

  let cursor = start
  let count = 0
  let safety = 0

  while (cursor <= horizon && safety < 500) {
    count += 1
    cursor = advanceRecurringDate(cursor, frequency)
    safety += 1
  }

  return count
}

function todayDateKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
}

function isEffectiveTransactionDate(date: string) {
  return date <= todayDateKey()
}

function normalizeTransactionDraft(input: TransactionDraft) {
  return {
    ...input,
    amount: Math.abs(input.amount),
    subcategory: input.subcategory.trim(),
    transferAccountId: input.type === 'transfer' ? input.transferAccountId : null,
    status: input.status ?? (isEffectiveTransactionDate(input.date) ? 'paid' : 'planned'),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    notes: input.notes.trim(),
    attachmentName: input.attachmentName ?? '',
    attachmentUrl: input.attachmentUrl ?? '',
    linkedRecurringExpenseId: input.linkedRecurringExpenseId ?? null,
  }
}

function transactionBudgetDelta(transaction: Pick<TransactionItem, 'amount' | 'type'>) {
  return transaction.type === 'expense' ? Math.abs(transaction.amount) : 0
}

function affectsCurrentBalance(transaction: Pick<TransactionItem, 'date' | 'status'>) {
  return isEffectiveTransactionDate(transaction.date) && transaction.status !== 'planned'
}

function applyTransactionToAccounts(
  accounts: AccountItem[],
  transaction: Pick<TransactionItem, 'accountId' | 'amount' | 'type' | 'transferAccountId'>,
  direction: 1 | -1,
) {
  return accounts.map((account) => {
    let nextBalance = account.balance

    if (account.id === transaction.accountId) {
      if (transaction.type === 'expense') {
        nextBalance += direction * -Math.abs(transaction.amount)
      } else if (transaction.type === 'income') {
        nextBalance += direction * Math.abs(transaction.amount)
      } else if (transaction.type === 'transfer') {
        nextBalance += direction * -Math.abs(transaction.amount)
      }
    }

    if (
      transaction.type === 'transfer' &&
      transaction.transferAccountId &&
      account.id === transaction.transferAccountId
    ) {
      nextBalance += direction * Math.abs(transaction.amount)
    }

    return nextBalance === account.balance ? account : { ...account, balance: nextBalance }
  })
}

function ensureCategoryStructures(
  categories: TransactionCategory[],
  budgets: FinanceState['budgets'],
  transaction: TransactionDraft,
) {
  if (transaction.type === 'transfer' || !transaction.category.trim()) {
    return { categories, budgets }
  }

  const hasCategory = categories.some(
    (category) => category.type === transaction.type && category.name === transaction.category,
  )

  if (hasCategory) {
    return { categories, budgets }
  }

  const nextCategory: TransactionCategory = {
    id: createId('cat'),
    name: transaction.category,
    type: transaction.type,
    subcategories: transaction.subcategory ? [transaction.subcategory] : [],
    color: transaction.type === 'income' ? '#14b8a6' : '#38bdf8',
  }

  return {
    categories: [...categories, nextCategory].sort((left, right) => left.name.localeCompare(right.name)),
    budgets:
      transaction.type === 'expense'
        ? [
            ...budgets,
            {
              id: createId('budget'),
              name: transaction.category,
              spent: 0,
              budget: 0,
              color: nextCategory.color,
            },
          ]
        : budgets,
  }
}

export function FinanceDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinanceState>(() => createStarterFinanceState())
  const [userName, setUserNameState] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [newsItems] = useState<NewsItem[]>(seedNews)
  const queryClient = useQueryClient()

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const payload = await bootstrapFinanceState()
        if (!isMounted) return

        setState(payload.state)
        setUserNameState(payload.userName)
      } catch {
        if (!isMounted) return

        setState(createStarterFinanceState())
        setUserNameState('')
      } finally {
        if (isMounted) {
          setIsHydrated(true)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    void saveFinanceState(state)
  }, [isHydrated, state])

  useEffect(() => {
    if (!isHydrated) return
    void saveUserName(userName)
  }, [isHydrated, userName])

  const marketSymbols = useMemo(
    () =>
      Array.from(
        new Set([
          ...seedIndices.map((item) => item.symbol),
          ...state.watchlist.map((item) => item.symbol),
        ]),
      ),
    [state.watchlist],
  )

  const fxQuery = useQuery({
    queryKey: ['fx-rates'],
    queryFn: getLatestFxRates,
    refetchInterval: 60_000,
  })

  const marketQuery = useQuery({
    queryKey: ['market-snapshot', marketSymbols],
    queryFn: () => getMarketSnapshot(marketSymbols),
    refetchInterval: 45_000,
  })

  const fxRates = fxQuery.data?.rates ?? seedFxRates
  const fxUpdatedAt = fxQuery.data?.updatedAt ?? 'fallback locale'
  const fxStatus = fxQuery.data?.status ?? 'fallback'
  const marketIndices = marketQuery.data?.indices ?? seedIndices
  const marketStatus = marketQuery.data?.status ?? 'fallback'
  const opportunities = marketQuery.data?.opportunities ?? seedOpportunities
  const liveWatchlist = useMemo(() => {
    const quoteMap = new Map(
      (marketQuery.data?.quotes ?? []).map((quote) => [quote.symbol, quote]),
    )

    return state.watchlist.map((item) => {
      const live = quoteMap.get(item.symbol)
      return live ? { ...item, price: live.price, change: live.change } : item
    })
  }, [marketQuery.data?.quotes, state.watchlist])

  const positionInsights = useMemo<PositionInsight[]>(() => {
    return state.positions.map((position) => {
      const costOriginal = position.quantity * position.buyPrice
      const marketValueOriginal = position.quantity * position.currentPrice
      const pnlOriginal = marketValueOriginal - costOriginal
      const pnlOriginalPct = costOriginal > 0 ? (pnlOriginal / costOriginal) * 100 : 0
      const currentFxRate = convertWithEuroBaseRates(
        1,
        position.currency,
        state.baseCurrency,
        fxRates,
      )
      const costBase = costOriginal * position.purchaseFxRate
      const marketValueBase = marketValueOriginal * currentFxRate
      const pnlBase = marketValueBase - costBase
      const pnlBasePct = costBase > 0 ? (pnlBase / costBase) * 100 : 0
      const fxImpactBase =
        marketValueOriginal * currentFxRate - marketValueOriginal * position.purchaseFxRate

      return {
        ...position,
        costOriginal,
        marketValueOriginal,
        pnlOriginal,
        pnlOriginalPct,
        currentFxRate,
        costBase,
        marketValueBase,
        pnlBase,
        pnlBasePct,
        fxImpactBase,
      }
    })
  }, [fxRates, state.baseCurrency, state.positions])

  const exposure = useMemo<ExposureItem[]>(() => {
    const total = positionInsights.reduce((sum, item) => sum + item.marketValueBase, 0)
    const grouped = new Map<CurrencyCode, number>()

    for (const item of positionInsights) {
      grouped.set(item.currency, (grouped.get(item.currency) ?? 0) + item.marketValueBase)
    }

    return Array.from(grouped.entries()).map(([currency, valueBase]) => ({
      currency,
      valueBase,
      share: total > 0 ? (valueBase / total) * 100 : 0,
      color: currencyColors[currency],
    }))
  }, [positionInsights])

  const basePortfolioValue = useMemo(
    () => positionInsights.reduce((sum, item) => sum + item.marketValueBase, 0),
    [positionInsights],
  )

  const totalLiquidBase = useMemo(
    () =>
      state.accounts.reduce(
        (sum, account) =>
          sum +
          convertWithEuroBaseRates(
            account.balance,
            account.currency,
            state.baseCurrency,
            fxRates,
          ),
        0,
      ),
    [fxRates, state.accounts, state.baseCurrency],
  )

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const currentMonthTransactions = state.transactions.filter((item) => {
      const date = new Date(item.date)
      return (
        item.type !== 'transfer' &&
        affectsCurrentBalance(item) &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      )
    })
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const previousMonthTransactions = state.transactions.filter((item) => {
      const date = new Date(item.date)
      return (
        item.type !== 'transfer' &&
        affectsCurrentBalance(item) &&
        date.getMonth() === previousMonthDate.getMonth() &&
        date.getFullYear() === previousMonthDate.getFullYear()
      )
    })
    const income = currentMonthTransactions
      .filter((item) => item.type === 'income')
      .reduce(
        (sum, item) =>
          sum + convertWithEuroBaseRates(item.amount, item.currency, state.baseCurrency, fxRates),
        0,
      )
    const expenses = Math.abs(
      currentMonthTransactions
        .filter((item) => item.type === 'expense')
        .reduce(
          (sum, item) =>
            sum +
            convertWithEuroBaseRates(item.amount, item.currency, state.baseCurrency, fxRates),
          0,
        ),
    )
    const previousNet = previousMonthTransactions.reduce((sum, item) => {
      const amountBase = convertWithEuroBaseRates(
        item.amount,
        item.currency,
        state.baseCurrency,
        fxRates,
      )
      return item.type === 'income' ? sum + amountBase : sum - Math.abs(amountBase)
    }, 0)
    const currentNet = income - expenses
    const monthlyChangePct = previousNet !== 0 ? ((currentNet - previousNet) / Math.abs(previousNet)) * 100 : 0

    return [
      {
        label: 'Patrimonio totale',
        value: totalLiquidBase + basePortfolioValue,
        change: 0,
        accent: 'teal',
      },
      {
        label: 'Liquidita disponibile',
        value: totalLiquidBase,
        change: 0,
        accent: 'blue',
      },
      {
        label: 'Portafoglio investito',
        value: basePortfolioValue,
        change: 0,
        accent: 'violet',
      },
      {
        label: 'Crescita mensile',
        value: currentNet,
        change: monthlyChangePct,
        accent: 'amber',
      },
    ]
  }, [basePortfolioValue, fxRates, state.baseCurrency, state.transactions, totalLiquidBase])

  const cashflowSeries = useMemo<CashflowPoint[]>(() => {
    const grouped = new Map<string, CashflowPoint>()

    for (const transaction of state.transactions) {
      if (transaction.type === 'transfer' || !affectsCurrentBalance(transaction)) continue

      const key = monthKey(transaction.date)
      const current = grouped.get(key) ?? {
        month: monthLabelFromKey(key),
        income: 0,
        expenses: 0,
        netWorth: 0,
      }
      const amountInBase = convertWithEuroBaseRates(
        transaction.amount,
        transaction.currency,
        state.baseCurrency,
        fxRates,
      )

      if (transaction.type === 'income') {
        current.income += amountInBase
      } else {
        current.expenses += Math.abs(amountInBase)
      }

      grouped.set(key, current)
    }

    if (!grouped.size) {
      return []
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<CashflowPoint[]>((acc, [, value]) => {
        const previousNetWorth = acc.at(-1)?.netWorth ?? 0
        acc.push({
          ...value,
          netWorth: previousNetWorth + value.income - value.expenses,
        })
        return acc
      }, [])
  }, [fxRates, state.baseCurrency, state.transactions])

  const portfolioTimeline = useMemo(() => {
    const grouped = new Map<string, number>()

    for (const position of positionInsights) {
      const key = monthKey(position.purchaseDate)
      grouped.set(key, (grouped.get(key) ?? 0) + position.marketValueBase)
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, total]) => ({
        month: monthLabelFromKey(key),
        total,
      }))
  }, [positionInsights])

  const hedgingAlert = useMemo(() => {
    const usdShare = exposure.find((item) => item.currency === 'USD')?.share ?? 0
    return usdShare > 60
      ? `Attenzione: il ${usdShare.toFixed(0)}% del portafoglio e esposto a USD.`
      : null
  }, [exposure])

  const strategyAlert = useMemo(() => {
    const total = positionInsights.reduce((sum, item) => sum + item.marketValueBase, 0)
    if (!total) return null

    const actualByType = new Map<PortfolioPosition['assetType'], number>()
    for (const item of positionInsights) {
      actualByType.set(
        item.assetType,
        (actualByType.get(item.assetType) ?? 0) + (item.marketValueBase / total) * 100,
      )
    }

    const worstDrift = state.strategyTargets
      .map((target) => ({
        assetType: target.assetType,
        drift: (actualByType.get(target.assetType) ?? 0) - target.targetPct,
      }))
      .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))[0]

    return worstDrift && Math.abs(worstDrift.drift) >= 5
      ? `Strategia fuori range: ${worstDrift.assetType} e a ${
          worstDrift.drift > 0 ? '+' : ''
        }${worstDrift.drift.toFixed(1)} punti rispetto al target.`
      : null
  }, [positionInsights, state.strategyTargets])

  const annualDividendIncomeBase = useMemo(
    () =>
      positionInsights.reduce((sum, item) => {
        const annualDividend = (item.annualDividendPerShare ?? 0) * item.quantity
        return (
          sum + convertWithEuroBaseRates(annualDividend, item.currency, state.baseCurrency, fxRates)
        )
      }, 0),
    [fxRates, positionInsights, state.baseCurrency],
  )

  const dividendMonthlyAverageBase = annualDividendIncomeBase / 12

  const fixedMonthlyExpensesBase = useMemo(
    () =>
      state.budgets
        .filter((item) => ['Casa', 'Abbonamenti', 'Trasporti'].includes(item.name))
        .reduce((sum, item) => sum + item.budget, 0),
    [state.budgets],
  )

  const dividendCoveragePct =
    fixedMonthlyExpensesBase > 0 ? (dividendMonthlyAverageBase / fixedMonthlyExpensesBase) * 100 : 0

  const taxCreditRemaining = useMemo(
    () => state.taxCredits.reduce((sum, item) => sum + (item.amount - item.used), 0),
    [state.taxCredits],
  )

  const taxCreditExpiring = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() + 12)
    return state.taxCredits.filter((item) => new Date(item.expiresAt) <= cutoff)
  }, [state.taxCredits])

  const recurringExpenseInsights = useMemo<RecurringExpenseInsight[]>(
    () =>
      state.recurringExpenses.map((expense) => {
        const amountBase = convertWithEuroBaseRates(
          expense.amount,
          expense.currency,
          state.baseCurrency,
          fxRates,
        )
        const monthlyEquivalentBase =
          expense.frequency === 'weekly'
            ? (amountBase * 52) / 12
            : expense.frequency === 'monthly'
              ? amountBase
              : expense.frequency === 'quarterly'
                ? amountBase / 3
                : amountBase / 12

        return {
          ...expense,
          amountBase,
          monthlyEquivalentBase,
          occurrences30: expense.active
            ? countOccurrencesWithinHorizon(expense.nextDate, expense.frequency, 30)
            : 0,
          occurrences90: expense.active
            ? countOccurrencesWithinHorizon(expense.nextDate, expense.frequency, 90)
            : 0,
          occurrences365: expense.active
            ? countOccurrencesWithinHorizon(expense.nextDate, expense.frequency, 365)
            : 0,
        }
      }),
    [fxRates, state.baseCurrency, state.recurringExpenses],
  )

  const recurringExpenseForecast = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const horizon30 = new Date(today)
    horizon30.setDate(horizon30.getDate() + 30)
    const horizon90 = new Date(today)
    horizon90.setDate(horizon90.getDate() + 90)
    const horizon365 = new Date(today)
    horizon365.setDate(horizon365.getDate() + 365)

    let next30DaysBase = 0
    let next90DaysBase = 0
    let next365DaysBase = 0
    const upcoming: RecurringExpenseForecastItem[] = []

    for (const expense of recurringExpenseInsights.filter((item) => item.active)) {
      let cursor = getAlignedRecurringDate(expense.nextDate, expense.frequency)
      let safety = 0

      while (cursor <= horizon365 && safety < 500) {
        const dateValue = formatStoredDate(cursor)
        upcoming.push({
          expenseId: expense.id,
          title: expense.title,
          category: expense.category,
          date: dateValue,
          amount: expense.amount,
          amountBase: expense.amountBase,
          currency: expense.currency,
          frequency: expense.frequency,
        })

        if (cursor <= horizon30) {
          next30DaysBase += expense.amountBase
        }
        if (cursor <= horizon90) {
          next90DaysBase += expense.amountBase
        }
        next365DaysBase += expense.amountBase

        cursor = advanceRecurringDate(cursor, expense.frequency)
        safety += 1
      }
    }

    return {
      next30DaysBase,
      next90DaysBase,
      next365DaysBase,
      monthlyRequiredBase: recurringExpenseInsights
        .filter((item) => item.active)
        .reduce((sum, item) => sum + item.monthlyEquivalentBase, 0),
      upcoming: upcoming.sort((left, right) => left.date.localeCompare(right.date)).slice(0, 12),
    }
  }, [recurringExpenseInsights])

  const setUserName = (name: string) => {
    setUserNameState(name)
  }

  const completeOnboarding = (name: string) => {
    setState(createStarterFinanceState())
    setUserNameState(name)
  }

  const setBaseCurrency = (currency: CurrencyCode) => {
    setState((current) => ({ ...current, baseCurrency: currency }))
  }

  const addAccount = () => {
    setState((current) => {
      const nextIndex = current.accounts.length + 1
      return {
        ...current,
        accounts: [
          ...current.accounts,
          {
            id: createId('acc'),
            name: `Conto ${nextIndex}`,
            institution: 'Nuovo istituto',
            balance: 0,
            currency: current.baseCurrency,
            kind: 'checking',
            tone: ACCOUNT_TONES[current.accounts.length % ACCOUNT_TONES.length],
            editable: true,
          },
        ],
      }
    })
  }

  const addCategory = (input: CategoryDraft) => {
    setState((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: createId('cat'),
          name: input.name.trim() || 'Nuova categoria',
          type: input.type,
          subcategories: input.subcategories.filter(Boolean),
          color: input.color,
        },
      ].sort((left, right) => left.name.localeCompare(right.name)),
      budgets:
        input.type === 'expense'
          ? [
              ...current.budgets,
              {
                id: createId('budget'),
                name: input.name.trim() || 'Nuova categoria',
                spent: 0,
                budget: 0,
                color: input.color,
              },
            ]
          : current.budgets,
    }))
  }

  const updateCategory = (
    id: string,
    patch: Partial<Pick<TransactionCategory, 'name' | 'subcategories' | 'color'>>,
  ) => {
    setState((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === id
          ? {
              ...category,
              ...patch,
              name: patch.name?.trim() || category.name,
              subcategories: patch.subcategories
                ? patch.subcategories.map((entry) => entry.trim()).filter(Boolean)
                : category.subcategories,
            }
          : category,
      ),
      budgets: current.budgets.map((budget) => {
        const category = current.categories.find((item) => item.id === id)
        return category && budget.name === category.name
          ? { ...budget, name: patch.name?.trim() || budget.name, color: patch.color ?? budget.color }
          : budget
      }),
    }))
  }

  const addTransaction = (input: TransactionDraft) => {
    const normalizedInput = normalizeTransactionDraft(input)
    const shouldApplyNow = affectsCurrentBalance(normalizedInput)

    setState((current) => {
      const ensured = ensureCategoryStructures(current.categories, current.budgets, normalizedInput)

      return {
        ...current,
        categories: ensured.categories,
        transactions: [{ id: createId('tx'), ...normalizedInput }, ...current.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
        budgets:
          shouldApplyNow && normalizedInput.type === 'expense'
            ? ensured.budgets.map((budget) =>
                budget.name === normalizedInput.category
                  ? {
                      ...budget,
                      spent:
                        budget.spent +
                        Math.abs(
                          convertWithEuroBaseRates(
                            normalizedInput.amount,
                            normalizedInput.currency,
                            current.baseCurrency,
                            fxRates,
                          ),
                        ),
                    }
                  : budget,
              )
            : ensured.budgets,
        accounts: shouldApplyNow
          ? applyTransactionToAccounts(current.accounts, normalizedInput, 1)
          : current.accounts,
      }
    })
  }

  const updateTransaction = (id: string, input: TransactionDraft) => {
    const normalizedInput = normalizeTransactionDraft(input)

    setState((current) => {
      const previous = current.transactions.find((transaction) => transaction.id === id)

      if (!previous) {
        return current
      }

      const previousApplied = affectsCurrentBalance(previous)
      const nextApplied = affectsCurrentBalance(normalizedInput)

      const previousBudgetDelta = Math.abs(
        convertWithEuroBaseRates(
          transactionBudgetDelta(previous),
          previous.currency,
          current.baseCurrency,
          fxRates,
        ),
      )
      const nextBudgetDelta = Math.abs(
        convertWithEuroBaseRates(
          transactionBudgetDelta(normalizedInput),
          normalizedInput.currency,
          current.baseCurrency,
          fxRates,
        ),
      )
      const ensured = ensureCategoryStructures(current.categories, current.budgets, normalizedInput)

      return {
        ...current,
        categories: ensured.categories,
        transactions: current.transactions
          .map((transaction) => (transaction.id === id ? { id, ...normalizedInput } : transaction))
          .sort((left, right) => right.date.localeCompare(left.date)),
        accounts: (() => {
          let nextAccounts = current.accounts
          if (previousApplied) {
            nextAccounts = applyTransactionToAccounts(nextAccounts, previous, -1)
          }
          if (nextApplied) {
            nextAccounts = applyTransactionToAccounts(nextAccounts, normalizedInput, 1)
          }
          return nextAccounts
        })(),
        budgets: ensured.budgets.map((budget) => {
          let nextSpent = budget.spent

          if (previousApplied && previous.type === 'expense' && budget.name === previous.category) {
            nextSpent = Math.max(nextSpent - previousBudgetDelta, 0)
          }

          if (nextApplied && normalizedInput.type === 'expense' && budget.name === normalizedInput.category) {
            nextSpent += nextBudgetDelta
          }

          return budget.name === previous.category || budget.name === normalizedInput.category
            ? { ...budget, spent: nextSpent }
            : budget
        }),
      }
    })
  }

  const duplicateTransaction = (id: string) => {
    setState((current) => {
      const source = current.transactions.find((transaction) => transaction.id === id)
      if (!source) return current

      const cloned = normalizeTransactionDraft({
        title: `${source.title} copia`,
        category: source.category,
        subcategory: source.subcategory ?? '',
        amount: source.amount,
        currency: source.currency,
        date: todayDateKey(),
        type: source.type,
        accountId: source.accountId,
        transferAccountId: source.transferAccountId ?? null,
        status: 'paid',
        tags: source.tags ?? [],
        notes: source.notes ?? '',
        attachmentName: source.attachmentName ?? '',
        attachmentUrl: source.attachmentUrl ?? '',
        linkedRecurringExpenseId: source.linkedRecurringExpenseId ?? null,
      })

      return {
        ...current,
        transactions: [{ id: createId('tx'), ...cloned }, ...current.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
        budgets:
          cloned.type === 'expense'
            ? current.budgets.map((budget) =>
                budget.name === cloned.category
                  ? {
                      ...budget,
                      spent:
                        budget.spent +
                        Math.abs(
                          convertWithEuroBaseRates(
                            cloned.amount,
                            cloned.currency,
                            current.baseCurrency,
                            fxRates,
                          ),
                        ),
                    }
                  : budget,
              )
            : current.budgets,
        accounts: applyTransactionToAccounts(current.accounts, cloned, 1),
      }
    })
  }

  const addRecurringExpense = (input: RecurringExpenseDraft) => {
    setState((current) => ({
      ...current,
      recurringExpenses: [
        { id: createId('rec'), active: true, ...input },
        ...current.recurringExpenses,
      ].sort((left, right) => left.nextDate.localeCompare(right.nextDate)),
    }))
  }

  const updateRecurringExpense = (
    id: string,
    patch: Partial<
      Pick<
        RecurringExpenseItem,
        'title' | 'category' | 'amount' | 'currency' | 'frequency' | 'nextDate' | 'notes' | 'active' | 'kind'
      >
    >,
  ) => {
    setState((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses
        .map((expense) => (expense.id === id ? { ...expense, ...patch } : expense))
        .sort((left, right) => left.nextDate.localeCompare(right.nextDate)),
    }))
  }

  const removeRecurringExpense = (id: string) => {
    setState((current) => ({
      ...current,
      recurringExpenses: current.recurringExpenses.filter((expense) => expense.id !== id),
    }))
  }

  const recordRecurringExpense = (id: string, accountId?: string) => {
    setState((current) => {
      const expense = current.recurringExpenses.find((item) => item.id === id)
      if (!expense) return current

      const targetAccountId = accountId ?? current.accounts[0]?.id
      if (!targetAccountId) return current

      const transactionDraft = normalizeTransactionDraft({
        title: expense.title,
        category: expense.category,
        subcategory: '',
        amount: expense.amount,
        currency: expense.currency,
        date: expense.nextDate <= todayDateKey() ? expense.nextDate : todayDateKey(),
        type: 'expense',
        accountId: targetAccountId,
        transferAccountId: null,
        status: 'paid',
        tags: ['ricorrenza', expense.kind ?? 'mandatory'],
        notes: expense.notes,
        attachmentName: '',
        attachmentUrl: '',
        linkedRecurringExpenseId: expense.id,
      })

      const nextDate = formatStoredDate(
        advanceRecurringDate(parseStoredDate(expense.nextDate), expense.frequency),
      )
      const amountBase = Math.abs(
        convertWithEuroBaseRates(
          transactionDraft.amount,
          transactionDraft.currency,
          current.baseCurrency,
          fxRates,
        ),
      )

      return {
        ...current,
        transactions: [{ id: createId('tx'), ...transactionDraft }, ...current.transactions].sort((a, b) =>
          b.date.localeCompare(a.date),
        ),
        recurringExpenses: current.recurringExpenses
          .map((item) => (item.id === id ? { ...item, nextDate } : item))
          .sort((left, right) => left.nextDate.localeCompare(right.nextDate)),
        budgets: current.budgets.map((budget) =>
          budget.name === transactionDraft.category ? { ...budget, spent: budget.spent + amountBase } : budget,
        ),
        accounts: applyTransactionToAccounts(current.accounts, transactionDraft, 1),
      }
    })
  }

  const updateBudget = (id: string, budget: number) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.map((item) => (item.id === id ? { ...item, budget } : item)),
    }))
  }

  const updateAccount = (
    id: string,
    patch: Partial<Pick<AccountItem, 'name' | 'institution' | 'balance' | 'kind'>>,
  ) => {
    setState((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.id === id && account.editable ? { ...account, ...patch } : account,
      ),
    }))
  }

  const addGoal = (input: GoalDraft) => {
    setState((current) => ({
      ...current,
      goals: [{ id: createId('goal'), ...input }, ...current.goals].sort((left, right) =>
        left.dueDate.localeCompare(right.dueDate),
      ),
    }))
  }

  const updateGoal = (id: string, patch: Partial<Omit<GoalItem, 'id'>>) => {
    setState((current) => ({
      ...current,
      goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
    }))
  }

  const addLiability = (input: LiabilityDraft) => {
    setState((current) => ({
      ...current,
      liabilities: [{ id: createId('liab'), ...input }, ...current.liabilities].sort((left, right) =>
        left.dueDate.localeCompare(right.dueDate),
      ),
    }))
  }

  const updateLiability = (id: string, patch: Partial<Omit<LiabilityItem, 'id'>>) => {
    setState((current) => ({
      ...current,
      liabilities: current.liabilities.map((liability) =>
        liability.id === id ? { ...liability, ...patch } : liability,
      ),
    }))
  }

  const addPosition = async (input: PositionDraft) => {
    let purchaseFxRate = 1
    if (input.currency !== state.baseCurrency) {
      try {
        const historicalRates = await getHistoricalFxRate(input.purchaseDate)
        purchaseFxRate = convertWithEuroBaseRates(
          1,
          input.currency,
          state.baseCurrency,
          historicalRates,
        )
      } catch {
        purchaseFxRate = convertWithEuroBaseRates(1, input.currency, state.baseCurrency, fxRates)
      }
    }

    setState((current) => ({
      ...current,
      positions: [{ id: createId('pos'), purchaseFxRate, ...input }, ...current.positions],
    }))
  }

  const updatePositionPrice = (id: string, price: number) => {
    setState((current) => ({
      ...current,
      positions: current.positions.map((position) =>
        position.id === id ? { ...position, currentPrice: price } : position,
      ),
    }))
  }

  const addWatchlistItem = (input: WatchlistDraft) => {
    setState((current) => ({
      ...current,
      watchlist: [{ id: createId('watch'), ...input, price: 0, change: 0 }, ...current.watchlist],
    }))
  }

  const addCalendarItem = (input: CalendarDraft) => {
    setState((current) => ({
      ...current,
      calendarItems: [{ id: createId('cal'), ...input }, ...current.calendarItems].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
  }

  const updatePositionNotes = (id: string, thesis: string) => {
    setState((current) => ({
      ...current,
      positions: current.positions.map((position) =>
        position.id === id ? { ...position, thesis } : position,
      ),
    }))
  }

  const updateStrategyTarget = (
    assetType: PortfolioPosition['assetType'],
    targetPct: number,
  ) => {
    setState((current) => ({
      ...current,
      strategyTargets: current.strategyTargets.map((item) =>
        item.assetType === assetType ? { ...item, targetPct } : item,
      ),
    }))
  }

  const simulateSale = (
    symbol: string,
    quantity: number,
    method: 'FIFO' | 'LIFO',
  ): SaleSimulation | null => {
    const lotsPool = state.positions
      .filter((item) => item.symbol === symbol)
      .sort((a, b) =>
        method === 'FIFO'
          ? a.purchaseDate.localeCompare(b.purchaseDate)
          : b.purchaseDate.localeCompare(a.purchaseDate),
      )

    if (!lotsPool.length) return null

    let remaining = quantity
    const lots: SimulatedSaleLot[] = []
    let costBase = 0
    let proceedsBase = 0

    for (const lot of lotsPool) {
      if (remaining <= 0) break

      const matchedQty = Math.min(remaining, lot.quantity)
      const lotCostBase = matchedQty * lot.buyPrice * lot.purchaseFxRate
      const lotProceedsBase =
        matchedQty *
        lot.currentPrice *
        convertWithEuroBaseRates(1, lot.currency, state.baseCurrency, fxRates)

      costBase += lotCostBase
      proceedsBase += lotProceedsBase
      lots.push({
        positionId: lot.id,
        symbol: lot.symbol,
        quantity: matchedQty,
        unitCost: lot.buyPrice,
        proceeds: matchedQty * lot.currentPrice,
        gainBase: lotProceedsBase - lotCostBase,
      })
      remaining -= matchedQty
    }

    const gainBase = proceedsBase - costBase
    const compensableCredits = taxCreditRemaining
    const taxableBase = Math.max(gainBase - compensableCredits, 0)
    const estimatedTax = taxableBase * 0.26

    return {
      symbol,
      quantity: quantity - remaining,
      method,
      proceedsBase,
      costBase,
      gainBase,
      estimatedTax,
      taxRate: 0.26,
      lots,
    }
  }

  const exportFiscalCsv = () => {
    const header =
      'symbol,purchaseDate,assetType,currency,quantity,buyPrice,currentPrice,costBase,marketValueBase,pnlBase,thesis'
    const rows = positionInsights.map((item) =>
      [
        item.symbol,
        item.purchaseDate,
        item.assetType,
        item.currency,
        item.quantity,
        item.buyPrice,
        item.currentPrice,
        item.costBase.toFixed(2),
        item.marketValueBase.toFixed(2),
        item.pnlBase.toFixed(2),
        `"${(item.thesis ?? '').replace(/"/g, '""')}"`,
      ].join(','),
    )

    return [header, ...rows].join('\n')
  }

  const refreshFxRates = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fx-rates'] })
  }

  const refreshMarketData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['market-snapshot'] })
  }

  const resetData = () => {
    setState(createStarterFinanceState())
    void queryClient.invalidateQueries({ queryKey: ['fx-rates'] })
    void queryClient.invalidateQueries({ queryKey: ['market-snapshot'] })
  }

  const value: FinanceContextValue = {
    ...state,
    isHydrated,
    supportedCurrencies,
    fxRates,
    fxUpdatedAt,
    fxSource: fxQuery.data?.source ?? 'Seed locale',
    fxStatus,
    marketIndices,
    marketStatus,
    newsItems,
    opportunities,
    watchlist: liveWatchlist,
    summaryMetrics,
    cashflowSeries,
    exposure,
    positionInsights,
    basePortfolioValue,
    totalLiquidBase,
    portfolioTimeline,
    hedgingAlert,
    strategyAlert,
    dividendMonthlyAverageBase,
    dividendCoveragePct,
    annualDividendIncomeBase,
    taxCreditRemaining,
    taxCreditExpiring,
    recurringExpenseInsights,
    recurringExpenseForecast,
    periodOptions,
    userName,
    setUserName,
    completeOnboarding,
    setBaseCurrency,
    addAccount,
    addTransaction,
    updateTransaction,
    duplicateTransaction,
    updateBudget,
    updateAccount,
    addCategory,
    updateCategory,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    recordRecurringExpense,
    addGoal,
    updateGoal,
    addLiability,
    updateLiability,
    addPosition,
    updatePositionPrice,
    addWatchlistItem,
    addCalendarItem,
    updatePositionNotes,
    updateStrategyTarget,
    simulateSale,
    exportFiscalCsv,
    refreshFxRates,
    refreshMarketData,
    resetData,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinanceData() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinanceData must be used within FinanceDataProvider')
  }
  return context
}
