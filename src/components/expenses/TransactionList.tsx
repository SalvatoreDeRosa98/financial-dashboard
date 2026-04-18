import { useState, type FormEvent } from 'react'
import { useFinanceData } from '../../hooks/useFinanceData'
import { formatCurrency } from '../../lib/utils'

export function TransactionList() {
  const { recentTransactions, addTransaction, resetData } = useFinanceData()
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('Varie')
  const [amount, setAmount] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = Number(amount)
    if (!merchant || Number.isNaN(parsed) || parsed === 0) return
    addTransaction({ merchant, category, amount: parsed })
    setMerchant('')
    setAmount('')
  }

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Ultime transazioni</p>
          <h2>Movimenti recenti</h2>
        </div>
      </div>

      <div className="stack gap-sm">
        <form className="transaction-form" onSubmit={handleSubmit}>
          <input
            onChange={(event) => setMerchant(event.target.value)}
            placeholder="Descrizione"
            value={merchant}
          />
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="Casa">Casa</option>
            <option value="Cibo">Cibo</option>
            <option value="Trasporti">Trasporti</option>
            <option value="Tempo libero">Tempo libero</option>
            <option value="Abbonamenti">Abbonamenti</option>
            <option value="Varie">Varie</option>
            <option value="Entrata">Entrata</option>
          </select>
          <input
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Importo, es. -45 oppure 1200"
            value={amount}
          />
          <div className="transaction-actions">
            <button className="primary-button" type="submit">
              Salva
            </button>
            <button className="ghost-button" onClick={resetData} type="button">
              Reset demo
            </button>
          </div>
        </form>

        {recentTransactions.map((item) => (
          <div key={`${item.merchant}-${item.date}`} className="list-card">
            <div className="account-icon tone-blue">{item.icon}</div>
            <div className="stack">
              <strong>{item.merchant}</strong>
              <span className="muted-text">{`${item.category} - ${item.date}`}</span>
            </div>
            <strong className={item.amount >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(item.amount)}
            </strong>
          </div>
        ))}
      </div>
    </article>
  )
}
