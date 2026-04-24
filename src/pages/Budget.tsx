import { useMemo, useState } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'
import { convertWithEuroBaseRates, formatCurrency, safeNumber } from '../lib/utils'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function BudgetPage() {
  const {
    addCategory,
    baseCurrency,
    budgets,
    categories,
    fxRates,
    recurringExpenseForecast,
    recurringExpenseInsights,
    transactions,
    updateBudget,
    updateCategory,
  } = useFinanceData()

  const [categoryDraft, setCategoryDraft] = useState({
    name: '',
    type: 'expense' as const,
    subcategories: '',
    color: '#0ea5e9',
  })

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0)
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0)
  const remainingBudget = totalBudget - totalSpent
  const futureMonthExpenses = transactions
    .filter((item) => item.date >= todayKey() && item.type === 'expense' && (item.status ?? 'paid') === 'planned')
    .reduce((sum, item) => sum + convertWithEuroBaseRates(item.amount, item.currency, baseCurrency, fxRates), 0)
  const projectedMonthClose = remainingBudget - futureMonthExpenses - recurringExpenseForecast.next30DaysBase
  const safeToSpend = Math.max(remainingBudget - recurringExpenseForecast.monthlyRequiredBase, 0)

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  )

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
          <span className="muted-text">movimenti già registrati</span>
        </article>
        <article className="panel metric-card metric-blue">
          <p className="muted-label">Residuo spendibile</p>
          <strong>{formatCurrency(safeToSpend, baseCurrency)}</strong>
          <span className="muted-text">margine prudente al netto del ricorrente</span>
        </article>
        <article className="panel metric-card metric-violet">
          <p className="muted-label">Fine mese prevista</p>
          <strong>{formatCurrency(projectedMonthClose, baseCurrency)}</strong>
          <span className={projectedMonthClose >= 0 ? 'positive' : 'negative'}>
            include pianificato e ricorrenze
          </span>
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
              <p className="muted-label">Categorie</p>
              <h2>Personalizza categorie</h2>
            </div>
          </div>
          <form
            className="stack gap-sm"
            onSubmit={(event) => {
              event.preventDefault()
              addCategory({
                name: categoryDraft.name,
                type: categoryDraft.type,
                color: categoryDraft.color,
                subcategories: categoryDraft.subcategories
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              })
              setCategoryDraft((current) => ({ ...current, name: '', subcategories: '' }))
            }}
          >
            <input
              className="input"
              placeholder="Nuova categoria"
              value={categoryDraft.name}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <div className="grid split-grid">
              <select
                className="input"
                value={categoryDraft.type}
                onChange={(event) =>
                  setCategoryDraft((current) => ({ ...current, type: event.target.value as typeof current.type }))
                }
              >
                <option value="expense">Spesa</option>
                <option value="income">Entrata</option>
              </select>
              <input
                className="input"
                type="color"
                value={categoryDraft.color}
                onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}
              />
            </div>
            <input
              className="input"
              placeholder="Sottocategorie separate da virgola"
              value={categoryDraft.subcategories}
              onChange={(event) => setCategoryDraft((current) => ({ ...current, subcategories: event.target.value }))}
            />
            <button className="primary-button" type="submit">
              Aggiungi categoria
            </button>
          </form>
        </article>
      </section>

      <section className="grid content-grid">
        <article className="panel span-two">
          <div className="panel-heading">
            <div>
              <p className="muted-label">Sottocategorie</p>
              <h2>Archivio categorie di spesa</h2>
            </div>
          </div>
          <div className="stack gap-sm">
            {expenseCategories.map((category) => (
              <div key={category.id} className="soft-card stack gap-sm">
                <div className="row-between">
                  <strong>{category.name}</strong>
                  <span className="muted-text">{category.subcategories.length} sottocategorie</span>
                </div>
                <input
                  className="input"
                  defaultValue={category.subcategories.join(', ')}
                  onBlur={(event) =>
                    updateCategory(category.id, {
                      subcategories: event.target.value
                        .split(',')
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            ))}
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
              <span>Ricorrente medio</span>
              <strong>{formatCurrency(recurringExpenseForecast.monthlyRequiredBase, baseCurrency)}</strong>
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
                  <span className="muted-text">
                    {expense.category} · {(expense.kind ?? 'mandatory') === 'mandatory' ? 'obbligatoria' : 'opzionale'}
                  </span>
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
