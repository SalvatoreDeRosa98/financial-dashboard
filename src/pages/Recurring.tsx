import { useState } from 'react'
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
  return new Date().toISOString().slice(0, 10)
}

function RecurringExpenseCard({
  expense,
  baseCurrency,
  onSave,
  onRemove,
}: {
  expense: ReturnType<typeof useFinanceData>['recurringExpenseInsights'][number]
  baseCurrency: CurrencyCode
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
        <button className="ghost-button" type="button" onClick={() => onRemove(expense.id)}>
          Elimina
        </button>
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

      <div className="grid split-grid">
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
          <small>stima del fabbisogno medio</small>
        </div>
      </div>
    </article>
  )
}

export function RecurringPage() {
  const {
    addRecurringExpense,
    baseCurrency,
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
  })

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Prossimi 30 giorni</p>
          <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
          <span className="muted-text">uscite pianificate a breve</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Prossimi 90 giorni</p>
          <strong>{formatCurrency(recurringExpenseForecast.next90DaysBase, baseCurrency)}</strong>
          <span className="muted-text">visione del trimestre</span>
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
            <div className="grid split-grid">
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
              <p className="muted-label">Lettura rapida</p>
              <h2>Indicatori di copertura</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            <div className="soft-card">
              <span>Ricorrenze attive</span>
              <strong>{recurringExpenseInsights.filter((item) => item.active).length}</strong>
            </div>
            <div className="soft-card">
              <span>Voci inattive</span>
              <strong>{recurringExpenseInsights.filter((item) => !item.active).length}</strong>
            </div>
            <div className="soft-card">
              <span>Totale medio mensile</span>
              <strong>{formatCurrency(recurringExpenseForecast.monthlyRequiredBase, baseCurrency)}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
