import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AccountProfileState {
  balance: number
  riskPercent: number
  hydrated: boolean
  setBalance: (value: number) => void
  setRiskPercent: (value: number) => void
  setHydrated: (value: boolean) => void
}

export const useAccountProfile = create<AccountProfileState>()(
  persist(
    (set) => ({
      balance: 0,
      riskPercent: 0.02,
      hydrated: false,
      setBalance: (balance) => set({ balance }),
      setRiskPercent: (riskPercent) => set({ riskPercent }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "account-profile",
      partialize: (state) => ({
        balance: state.balance,
        riskPercent: state.riskPercent,
      }),
      onRehydrateStorage: () => () => {
        useAccountProfile.getState().setHydrated(true)
      },
    }
  )
)
