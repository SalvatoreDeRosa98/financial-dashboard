export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF' | 'CAD'

export type PeriodKey = '1M' | '3M' | 'YTD' | '1A'

export interface SummaryMetric {
  label: string
  value: number
  change: number
  accent: string
}

export type AccountKind = 'checking' | 'cash' | 'card' | 'broker' | 'savings'

export interface AccountItem {
  id: string
  name: string
  institution: string
  balance: number
  currency: CurrencyCode
  kind?: AccountKind
  tone: string
  editable: boolean
}

export interface BudgetCategory {
  id: string
  name: string
  spent: number
  budget: number
  color: string
}

export type TransactionStatus = 'planned' | 'confirmed' | 'paid'

export interface TransactionCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  subcategories: string[]
  color: string
}

export interface TransactionItem {
  id: string
  title: string
  category: string
  subcategory?: string
  amount: number
  currency: CurrencyCode
  date: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  transferAccountId?: string | null
  status?: TransactionStatus
  tags?: string[]
  notes?: string
  attachmentName?: string
  attachmentUrl?: string
  linkedRecurringExpenseId?: string | null
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface RecurringExpenseItem {
  id: string
  title: string
  category: string
  amount: number
  currency: CurrencyCode
  frequency: RecurringFrequency
  nextDate: string
  notes: string
  active: boolean
  kind?: 'mandatory' | 'optional'
}

export interface GoalItem {
  id: string
  title: string
  category: string
  target: number
  current: number
  dueDate: string
}

export interface LiabilityItem {
  id: string
  title: string
  balance: number
  dueDate: string
  kind: 'card' | 'loan' | 'tax' | 'other'
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
  chartSymbol: string
}

export interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  summary: string
  url: string
}

export interface OpportunityItem {
  id: string
  symbol: string
  name: string
  kind: 'Stock' | 'ETF'
  region: string
  currency: CurrencyCode
  price: number
  performance: {
    day: number
    week: number
    month: number
    threeMonths: number
    year: number
  }
}

export type FxRateMap = Record<CurrencyCode, number>

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
