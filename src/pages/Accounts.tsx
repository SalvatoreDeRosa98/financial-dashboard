import { AccountEditorCard } from '../components/money/MoneyPanels'
import { useFinanceData } from '../hooks/useFinanceData'
import { convertWithEuroBaseRates, formatCurrency } from '../lib/utils'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function AccountsPage() {
  const {
    accounts,
    addAccount,
    baseCurrency,
    fxRates,
    recurringExpenseForecast,
    totalLiquidBase,
    transactions,
    updateAccount,
  } = useFinanceData()

  const futureTransactions = transactions.filter((transaction) => transaction.date > todayKey())
  const futureDeltaBase = futureTransactions.reduce((sum, transaction) => {
    const amountBase = convertWithEuroBaseRates(transaction.amount, transaction.currency, baseCurrency, fxRates)
    if (transaction.type === 'income') return sum + amountBase
    if (transaction.type === 'expense') return sum - amountBase
    return sum
  }, 0)

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Saldo attuale</p>
          <strong>{formatCurrency(totalLiquidBase, baseCurrency)}</strong>
          <span className="muted-text">liquidita reale disponibile adesso</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Movimenti pianificati</p>
          <strong>{formatCurrency(futureDeltaBase, baseCurrency)}</strong>
          <span className={futureDeltaBase >= 0 ? 'positive' : 'negative'}>
            impatto futuro già registrato
          </span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Saldo previsto</p>
          <strong>{formatCurrency(totalLiquidBase + futureDeltaBase, baseCurrency)}</strong>
          <span className="muted-text">saldo attuale piu movimenti futuri</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Copertura ricorrenze 30g</p>
          <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
          <span className="muted-text">uscite ricorrenti in arrivo</span>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Conti</p>
            <h2>Gestione conti, tipo e saldi</h2>
          </div>
          <button className="icon-button" onClick={addAccount} type="button" aria-label="Aggiungi conto">
            +
          </button>
        </div>
        <div className="grid metrics-grid">
          {accounts.map((account) => (
            <AccountEditorCard key={account.id} account={account} onSave={updateAccount} />
          ))}
        </div>
      </section>
    </div>
  )
}
