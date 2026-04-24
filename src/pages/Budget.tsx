import { useFinanceData } from '../hooks/useFinanceData'
import { formatCurrency, safeNumber } from '../lib/utils'

export function BudgetPage() {
  const {
    baseCurrency,
    budgets,
    recurringExpenseForecast,
    recurringExpenseInsights,
    updateBudget,
  } = useFinanceData()

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0)
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const remainingBudget = totalBudget - totalSpent

  return (
    <div className="stack gap-lg">
      <section className="grid metrics-grid">
        <article className="panel metric-card metric-teal">
          <p className="muted-label">Budget totale</p>
          <strong>{formatCurrency(totalBudget, baseCurrency)}</strong>
          <span className="muted-text">obiettivo mensile per categoria</span>
        </article>
        <article className="panel metric-card metric-amber">
          <p className="muted-label">Speso</p>
          <strong>{formatCurrency(totalSpent, baseCurrency)}</strong>
          <span className="muted-text">movimenti gia registrati</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Residuo</p>
          <strong>{formatCurrency(remainingBudget, baseCurrency)}</strong>
          <span className={remainingBudget >= 0 ? 'positive' : 'negative'}>
            {remainingBudget >= 0 ? 'Margine disponibile' : 'Budget oltre soglia'}
          </span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Ricorrente medio</p>
          <strong>{formatCurrency(recurringExpenseForecast.monthlyRequiredBase, baseCurrency)}</strong>
          <span className="muted-text">copertura minima futura</span>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Budget</p>
              <h2>Categorie e soglie mensili</h2>
            </div>
          </div>
          <div className="stack gap-md">
            {budgets.map((budget) => {
              const progress = budget.budget > 0 ? Math.min((budget.spent / budget.budget) * 100, 100) : 0
              return (
                <div key={budget.id} className="stack gap-sm">
                  <div className="row-between">
                    <strong>{budget.name}</strong>
                    <span>
                      {formatCurrency(budget.spent, baseCurrency)} / {formatCurrency(budget.budget, baseCurrency)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: budget.color }} />
                  </div>
                  <input
                    className="input"
                    defaultValue={budget.budget}
                    type="number"
                    onBlur={(event) => updateBudget(budget.id, safeNumber(event.target.value, budget.budget))}
                  />
                </div>
              )
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Ricorrenze</p>
              <h2>Base di copertura</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            <div className="soft-card">
              <span>Prossimi 30 giorni</span>
              <strong>{formatCurrency(recurringExpenseForecast.next30DaysBase, baseCurrency)}</strong>
            </div>
            <div className="soft-card">
              <span>Prossimi 90 giorni</span>
              <strong>{formatCurrency(recurringExpenseForecast.next90DaysBase, baseCurrency)}</strong>
            </div>
            <div className="soft-card">
              <span>Prossimi 12 mesi</span>
              <strong>{formatCurrency(recurringExpenseForecast.next365DaysBase, baseCurrency)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="muted-label">Voci ricorrenti</p>
            <h2>Impatto sul budget futuro</h2>
          </div>
        </div>
        <div className="stack gap-sm">
          {recurringExpenseInsights.length ? (
            recurringExpenseInsights.map((expense) => (
              <div key={expense.id} className="list-card">
                <div className="stack gap-xs">
                  <strong>{expense.title}</strong>
                  <span className="muted-text">{expense.category}</span>
                </div>
                <div className="stack align-end gap-xs">
                  <strong>{formatCurrency(expense.monthlyEquivalentBase, baseCurrency)}</strong>
                  <span className="muted-text">equivalente medio mensile</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>Nessuna ricorrenza attiva</strong>
              <p>Quando aggiungi spese ricorrenti, qui vedrai il loro peso sul budget.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
