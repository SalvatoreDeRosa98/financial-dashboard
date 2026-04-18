import { formatCurrency, formatSignedPercent } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function AccountList() {
  const { accounts, updateAccountBalance } = useFinanceData()

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Lista conti</p>
          <h2>Bilanci correnti</h2>
        </div>
      </div>

      <div className="stack gap-sm">
        {accounts.map((account) => (
          <div key={account.name} className="list-card">
            <div className={`account-icon tone-${account.tone}`}>{account.icon}</div>
            <div className="stack">
              <strong>{account.name}</strong>
              <span className="muted-text">{account.institution}</span>
            </div>
            <div className="stack align-end">
              <strong>{formatCurrency(account.balance)}</strong>
              <span className={`delta ${account.delta >= 0 ? 'positive' : 'negative'}`}>
                {formatSignedPercent(account.delta)}
              </span>
            </div>
            <label className="inline-editor">
              <span>Nuovo saldo</span>
              <input
                defaultValue={account.balance}
                min="0"
                onBlur={(event) =>
                  updateAccountBalance(account.name, Number(event.target.value) || 0)
                }
                type="number"
              />
            </label>
          </div>
        ))}
      </div>
    </article>
  )
}
