import { formatCurrency, formatSignedPercent } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function ReturnBadges() {
  const { investmentAssets } = useFinanceData()
  const totalValue = investmentAssets.reduce((sum, asset) => sum + asset.value, 0)
  const ytdReturn = 12.8
  const monthlyReturn = 3.1

  return (
    <section className="grid three-up">
      <article className="panel badge-card">
        <p className="muted-label">Valore portafoglio</p>
        <strong>{formatCurrency(totalValue)}</strong>
      </article>
      <article className="panel badge-card">
        <p className="muted-label">Rendimento YTD</p>
        <strong className="positive">{formatSignedPercent(ytdReturn)}</strong>
      </article>
      <article className="panel badge-card">
        <p className="muted-label">Rendimento mensile</p>
        <strong className="positive">{formatSignedPercent(monthlyReturn)}</strong>
      </article>
    </section>
  )
}
