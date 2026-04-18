import { useEffect, useMemo, useRef, useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, formatDateLong, formatSignedPercent } from '../lib/utils'

type OpportunityPeriod = 'day' | 'week' | 'month' | 'threeMonths' | 'year'

function TradingViewSymbolChart({
  chartSymbol,
  title,
}: {
  chartSymbol: string
  title: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''

    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'

    const copyright = document.createElement('div')
    copyright.className = 'tradingview-widget-copyright'
    copyright.innerHTML = `<a href="https://www.tradingview.com/symbols/${chartSymbol.replace(':', '-')}/" rel="noopener noreferrer" target="_blank">Grafico ufficiale ${title} su TradingView</a>`

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    script.text = JSON.stringify({
      symbols: [[title, chartSymbol]],
      chartOnly: false,
      width: '100%',
      height: 420,
      locale: 'it',
      colorTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      chartType: 'area',
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12',
      lineWidth: 2,
      lineType: 0,
      dateRanges: ['1D|1', '1M|30', '3M|60', '12M|1D', '60M|1W', 'all|1M'],
    })

    containerRef.current.append(widget, copyright, script)
  }, [chartSymbol, title])

  return <div ref={containerRef} className="tradingview-widget-container chart-embed" />
}

export function MarketsPage() {
  const {
    addWatchlistItem,
    marketIndices,
    marketStatus,
    newsItems,
    opportunities,
    refreshMarketData,
    watchlist,
  } = useFinanceData()
  const [draft, setDraft] = useState({
    symbol: '',
    name: '',
    category: '',
    currency: 'USD' as const,
    notes: '',
  })
  const [selectedIndexSymbol, setSelectedIndexSymbol] = useState(marketIndices[0]?.symbol ?? '')
  const [selectedKind, setSelectedKind] = useState<'Stock' | 'ETF'>('Stock')
  const [selectedPeriod, setSelectedPeriod] = useState<OpportunityPeriod>('month')

  const selectedIndex =
    marketIndices.find((item) => item.symbol === selectedIndexSymbol) ?? marketIndices[0] ?? null

  const topGainers = useMemo(
    () =>
      [...opportunities]
        .filter((item) => item.kind === selectedKind)
        .sort((left, right) => right.performance[selectedPeriod] - left.performance[selectedPeriod]),
    [opportunities, selectedKind, selectedPeriod],
  )

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
            <button
              key={item.symbol}
              className={`soft-card market-card-button${item.symbol === selectedIndex?.symbol ? ' is-selected' : ''}`}
              onClick={() => setSelectedIndexSymbol(item.symbol)}
              type="button"
            >
              <span>{item.region}</span>
              <strong>{item.name}</strong>
              <div className="large-value">{formatCurrency(item.price, item.currency)}</div>
              <small className={item.change >= 0 ? 'positive' : 'negative'}>
                {formatSignedPercent(item.change)}
              </small>
            </button>
          ))}
        </div>
      </section>

      {selectedIndex ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Grafico indice selezionato</p>
              <h2>{selectedIndex.name}</h2>
            </div>
            <a
              className="ghost-button"
              href={`https://www.tradingview.com/symbols/${selectedIndex.chartSymbol.replace(':', '-')}/`}
              rel="noreferrer"
              target="_blank"
            >
              Apri su TradingView
            </a>
          </div>
          <TradingViewSymbolChart chartSymbol={selectedIndex.chartSymbol} title={selectedIndex.name} />
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Top gainer globali</p>
            <h2>Scouting operativo tra azioni ed ETF</h2>
          </div>
        </div>
        <div className="tab-row">
          {(['Stock', 'ETF'] as const).map((kind) => (
            <button
              key={kind}
              className={`tab-button${selectedKind === kind ? ' is-active' : ''}`}
              onClick={() => setSelectedKind(kind)}
              type="button"
            >
              {kind === 'Stock' ? 'Azioni globali' : 'ETF globali'}
            </button>
          ))}
        </div>
        <div className="tab-row">
          {[
            { key: 'day', label: 'Giorno' },
            { key: 'week', label: 'Settimana' },
            { key: 'month', label: 'Mese' },
            { key: 'threeMonths', label: '3 mesi' },
            { key: 'year', label: 'Annuale' },
          ].map((period) => (
            <button
              key={period.key}
              className={`tab-button${selectedPeriod === period.key ? ' is-active' : ''}`}
              onClick={() => setSelectedPeriod(period.key as OpportunityPeriod)}
              type="button"
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className="grid mini-grid">
          {topGainers.map((item, index) => (
            <article key={item.id} className={`soft-card${index === 0 ? ' highlight-card' : ''}`}>
              <span>
                #{index + 1} - {item.region}
              </span>
              <strong>
                {item.symbol} · {item.name}
              </strong>
              <div className="large-value">{formatCurrency(item.price, item.currency)}</div>
              <small className={item.performance[selectedPeriod] >= 0 ? 'positive' : 'negative'}>
                {formatSignedPercent(item.performance[selectedPeriod])} nel periodo selezionato
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
            <input
              className="input"
              placeholder="Ticker"
              value={draft.symbol}
              onChange={(event) => setDraft((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
            />
            <input
              className="input"
              placeholder="Nome"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              className="input"
              placeholder="Categoria"
              value={draft.category}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            />
            <select
              className="input"
              value={draft.currency}
              onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value as typeof current.currency }))}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
            </select>
            <textarea
              className="input textarea"
              placeholder="Note personali"
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            />
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
