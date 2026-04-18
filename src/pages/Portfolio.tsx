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

export function PortfolioPage() {
  const {
    addPosition,
    accounts,
    baseCurrency,
    basePortfolioValue,
    dividendMonthlyAverageBase,
    hedgingAlert,
    portfolioTimeline,
    positionInsights,
    simulateSale,
    strategyAlert,
    strategyTargets,
    taxCreditRemaining,
    totalLiquidBase,
    updatePositionNotes,
    updatePositionPrice,
    updateStrategyTarget,
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
  const [sale, setSale] = useState({
    symbol: 'AAPL',
    quantity: '10',
    method: 'FIFO' as 'FIFO' | 'LIFO',
  })
  const brokerAccount = accounts.find((account) => account.id === 'acc-broker')
  const totalCostBase = useMemo(
    () => positionInsights.reduce((sum, position) => sum + position.costBase, 0),
    [positionInsights],
  )
  const totalPnlBase = basePortfolioValue - totalCostBase
  const totalPnlPct = totalCostBase > 0 ? (totalPnlBase / totalCostBase) * 100 : 0
  const salePreview = simulateSale(sale.symbol, safeNumber(sale.quantity, 0), sale.method)

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
          <span className="muted-text">gestito da qui, non da Denaro</span>
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

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Snapshot portfolio</p>
              <h2>Numeri rapidi da monitorare</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            <div className="soft-card">
              <span>Strumenti in portafoglio</span>
              <strong>{positionInsights.length}</strong>
            </div>
            <div className="soft-card">
              <span>Dividendi medi mensili</span>
              <strong>{formatCurrency(dividendMonthlyAverageBase, baseCurrency)}</strong>
            </div>
            <div className="soft-card">
              <span>Liquidita pronta da investire</span>
              <strong>{formatCurrency(totalLiquidBase, baseCurrency)}</strong>
            </div>
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
              <p className="muted-label">Portfolio tracker</p>
              <h2>Prezzo di carico, prezzo attuale e resa di ogni strumento</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {positionInsights.map((position) => (
              <div key={position.id} className="position-card">
                <div className="position-top">
                  <div>
                    <strong>{position.symbol}</strong>
                    <span className="muted-text">
                      {position.name} - {position.assetType} - acquistato il {formatDateLong(position.purchaseDate)}
                    </span>
                  </div>
                  <span className="small-pill">{position.hedged ? 'Hedged' : 'Unhedged'}</span>
                </div>
                <div className="grid tri-grid">
                  <div className="soft-card">
                    <span>Prezzo di carico</span>
                    <strong>{formatCurrency(position.buyPrice, position.currency)}</strong>
                    <small>{position.quantity} quote</small>
                  </div>
                  <div className="soft-card">
                    <span>Prezzo attuale</span>
                    <strong>{formatCurrency(position.currentPrice, position.currency)}</strong>
                    <small>aggiorna il prezzo quando vuoi</small>
                  </div>
                  <div className="soft-card">
                    <span>P&amp;L totale</span>
                    <strong>{formatSignedCurrency(position.pnlBase, baseCurrency)}</strong>
                    <small>{formatSignedPercent(position.pnlBasePct)}</small>
                  </div>
                </div>
                <div className="grid tri-grid">
                  <div className="soft-card">
                    <span>P&amp;L nella valuta originale</span>
                    <strong>{formatSignedCurrency(position.pnlOriginal, position.currency)}</strong>
                    <small>{formatSignedPercent(position.pnlOriginalPct)}</small>
                  </div>
                  <div className="soft-card">
                    <span>Valore attuale</span>
                    <strong>{formatCurrency(position.marketValueBase, baseCurrency)}</strong>
                    <small>
                      {formatCurrency(position.marketValueOriginal, position.currency)} nella valuta strumento
                    </small>
                  </div>
                  <div className="soft-card">
                    <span>Effetto cambio</span>
                    <strong>{formatSignedCurrency(position.fxImpactBase, baseCurrency)}</strong>
                    <small>
                      fx acquisto {position.purchaseFxRate.toFixed(4)} / oggi {position.currentFxRate.toFixed(4)}
                    </small>
                  </div>
                </div>
                <div className="position-bottom">
                  <span>Acquistato il {formatDateLong(position.purchaseDate)}</span>
                  <div className="row-inline">
                    <input
                      className="input input-small"
                      defaultValue={position.currentPrice}
                      onBlur={(event) => updatePositionPrice(position.id, safeNumber(event.target.value, position.currentPrice))}
                    />
                  </div>
                </div>
                <textarea
                  className="input textarea"
                  defaultValue={position.thesis ?? ''}
                  onBlur={(event) => updatePositionNotes(position.id, event.target.value)}
                />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Simulatore capital gain</p>
              <h2>FIFO / LIFO</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            <select className="input" value={sale.symbol} onChange={(event) => setSale((current) => ({ ...current, symbol: event.target.value }))}>
              {Array.from(new Set(positionInsights.map((item) => item.symbol))).map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            <input className="input" value={sale.quantity} onChange={(event) => setSale((current) => ({ ...current, quantity: event.target.value }))} />
            <select className="input" value={sale.method} onChange={(event) => setSale((current) => ({ ...current, method: event.target.value as 'FIFO' | 'LIFO' }))}>
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
            </select>
            {salePreview ? (
              <div className="stack gap-sm">
                <div className="soft-card">
                  <strong>Gain stimato: {formatCurrency(salePreview.gainBase, baseCurrency)}</strong>
                  <p className="muted-text">
                    Imposta stimata {formatCurrency(salePreview.estimatedTax, baseCurrency)} al 26%, compensando fino a {formatCurrency(taxCreditRemaining, baseCurrency)} di minus disponibili.
                  </p>
                </div>
                {salePreview.lots.map((lot) => (
                  <div key={`${lot.positionId}-${lot.quantity}`} className="soft-card">
                    <strong>{lot.symbol} - {lot.quantity} quote</strong>
                    <p className="muted-text">
                      costo {lot.unitCost} / gain {formatCurrency(lot.gainBase, baseCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Strategia target</p>
              <h2>Alert deviazione portafoglio</h2>
            </div>
          </div>
          <div className="grid tri-grid">
            {strategyTargets.map((target) => {
              const actual =
                positionInsights
                  .filter((item) => item.assetType === target.assetType)
                  .reduce((sum, item) => sum + item.marketValueBase, 0) /
                Math.max(
                  positionInsights.reduce((sum, item) => sum + item.marketValueBase, 0),
                  1,
                ) *
                100

              return (
                <div key={target.assetType} className="soft-card">
                  <strong>{target.assetType}</strong>
                  <p className="muted-text">Target {target.targetPct}% / Attuale {actual.toFixed(1)}%</p>
                  <input
                    className="input"
                    defaultValue={target.targetPct}
                    type="number"
                    onBlur={(event) => updateStrategyTarget(target.assetType, safeNumber(event.target.value, target.targetPct))}
                  />
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}
