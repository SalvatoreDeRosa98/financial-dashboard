import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency } from '../lib/utils'

export function ReportsPage() {
  const {
    annualDividendIncomeBase,
    baseCurrency,
    budgets,
    cashflowSeries,
    dividendCoveragePct,
    dividendMonthlyAverageBase,
    exposure,
    exportFiscalCsv,
    taxCreditExpiring,
    taxCreditRemaining,
  } = useFinanceData()

  return (
    <div className="stack gap-lg">
      <section className="grid content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Spese per categoria</p>
              <h2>Breakdown mensile</h2>
            </div>
          </div>
          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={budgets} dataKey="spent" innerRadius={60} outerRadius={92}>
                  {budgets.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Report annuale</p>
              <h2>Entrate, uscite e patrimonio</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowSeries}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), baseCurrency)} />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#f97316" radius={[8, 8, 0, 0]} />
                <Bar dataKey="netWorth" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Dividendi & rendita</p>
            <h2>Financial independence tracker</h2>
          </div>
        </div>
        <div className="grid tri-grid">
          <div className="soft-card">
            <span>Dividendi annui</span>
            <strong>{formatCurrency(annualDividendIncomeBase, baseCurrency)}</strong>
          </div>
          <div className="soft-card">
            <span>Media mensile</span>
            <strong>{formatCurrency(dividendMonthlyAverageBase, baseCurrency)}</strong>
          </div>
          <div className="soft-card">
            <span>Copertura spese fisse</span>
            <strong>{dividendCoveragePct.toFixed(1)}%</strong>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(dividendCoveragePct, 100)}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid content-grid">
        <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Zaino fiscale</p>
            <h2>Minusvalenze residue</h2>
          </div>
        </div>
        <div className="soft-card">
          <strong>{formatCurrency(taxCreditRemaining, baseCurrency)}</strong>
          <p className="muted-text">Credito fiscale residuo stimato disponibile per compensazione.</p>
        </div>
        <div className="stack gap-sm">
          {taxCreditExpiring.length ? taxCreditExpiring.map((bucket) => (
            <div key={bucket.id} className="soft-card">
              <strong>{formatCurrency(bucket.amount - bucket.used, baseCurrency)}</strong>
              <p className="muted-text">Scade il {bucket.expiresAt} - {bucket.note}</p>
            </div>
          )) : <div className="soft-card"><p>Nessuna minus in scadenza entro 12 mesi.</p></div>}
        </div>
        </article>

        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Esportazione fiscalita</p>
              <h2>CSV per commercialista</h2>
            </div>
          </div>
          <textarea className="input textarea report-export" readOnly value={exportFiscalCsv()} />
          <p className="muted-text">
            Stima semplificata per supporto operativo. Da verificare per regime dichiarativo, categorie compensabili e quadri RW/RT/RM.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Esposizione valutaria</p>
            <h2>Distribuzione portfolio</h2>
          </div>
        </div>
        <div className="grid mini-grid">
          {exposure.map((item) => (
            <div key={item.currency} className="soft-card">
              <span>{item.currency}</span>
              <strong>{formatCurrency(item.valueBase, baseCurrency)}</strong>
              <small>{item.share.toFixed(1)}% del portfolio</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
