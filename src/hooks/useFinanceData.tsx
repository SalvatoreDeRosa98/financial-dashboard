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
  MarketIndex,
  NewsItem,
  OpportunityItem,
  PortfolioPosition,
  RecurringExpenseItem,
  SaleSimulation,
  SimulatedSaleLot,
  SummaryMetric,
  TaxCreditBucket,
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
  amount: number
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense'
  accountId: string
}

interface RecurringExpenseDraft {
  title: string
  category: string
  amount: number
  currency: CurrencyCode
  frequency: RecurringExpenseItem['frequency']
  nextDate: string
  notes: string
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
  updateBudget: (id: string, budget: number) => void
  updateAccount: (
    id: string,
    patch: Partial<Pick<AccountItem, 'name' | 'institution' | 'balance'>>,
  ) => void
  addRecurringExpense: (input: RecurringExpenseDraft) => void
  updateRecurringExpense: (
    id: string,
    patch: Partial<
      Pick<RecurringExpenseItem, 'title' | 'category' | 'amount' | 'currency' | 'frequency' | 'nextDate' | 'notes' | 'active'>
    >,
  ) => void
  removeRecurringExpense: (id: string) => void
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
    const hasTrackedData =
      state.transactions.length > 0 ||
      state.positions.length > 0 ||
      state.accounts.some((account) => account.balance !== 0)
    const currentMonthTransactions = state.transactions.filter((item) => {
      const date = new Date(item.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
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

    return [
      {
        label: 'Patrimonio totale',
        value: totalLiquidBase + basePortfolioValue,
        change: hasTrackedData ? 4.2 : 0,
        accent: 'teal',
      },
      {
        label: 'Liquidita disponibile',
        value: totalLiquidBase,
        change: hasTrackedData ? 2.1 : 0,
        accent: 'blue',
      },
      {
        label: 'Portafoglio investito',
        value: basePortfolioValue,
        change: hasTrackedData ? 7.1 : 0,
        accent: 'violet',
      },
      {
        label: 'Crescita mensile',
        value: income - expenses,
        change: hasTrackedData ? 2.8 : 0,
        accent: 'amber',
      },
    ]
  }, [basePortfolioValue, fxRates, state.accounts, state.baseCurrency, state.positions, state.transactions, totalLiquidBase])

  const cashflowSeries = useMemo<CashflowPoint[]>(() => {
    const grouped = new Map<string, CashflowPoint>()

    for (const transaction of state.transactions) {
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
      .map(([, value], index, all) => ({
        ...value,
        netWorth:
          summaryMetrics[0].value - (all.length - index - 1) * 3800 + value.income - value.expenses,
      }))
  }, [fxRates, state.baseCurrency, state.transactions, summaryMetrics])

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
            tone: ACCOUNT_TONES[current.accounts.length % ACCOUNT_TONES.length],
            editable: true,
          },
        ],
      }
    })
  }

  const addTransaction = (input: TransactionDraft) => {
    setState((current) => ({
      ...current,
      transactions: [{ id: createId('tx'), ...input }, ...current.transactions].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
      budgets:
        input.type === 'expense'
          ? current.budgets.map((budget) =>
              budget.name === input.category
                ? {
                    ...budget,
                    spent:
                      budget.spent +
                      Math.abs(
                        convertWithEuroBaseRates(
                          input.amount,
                          input.currency,
                          current.baseCurrency,
                          fxRates,
                        ),
                      ),
                  }
                : budget,
            )
          : current.budgets,
      accounts: current.accounts.map((account) =>
        account.id === input.accountId
          ? {
              ...account,
              balance:
                account.balance +
                (input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount)),
            }
          : account,
      ),
    }))
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
        'title' | 'category' | 'amount' | 'currency' | 'frequency' | 'nextDate' | 'notes' | 'active'
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

  const updateBudget = (id: string, budget: number) => {
    setState((current) => ({
      ...current,
      budgets: current.budgets.map((item) => (item.id === id ? { ...item, budget } : item)),
    }))
  }

  const updateAccount = (
    id: string,
    patch: Partial<Pick<AccountItem, 'name' | 'institution' | 'balance'>>,
  ) => {
    setState((current) => ({
      ...current,
      accounts: current.accounts.map((account) =>
        account.id === id && account.editable ? { ...account, ...patch } : account,
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
    updateBudget,
    updateAccount,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
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
