import { useMemo, useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLong, safeNumber } from '../lib/utils'
import type { CurrencyCode, RecurringExpenseItem } from '../data/types'

const frequencyLabels = {
  weekly: 'Settimanale',
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  annual: 'Annuale',
} as const

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function RecurringExpenseCard({
  expense,
  baseCurrency,
  fallbackAccountId,
  onRecord,
  onSave,
  onRemove,
}: {
  expense: ReturnType<typeof useFinanceData>['recurringExpenseInsights'][number]
  baseCurrency: CurrencyCode
  fallbackAccountId?: string
  onRecord: (id: string, accountId?: string) => void
  onSave: (
    id: string,
    patch: Partial<{
      title: string
      category: string
      amount: number
      currency: CurrencyCode
      frequency: RecurringExpenseItem['frequency']
      nextDate: string
      notes: string
      active: boolean
      kind: 'mandatory' | 'optional'
    }>,
  ) => void
  onRemove: (id: string) => void
}) {
  const [titleDraft, setTitleDraft] = useState(expense.title)
  const [categoryDraft, setCategoryDraft] = useState(expense.category)
  const [amountDraft, setAmountDraft] = useState(String(expense.amount))
  const [notesDraft, setNotesDraft] = useState(expense.notes)

  return (
    <article className="recurring-card">
      <div className="recurring-card-top">
        <label className="checkbox-row">
          <input
            checked={expense.active}
            type="checkbox"
            onChange={(event) => onSave(expense.id, { active: event.target.checked })}
          />
          Attiva
        </label>
        <div className="transaction-inline-actions">
          <button className="ghost-button" type="button" onClick={() => onRecord(expense.id, fallbackAccountId)}>
            Registra
          </button>
          <button className="ghost-button" type="button" onClick={() => onRemove(expense.id)}>
            Elimina
          </button>
        </div>
      </div>

      <div className="grid split-grid">
        <input
          className="input"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={() => onSave(expense.id, { title: titleDraft })}
        />
        <input
          className="input"
          value={categoryDraft}
          onChange={(event) => setCategoryDraft(event.target.value)}
          onBlur={() => onSave(expense.id, { category: categoryDraft })}
        />
      </div>

      <div className="grid split-grid">
        <input
          className="input"
          value={amountDraft}
          type="number"
          onChange={(event) => setAmountDraft(event.target.value)}
          onBlur={() => {
            const nextAmount = safeNumber(amountDraft, expense.amount)
            setAmountDraft(String(nextAmount))
            onSave(expense.id, { amount: nextAmount })
          }}
        />
        <select
          className="input"
          value={expense.currency}
          onChange={(event) => onSave(expense.id, { currency: event.target.value as typeof baseCurrency })}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
          <option value="CHF">CHF</option>
          <option value="CAD">CAD</option>
        </select>
      </div>

      <div className="grid tri-grid">
        <select
          className="input"
          value={expense.frequency}
          onChange={(event) => onSave(expense.id, { frequency: event.target.value as typeof expense.frequency })}
        >
          <option value="weekly">Settimanale</option>
          <option value="monthly">Mensile</option>
          <option value="quarterly">Trimestrale</option>
          <option value="annual">Annuale</option>
        </select>
        <input
          className="input"
          type="date"
          value={expense.nextDate}
          onChange={(event) => onSave(expense.id, { nextDate: event.target.value })}
        />
        <select
          className="input"
          value={expense.kind ?? 'mandatory'}
          onChange={(event) => onSave(expense.id, { kind: event.target.value as 'mandatory' | 'optional' })}
        >
          <option value="mandatory">Obbligatoria</option>
          <option value="optional">Opzionale</option>
        </select>
      </div>

      <textarea
        className="input textarea"
        value={notesDraft}
        placeholder="Note operative"
        onChange={(event) => setNotesDraft(event.target.value)}
        onBlur={() => onSave(expense.id, { notes: notesDraft })}
      />

      <div className="grid tri-grid">
        <div className="soft-card">
          <span>Importo</span>
          <strong>{formatCurrency(expense.amount, expense.currency)}</strong>
          <small>{formatCurrency(expense.amountBase, baseCurrency)} in valuta base</small>
        </div>
        <div className="soft-card">
          <span>Prossima data</span>
          <strong>{formatDateLong(expense.nextDate)}</strong>
          <small>{frequencyLabels[expense.frequency]}</small>
        </div>
        <div className="soft-card">
          <span>Media mensile</span>
          <strong>{formatCurrency(expense.monthlyEquivalentBase, baseCurrency)}</strong>
          <small>{(expense.kind ?? 'mandatory') === 'mandatory' ? 'obbligatoria' : 'opzionale'}</small>
        </div>
      </div>
    </article>
  )
}

export function RecurringPage() {
  const {
    accounts,
    addRecurringExpense,
    baseCurrency,
    recordRecurringExpense,
    recurringExpenseForecast,
    recurringExpenseInsights,
    removeRecurringExpense,
    updateRecurringExpense,
  } = useFinanceData()

  const [form, setForm] = useState({
    title: '',
    category: 'Casa',
    amount: '',
    currency: baseCurrency,
    frequency: 'monthly' as const,
    nextDate: todayKey(),
    notes: '',
    kind: 'mandatory' as const,
  })

  const dueSoon = recurringExpenseForecast.upcoming.filter((item) => {
    const diff = Math.ceil((new Date(`${item.date}T12:00:00`).getTime() - new Date(`${todayKey()}T12:00:00`).getTime()) / 86400000)
    return diff >= 0 && diff <= 7
  })
  const dueSoonTotal = dueSoon.reduce((sum, item) => sum + item.amountBase, 0)
  const monthlyAggregate = useMemo(() => {
    const grouped = new Map<string, number>()
    for (const item of recurringExpenseForecast.upcoming) {
      const key = item.date.slice(0, 7)
      grouped.set(key, (grouped.get(key) ?? 0) + item.amountBase)
    }
    return Array.from(grouped.entries()).map(([month, total]) => ({ month, total }))
  }, [recurringExpenseForecast.upcoming])

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Prossimi 30 giorni</p>
          <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
          <span className="muted-text">uscite pianificate a breve</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Alert 7 giorni</p>
          <strong>{formatCurrency(dueSoonTotal, baseCurrency)}</strong>
          <span className="muted-text">{dueSoon.length} uscite in scadenza</span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Prossimi 12 mesi</p>
          <strong>{formatCurrency(recurringExpenseForecast.next365DaysBase, baseCurrency)}</strong>
          <span className="muted-text">fabbisogno annuale stimato</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Budget medio mensile</p>
          <strong>{formatCurrency(recurringExpenseForecast.monthlyRequiredBase, baseCurrency)}</strong>
          <span className="muted-text">media teorica delle ricorrenze attive</span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuova ricorrenza</p>
              <h2>Aggiungi una spesa futura</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addRecurringExpense({
                title: form.title || 'Nuova ricorrenza',
                category: form.category,
                amount: safeNumber(form.amount, 0),
                currency: form.currency,
                frequency: form.frequency,
                nextDate: form.nextDate,
                notes: form.notes,
                kind: form.kind,
              })
              setForm((current) => ({
                ...current,
                title: '',
                amount: '',
                notes: '',
                nextDate: todayKey(),
              }))
            }}
          >
            <input
              className="input"
              placeholder="Nome spesa"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <div className="grid split-grid">
              <input
                className="input"
                placeholder="Categoria"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              />
              <input
                className="input"
                placeholder="Importo"
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>
            <div className="grid tri-grid">
              <select
                className="input"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as typeof baseCurrency }))}
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
                value={form.frequency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    frequency: event.target.value as typeof current.frequency,
                  }))
                }
              >
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
                <option value="quarterly">Trimestrale</option>
                <option value="annual">Annuale</option>
              </select>
              <select
                className="input"
                value={form.kind}
                onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as typeof current.kind }))}
              >
                <option value="mandatory">Obbligatoria</option>
                <option value="optional">Opzionale</option>
              </select>
            </div>
            <input
              className="input"
              type="date"
              value={form.nextDate}
              onChange={(event) => setForm((current) => ({ ...current, nextDate: event.target.value }))}
            />
            <textarea
              className="input textarea"
              placeholder="Note"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
            <button className="primary-button" type="submit">
              Salva ricorrenza
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Ricorrenze attive</p>
              <h2>Elenco modificabile</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {recurringExpenseInsights.length ? (
              recurringExpenseInsights.map((expense) => (
                <RecurringExpenseCard
                  key={expense.id}
                  baseCurrency={baseCurrency}
                  expense={expense}
                  fallbackAccountId={accounts[0]?.id}
                  onRecord={recordRecurringExpense}
                  onRemove={removeRecurringExpense}
                  onSave={updateRecurringExpense}
                />
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna spesa ricorrente configurata</strong>
                <p>Inserisci affitti, abbonamenti, rate o altre uscite programmate per stimare il fabbisogno futuro.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Scadenze in arrivo</p>
              <h2>Prossimi addebiti previsti</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {recurringExpenseForecast.upcoming.length ? (
              recurringExpenseForecast.upcoming.map((item) => (
                <div key={`${item.expenseId}-${item.date}`} className="list-card">
                  <div className="stack gap-xs">
                    <strong>{item.title}</strong>
                    <span className="muted-text">
                      {item.category} - {formatDateLong(item.date)} - {frequencyLabels[item.frequency]}
                    </span>
                  </div>
                  <strong>{formatCurrency(item.amount, item.currency)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna scadenza programmata</strong>
                <p>Quando aggiungi una ricorrenza, qui compariranno le prossime date da coprire.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Aggregato mensile</p>
              <h2>Budget minimo da coprire</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {monthlyAggregate.length ? (
              monthlyAggregate.map((bucket) => (
                <div key={bucket.month} className="soft-card">
                  <span>{bucket.month}</span>
                  <strong>{formatCurrency(bucket.total, baseCurrency)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna ricorrenza aggregata</strong>
                <p>Appena inserisci le ricorrenze, qui vedi il fabbisogno mese per mese.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
