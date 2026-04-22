import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type OpportunityPeriod = 'day' | 'week' | 'month' | 'threeMonths' | 'year'
type OpportunityKind = 'Stock' | 'ETF'

interface DashboardStore {
  selectedIndexSymbol: string | null
  marketPeriod: OpportunityPeriod
  marketKind: OpportunityKind
  selectedMoneyMonth: string | null
  selectedInstrumentId: string | null
  setSelectedIndexSymbol: (symbol: string | null) => void
  setMarketPeriod: (period: OpportunityPeriod) => void
  setMarketKind: (kind: OpportunityKind) => void
  setSelectedMoneyMonth: (month: string | null) => void
  setSelectedInstrumentId: (id: string | null) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      selectedIndexSymbol: null,
      marketPeriod: 'month',
      marketKind: 'Stock',
      selectedMoneyMonth: null,
      selectedInstrumentId: null,
      setSelectedIndexSymbol: (selectedIndexSymbol) => set({ selectedIndexSymbol }),
      setMarketPeriod: (marketPeriod) => set({ marketPeriod }),
      setMarketKind: (marketKind) => set({ marketKind }),
      setSelectedMoneyMonth: (selectedMoneyMonth) => set({ selectedMoneyMonth }),
      setSelectedInstrumentId: (selectedInstrumentId) => set({ selectedInstrumentId }),
    }),
    {
      name: 'fintracker-dashboard-ui',
      partialize: (state) => ({
        selectedIndexSymbol: state.selectedIndexSymbol,
        marketPeriod: state.marketPeriod,
        marketKind: state.marketKind,
        selectedMoneyMonth: state.selectedMoneyMonth,
      }),
    },
  ),
)
