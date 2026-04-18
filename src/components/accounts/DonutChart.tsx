import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function DonutChart() {
  const { moneyAllocation } = useFinanceData()

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Split liquidita</p>
          <h2>Conti e strumenti</h2>
        </div>
      </div>

      <div className="chart-wrap compact">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={moneyAllocation}
              dataKey="value"
              nameKey="label"
              innerRadius={72}
              outerRadius={108}
              paddingAngle={3}
            >
              {moneyAllocation.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
