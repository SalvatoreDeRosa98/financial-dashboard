import { AccountList } from '../components/accounts/AccountList'
import { BalanceTrendChart } from '../components/accounts/BalanceTrendChart'
import { DonutChart } from '../components/accounts/DonutChart'

export function AccountsPage() {
  return (
    <section className="grid three-up">
      <BalanceTrendChart />
      <DonutChart />
      <AccountList />
    </section>
  )
}
