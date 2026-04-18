import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLabel, safeNumber } from '../lib/utils'

export function MoneyPage() {
  const { accounts, addTransaction, baseCurrency, budgets, cashflowSeries, transactions, updateBudget } =
    useFinanceData()
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

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        {accounts.map((account) => (
          <article key={account.id} className="panel soft-card">
            <p className="muted-label">{account.institution}</p>
            <strong>{account.name}</strong>
            <div className="large-value">{formatCurrency(account.balance, account.currency)}</div>
          </article>
        ))}
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuovo movimento</p>
              <h2>Entrate e uscite</h2>
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
                    {account.name}
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
              <h2>Entrate vs uscite</h2>
            </div>
          </div>
          <div className="chart-wrap">
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
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Budget & obiettivi</p>
              <h2>Categorie del mese</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {budgets.map((budget) => {
              const progress = Math.min((budget.spent / budget.budget) * 100, 100)
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
            {transactions.slice(0, 8).map((transaction) => (
              <div key={transaction.id} className="list-card">
                <div className="stack">
                  <strong>{transaction.title}</strong>
                  <span className="muted-text">
                    {transaction.category} - {formatDateLabel(transaction.date)}
                  </span>
                </div>
                <strong className={transaction.type === 'income' ? 'positive' : 'negative'}>
                  {formatCurrency(transaction.amount, transaction.currency)}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
