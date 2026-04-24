import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency } from '../lib/utils'
import { AccountEditorCard } from '../components/money/MoneyPanels'

export function AccountsPage() {
  const { accounts, addAccount, baseCurrency, totalLiquidBase, updateAccount } = useFinanceData()

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Liquidita complessiva</p>
          <strong>{formatCurrency(totalLiquidBase, baseCurrency)}</strong>
          <span className="muted-text">saldo aggregato dei conti operativi</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Conti collegati</p>
          <strong>{accounts.length}</strong>
          <span className="muted-text">correnti, contanti, broker e risparmio</span>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Conti</p>
            <h2>Gestione conti e saldi</h2>
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
