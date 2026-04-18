import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCompactCurrency, formatCurrency, formatSignedPercent } from '../lib/utils'

export function HomePage() {
  const {
    baseCurrency,
    cashflowSeries,
    exposure,
    fxRates,
    fxSource,
    fxStatus,
    hedgingAlert,
    marketIndices,
    summaryMetrics,
  } = useFinanceData()

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className={`panel metric-card metric-${metric.accent}`}>
            <p className="muted-label">{metric.label}</p>
            <strong>
              {metric.label === 'Esposizione USD'
                ? formatSignedPercent(metric.value)
                : formatCurrency(metric.value, baseCurrency)}
            </strong>
            <span className={metric.change >= 0 ? 'positive' : 'negative'}>
              {formatSignedPercent(metric.change)}
            </span>
          </article>
        ))}
      </section>

      {hedgingAlert ? <div className="alert-banner warning">{hedgingAlert}</div> : null}

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Patrimonio & cashflow</p>
              <h2>Ultimi 6 mesi</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowSeries}>
                <defs>
                  <linearGradient id="home-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(Number(value), baseCurrency)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), baseCurrency)}
                  contentStyle={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}
                />
                <Area type="monotone" dataKey="netWorth" stroke="#38bdf8" strokeWidth={3} fill="url(#home-area)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Esposizione valutaria</p>
              <h2>Rischio cambio</h2>
            </div>
          </div>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={exposure} dataKey="valueBase" innerRadius={60} outerRadius={94} paddingAngle={3}>
                  {exposure.map((entry) => (
                    <Cell key={entry.currency} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stack gap-sm">
            {exposure.map((item) => (
              <div key={item.currency} className="row-between compact-row">
                <span className="row-inline">
                  <span className="color-dot" style={{ background: item.color }} />
                  {item.currency}
                </span>
                <strong>{item.share.toFixed(0)}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Tassi FX</p>
              <h2>{fxStatus === 'live' ? 'Feed attivo' : 'Fallback locale'}</h2>
            </div>
            <span className="small-pill">{fxSource}</span>
          </div>
          <div className="grid mini-grid">
            {(Object.entries(fxRates) as Array<[string, number]>).map(([currency, rate]) => (
              <div key={currency} className="soft-card">
                <span>{currency}</span>
                <strong>{rate.toFixed(currency === 'JPY' ? 2 : 4)}</strong>
                <small>per 1 EUR</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Indici globali</p>
              <h2>Market pulse</h2>
            </div>
          </div>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketIndices}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="change" radius={[10, 10, 0, 0]}>
                  {marketIndices.map((entry) => (
                    <Cell key={entry.symbol} fill={entry.change >= 0 ? '#10b981' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
