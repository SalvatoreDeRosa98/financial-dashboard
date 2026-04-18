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
} from './types'

export const summaryMetrics: SummaryMetric[] = [
  { label: 'Saldo totale', value: 128450, change: 6.2, accent: 'teal' },
  { label: 'Entrate mensili', value: 7250, change: 3.8, accent: 'blue' },
  { label: 'Uscite mensili', value: 3190, change: -4.1, accent: 'amber' },
  { label: 'Patrimonio netto', value: 214900, change: 8.6, accent: 'violet' },
]

export const netWorthTrend: NetWorthPoint[] = [
  { month: 'Mag', netWorth: 156000, income: 6200, expenses: 3400 },
  { month: 'Giu', netWorth: 161500, income: 6550, expenses: 3290 },
  { month: 'Lug', netWorth: 164800, income: 6400, expenses: 3010 },
  { month: 'Ago', netWorth: 168300, income: 6620, expenses: 3150 },
  { month: 'Set', netWorth: 175900, income: 7040, expenses: 3460 },
  { month: 'Ott', netWorth: 182700, income: 6890, expenses: 3370 },
  { month: 'Nov', netWorth: 188900, income: 7150, expenses: 3320 },
  { month: 'Dic', netWorth: 194400, income: 7360, expenses: 3510 },
  { month: 'Gen', netWorth: 198500, income: 7020, expenses: 3140 },
  { month: 'Feb', netWorth: 204300, income: 7110, expenses: 3210 },
  { month: 'Mar', netWorth: 209700, income: 7280, expenses: 3160 },
  { month: 'Apr', netWorth: 214900, income: 7250, expenses: 3190 },
]

export const moneyAllocation: AllocationItem[] = [
  { label: 'Conti correnti', value: 38200, color: '#2dd4bf' },
  { label: 'Contanti', value: 1850, color: '#38bdf8' },
  { label: 'Carte', value: 12300, color: '#f59e0b' },
  { label: 'Wallet', value: 4100, color: '#a78bfa' },
  { label: 'Investimenti', value: 72000, color: '#10b981' },
]

export const accounts: AccountItem[] = [
  { name: 'Conto principale', institution: 'Intesa Sanpaolo', balance: 22450, delta: 4.6, icon: 'IB', tone: 'teal' },
  { name: 'Conto risparmio', institution: 'Fineco', balance: 15750, delta: 2.1, icon: 'SV', tone: 'blue' },
  { name: 'Carta aziendale', institution: 'American Express', balance: 8300, delta: -1.8, icon: 'CC', tone: 'amber' },
  { name: 'Wallet digitale', institution: 'PayPal', balance: 4100, delta: 8.9, icon: 'WL', tone: 'violet' },
]

export const accountBalanceTrend: AccountBalancePoint[] = [
  { month: 'Nov', checking: 18900, savings: 14100, card: 6500, wallet: 3100 },
  { month: 'Dic', checking: 20200, savings: 14400, card: 6900, wallet: 3250 },
  { month: 'Gen', checking: 19550, savings: 14850, card: 7100, wallet: 3380 },
  { month: 'Feb', checking: 20980, savings: 15100, card: 7600, wallet: 3520 },
  { month: 'Mar', checking: 21700, savings: 15420, card: 7920, wallet: 3890 },
  { month: 'Apr', checking: 22450, savings: 15750, card: 8300, wallet: 4100 },
]

export const investmentPeriods: PeriodOption[] = [
  { label: '1M', key: '1M' },
  { label: '3M', key: '3M' },
  { label: 'YTD', key: 'YTD' },
  { label: '1A', key: '1A' },
]

export const portfolioSeries: Record<PeriodOption['key'], PortfolioPoint[]> = {
  '1M': [
    { label: '1 Apr', value: 66400 },
    { label: '7 Apr', value: 67120 },
    { label: '14 Apr', value: 67810 },
    { label: '21 Apr', value: 68950 },
    { label: '28 Apr', value: 72000 },
  ],
  '3M': [
    { label: 'Feb', value: 62100 },
    { label: 'Mar', value: 64650 },
    { label: 'Apr', value: 72000 },
  ],
  YTD: [
    { label: 'Gen', value: 58300 },
    { label: 'Feb', value: 62100 },
    { label: 'Mar', value: 64650 },
    { label: 'Apr', value: 72000 },
  ],
  '1A': [
    { label: 'Mag', value: 47200 },
    { label: 'Lug', value: 50600 },
    { label: 'Set', value: 55100 },
    { label: 'Nov', value: 57850 },
    { label: 'Gen', value: 58300 },
    { label: 'Apr', value: 72000 },
  ],
}

export const investmentAssets: InvestmentAsset[] = [
  { symbol: 'VWCE', name: 'ETF Azionario Globale', value: 28100, allocation: 39, change: 14.2, type: 'ETF' },
  { symbol: 'BTP', name: 'Titoli di Stato', value: 14250, allocation: 20, change: 3.4, type: 'Bond' },
  { symbol: 'SXRV', name: 'ETF Nasdaq', value: 12880, allocation: 18, change: 18.9, type: 'ETF' },
  { symbol: 'GLD', name: 'Oro', value: 7600, allocation: 11, change: 5.7, type: 'Commodity' },
  { symbol: 'BTC', name: 'Bitcoin', value: 9170, allocation: 12, change: 24.3, type: 'Crypto' },
]

export const monthlyExpenses: MonthlyExpensePoint[] = [
  { month: 'Nov', amount: 3010 },
  { month: 'Dic', amount: 3290 },
  { month: 'Gen', amount: 2940 },
  { month: 'Feb', amount: 3110 },
  { month: 'Mar', amount: 3160 },
  { month: 'Apr', amount: 3190 },
]

export const expenseCategories: ExpenseCategory[] = [
  { name: 'Casa', amount: 1120, budget: 1250, color: '#2dd4bf' },
  { name: 'Cibo', amount: 540, budget: 600, color: '#38bdf8' },
  { name: 'Trasporti', amount: 240, budget: 280, color: '#f59e0b' },
  { name: 'Tempo libero', amount: 420, budget: 450, color: '#a78bfa' },
  { name: 'Abbonamenti', amount: 110, budget: 140, color: '#fb7185' },
  { name: 'Varie', amount: 760, budget: 820, color: '#34d399' },
]

export const recentTransactions: TransactionItem[] = [
  { merchant: 'Esselunga', category: 'Cibo', amount: -84.2, date: '18 Apr', icon: 'ES' },
  { merchant: 'ATM Milano', category: 'Trasporti', amount: -22.0, date: '17 Apr', icon: 'AT' },
  { merchant: 'Amazon', category: 'Varie', amount: -64.9, date: '16 Apr', icon: 'AZ' },
  { merchant: 'Spotify', category: 'Abbonamenti', amount: -10.99, date: '16 Apr', icon: 'SP' },
  { merchant: 'Freelance payout', category: 'Entrata', amount: 1450.0, date: '15 Apr', icon: 'FR' },
]
