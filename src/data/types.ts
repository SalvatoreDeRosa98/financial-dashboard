export interface SummaryMetric {
  label: string
  value: number
  change: number
  accent: string
}

export interface NetWorthPoint {
  month: string
  netWorth: number
  income: number
  expenses: number
}

export interface AllocationItem {
  label: string
  value: number
  color: string
}

export interface AccountBalancePoint {
  month: string
  checking: number
  savings: number
  card: number
  wallet: number
}

export interface AccountItem {
  name: string
  institution: string
  balance: number
  delta: number
  icon: string
  tone: string
}

export interface PortfolioPoint {
  label: string
  value: number
}

export interface PeriodOption {
  label: string
  key: '1M' | '3M' | 'YTD' | '1A'
}

export interface InvestmentAsset {
  symbol: string
  name: string
  value: number
  allocation: number
  change: number
  type: string
}

export interface MonthlyExpensePoint {
  month: string
  amount: number
}

export interface ExpenseCategory {
  name: string
  amount: number
  budget: number
  color: string
}

export interface TransactionItem {
  merchant: string
  category: string
  amount: number
  date: string
  icon: string
}
