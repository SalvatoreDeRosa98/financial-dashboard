import { AllocationBars } from '../components/overview/AllocationBars'
import { KpiCards } from '../components/overview/KpiCards'
import { NetWorthChart } from '../components/overview/NetWorthChart'

export function OverviewPage() {
  return (
    <div className="stack gap-lg">
      <KpiCards />
      <section className="grid three-up">
        <NetWorthChart />
        <AllocationBars />
      </section>
    </div>
  )
}
