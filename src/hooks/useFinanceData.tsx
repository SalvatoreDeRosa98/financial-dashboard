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
  defaultFinanceState,
  emptyFinanceState,
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
  periodOptions: typeof periodOptions
  userName: string
  setUserName: (name: string) => void
  completeOnboarding: (name: string) => void
  setBaseCurrency: (currency: CurrencyCode) => void
  addTransaction: (input: TransactionDraft) => void
  updateBudget: (id: string, budget: number) => void
  updateAccount: (
    id: string,
    patch: Partial<Pick<AccountItem, 'name' | 'institution' | 'balance'>>,
  ) => void
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

export function FinanceDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinanceState>(defaultFinanceState)
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

        setState(defaultFinanceState)
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
        change: 4.2,
        accent: 'teal',
      },
      {
        label: 'Liquidita disponibile',
        value: totalLiquidBase,
        change: 2.1,
        accent: 'blue',
      },
      {
        label: 'Portafoglio investito',
        value: basePortfolioValue,
        change: 7.1,
        accent: 'violet',
      },
      {
        label: 'Crescita mensile',
        value: income - expenses,
        change: 2.8,
        accent: 'amber',
      },
    ]
  }, [basePortfolioValue, fxRates, state.baseCurrency, state.transactions, totalLiquidBase])

  const cashflowSeries = useMemo<CashflowPoint[]>(() => {
    const seedKeys = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04']
    const grouped = new Map(
      seedKeys.map((key, index) => [
        key,
        {
          month: monthLabelFromKey(key),
          income: 2200 + index * 110,
          expenses: 1800 + index * 60,
          netWorth: 162000 + index * 4300,
        },
      ]),
    )

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

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value], index, all) => ({
        ...value,
        netWorth:
          summaryMetrics[0].value - (all.length - index - 1) * 3800 + value.income - value.expenses,
      }))
  }, [fxRates, state.baseCurrency, state.transactions, summaryMetrics])

  const portfolioTimeline = useMemo(() => {
    const currentTotal = basePortfolioValue

    return ['Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr'].map((month, index, all) => ({
      month,
      total: currentTotal - (all.length - index - 1) * 1800,
    }))
  }, [basePortfolioValue])

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

  const setUserName = (name: string) => {
    setUserNameState(name)
  }

  const completeOnboarding = (name: string) => {
    setState(emptyFinanceState)
    setUserNameState(name)
  }

  const setBaseCurrency = (currency: CurrencyCode) => {
    setState((current) => ({ ...current, baseCurrency: currency }))
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
    setState(defaultFinanceState)
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
    periodOptions,
    userName,
    setUserName,
    completeOnboarding,
    setBaseCurrency,
    addTransaction,
    updateBudget,
    updateAccount,
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
