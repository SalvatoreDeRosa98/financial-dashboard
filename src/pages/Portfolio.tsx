import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateLong,
  formatSignedCurrency,
  formatSignedPercent,
  safeNumber,
} from '../lib/utils'
import { useDashboardStore } from '../stores/dashboardStore'

export function PortfolioPage() {
  const {
    addPosition,
    accounts,
    baseCurrency,
    basePortfolioValue,
    hedgingAlert,
    portfolioTimeline,
    positionInsights,
    strategyAlert,
    updatePositionNotes,
    updatePositionPrice,
  } = useFinanceData()
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    assetType: 'Stock' as const,
    quantity: '',
    buyPrice: '',
    currentPrice: '',
    currency: 'USD' as const,
    purchaseDate: '2026-04-18',
    hedged: false,
    annualDividendPerShare: '',
    thesis: '',
  })
  const brokerAccount = accounts.find((account) => account.id === 'acc-broker')
  const selectedPositionId = useDashboardStore((state) => state.selectedInstrumentId)
  const setSelectedPositionId = useDashboardStore((state) => state.setSelectedInstrumentId)
  const totalCostBase = useMemo(
    () => positionInsights.reduce((sum, position) => sum + position.costBase, 0),
    [positionInsights],
  )
  const totalPnlBase = basePortfolioValue - totalCostBase
  const totalPnlPct = totalCostBase > 0 ? (totalPnlBase / totalCostBase) * 100 : 0
  const selectedPosition =
    positionInsights.find((position) => position.id === selectedPositionId) ?? null

  return (
    <div className="stack gap-lg">
      {hedgingAlert ? <div className="alert-banner warning">{hedgingAlert}</div> : null}
      {strategyAlert ? <div className="alert-banner warning">{strategyAlert}</div> : null}

      <section className="grid metrics-grid">
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Valore portafoglio</p>
          <strong>{formatCurrency(basePortfolioValue, baseCurrency)}</strong>
          <span className={totalPnlBase >= 0 ? 'positive' : 'negative'}>{formatSignedPercent(totalPnlPct)}</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Capitale investito</p>
          <strong>{formatCurrency(totalCostBase, baseCurrency)}</strong>
          <span className="muted-text">prezzo medio di carico aggregato</span>
        </article>
        <article className="panel metric-card metric-teal">
          <p className="muted-label">P&amp;L totale</p>
          <strong>{formatSignedCurrency(totalPnlBase, baseCurrency)}</strong>
          <span className={totalPnlBase >= 0 ? 'positive' : 'negative'}>{formatSignedPercent(totalPnlPct)}</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Broker wallet</p>
          <strong>
            {brokerAccount ? formatCurrency(brokerAccount.balance, brokerAccount.currency) : formatCurrency(0, baseCurrency)}
          </strong>
          <span className="muted-text">liquidita dedicata agli investimenti</span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Andamento complessivo</p>
              <h2>Quanto valgono oggi tutti gli strumenti acquistati</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioTimeline}>
                <defs>
                  <linearGradient id="portfolio-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), baseCurrency)}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#portfolio-area)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuova posizione</p>
              <h2>Portafoglio multi-currency</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={async (event) => {
              event.preventDefault()
              await addPosition({
                symbol: form.symbol.toUpperCase(),
                name: form.name,
                assetType: form.assetType,
                quantity: safeNumber(form.quantity, 0),
                buyPrice: safeNumber(form.buyPrice, 0),
                currentPrice: safeNumber(form.currentPrice, 0),
                currency: form.currency,
                purchaseDate: form.purchaseDate,
                hedged: form.hedged,
                annualDividendPerShare: safeNumber(form.annualDividendPerShare, 0),
                thesis: form.thesis,
              })
              setForm((current) => ({
                ...current,
                symbol: '',
                name: '',
                quantity: '',
                buyPrice: '',
                currentPrice: '',
                annualDividendPerShare: '',
                thesis: '',
              }))
            }}
          >
            <div className="grid split-grid">
              <input className="input" placeholder="Ticker" value={form.symbol} onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value }))} />
              <input className="input" placeholder="Nome strumento" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid split-grid">
              <select className="input" value={form.assetType} onChange={(event) => setForm((current) => ({ ...current, assetType: event.target.value as typeof current.assetType }))}>
                <option value="Stock">Azione</option>
                <option value="ETF">ETF</option>
                <option value="Crypto">Crypto</option>
                <option value="Bond">Bond</option>
              </select>
              <select className="input" value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as typeof current.currency }))}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CHF">CHF</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div className="grid split-grid">
              <input className="input" placeholder="Quantita" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
              <input className="input" placeholder="Prezzo di carico" value={form.buyPrice} onChange={(event) => setForm((current) => ({ ...current, buyPrice: event.target.value }))} />
            </div>
            <div className="grid split-grid">
              <input className="input" placeholder="Prezzo corrente" value={form.currentPrice} onChange={(event) => setForm((current) => ({ ...current, currentPrice: event.target.value }))} />
              <input className="input" type="date" value={form.purchaseDate} onChange={(event) => setForm((current) => ({ ...current, purchaseDate: event.target.value }))} />
            </div>
            <input className="input" placeholder="Dividendo annuo per quota" value={form.annualDividendPerShare} onChange={(event) => setForm((current) => ({ ...current, annualDividendPerShare: event.target.value }))} />
            <textarea className="input textarea" placeholder="Tesi di investimento / note anti-FOMO" value={form.thesis} onChange={(event) => setForm((current) => ({ ...current, thesis: event.target.value }))} />
            <label className="checkbox-row">
              <input type="checkbox" checked={form.hedged} onChange={(event) => setForm((current) => ({ ...current, hedged: event.target.checked }))} />
              ETF o strumento hedged
            </label>
            <button className="primary-button" type="submit">
              Aggiungi posizione
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Strumenti investiti</p>
              <h2>Lista pulita del portafoglio con dettaglio al click</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {positionInsights.map((position) => (
              <button
                key={position.id}
                className="position-list-item"
                onClick={() => setSelectedPositionId(position.id)}
                type="button"
              >
                <div className="stack align-start">
                  <strong>{position.symbol}</strong>
                  <span className="muted-text">
                    {position.name} - {position.assetType}
                  </span>
                </div>
                <div className="stack align-end">
                  <span className="muted-text">Carico</span>
                  <strong>{formatCurrency(position.buyPrice, position.currency)}</strong>
                </div>
                <div className="stack align-end">
                  <span className="muted-text">Oggi</span>
                  <strong>{formatCurrency(position.currentPrice, position.currency)}</strong>
                </div>
                <div className="stack align-end">
                  <span className="muted-text">Valore</span>
                  <strong>{formatCurrency(position.marketValueBase, baseCurrency)}</strong>
                </div>
                <div className="stack align-end">
                  <span className="muted-text">P&amp;L</span>
                  <strong className={position.pnlBase >= 0 ? 'positive' : 'negative'}>
                    {formatSignedCurrency(position.pnlBase, baseCurrency)}
                  </strong>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>

      {selectedPosition ? (
        <div className="modal-backdrop" onClick={() => setSelectedPositionId(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="panel-heading">
              <div>
                <p className="muted-label">Dettaglio strumento</p>
                <h2>
                  {selectedPosition.symbol} · {selectedPosition.name}
                </h2>
              </div>
              <button className="ghost-button" onClick={() => setSelectedPositionId(null)} type="button">
                Chiudi
              </button>
            </div>
            <div className="grid tri-grid">
              <div className="soft-card">
                <span>Prezzo di carico</span>
                <strong>{formatCurrency(selectedPosition.buyPrice, selectedPosition.currency)}</strong>
                <small>{selectedPosition.quantity} quote</small>
              </div>
              <div className="soft-card">
                <span>Prezzo attuale</span>
                <strong>{formatCurrency(selectedPosition.currentPrice, selectedPosition.currency)}</strong>
                <small>ultimo valore inserito</small>
              </div>
              <div className="soft-card">
                <span>P&amp;L totale</span>
                <strong>{formatSignedCurrency(selectedPosition.pnlBase, baseCurrency)}</strong>
                <small>{formatSignedPercent(selectedPosition.pnlBasePct)}</small>
              </div>
              <div className="soft-card">
                <span>P&amp;L valuta originale</span>
                <strong>{formatSignedCurrency(selectedPosition.pnlOriginal, selectedPosition.currency)}</strong>
                <small>{formatSignedPercent(selectedPosition.pnlOriginalPct)}</small>
              </div>
              <div className="soft-card">
                <span>Valore attuale</span>
                <strong>{formatCurrency(selectedPosition.marketValueBase, baseCurrency)}</strong>
                <small>{formatCurrency(selectedPosition.marketValueOriginal, selectedPosition.currency)}</small>
              </div>
              <div className="soft-card">
                <span>Effetto cambio</span>
                <strong>{formatSignedCurrency(selectedPosition.fxImpactBase, baseCurrency)}</strong>
                <small>
                  fx acquisto {selectedPosition.purchaseFxRate.toFixed(4)} / oggi {selectedPosition.currentFxRate.toFixed(4)}
                </small>
              </div>
            </div>
            <div className="grid split-grid">
              <div className="stack gap-sm">
                <label className="muted-label" htmlFor="current-price-modal">
                  Aggiorna prezzo corrente
                </label>
                <input
                  id="current-price-modal"
                  className="input"
                  defaultValue={selectedPosition.currentPrice}
                  onBlur={(event) =>
                    updatePositionPrice(
                      selectedPosition.id,
                      safeNumber(event.target.value, selectedPosition.currentPrice),
                    )
                  }
                />
              </div>
              <div className="stack gap-sm">
                <label className="muted-label">Data acquisto</label>
                <div className="soft-card">
                  <strong>{formatDateLong(selectedPosition.purchaseDate)}</strong>
                  <small>{selectedPosition.hedged ? 'Strumento hedged' : 'Strumento non hedged'}</small>
                </div>
              </div>
            </div>
            <div className="stack gap-sm">
              <label className="muted-label" htmlFor="notes-modal">
                Note / tesi di investimento
              </label>
              <textarea
                id="notes-modal"
                className="input textarea"
                defaultValue={selectedPosition.thesis ?? ''}
                onBlur={(event) => updatePositionNotes(selectedPosition.id, event.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
