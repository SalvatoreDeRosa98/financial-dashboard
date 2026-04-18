import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLong, safeNumber } from '../lib/utils'

export function CalendarPage() {
  const { addCalendarItem, calendarItems } = useFinanceData()
  const [draft, setDraft] = useState({
    title: '',
    date: '2026-04-25',
    kind: 'bill' as const,
    amount: '',
    currency: 'EUR' as const,
  })

  return (
    <div className="grid content-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Nuova scadenza</p>
            <h2>Promemoria finanziario</h2>
          </div>
        </div>
        <form
          className="stack gap-sm"
          onSubmit={(event) => {
            event.preventDefault()
            addCalendarItem({
              title: draft.title,
              date: draft.date,
              kind: draft.kind,
              amount: draft.amount ? safeNumber(draft.amount) : undefined,
              currency: draft.currency,
            })
            setDraft((current) => ({ ...current, title: '', amount: '' }))
          }}
        >
          <input className="input" placeholder="Titolo evento" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          <input className="input" type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          <select className="input" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as typeof current.kind }))}>
            <option value="bill">Bill</option>
            <option value="salary">Salary</option>
            <option value="subscription">Subscription</option>
            <option value="goal">Goal</option>
          </select>
          <div className="grid split-grid">
            <input className="input" placeholder="Importo opzionale" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} />
            <select className="input" value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as typeof current.currency }))}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
          <button className="primary-button" type="submit">
            Salva scadenza
          </button>
        </form>
      </article>

      <article className="panel span-two">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Prossimi eventi</p>
            <h2>Calendario personale</h2>
          </div>
        </div>
        <div className="stack gap-sm">
          {calendarItems.map((item) => (
            <div key={item.id} className="list-card">
              <div className="stack">
                <strong>{item.title}</strong>
                <span className="muted-text">
                  {item.kind} - {formatDateLong(item.date)}
                </span>
              </div>
              <strong>{item.amount ? formatCurrency(item.amount, item.currency ?? 'EUR') : 'Promemoria'}</strong>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
