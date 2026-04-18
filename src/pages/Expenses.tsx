import { CategoryList } from '../components/expenses/CategoryList'
import { MonthlyBarChart } from '../components/expenses/MonthlyBarChart'
import { TransactionList } from '../components/expenses/TransactionList'

export function ExpensesPage() {
  return (
    <section className="grid three-up">
      <MonthlyBarChart />
      <CategoryList />
      <TransactionList />
    </section>
  )
}
