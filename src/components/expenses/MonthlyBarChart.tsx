import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function MonthlyBarChart() {
  const { monthlyExpenses } = useFinanceData()
  const activeMonth = monthlyExpenses[monthlyExpenses.length - 1]?.month

  return (
    <article className="panel span-two">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Trend spese</p>
          <h2>Ultimi 6 mesi</h2>
        </div>
        <span className="pill">Aprile evidenziato</span>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyExpenses}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
              {monthlyExpenses.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={entry.month === activeMonth ? '#0ea5e9' : '#7dd3fc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
