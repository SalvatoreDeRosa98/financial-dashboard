import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { convertWithEuroBaseRates, formatCompactCurrency, formatCurrency, formatDateLong } from '../lib/utils'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function currentMonthKey() {
  return todayKey().slice(0, 7)
}

export function HomePage() {
  const {
    accounts,
    baseCurrency,
    basePortfolioValue,
    cashflowSeries,
    fxRates,
    goals,
    liabilities,
    marketIndices,
    recurringExpenseForecast,
    totalLiquidBase,
    transactions,
  } = useFinanceData()

  const currentMonth = currentMonthKey()
  const monthTransactions = transactions.filter(
    (item) => item.date.startsWith(currentMonth) && item.type !== 'transfer',
  )
  const incomeMonth = monthTransactions
    .filter((item) => item.type === 'income' && (item.status ?? 'paid') !== 'planned')
    .reduce((sum, item) => sum + convertWithEuroBaseRates(item.amount, item.currency, baseCurrency, fxRates), 0)
  const expenseMonth = monthTransactions
    .filter((item) => item.type === 'expense' && (item.status ?? 'paid') !== 'planned')
    .reduce((sum, item) => sum + convertWithEuroBaseRates(item.amount, item.currency, baseCurrency, fxRates), 0)
  const plannedMonthDelta = monthTransactions
    .filter((item) => (item.status ?? 'paid') === 'planned')
    .reduce((sum, item) => {
      const amountBase = convertWithEuroBaseRates(item.amount, item.currency, baseCurrency, fxRates)
      if (item.type === 'income') return sum + amountBase
      if (item.type === 'expense') return sum - amountBase
      return sum
    }, 0)
  const endOfMonthProjectedBalance = totalLiquidBase + plannedMonthDelta - recurringExpenseForecast.next30DaysBase
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0)
  const netWorth = totalLiquidBase + basePortfolioValue - totalLiabilities
  const savingsRate = incomeMonth > 0 ? ((incomeMonth - expenseMonth) / incomeMonth) * 100 : 0
  const essentialMonthlyBase = Math.max(recurringExpenseForecast.monthlyRequiredBase, 1)
  const runwayMonths = totalLiquidBase > 0 ? totalLiquidBase / essentialMonthlyBase : 0
  const safeToSpend = Math.max(incomeMonth - expenseMonth - recurringExpenseForecast.monthlyRequiredBase, 0)

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Liquidità reale</p>
          <strong>{formatCurrency(totalLiquidBase, baseCurrency)}</strong>
          <span className="muted-text">saldo attuale disponibile</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Entrate mese</p>
          <strong>{formatCurrency(incomeMonth, baseCurrency)}</strong>
          <span className="muted-text">incassi già registrati</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Uscite mese</p>
          <strong>{formatCurrency(expenseMonth, baseCurrency)}</strong>
          <span className="muted-text">spese già registrate</span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Ricorrenti 30 giorni</p>
          <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
          <span className="muted-text">fabbisogno già previsto</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Saldo previsto fine mese</p>
          <strong>{formatCurrency(endOfMonthProjectedBalance, baseCurrency)}</strong>
          <span className={endOfMonthProjectedBalance >= 0 ? 'positive' : 'negative'}>
            attuale più pianificato
          </span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Flusso reale</p>
              <h2>Andamento mensile di entrate e uscite</h2>
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
                <p>Il tracciamento inizierà dal primo movimento che registri.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Indicatori personali</p>
              <h2>Tenuta finanziaria</h2>
            </div>
          </div>
          <div className="summary-text-list">
            <div className="summary-text-row">
              <span>Net worth</span>
              <strong>{formatCurrency(netWorth, baseCurrency)}</strong>
            </div>
            <div className="summary-text-row">
              <span>Safe to spend</span>
              <strong>{formatCurrency(safeToSpend, baseCurrency)}</strong>
            </div>
            <div className="summary-text-row">
              <span>Runway</span>
              <strong>{runwayMonths.toFixed(1)} mesi</strong>
            </div>
            <div className="summary-text-row">
              <span>Risparmio del mese</span>
              <strong>{savingsRate.toFixed(1)}%</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Conti</p>
              <h2>Situazione operativa</h2>
            </div>
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

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Obiettivi</p>
              <h2>Avanzamento risparmi</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {goals.length ? (
              goals.map((goal) => {
                const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0
                return (
                  <div key={goal.id} className="soft-card stack gap-sm">
                    <div className="row-between">
                      <strong>{goal.title}</strong>
                      <span>{formatCurrency(goal.current, baseCurrency)} / {formatCurrency(goal.target, baseCurrency)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: '#14b8a6' }} />
                    </div>
                    <small className="muted-text">scadenza {formatDateLong(goal.dueDate)}</small>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <strong>Nessun obiettivo impostato</strong>
                <p>Li puoi configurare nella sezione portafoglio personale.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Passività</p>
              <h2>Impegni da coprire</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {liabilities.length ? (
              liabilities.map((item) => (
                <div key={item.id} className="list-card">
                  <div className="stack gap-xs">
                    <strong>{item.title}</strong>
                    <span className="muted-text">
                      {item.kind} · scadenza {formatDateLong(item.dueDate)}
                    </span>
                  </div>
                  <strong className="negative">{formatCurrency(item.balance, baseCurrency)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nessuna passività registrata</strong>
                <p>Carte, prestiti o imposte appariranno qui quando le aggiungi.</p>
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
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
