import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLong, formatSignedPercent } from '../lib/utils'

export function MarketsPage() {
  const { addWatchlistItem, marketIndices, marketStatus, newsItems, refreshMarketData, watchlist } = useFinanceData()
  const [draft, setDraft] = useState({
    symbol: '',
    name: '',
    category: '',
    currency: 'USD' as const,
    notes: '',
  })

  return (
    <div className="stack gap-lg">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Indici globali</p>
            <h2>{marketStatus === 'live' ? 'Aggiornamento live' : 'Fallback seed'}</h2>
          </div>
          <button className="ghost-button" onClick={() => void refreshMarketData()} type="button">
            Aggiorna
          </button>
        </div>
        <div className="grid mini-grid">
          {marketIndices.map((item) => (
            <article key={item.symbol} className="soft-card">
              <span>{item.region}</span>
              <strong>{item.name}</strong>
              <div className="large-value">{formatCurrency(item.price, item.currency)}</div>
              <small className={item.change >= 0 ? 'positive' : 'negative'}>
                {formatSignedPercent(item.change)}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuova watchlist</p>
              <h2>Titoli da seguire</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addWatchlistItem(draft)
              setDraft({ symbol: '', name: '', category: '', currency: 'USD', notes: '' })
            }}
          >
            <input className="input" placeholder="Ticker" value={draft.symbol} onChange={(event) => setDraft((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))} />
            <input className="input" placeholder="Nome" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <input className="input" placeholder="Categoria" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
            <select className="input" value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as typeof current.currency }))}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
            <textarea className="input textarea" placeholder="Note personali" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            <button className="primary-button" type="submit">
              Salva in watchlist
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Watchlist personale</p>
              <h2>Variazioni in evidenza</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {watchlist.map((item) => (
              <div key={item.id} className="list-card">
                <div className="stack">
                  <strong>{item.symbol}</strong>
                  <span className="muted-text">
                    {item.name} - {item.category}
                  </span>
                </div>
                <div className="stack align-end">
                  <strong>{formatCurrency(item.price, item.currency)}</strong>
                  <span className={item.change >= 0 ? 'positive' : 'negative'}>
                    {formatSignedPercent(item.change)}
                  </span>
                </div>
                <div className="muted-text note-box">{item.notes}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">News finanziarie</p>
            <h2>Brief quotidiano</h2>
          </div>
        </div>
        <div className="grid mini-grid">
          {newsItems.map((item) => (
            <article key={item.id} className="soft-card news-card">
              <span>{item.source}</span>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <small>{formatDateLong(item.publishedAt)}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
