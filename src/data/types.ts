export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF' | 'CAD'

export type PeriodKey = '1M' | '3M' | 'YTD' | '1A'

export interface SummaryMetric {
  label: string
  value: number
  change: number
  accent: string
}

export interface AccountItem {
  id: string
  name: string
  institution: string
  balance: number
  currency: CurrencyCode
  tone: string
}

export interface BudgetCategory {
  id: string
  name: string
  spent: number
  budget: number
  color: string
}

export interface TransactionItem {
  id: string
  title: string
  category: string
  amount: number
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense'
  accountId: string
}

export interface PortfolioPosition {
  id: string
  symbol: string
  name: string
  assetType: 'Stock' | 'ETF' | 'Crypto' | 'Bond'
  quantity: number
  buyPrice: number
  currentPrice: number
  currency: CurrencyCode
  purchaseDate: string
  purchaseFxRate: number
  hedged: boolean
  annualDividendPerShare?: number
  thesis?: string
}

export interface WatchlistItem {
  id: string
  symbol: string
  name: string
  category: string
  currency: CurrencyCode
  price: number
  change: number
  notes: string
}

export interface CalendarItem {
  id: string
  title: string
  date: string
  kind: 'bill' | 'salary' | 'subscription' | 'goal'
  amount?: number
  currency?: CurrencyCode
}

export interface MarketIndex {
  symbol: string
  name: string
  region: string
  price: number
  change: number
  currency: CurrencyCode
}

export interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  summary: string
  url: string
}

export interface FxRateMap extends Record<CurrencyCode, number> {}

export interface PeriodOption {
  label: string
  key: PeriodKey
}

export interface CashflowPoint {
  month: string
  income: number
  expenses: number
  netWorth: number
}

export interface ExposureItem {
  currency: CurrencyCode
  valueBase: number
  share: number
  color: string
}

export interface TaxCreditBucket {
  id: string
  createdAt: string
  expiresAt: string
  amount: number
  used: number
  note: string
}

export interface StrategyTarget {
  assetType: PortfolioPosition['assetType']
  targetPct: number
}

export interface SimulatedSaleLot {
  positionId: string
  symbol: string
  quantity: number
  unitCost: number
  proceeds: number
  gainBase: number
}

export interface SaleSimulation {
  symbol: string
  quantity: number
  method: 'FIFO' | 'LIFO'
  proceedsBase: number
  costBase: number
  gainBase: number
  estimatedTax: number
  taxRate: number
  lots: SimulatedSaleLot[]
}
