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
  RecurringExpenseItem,
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
  recurringExpenses: RecurringExpenseItem[]
  positions: PortfolioPosition[]
  watchlist: WatchlistItem[]
  calendarItems: CalendarItem[]
  taxCredits: TaxCreditBucket[]
  strategyTargets: StrategyTarget[]
}

export function createEmptyFinanceState(baseCurrency: CurrencyCode = 'EUR'): FinanceState {
  return {
    baseCurrency,
    accounts: [],
    budgets: [],
    transactions: [],
    recurringExpenses: [],
    positions: [],
    watchlist: [],
    calendarItems: [],
    taxCredits: [],
    strategyTargets: [],
  }
}

export const emptyFinanceState: FinanceState = createEmptyFinanceState()

export function createStarterFinanceState(baseCurrency: CurrencyCode = 'EUR'): FinanceState {
  return {
    baseCurrency,
    accounts: [
      {
        id: 'acc-main',
        name: 'Conto principale',
        institution: 'Da configurare',
        balance: 0,
        currency: baseCurrency,
        tone: 'teal',
        editable: true,
      },
      {
        id: 'acc-broker',
        name: 'Broker',
        institution: 'Da configurare',
        balance: 0,
        currency: baseCurrency,
        tone: 'blue',
        editable: true,
      },
    ],
    budgets: seedBudgets.map((budget) => ({
      ...budget,
      spent: 0,
      budget: 0,
    })),
    transactions: [],
    recurringExpenses: [],
    positions: [],
    watchlist: [],
    calendarItems: [],
    taxCredits: [],
    strategyTargets: seedStrategyTargets.map((target) => ({ ...target })),
  }
}

export const defaultFinanceState: FinanceState = {
  baseCurrency: 'EUR',
  accounts: seedAccounts,
  budgets: seedBudgets,
  transactions: seedTransactions,
  recurringExpenses: [],
  positions: seedPositions,
  watchlist: seedWatchlist,
  calendarItems: seedCalendar,
  taxCredits: seedTaxCreditBuckets,
  strategyTargets: seedStrategyTargets,
}
