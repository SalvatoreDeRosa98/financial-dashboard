import { formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function AllocationBars() {
  const { moneyAllocation } = useFinanceData()
  const total = moneyAllocation.reduce((sum, item) => sum + item.value, 0)

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Dove sono i soldi</p>
          <h2>Ripartizione attuale</h2>
        </div>
      </div>

      <div className="stack gap-md">
        {moneyAllocation.map((item) => {
          const share = (item.value / total) * 100
          return (
            <div key={item.label} className="allocation-row">
              <div className="row-between">
                <span>{item.label}</span>
                <strong>{formatCurrency(item.value)}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${share}%`, background: item.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
