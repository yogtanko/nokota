import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AccountProfileState {
  balance: number
  riskPercent: number
  setBalance: (value: number) => void
  setRiskPercent: (value: number) => void
}

export const useAccountProfile = create<AccountProfileState>()(
  persist(
    (set) => ({
      balance: 0,
      riskPercent: 0.02,
      setBalance: (balance) => set({ balance }),
      setRiskPercent: (riskPercent) => set({ riskPercent }),
    }),
    { name: "account-profile" }
  )
)
