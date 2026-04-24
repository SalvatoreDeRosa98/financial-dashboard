import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLabel, monthKey, safeNumber } from '../lib/utils'
import { useDashboardStore } from '../stores/dashboardStore'

function AccountEditorCard({
  account,
  onSave,
}: {
  account: {
    id: string
    institution: string
    name: string
    balance: number
    currency: string
  }
  onSave: (id: string, patch: { institution?: string; name?: string; balance?: number }) => void
}) {
  const [institutionDraft, setInstitutionDraft] = useState(account.institution)
  const [nameDraft, setNameDraft] = useState(account.name)
  const [balanceDraft, setBalanceDraft] = useState(String(account.balance))

  return (
    <article className="panel soft-card">
      <input
        className="input"
        value={institutionDraft}
        onChange={(event) => setInstitutionDraft(event.target.value)}
        onBlur={() => onSave(account.id, { institution: institutionDraft })}
      />
      <input
        className="input"
        value={nameDraft}
        onChange={(event) => setNameDraft(event.target.value)}
        onBlur={() => onSave(account.id, { name: nameDraft })}
      />
      <div className="large-value">{formatCurrency(account.balance, account.currency as never)}</div>
      <div className="inline-editor">
        <label htmlFor={`account-${account.id}`}>Saldo attuale</label>
        <input
          id={`account-${account.id}`}
          className="input"
          value={balanceDraft}
          type="number"
          onChange={(event) => setBalanceDraft(event.target.value)}
          onBlur={() => {
            const nextBalance = safeNumber(balanceDraft, account.balance)
            setBalanceDraft(String(nextBalance))
            onSave(account.id, { balance: nextBalance })
          }}
        />
      </div>
    </article>
  )
}

export function MoneyPage() {
  const {
    accounts,
    addAccount,
    addTransaction,
    baseCurrency,
    budgets,
    cashflowSeries,
    transactions,
    updateAccount,
    updateBudget,
    updateTransaction,
  } = useFinanceData()
  const [form, setForm] = useState<{
    title: string
    category: string
    amount: string
    currency: typeof baseCurrency
    date: string
    type: 'income' | 'expense'
    accountId: string
  }>({
    title: '',
    category: 'Cibo',
    amount: '',
    currency: baseCurrency,
    date: '2026-04-18',
    type: 'expense' as const,
    accountId: accounts[0]?.id ?? '',
  })
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    category: string
    amount: string
    currency: typeof baseCurrency
    date: string
    type: 'income' | 'expense'
    accountId: string
  }>({
    title: '',
    category: 'Cibo',
    amount: '',
    currency: baseCurrency,
    date: '2026-04-18',
    type: 'expense',
    accountId: accounts[0]?.id ?? '',
  })
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
  const selectedMonth = useDashboardStore((state) => state.selectedMoneyMonth) ?? monthKeys[0] ?? monthKey(form.date)
  const setSelectedMonth = useDashboardStore((state) => state.setSelectedMoneyMonth)
  const monthTransactions = transactions.filter((item) => monthKey(item.date) === selectedMonth)
  const monthSummary = monthMap[selectedMonth] ?? { income: 0, expenses: 0 }
  const monthNet = monthSummary.income - monthSummary.expenses
  const selectedTransaction =
    transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null
  const monthPickerValue = useMemo(() => {
    if (selectedMonth) return selectedMonth
    return monthKey(form.date)
  }, [form.date, selectedMonth])
  const biggestExpense =
    monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .sort((left, right) => right.amount - left.amount)[0] ?? null
  const latestMovement = monthTransactions[0] ?? null

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId)
    return account ? `${account.institution} · ${account.name}` : 'Conto non trovato'
  }

  const transactionCategories = ['Cibo', 'Casa', 'Trasporti', 'Tempo libero', 'Abbonamenti', 'Entrate']

  const openTransactionEditor = (transactionId: string) => {
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
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Conti operativi</p>
            <h2>Saldi e istituti collegati</h2>
          </div>
          <button className="icon-button" onClick={addAccount} type="button" aria-label="Aggiungi conto">
            +
          </button>
        </div>
        <div className="grid metrics-grid">
          {accounts.map((account) => (
            <AccountEditorCard key={account.id} account={account} onSave={updateAccount} />
          ))}
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuova registrazione</p>
              <h2>Inserisci un movimento</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addTransaction({
                title: form.title,
                category: form.category,
                amount: safeNumber(form.amount),
                currency: form.currency,
                date: form.date,
                type: form.type,
                accountId: form.accountId,
              })
              setForm((current) => ({ ...current, title: '', amount: '' }))
            }}
          >
            <input
              className="input"
              placeholder="Descrizione"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <div className="grid split-grid">
              <select
                className="input"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="Cibo">Cibo</option>
                <option value="Casa">Casa</option>
                <option value="Trasporti">Trasporti</option>
                <option value="Tempo libero">Tempo libero</option>
                <option value="Abbonamenti">Abbonamenti</option>
                <option value="Entrate">Entrate</option>
              </select>
              <input
                className="input"
                placeholder="Importo"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>
            <div className="grid split-grid">
              <select
                className="input"
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value as typeof baseCurrency }))
                }
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CHF">CHF</option>
                <option value="CAD">CAD</option>
              </select>
              <select
                className="input"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as 'income' | 'expense' }))
                }
              >
                <option value="expense">Spesa</option>
                <option value="income">Entrata</option>
              </select>
            </div>
            <div className="grid split-grid">
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
              <select
                className="input"
                value={form.accountId}
                onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.institution} · {account.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="primary-button" type="submit">
              Salva movimento
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Cashflow</p>
              <h2>Confronto entrate e uscite</h2>
            </div>
          </div>
          <div className="chart-wrap">
            {cashflowSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowSeries}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <strong>Nessun mese registrato</strong>
                <p>Il cashflow verra costruito dal primo movimento inserito.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Analisi mensile</p>
              <h2>Riepilogo del mese selezionato</h2>
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
              value={monthPickerValue}
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
              <p className="muted-label">Budget</p>
              <h2>Categorie e soglie mensili</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {budgets.map((budget) => {
              const progress = budget.budget > 0 ? Math.min((budget.spent / budget.budget) * 100, 100) : 0
              return (
                <div key={budget.id} className="stack gap-sm">
                  <div className="row-between">
                    <strong>{budget.name}</strong>
                    <span>
                      {formatCurrency(budget.spent, baseCurrency)} / {formatCurrency(budget.budget, baseCurrency)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: budget.color }} />
                  </div>
                  <input
                    className="input"
                    defaultValue={budget.budget}
                    type="number"
                    onBlur={(event) => updateBudget(budget.id, safeNumber(event.target.value, budget.budget))}
                  />
                </div>
              )
            })}
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Movimenti recenti</p>
              <h2>Storico</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {transactions.length ? (
              transactions.slice(0, 8).map((transaction) => (
                <button
                  key={transaction.id}
                  className="list-card list-card-button"
                  onClick={() => openTransactionEditor(transaction.id)}
                  type="button"
                >
                  <div className="stack gap-xs">
                    <strong>{transaction.title}</strong>
                    <span className="muted-text">
                      {transaction.category} - {formatDateLabel(transaction.date)}
                    </span>
                    <span className="muted-text">{getAccountLabel(transaction.accountId)}</span>
                  </div>
                  <strong className={transaction.type === 'income' ? 'positive' : 'negative'}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </strong>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <strong>Storico vuoto</strong>
                <p>I movimenti recenti appariranno qui dopo il primo inserimento.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      {selectedTransaction ? (
        <div className="modal-backdrop" onClick={() => setSelectedTransactionId(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="panel-heading">
              <div>
                <p className="muted-label">Modifica movimento</p>
                <h2>{selectedTransaction.title}</h2>
              </div>
              <button className="ghost-button" onClick={() => setSelectedTransactionId(null)} type="button">
                Chiudi
              </button>
            </div>

            <form
              className="stack gap-md"
              onSubmit={(event) => {
                event.preventDefault()
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
            >
              <input
                className="input"
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              />
              <div className="grid split-grid">
                <select
                  className="input"
                  value={editForm.category}
                  onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {transactionCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  type="number"
                  value={editForm.amount}
                  onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))}
                />
              </div>
              <div className="grid split-grid">
                <select
                  className="input"
                  value={editForm.currency}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, currency: event.target.value as typeof baseCurrency }))
                  }
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CHF">CHF</option>
                  <option value="CAD">CAD</option>
                </select>
                <select
                  className="input"
                  value={editForm.type}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, type: event.target.value as 'income' | 'expense' }))
                  }
                >
                  <option value="expense">Spesa</option>
                  <option value="income">Entrata</option>
                </select>
              </div>
              <div className="grid split-grid">
                <input
                  className="input"
                  type="date"
                  value={editForm.date}
                  onChange={(event) => setEditForm((current) => ({ ...current, date: event.target.value }))}
                />
                <select
                  className="input"
                  value={editForm.accountId}
                  onChange={(event) => setEditForm((current) => ({ ...current, accountId: event.target.value }))}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.institution} · {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="transaction-actions">
                <button className="primary-button" type="submit">
                  Salva modifica
                </button>
                <button className="ghost-button" onClick={() => setSelectedTransactionId(null)} type="button">
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
