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
  GoalItem,
  LiabilityItem,
  CurrencyCode,
  PortfolioPosition,
  RecurringExpenseItem,
  StrategyTarget,
  TaxCreditBucket,
  TransactionCategory,
  TransactionItem,
  WatchlistItem,
} from './types'

export interface FinanceState {
  baseCurrency: CurrencyCode
  accounts: AccountItem[]
  budgets: BudgetCategory[]
  categories: TransactionCategory[]
  transactions: TransactionItem[]
  recurringExpenses: RecurringExpenseItem[]
  positions: PortfolioPosition[]
  watchlist: WatchlistItem[]
  calendarItems: CalendarItem[]
  goals: GoalItem[]
  liabilities: LiabilityItem[]
  taxCredits: TaxCreditBucket[]
  strategyTargets: StrategyTarget[]
}

const defaultExpenseCategories = [
  { name: 'Casa', subcategories: ['Affitto', 'Bollette', 'Manutenzione'], color: '#38bdf8' },
  { name: 'Cibo', subcategories: ['Spesa', 'Pranzi', 'Delivery'], color: '#10b981' },
  { name: 'Trasporti', subcategories: ['Carburante', 'Treno', 'Taxi'], color: '#f59e0b' },
  { name: 'Tempo libero', subcategories: ['Ristoranti', 'Viaggi', 'Sport'], color: '#8b5cf6' },
  { name: 'Abbonamenti', subcategories: ['Streaming', 'Software', 'Palestra'], color: '#ec4899' },
] as const

const defaultIncomeCategories = [
  { name: 'Entrate', subcategories: ['Stipendio', 'Rimborso', 'Extra'], color: '#14b8a6' },
] as const

function createStarterCategories() {
  return [
    ...defaultExpenseCategories.map((category, index) => ({
      id: `cat-expense-${index + 1}`,
      name: category.name,
      type: 'expense' as const,
      subcategories: [...category.subcategories],
      color: category.color,
    })),
    ...defaultIncomeCategories.map((category, index) => ({
      id: `cat-income-${index + 1}`,
      name: category.name,
      type: 'income' as const,
      subcategories: [...category.subcategories],
      color: category.color,
    })),
  ] satisfies TransactionCategory[]
}

function inferAccountKind(account: Partial<AccountItem>): NonNullable<AccountItem['kind']> {
  const label = `${account.name ?? ''} ${account.institution ?? ''}`.toLowerCase()

  if (label.includes('broker')) return 'broker'
  if (label.includes('cash') || label.includes('contant')) return 'cash'
  if (label.includes('carta') || label.includes('card')) return 'card'
  if (label.includes('risparm')) return 'savings'
  return 'checking'
}

function normalizeAccount(account: AccountItem) {
  return {
    ...account,
    kind: account.kind ?? inferAccountKind(account),
  }
}

function normalizeTransaction(transaction: TransactionItem) {
  return {
    ...transaction,
    subcategory: transaction.subcategory ?? '',
    transferAccountId: transaction.transferAccountId ?? null,
    status: transaction.status ?? (transaction.date > new Date().toISOString().slice(0, 10) ? 'planned' : 'paid'),
    tags: transaction.tags ?? [],
    notes: transaction.notes ?? '',
    attachmentName: transaction.attachmentName ?? '',
    attachmentUrl: transaction.attachmentUrl ?? '',
    linkedRecurringExpenseId: transaction.linkedRecurringExpenseId ?? null,
  }
}

function normalizeRecurringExpense(expense: RecurringExpenseItem) {
  return {
    ...expense,
    kind: expense.kind ?? 'mandatory',
  }
}

function normalizeCategories(
  categories: TransactionCategory[],
  budgets: BudgetCategory[],
  transactions: TransactionItem[],
) {
  const starter = createStarterCategories()
  const categoryMap = new Map<string, TransactionCategory>()

  for (const category of [...starter, ...categories]) {
    const key = `${category.type}:${category.name}`
    categoryMap.set(key, {
      ...category,
      subcategories: Array.from(new Set(category.subcategories ?? [])),
    })
  }

  for (const budget of budgets) {
    const key = `expense:${budget.name}`
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        id: `cat-budget-${budget.id}`,
        name: budget.name,
        type: 'expense',
        subcategories: [],
        color: budget.color,
      })
    }
  }

  for (const transaction of transactions) {
    if (transaction.type === 'transfer') continue
    const type = transaction.type
    const key = `${type}:${transaction.category}`
    const existing = categoryMap.get(key)
    if (existing) {
      if (transaction.subcategory) {
        existing.subcategories = Array.from(new Set([...existing.subcategories, transaction.subcategory]))
      }
      continue
    }

    categoryMap.set(key, {
      id: `cat-tx-${transaction.id}`,
      name: transaction.category,
      type,
      subcategories: transaction.subcategory ? [transaction.subcategory] : [],
      color: type === 'income' ? '#14b8a6' : '#38bdf8',
    })
  }

  return Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name))
}

export function createEmptyFinanceState(baseCurrency: CurrencyCode = 'EUR'): FinanceState {
  return {
    baseCurrency,
    accounts: [],
    budgets: [],
    categories: [],
    transactions: [],
    recurringExpenses: [],
    positions: [],
    watchlist: [],
    calendarItems: [],
    goals: [],
    liabilities: [],
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
        kind: 'checking',
        tone: 'teal',
        editable: true,
      },
      {
        id: 'acc-broker',
        name: 'Broker',
        institution: 'Da configurare',
        balance: 0,
        currency: baseCurrency,
        kind: 'broker',
        tone: 'blue',
        editable: true,
      },
    ],
    budgets: seedBudgets.map((budget) => ({
      ...budget,
      spent: 0,
      budget: 0,
    })),
    categories: createStarterCategories(),
    transactions: [],
    recurringExpenses: [],
    positions: [],
    watchlist: [],
    calendarItems: [],
    goals: [],
    liabilities: [],
    taxCredits: [],
    strategyTargets: seedStrategyTargets.map((target) => ({ ...target })),
  }
}

export const defaultFinanceState: FinanceState = {
  baseCurrency: 'EUR',
  accounts: seedAccounts.map(normalizeAccount),
  budgets: seedBudgets,
  categories: normalizeCategories([], seedBudgets, seedTransactions.map(normalizeTransaction)),
  transactions: seedTransactions.map(normalizeTransaction),
  recurringExpenses: [],
  positions: seedPositions,
  watchlist: seedWatchlist,
  calendarItems: seedCalendar,
  goals: [],
  liabilities: [],
  taxCredits: seedTaxCreditBuckets,
  strategyTargets: seedStrategyTargets,
}

export function normalizeFinanceState(state: FinanceState): FinanceState {
  const baseCurrency = state.baseCurrency ?? 'EUR'
  const starter = createStarterFinanceState(baseCurrency)
  const transactions = (state.transactions ?? []).map(normalizeTransaction)
  const budgets = state.budgets?.length ? state.budgets : starter.budgets

  return {
    ...starter,
    ...state,
    baseCurrency,
    accounts: (state.accounts?.length ? state.accounts : starter.accounts).map(normalizeAccount),
    budgets,
    categories: normalizeCategories(state.categories ?? [], budgets, transactions),
    transactions,
    recurringExpenses: (state.recurringExpenses ?? []).map(normalizeRecurringExpense),
    goals: state.goals ?? [],
    liabilities: state.liabilities ?? [],
  }
}
