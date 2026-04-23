import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCompactCurrency, formatCurrency, formatDateLabel, formatSignedPercent } from '../lib/utils'

export function HomePage() {
  const {
    accounts,
    baseCurrency,
    basePortfolioValue,
    cashflowSeries,
    marketIndices,
    summaryMetrics,
    totalLiquidBase,
    transactions,
  } = useFinanceData()

  const wealthMix = [
    { label: 'Liquidita', value: totalLiquidBase },
    { label: 'Investito', value: basePortfolioValue },
  ]
  const metricDescriptions: Record<string, string> = {
    'Patrimonio totale': 'Valore aggregato di liquidita e portafoglio convertito nella valuta base.',
    'Liquidita disponibile': 'Disponibilita immediata su conti correnti, deposito e broker.',
    'Portafoglio investito': 'Controvalore aggiornato delle posizioni finanziarie aperte.',
    'Crescita mensile': 'Saldo netto del mese tra entrate registrate e uscite contabilizzate.',
  }
  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className={`panel metric-card metric-${metric.accent}`}>
            <p className="muted-label">{metric.label}</p>
            <strong>{formatCurrency(metric.value, baseCurrency)}</strong>
            <span className={metric.change >= 0 ? 'positive' : 'negative'}>
              {formatSignedPercent(metric.change)}
            </span>
            <span className="metric-caption">{metricDescriptions[metric.label]}</span>
          </article>
        ))}
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Patrimonio</p>
              <h2>Andamento del patrimonio negli ultimi 6 mesi</h2>
            </div>
          </div>
          <div className="chart-wrap">
            {cashflowSeries.length ? (
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
            ) : (
              <div className="empty-state">
                <strong>Nessuno storico disponibile</strong>
                <p>Il tracciamento iniziera dal primo movimento che registri.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Allocazione</p>
              <h2>Ripartizione tra liquidita e investimenti</h2>
            </div>
          </div>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wealthMix} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), baseCurrency)}
                />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={86} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stack gap-sm">
            {wealthMix.map((item) => (
              <div key={item.label} className="row-between compact-row">
                <span>{item.label}</span>
                <strong>{formatCurrency(item.value, baseCurrency)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Conti</p>
              <h2>Saldi correnti per istituto</h2>
            </div>
            <span className="small-pill">{accounts.length} conti</span>
          </div>
          <div className="stack gap-sm">
            {accounts.map((account) => (
              <div key={account.id} className="list-card">
                <div className="stack gap-xs">
                  <strong>{account.name}</strong>
                  <span className="muted-text">{account.institution}</span>
                </div>
                <strong>{formatCurrency(account.balance, account.currency)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Attivita recente</p>
              <h2>Ultimi movimenti registrati</h2>
            </div>
            <span className="small-pill">{transactions.slice(0, 6).length} righe</span>
          </div>
          <div className="stack gap-sm">
            {transactions.length ? (
              transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="list-card">
                  <div className="stack gap-xs">
                    <strong>{transaction.title}</strong>
                    <span className="muted-text">
                      {transaction.category} - {formatDateLabel(transaction.date)}
                    </span>
                  </div>
                  <strong className={transaction.type === 'income' ? 'positive' : 'negative'}>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessun movimento registrato</strong>
                <p>Lo storico comparira qui quando inserirai la prima operazione.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Mercati</p>
            <h2>Indici principali</h2>
          </div>
        </div>
        <div className="grid mini-grid">
          {marketIndices.map((item) => (
            <article key={item.symbol} className="soft-card home-market-card">
              <span>{item.region}</span>
              <strong>{item.name}</strong>
              <div className="large-value">{formatCurrency(item.price, item.currency)}</div>
              <small className={item.change >= 0 ? 'positive' : 'negative'}>
                {formatSignedPercent(item.change)}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
