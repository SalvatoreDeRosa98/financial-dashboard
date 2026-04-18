import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function BalanceTrendChart() {
  const { accountBalanceTrend } = useFinanceData()

  return (
    <article className="panel span-two">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Andamento 6 mesi</p>
          <h2>Saldo per strumento</h2>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={accountBalanceTrend}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="checking" stroke="#2dd4bf" strokeWidth={2.5} dot={false} name="Conto principale" />
            <Line type="monotone" dataKey="savings" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="Risparmio" />
            <Line type="monotone" dataKey="card" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Carta" />
            <Line type="monotone" dataKey="wallet" stroke="#a78bfa" strokeWidth={2.5} dot={false} name="Wallet" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
