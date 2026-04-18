import { formatCurrency } from '../../lib/utils'
import { useFinanceData } from '../../hooks/useFinanceData'

export function CategoryList() {
  const { expenseCategories } = useFinanceData()

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="muted-label">Categorie</p>
          <h2>Budget vs spesa</h2>
        </div>
      </div>

      <div className="stack gap-md">
        {expenseCategories.map((category) => {
          const pct = Math.min((category.amount / category.budget) * 100, 100)
          return (
            <div key={category.name} className="allocation-row">
              <div className="row-between">
                <span>{category.name}</span>
                <strong>{formatCurrency(category.amount)}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, background: category.color }}
                />
              </div>
              <span className="muted-text">Budget {formatCurrency(category.budget)}</span>
            </div>
          )
        })}
      </div>
    </article>
  )
}
