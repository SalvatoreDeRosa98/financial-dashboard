import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PeriodOption } from '../../data/types'
import { formatCompactCurrency, formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function PortfolioChart() {
  const { investmentPeriods, portfolioSeries } = useFinanceData()
  const [period, setPeriod] = useState<PeriodOption['key']>('YTD')

  return (
    <article className="panel span-two">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Andamento portafoglio</p>
          <h2>Performance per periodo</h2>
        </div>
        <div className="tab-row">
          {investmentPeriods.map((item) => (
            <button
              key={item.key}
              className={`tab-button ${period === item.key ? 'is-active' : ''}`}
              onClick={() => setPeriod(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolioSeries[period]}>
            <defs>
              <linearGradient id="portfolio-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#portfolio-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
