import type {
  AccountItem,
  BudgetCategory,
  CalendarItem,
  CurrencyCode,
  FxRateMap,
  MarketIndex,
  NewsItem,
  PeriodOption,
  PortfolioPosition,
  StrategyTarget,
  TaxCreditBucket,
  TransactionItem,
  WatchlistItem,
} from './types'

export const supportedCurrencies: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD']

export const currencyColors: Record<CurrencyCode, string> = {
  EUR: '#38bdf8',
  USD: '#10b981',
  GBP: '#f59e0b',
  JPY: '#f97316',
  CHF: '#8b5cf6',
  CAD: '#ec4899',
}

export const periodOptions: PeriodOption[] = [
  { label: '1M', key: '1M' },
  { label: '3M', key: '3M' },
  { label: 'YTD', key: 'YTD' },
  { label: '1A', key: '1A' },
]

export const seedFxRates: FxRateMap = {
  EUR: 1,
  USD: 1.086,
  GBP: 0.857,
  JPY: 163.72,
  CHF: 0.973,
  CAD: 1.472,
}

export const seedAccounts: AccountItem[] = [
  {
    id: 'acc-main',
    name: 'Conto principale',
    institution: 'Intesa Sanpaolo',
    balance: 18240,
    currency: 'EUR',
    tone: 'teal',
  },
  {
    id: 'acc-save',
    name: 'Cash reserve',
    institution: 'Wise',
    balance: 8450,
    currency: 'USD',
    tone: 'blue',
  },
  {
    id: 'acc-card',
    name: 'Carta spese',
    institution: 'American Express',
    balance: 2960,
    currency: 'EUR',
    tone: 'amber',
  },
  {
    id: 'acc-broker',
    name: 'Broker wallet',
    institution: 'IBKR',
    balance: 5100,
    currency: 'USD',
    tone: 'violet',
  },
]

export const seedBudgets: BudgetCategory[] = [
  { id: 'b-home', name: 'Casa', spent: 1080, budget: 1300, color: '#38bdf8' },
  { id: 'b-food', name: 'Cibo', spent: 462, budget: 520, color: '#10b981' },
  { id: 'b-transport', name: 'Trasporti', spent: 180, budget: 240, color: '#f59e0b' },
  { id: 'b-fun', name: 'Tempo libero', spent: 390, budget: 450, color: '#8b5cf6' },
  { id: 'b-subs', name: 'Abbonamenti', spent: 76, budget: 110, color: '#ec4899' },
]

export const seedTransactions: TransactionItem[] = [
  {
    id: 'tx-1',
    title: 'Stipendio',
    category: 'Entrate',
    amount: 2950,
    currency: 'EUR',
    date: '2026-04-03',
    type: 'income',
    accountId: 'acc-main',
  },
  {
    id: 'tx-2',
    title: 'Esselunga',
    category: 'Cibo',
    amount: -82,
    currency: 'EUR',
    date: '2026-04-16',
    type: 'expense',
    accountId: 'acc-card',
  },
  {
    id: 'tx-3',
    title: 'Adobe CC',
    category: 'Abbonamenti',
    amount: -24,
    currency: 'EUR',
    date: '2026-04-11',
    type: 'expense',
    accountId: 'acc-card',
  },
  {
    id: 'tx-4',
    title: 'Freelance payout',
    category: 'Entrate',
    amount: 1200,
    currency: 'USD',
    date: '2026-04-09',
    type: 'income',
    accountId: 'acc-save',
  },
  {
    id: 'tx-5',
    title: 'Metro Milano',
    category: 'Trasporti',
    amount: -37,
    currency: 'EUR',
    date: '2026-04-14',
    type: 'expense',
    accountId: 'acc-card',
  },
  {
    id: 'tx-6',
    title: 'Affitto',
    category: 'Casa',
    amount: -980,
    currency: 'EUR',
    date: '2026-04-01',
    type: 'expense',
    accountId: 'acc-main',
  },
]

export const seedPositions: PortfolioPosition[] = [
  {
    id: 'pos-1',
    symbol: 'AAPL',
    name: 'Apple',
    assetType: 'Stock',
    quantity: 12,
    buyPrice: 171.4,
    currentPrice: 205.8,
    currency: 'USD',
    purchaseDate: '2025-06-14',
    purchaseFxRate: 0.924,
    hedged: false,
    annualDividendPerShare: 1.0,
    thesis: 'Mega-cap quality, free cash flow enorme, base AI devices/services.',
  },
  {
    id: 'pos-2',
    symbol: 'VWCE',
    name: 'Vanguard FTSE All-World',
    assetType: 'ETF',
    quantity: 44,
    buyPrice: 106.7,
    currentPrice: 121.2,
    currency: 'EUR',
    purchaseDate: '2025-10-05',
    purchaseFxRate: 1,
    hedged: false,
    annualDividendPerShare: 1.75,
    thesis: 'Core equity allocation globale a basso attrito.',
  },
  {
    id: 'pos-3',
    symbol: 'IGLN',
    name: 'Gold ETC USD hedged',
    assetType: 'ETF',
    quantity: 18,
    buyPrice: 39.8,
    currentPrice: 42.3,
    currency: 'USD',
    purchaseDate: '2026-01-20',
    purchaseFxRate: 0.958,
    hedged: true,
    annualDividendPerShare: 0.42,
    thesis: 'Protezione inflazione e diversificazione tattica.',
  },
  {
    id: 'pos-4',
    symbol: 'AAPL',
    name: 'Apple add-on',
    assetType: 'Stock',
    quantity: 8,
    buyPrice: 188.2,
    currentPrice: 205.8,
    currency: 'USD',
    purchaseDate: '2026-02-12',
    purchaseFxRate: 0.956,
    hedged: false,
    annualDividendPerShare: 1.0,
    thesis: 'Secondo lotto comprato dopo earnings, ancora coerente con la tesi.',
  },
]

export const seedTaxCreditBuckets: TaxCreditBucket[] = [
  {
    id: 'tax-1',
    createdAt: '2024-09-18',
    expiresAt: '2028-12-31',
    amount: 1480,
    used: 320,
    note: 'Minus da ETF thematic liquidati in loss',
  },
  {
    id: 'tax-2',
    createdAt: '2025-11-04',
    expiresAt: '2029-12-31',
    amount: 620,
    used: 0,
    note: 'Minus da rotazione su singole stock growth',
  },
]

export const seedStrategyTargets: StrategyTarget[] = [
  { assetType: 'Stock', targetPct: 35 },
  { assetType: 'ETF', targetPct: 45 },
  { assetType: 'Bond', targetPct: 10 },
  { assetType: 'Crypto', targetPct: 10 },
]

export const seedWatchlist: WatchlistItem[] = [
  {
    id: 'watch-1',
    symbol: 'MSFT',
    name: 'Microsoft',
    category: 'AI / Cloud',
    currency: 'USD',
    price: 428.5,
    change: 1.6,
    notes: 'Da accumulare su pullback < 400',
  },
  {
    id: 'watch-2',
    symbol: 'EUNL',
    name: 'iShares Core MSCI World',
    category: 'ETF globale',
    currency: 'EUR',
    price: 96.4,
    change: 0.8,
    notes: 'Alternativa semplice al VWCE',
  },
]

export const seedCalendar: CalendarItem[] = [
  { id: 'cal-1', title: 'Stipendio', date: '2026-04-27', kind: 'salary', amount: 2950, currency: 'EUR' },
  { id: 'cal-2', title: 'Rinnovo Spotify', date: '2026-04-21', kind: 'subscription', amount: 10.99, currency: 'EUR' },
  { id: 'cal-3', title: 'Versamento PAC', date: '2026-05-02', kind: 'goal', amount: 600, currency: 'EUR' },
]

export const seedIndices: MarketIndex[] = [
  { symbol: '^GSPC', name: 'S&P 500', region: 'USA', price: 5230, change: 0.42, currency: 'USD' },
  { symbol: '^FTMIB', name: 'FTSE MIB', region: 'Italia', price: 34620, change: 0.58, currency: 'EUR' },
  { symbol: '^GDAXI', name: 'DAX', region: 'Germania', price: 18220, change: -0.21, currency: 'EUR' },
  { symbol: '^N225', name: 'Nikkei 225', region: 'Giappone', price: 38540, change: 0.95, currency: 'JPY' },
]

export const seedNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'I mercati restano concentrati sul taglio dei tassi BCE di giugno',
    source: 'Desk interno',
    publishedAt: '2026-04-18T08:30:00.000Z',
    summary: 'Scenario base: euro piu debole nel breve, supporto agli asset risk-on europei.',
    url: 'https://example.com/news/bce-june',
  },
  {
    id: 'news-2',
    title: 'Rotazione dagli ETF growth verso quality dividend',
    source: 'Desk interno',
    publishedAt: '2026-04-18T10:00:00.000Z',
    summary: 'Tema utile per watchlist e ribilanciamento in ottica di riduzione volatilita.',
    url: 'https://example.com/news/rotation-quality',
  },
]
