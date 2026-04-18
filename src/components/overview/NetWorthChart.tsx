import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function NetWorthChart() {
  const { netWorthTrend } = useFinanceData()

  return (
    <article className="panel chart-panel span-two">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Trend patrimonio</p>
          <h2>Ultimi 12 mesi</h2>
        </div>
        <span className="pill">+58.900 EUR anno su anno</span>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={netWorthTrend}>
            <defs>
              <linearGradient id="net-worth-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--panel)',
              }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#0ea5e9"
              strokeWidth={3}
              fill="url(#net-worth-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
