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
    addGoal,
    addLiability,
    addPosition,
    baseCurrency,
    basePortfolioValue,
    goals,
    hedgingAlert,
    liabilities,
    portfolioTimeline,
    positionInsights,
    recurringExpenseForecast,
    strategyAlert,
    totalLiquidBase,
    updateGoal,
    updateLiability,
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
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'Fondo emergenza',
    target: '',
    current: '',
    dueDate: '2026-12-31',
  })
  const [liabilityForm, setLiabilityForm] = useState({
    title: '',
    balance: '',
    dueDate: '2026-12-31',
    kind: 'card' as const,
  })
  const selectedPositionId = useDashboardStore((state) => state.selectedInstrumentId)
  const setSelectedPositionId = useDashboardStore((state) => state.setSelectedInstrumentId)
  const totalCostBase = useMemo(
    () => positionInsights.reduce((sum, position) => sum + position.costBase, 0),
    [positionInsights],
  )
  const totalPnlBase = basePortfolioValue - totalCostBase
  const totalPnlPct = totalCostBase > 0 ? (totalPnlBase / totalCostBase) * 100 : 0
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0)
  const netWorth = totalLiquidBase + basePortfolioValue - totalLiabilities
  const runwayMonths =
    recurringExpenseForecast.monthlyRequiredBase > 0
      ? totalLiquidBase / recurringExpenseForecast.monthlyRequiredBase
      : 0
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
          <span className="muted-text">costo storico aggregato</span>
        </article>
        <article className="panel metric-card metric-teal">
          <p className="muted-label">P&amp;L totale</p>
          <strong>{formatSignedCurrency(totalPnlBase, baseCurrency)}</strong>
          <span className={totalPnlBase >= 0 ? 'positive' : 'negative'}>{formatSignedPercent(totalPnlPct)}</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Net worth</p>
          <strong>
            {formatCurrency(netWorth, baseCurrency)}
          </strong>
          <span className="muted-text">
            liquidita + portafoglio - passività
          </span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Storico portafoglio</p>
              <h2>Valore complessivo delle posizioni</h2>
            </div>
          </div>
          <div className="chart-wrap">
            {portfolioTimeline.length ? (
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
            ) : (
              <div className="empty-state">
                <strong>Nessuna posizione registrata</strong>
                <p>La cronologia del portafoglio partira dal primo strumento inserito.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Obiettivi</p>
              <h2>Risparmi da costruire</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addGoal({
                title: goalForm.title || 'Nuovo obiettivo',
                category: goalForm.category,
                target: safeNumber(goalForm.target, 0),
                current: safeNumber(goalForm.current, 0),
                dueDate: goalForm.dueDate,
              })
              setGoalForm((current) => ({ ...current, title: '', target: '', current: '' }))
            }}
          >
            <input className="input" placeholder="Nome obiettivo" value={goalForm.title} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} />
            <input className="input" placeholder="Categoria" value={goalForm.category} onChange={(event) => setGoalForm((current) => ({ ...current, category: event.target.value }))} />
            <div className="grid split-grid">
              <input className="input" placeholder="Target" value={goalForm.target} onChange={(event) => setGoalForm((current) => ({ ...current, target: event.target.value }))} />
              <input className="input" placeholder="Accumulo attuale" value={goalForm.current} onChange={(event) => setGoalForm((current) => ({ ...current, current: event.target.value }))} />
            </div>
            <input className="input" type="date" value={goalForm.dueDate} onChange={(event) => setGoalForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <button className="primary-button" type="submit">
              Aggiungi obiettivo
            </button>
          </form>
          <div className="stack gap-sm">
            {goals.map((goal) => {
              const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0
              return (
                <div key={goal.id} className="soft-card stack gap-sm">
                  <div className="row-between">
                    <strong>{goal.title}</strong>
                    <span>{formatCurrency(goal.current, baseCurrency)} / {formatCurrency(goal.target, baseCurrency)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: '#14b8a6' }} />
                  </div>
                  <input
                    className="input"
                    defaultValue={goal.current}
                    type="number"
                    onBlur={(event) => updateGoal(goal.id, { current: safeNumber(event.target.value, goal.current) })}
                  />
                </div>
              )
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Nuova posizione</p>
              <h2>Inserisci una nuova posizione</h2>
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
            <textarea className="input textarea" placeholder="Tesi di investimento o note operative" value={form.thesis} onChange={(event) => setForm((current) => ({ ...current, thesis: event.target.value }))} />
            <label className="checkbox-row">
              <input type="checkbox" checked={form.hedged} onChange={(event) => setForm((current) => ({ ...current, hedged: event.target.checked }))} />
              Strumento coperto dal rischio cambio
            </label>
            <button className="primary-button" type="submit">
              Aggiungi posizione
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Posizioni aperte</p>
              <h2>Dettaglio strumenti in portafoglio</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {positionInsights.length ? (
              positionInsights.map((position) => (
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
              ))
            ) : (
              <div className="empty-state">
                <strong>Portafoglio ancora vuoto</strong>
                <p>Le posizioni appariranno qui quando aggiungerai il primo strumento.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Passività</p>
              <h2>Debiti e impegni</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addLiability({
                title: liabilityForm.title || 'Nuova passività',
                balance: safeNumber(liabilityForm.balance, 0),
                dueDate: liabilityForm.dueDate,
                kind: liabilityForm.kind,
              })
              setLiabilityForm((current) => ({ ...current, title: '', balance: '' }))
            }}
          >
            <input className="input" placeholder="Titolo" value={liabilityForm.title} onChange={(event) => setLiabilityForm((current) => ({ ...current, title: event.target.value }))} />
            <div className="grid split-grid">
              <select className="input" value={liabilityForm.kind} onChange={(event) => setLiabilityForm((current) => ({ ...current, kind: event.target.value as typeof current.kind }))}>
                <option value="card">Carta</option>
                <option value="loan">Prestito</option>
                <option value="tax">Tasse</option>
                <option value="other">Altro</option>
              </select>
              <input className="input" placeholder="Saldo residuo" value={liabilityForm.balance} onChange={(event) => setLiabilityForm((current) => ({ ...current, balance: event.target.value }))} />
            </div>
            <input className="input" type="date" value={liabilityForm.dueDate} onChange={(event) => setLiabilityForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <button className="primary-button" type="submit">
              Aggiungi passività
            </button>
          </form>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Sintesi personale</p>
              <h2>Tenuta finanziaria complessiva</h2>
            </div>
          </div>
          <div className="grid tri-grid">
            <div className="soft-card">
              <span>Liquidità + investimenti</span>
              <strong>{formatCurrency(totalLiquidBase + basePortfolioValue, baseCurrency)}</strong>
            </div>
            <div className="soft-card">
              <span>Passività totali</span>
              <strong>{formatCurrency(totalLiabilities, baseCurrency)}</strong>
            </div>
            <div className="soft-card">
              <span>Runway</span>
              <strong>{runwayMonths.toFixed(1)} mesi</strong>
            </div>
          </div>
          <div className="stack gap-sm">
            {liabilities.length ? (
              liabilities.map((liability) => (
                <div key={liability.id} className="list-card">
                  <div className="stack gap-xs">
                    <strong>{liability.title}</strong>
                    <span className="muted-text">
                      {liability.kind} · {formatDateLong(liability.dueDate)}
                    </span>
                  </div>
                  <input
                    className="input compact-input"
                    defaultValue={liability.balance}
                    type="number"
                    onBlur={(event) =>
                      updateLiability(liability.id, { balance: safeNumber(event.target.value, liability.balance) })
                    }
                  />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna passività registrata</strong>
                <p>Carte, finanziamenti o imposte appariranno qui.</p>
              </div>
            )}
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
                <small>ultimo prezzo registrato</small>
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
                  <small>{selectedPosition.hedged ? 'Copertura cambio attiva' : 'Copertura cambio non attiva'}</small>
                </div>
              </div>
            </div>
            <div className="stack gap-sm">
              <label className="muted-label" htmlFor="notes-modal">
                Tesi di investimento
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
