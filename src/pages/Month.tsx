import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { convertWithEuroBaseRates, formatCurrency, formatDateLabel, monthKey, safeNumber } from '../lib/utils'
import { useDashboardStore } from '../stores/dashboardStore'
import { TransactionEditorModal, TransactionRowButton, type TransactionFormState } from '../components/money/MoneyPanels'
import type { TransactionItem } from '../data/types'

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function transactionToForm(transaction: TransactionItem): TransactionFormState {
  return {
    title: transaction.title,
    category: transaction.category,
    subcategory: transaction.subcategory ?? '',
    amount: String(transaction.amount),
    currency: transaction.currency,
    date: transaction.date,
    type: transaction.type,
    accountId: transaction.accountId,
    transferAccountId: transaction.transferAccountId ?? null,
    status: transaction.status ?? 'paid',
    tags: transaction.tags ?? [],
    notes: transaction.notes ?? '',
    attachmentName: transaction.attachmentName ?? '',
    attachmentUrl: transaction.attachmentUrl ?? '',
    linkedRecurringExpenseId: transaction.linkedRecurringExpenseId ?? null,
  }
}

function monthRange(key: string) {
  const [year, month] = key.split('-').map(Number)
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0),
  }
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function MonthPage() {
  const {
    accounts,
    baseCurrency,
    categories,
    fxRates,
    recurringExpenseForecast,
    recurringExpenseInsights,
    transactions,
    updateTransaction,
  } = useFinanceData()
  const selectedMonthState = useDashboardStore((state) => state.selectedMoneyMonth)
  const setSelectedMonth = useDashboardStore((state) => state.setSelectedMoneyMonth)

  const monthKeys = Array.from(new Set(transactions.map((item) => monthKey(item.date)))).sort((left, right) =>
    right.localeCompare(left),
  )
  const selectedMonth = selectedMonthState ?? monthKeys[0] ?? monthKey(todayKey())
  const previousMonth = shiftMonth(selectedMonth, -1)
  const { start: monthStart, end: monthEnd } = monthRange(selectedMonth)

  const monthTransactions = transactions.filter((item) => monthKey(item.date) === selectedMonth)
  const operationalTransactions = monthTransactions.filter((item) => item.type !== 'transfer')
  const actualTransactions = operationalTransactions.filter((item) => (item.status ?? 'paid') !== 'planned')
  const plannedTransactions = operationalTransactions.filter((item) => (item.status ?? 'paid') === 'planned')
  const monthIncomeTransactions = operationalTransactions.filter((item) => item.type === 'income')
  const monthExpenseTransactions = operationalTransactions.filter((item) => item.type === 'expense')
  const previousMonthTransactions = transactions.filter(
    (item) => monthKey(item.date) === previousMonth && item.type !== 'transfer' && (item.status ?? 'paid') !== 'planned',
  )

  const toBase = (transaction: TransactionItem) =>
    convertWithEuroBaseRates(transaction.amount, transaction.currency, baseCurrency, fxRates)
  const sumIncome = (items: TransactionItem[]) =>
    items.filter((item) => item.type === 'income').reduce((sum, item) => sum + toBase(item), 0)
  const sumExpenses = (items: TransactionItem[]) =>
    items.filter((item) => item.type === 'expense').reduce((sum, item) => sum + toBase(item), 0)

  const income = sumIncome(actualTransactions)
  const expenses = sumExpenses(actualTransactions)
  const net = income - expenses
  const previousNet = sumIncome(previousMonthTransactions) - sumExpenses(previousMonthTransactions)
  const plannedIncome = sumIncome(plannedTransactions)
  const plannedExpenses = sumExpenses(plannedTransactions)
  const recurringThisMonth = recurringExpenseForecast.upcoming.filter((item) => monthKey(item.date) === selectedMonth)
  const remainingRecurring = recurringThisMonth.reduce((sum, item) => sum + item.amountBase, 0)
  const projectedNet = net + plannedIncome - plannedExpenses - remainingRecurring

  const fixedExpenseCategories = new Set(
    recurringExpenseInsights.filter((item) => (item.kind ?? 'mandatory') === 'mandatory').map((item) => item.category),
  )
  const fixedExpenses = monthExpenseTransactions
    .filter((item) => fixedExpenseCategories.has(item.category) || Boolean(item.linkedRecurringExpenseId))
    .reduce((sum, item) => sum + toBase(item), 0)
  const variableExpenses = monthExpenseTransactions
    .filter((item) => !fixedExpenseCategories.has(item.category) && !item.linkedRecurringExpenseId)
    .reduce((sum, item) => sum + toBase(item), 0)
  const paidExpenses = monthExpenseTransactions
    .filter((item) => (item.status ?? 'paid') === 'paid')
    .reduce((sum, item) => sum + toBase(item), 0)
  const pendingExpenses = monthExpenseTransactions
    .filter((item) => (item.status ?? 'paid') !== 'paid')
    .reduce((sum, item) => sum + toBase(item), 0)

  const topCategories = (() => {
    const grouped = new Map<string, number>()
    for (const transaction of monthExpenseTransactions) {
      grouped.set(transaction.category, (grouped.get(transaction.category) ?? 0) + toBase(transaction))
    }
    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        color: categories.find((category) => category.name === name)?.color ?? '#38bdf8',
      }))
  })()

  const averageLast3Months = (() => {
    const monthWindow = [selectedMonth, shiftMonth(selectedMonth, -1), shiftMonth(selectedMonth, -2)]
    const totals = monthWindow.map((key) =>
      transactions
        .filter((item) => monthKey(item.date) === key && item.type === 'expense' && (item.status ?? 'paid') !== 'planned')
        .reduce((sum, item) => sum + toBase(item), 0),
    )
    const average = totals.reduce((sum, item) => sum + item, 0) / totals.length
    return Number.isFinite(average) ? average : 0
  })()

  const calendarDays = (() => {
    const firstDayWeekIndex = (monthStart.getDay() + 6) % 7
    const daysInMonth = monthEnd.getDate()
    const byDate = new Map<string, { income: number; expenses: number; count: number }>()

    for (const transaction of operationalTransactions) {
      const bucket = byDate.get(transaction.date) ?? { income: 0, expenses: 0, count: 0 }
      if (transaction.type === 'income') bucket.income += toBase(transaction)
      if (transaction.type === 'expense') bucket.expenses += toBase(transaction)
      bucket.count += 1
      byDate.set(transaction.date, bucket)
    }

    return Array.from({ length: firstDayWeekIndex + daysInMonth }, (_, index) => {
      if (index < firstDayWeekIndex) return null
      const day = index - firstDayWeekIndex + 1
      const dateKey = `${selectedMonth}-${String(day).padStart(2, '0')}`
      return {
        dateKey,
        day,
        summary: byDate.get(dateKey) ?? { income: 0, expenses: 0, count: 0 },
      }
    })
  })()

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TransactionFormState>({
    title: '',
    category: categories.find((category) => category.type === 'expense')?.name ?? 'Cibo',
    subcategory: '',
    amount: '',
    currency: baseCurrency,
    date: todayKey(),
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
    transferAccountId: accounts[1]?.id ?? null,
    status: 'paid',
    tags: [],
    notes: '',
    attachmentName: '',
    attachmentUrl: '',
    linkedRecurringExpenseId: null,
  })

  const selectedTransaction =
    transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId)
    return account ? `${account.institution} · ${account.name}` : 'Conto non trovato'
  }

  const openEditor = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    setEditForm(transactionToForm(transaction))
    setSelectedTransactionId(transactionId)
  }

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Entrate del mese</p>
          <strong>{formatCurrency(income, baseCurrency)}</strong>
          <span className="muted-text">solo movimenti già registrati</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Spese del mese</p>
          <strong>{formatCurrency(expenses, baseCurrency)}</strong>
          <span className="muted-text">uscite registrate nel mese selezionato</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Saldo netto</p>
          <strong>{formatCurrency(net, baseCurrency)}</strong>
          <span className={net - previousNet >= 0 ? 'positive' : 'negative'}>
            vs mese scorso {formatCurrency(net - previousNet, baseCurrency)}
          </span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Chiusura prevista</p>
          <strong>{formatCurrency(projectedNet, baseCurrency)}</strong>
          <span className="muted-text">saldo mese includendo pianificato e ricorrenze</span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Mese</p>
              <h2>Lettura operativa</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            <label className="muted-label" htmlFor="month-picker">
              Scegli il mese
            </label>
            <input
              id="month-picker"
              className="input"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
          <div className="summary-text-list">
            <div className="summary-text-row">
              <span>Fisso vs variabile</span>
              <strong>
                {formatCurrency(fixedExpenses, baseCurrency)} / {formatCurrency(variableExpenses, baseCurrency)}
              </strong>
            </div>
            <div className="summary-text-row">
              <span>Già pagato vs da pagare</span>
              <strong>
                {formatCurrency(paidExpenses, baseCurrency)} / {formatCurrency(pendingExpenses, baseCurrency)}
              </strong>
            </div>
            <div className="summary-text-row">
              <span>Media ultimi 3 mesi</span>
              <strong>{formatCurrency(averageLast3Months, baseCurrency)}</strong>
            </div>
            <div className="summary-text-row">
              <span>Ricorrenze residue mese</span>
              <strong>{formatCurrency(remainingRecurring, baseCurrency)}</strong>
            </div>
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Calendario</p>
              <h2>Giorni di incasso e uscita</h2>
            </div>
          </div>
          <div className="month-calendar">
            {weekdayLabels.map((label) => (
              <span key={label} className="month-calendar-label">
                {label}
              </span>
            ))}
            {calendarDays.map((day, index) =>
              day ? (
                <div key={day.dateKey} className="month-calendar-cell">
                  <strong>{day.day}</strong>
                  <small>{day.summary.count} mov.</small>
                  {day.summary.income > 0 ? <span className="positive">{formatCurrency(day.summary.income, baseCurrency)}</span> : null}
                  {day.summary.expenses > 0 ? <span className="negative">{formatCurrency(day.summary.expenses, baseCurrency)}</span> : null}
                </div>
              ) : (
                <div key={`empty-${index}`} className="month-calendar-cell month-calendar-cell-empty" />
              ),
            )}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Categorie</p>
              <h2>Principali uscite del mese</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {topCategories.length ? (
              topCategories.map((category) => (
                <div key={category.name} className="list-card">
                  <div className="stack gap-xs">
                    <strong>{category.name}</strong>
                    <span className="muted-text">categoria principale del mese</span>
                  </div>
                  <strong>{formatCurrency(category.amount, baseCurrency)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna uscita nel mese</strong>
                <p>Le categorie principali compariranno qui quando registri le spese.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Entrate</p>
              <h2>Incassi del mese</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {monthIncomeTransactions.length ? (
              monthIncomeTransactions.map((transaction) => (
                <TransactionRowButton
                  key={transaction.id}
                  accountLabel={getAccountLabel(transaction.accountId)}
                  transaction={transaction}
                  onClick={() => openEditor(transaction.id)}
                />
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessun incasso registrato</strong>
                <p>Gli incassi del mese compariranno qui.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Spese</p>
              <h2>Uscite del mese</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {monthExpenseTransactions.length ? (
              monthExpenseTransactions.map((transaction) => (
                <TransactionRowButton
                  key={transaction.id}
                  accountLabel={`${getAccountLabel(transaction.accountId)} · ${formatDateLabel(transaction.date)}`}
                  transaction={transaction}
                  onClick={() => openEditor(transaction.id)}
                />
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna spesa registrata</strong>
                <p>Le uscite del mese compariranno qui.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <TransactionEditorModal
        accounts={accounts}
        categories={categories}
        form={editForm}
        isOpen={Boolean(selectedTransaction)}
        onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
        onClose={() => setSelectedTransactionId(null)}
        onSave={() => {
          if (!selectedTransaction) return
          updateTransaction(selectedTransaction.id, {
            title: editForm.title,
            category: editForm.type === 'transfer' ? 'Trasferimento interno' : editForm.category,
            subcategory: editForm.subcategory,
            amount: safeNumber(editForm.amount),
            currency: editForm.currency,
            date: editForm.date,
            type: editForm.type,
            accountId: editForm.accountId,
            transferAccountId: editForm.type === 'transfer' ? editForm.transferAccountId : null,
            status: editForm.status,
            tags: editForm.tags,
            notes: editForm.notes,
            attachmentName: editForm.attachmentName,
            attachmentUrl: editForm.attachmentUrl,
            linkedRecurringExpenseId: editForm.linkedRecurringExpenseId ?? null,
          })
          setSelectedTransactionId(null)
        }}
        title={selectedTransaction?.title ?? 'Movimento'}
      />
    </div>
  )
}
