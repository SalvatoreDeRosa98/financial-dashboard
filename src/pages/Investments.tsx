import { AssetList } from '../components/investments/AssetList'
import { PortfolioChart } from '../components/investments/PortfolioChart'
import { ReturnBadges } from '../components/investments/ReturnBadges'

export function InvestmentsPage() {
  return (
    <div className="stack gap-lg">
      <ReturnBadges />
      <section className="grid three-up">
        <PortfolioChart />
        <AssetList />
      </section>
    </div>
  )
}
