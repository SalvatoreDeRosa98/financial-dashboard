import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLabel, monthKey, safeNumber } from '../lib/utils'
import { useDashboardStore } from '../stores/dashboardStore'
import { useState } from 'react'
import { TransactionEditorModal, TransactionRowButton, type TransactionFormState } from '../components/money/MoneyPanels'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
}

export function MonthPage() {
  const { accounts, baseCurrency, recurringExpenseForecast, transactions, updateTransaction } = useFinanceData()
  const monthMap = transactions.reduce<Record<string, { income: number; expenses: number }>>((acc, transaction) => {
    const key = monthKey(transaction.date)
    if (!acc[key]) {
      acc[key] = { income: 0, expenses: 0 }
    }
    if (transaction.type === 'income') {
      acc[key].income += Math.abs(transaction.amount)
    } else {
      acc[key].expenses += Math.abs(transaction.amount)
    }
    return acc
  }, {})
  const monthKeys = Object.keys(monthMap).sort((left, right) => right.localeCompare(left))
  const selectedMonth = useDashboardStore((state) => state.selectedMoneyMonth) ?? monthKeys[0] ?? monthKey(todayKey())
  const setSelectedMonth = useDashboardStore((state) => state.setSelectedMoneyMonth)
  const monthTransactions = transactions.filter((item) => monthKey(item.date) === selectedMonth)
  const monthIncomeTransactions = monthTransactions.filter((item) => item.type === 'income')
  const monthExpenseTransactions = monthTransactions.filter((item) => item.type === 'expense')
  const monthSummary = monthMap[selectedMonth] ?? { income: 0, expenses: 0 }
  const monthNet = monthSummary.income - monthSummary.expenses
  const biggestExpense =
    monthExpenseTransactions.sort((left, right) => right.amount - left.amount)[0] ?? null
  const latestMovement = monthTransactions[0] ?? null
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TransactionFormState>({
    title: '',
    category: 'Cibo',
    amount: '',
    currency: baseCurrency,
    date: todayKey(),
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
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

    setEditForm({
      title: transaction.title,
      category: transaction.category,
      amount: String(transaction.amount),
      currency: transaction.currency,
      date: transaction.date,
      type: transaction.type,
      accountId: transaction.accountId,
    })
    setSelectedTransactionId(transactionId)
  }

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Entrate del mese</p>
          <strong>{formatCurrency(monthSummary.income, baseCurrency)}</strong>
          <span className="muted-text">incassi registrati nel mese selezionato</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Spese del mese</p>
          <strong>{formatCurrency(monthSummary.expenses, baseCurrency)}</strong>
          <span className="muted-text">uscite registrate nel mese selezionato</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Saldo netto</p>
          <strong>{formatCurrency(monthNet, baseCurrency)}</strong>
          <span className={monthNet >= 0 ? 'positive' : 'negative'}>
            {monthNet >= 0 ? 'Mese in positivo' : 'Mese in assorbimento'}
          </span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Ricorrenze 30 giorni</p>
          <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
          <span className="muted-text">uscite pianificate a breve</span>
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
              <span>Entrate del mese</span>
              <strong>{formatCurrency(monthSummary.income, baseCurrency)}</strong>
            </div>
            <div className="summary-text-row">
              <span>Spese del mese</span>
              <strong>{formatCurrency(monthSummary.expenses, baseCurrency)}</strong>
            </div>
            <div className="summary-text-row">
              <span>Saldo netto</span>
              <strong className={monthNet >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(monthNet, baseCurrency)}
              </strong>
            </div>
            <div className="summary-text-row summary-text-row-top">
              <span>Spesa piu rilevante</span>
              <div className="summary-text-detail">
                <strong>{biggestExpense ? biggestExpense.title : 'Nessuna spesa registrata'}</strong>
                <small>
                  {biggestExpense
                    ? `${formatCurrency(biggestExpense.amount, biggestExpense.currency)} · ${formatDateLabel(biggestExpense.date)}`
                    : 'Nessun movimento di uscita nel mese selezionato.'}
                </small>
              </div>
            </div>
            <div className="summary-text-row summary-text-row-top">
              <span>Ultimo movimento</span>
              <div className="summary-text-detail">
                <strong>{latestMovement ? latestMovement.title : 'Nessun movimento registrato'}</strong>
                <small>
                  {latestMovement
                    ? `${formatCurrency(latestMovement.amount, latestMovement.currency)} · ${formatDateLabel(latestMovement.date)}`
                    : 'Il riepilogo si popola quando inizi a registrare operazioni.'}
                </small>
              </div>
            </div>
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
                  accountLabel={getAccountLabel(transaction.accountId)}
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
        form={editForm}
        isOpen={Boolean(selectedTransaction)}
        onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
        onClose={() => setSelectedTransactionId(null)}
        onSave={() => {
          if (!selectedTransaction) return
          updateTransaction(selectedTransaction.id, {
            title: editForm.title,
            category: editForm.category,
            amount: safeNumber(editForm.amount),
            currency: editForm.currency,
            date: editForm.date,
            type: editForm.type,
            accountId: editForm.accountId,
          })
          setSelectedTransactionId(null)
        }}
        title={selectedTransaction?.title ?? 'Movimento'}
      />
    </div>
  )
}
