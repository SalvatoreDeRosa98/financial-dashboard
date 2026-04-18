import { formatCurrency, formatSignedPercent } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function KpiCards() {
  const { summaryMetrics } = useFinanceData()

  return (
    <section className="grid four-up">
      {summaryMetrics.map((metric) => (
        <article key={metric.label} className={`panel kpi-card tone-${metric.accent}`}>
          <p className="muted-label">{metric.label}</p>
          <strong>{formatCurrency(metric.value)}</strong>
          <span className={`delta ${metric.change >= 0 ? 'positive' : 'negative'}`}>
            {formatSignedPercent(metric.change)} vs mese scorso
          </span>
        </article>
      ))}
    </section>
  )
}
