import { useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { convertWithEuroBaseRates, formatCurrency, safeNumber } from '../lib/utils'

export function FXPage() {
  const {
    baseCurrency,
    fxRates,
    fxSource,
    fxStatus,
    fxUpdatedAt,
    positionInsights,
    refreshFxRates,
    setBaseCurrency,
    supportedCurrencies,
  } = useFinanceData()
  const [converter, setConverter] = useState({
    amount: '1000',
    from: 'USD',
    to: 'EUR',
  })

  const converted = convertWithEuroBaseRates(
    safeNumber(converter.amount, 0),
    converter.from as typeof baseCurrency,
    converter.to as typeof baseCurrency,
    fxRates,
  )

  return (
    <div className="stack gap-lg">
      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Valuta base</p>
              <h2>Imposta la valuta di riferimento</h2>
            </div>
          </div>
          <select className="input" value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value as typeof baseCurrency)}>
            {supportedCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <div className="soft-card">
            <strong>{fxStatus === 'live' ? 'Feed cambi attivo' : 'Feed locale di fallback'}</strong>
            <p className="muted-text">
              Fonte: {fxSource} - ultimo aggiornamento {fxUpdatedAt}
            </p>
            <button className="ghost-button" onClick={() => void refreshFxRates()} type="button">
              Aggiorna cambi
            </button>
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Convertitore</p>
              <h2>Conversione rapida tra valute</h2>
            </div>
          </div>
          <div className="grid tri-grid">
            <input className="input" value={converter.amount} onChange={(event) => setConverter((current) => ({ ...current, amount: event.target.value }))} />
            <select className="input" value={converter.from} onChange={(event) => setConverter((current) => ({ ...current, from: event.target.value }))}>
              {supportedCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <select className="input" value={converter.to} onChange={(event) => setConverter((current) => ({ ...current, to: event.target.value }))}>
              {supportedCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <div className="highlight-card">
            <span>Risultato</span>
            <strong>{formatCurrency(converted, converter.to as typeof baseCurrency)}</strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Impatto cambio</p>
            <h2>Confronto tra cambio di acquisto e cambio corrente</h2>
          </div>
        </div>
        <div className="stack gap-sm">
          {positionInsights.map((position) => (
            <div key={position.id} className="list-card">
              <div className="stack">
                <strong>{position.symbol}</strong>
                <span className="muted-text">
                  acquisto {position.purchaseFxRate.toFixed(4)} / oggi {position.currentFxRate.toFixed(4)}
                </span>
              </div>
              <div className="stack align-end">
                <strong>{formatCurrency(position.marketValueBase, baseCurrency)}</strong>
                <span className={position.fxImpactBase >= 0 ? 'positive' : 'negative'}>
                  impatto FX {formatCurrency(position.fxImpactBase, baseCurrency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
