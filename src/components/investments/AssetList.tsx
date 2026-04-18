import { formatCurrency, formatSignedPercent } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function AssetList() {
  const { investmentAssets, updateInvestmentValue } = useFinanceData()

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Asset allocation</p>
          <h2>Posizioni principali</h2>
        </div>
      </div>

      <div className="stack gap-sm">
        {investmentAssets.map((asset) => (
          <div key={asset.symbol} className="asset-row">
            <div className="stack">
              <div className="row-inline">
                <strong>{asset.symbol}</strong>
                <span className="small-pill">{asset.type}</span>
              </div>
              <span className="muted-text">{asset.name}</span>
            </div>
            <div className="stack align-end">
              <strong>{formatCurrency(asset.value)}</strong>
              <span>{asset.allocation}% portafoglio</span>
            </div>
            <div className={`delta ${asset.change >= 0 ? 'positive' : 'negative'}`}>
              {formatSignedPercent(asset.change)}
            </div>
            <label className="inline-editor">
              <span>Valore</span>
              <input
                defaultValue={asset.value}
                min="0"
                onBlur={(event) =>
                  updateInvestmentValue(asset.symbol, Number(event.target.value) || 0)
                }
                type="number"
              />
            </label>
          </div>
        ))}
      </div>
    </article>
  )
}
