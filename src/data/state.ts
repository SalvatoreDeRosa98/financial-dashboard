import {
  seedAccounts,
  seedBudgets,
  seedCalendar,
  seedPositions,
  seedStrategyTargets,
  seedTaxCreditBuckets,
  seedTransactions,
  seedWatchlist,
} from './seed'
import type {
  AccountItem,
  BudgetCategory,
  CalendarItem,
  CurrencyCode,
  PortfolioPosition,
  StrategyTarget,
  TaxCreditBucket,
  TransactionItem,
  WatchlistItem,
} from './types'

export interface FinanceState {
  baseCurrency: CurrencyCode
  accounts: AccountItem[]
  budgets: BudgetCategory[]
  transactions: TransactionItem[]
  positions: PortfolioPosition[]
  watchlist: WatchlistItem[]
  calendarItems: CalendarItem[]
  taxCredits: TaxCreditBucket[]
  strategyTargets: StrategyTarget[]
}

export const emptyFinanceState: FinanceState = {
  baseCurrency: 'EUR',
  accounts: [],
  budgets: [],
  transactions: [],
  positions: [],
  watchlist: [],
  calendarItems: [],
  taxCredits: [],
  strategyTargets: [],
}

export const defaultFinanceState: FinanceState = {
  baseCurrency: 'EUR',
  accounts: seedAccounts,
  budgets: seedBudgets,
  transactions: seedTransactions,
  positions: seedPositions,
  watchlist: seedWatchlist,
  calendarItems: seedCalendar,
  taxCredits: seedTaxCreditBuckets,
  strategyTargets: seedStrategyTargets,
}
