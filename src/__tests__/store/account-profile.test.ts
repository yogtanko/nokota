import { useAccountProfile } from "@/store/account-profile"

describe("Account Profile Store", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("has default balance of 0", () => {
    const { balance } = useAccountProfile.getState()
    expect(balance).toBe(0)
  })

  it("has default riskPercent of 0.02", () => {
    const { riskPercent } = useAccountProfile.getState()
    expect(riskPercent).toBe(0.02)
  })

  it("setBalance updates the balance", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    expect(useAccountProfile.getState().balance).toBe(50_000_000)
  })

  it("setRiskPercent updates the risk percent", () => {
    useAccountProfile.getState().setRiskPercent(0.05)
    expect(useAccountProfile.getState().riskPercent).toBe(0.05)
  })

  it("setBalance accepts zero", () => {
    useAccountProfile.getState().setBalance(0)
    expect(useAccountProfile.getState().balance).toBe(0)
  })

  it("setRiskPercent accepts zero", () => {
    useAccountProfile.getState().setRiskPercent(0)
    expect(useAccountProfile.getState().riskPercent).toBe(0)
  })

  it("persists state to localStorage", async () => {
    useAccountProfile.getState().setBalance(100_000_000)
    useAccountProfile.getState().setRiskPercent(0.1)

    await new Promise(process.nextTick)

    const stored = JSON.parse(localStorage.getItem("account-profile")!)
    expect(stored.state.balance).toBe(100_000_000)
    expect(stored.state.riskPercent).toBe(0.1)
  })

  it("rehydrates state from localStorage", async () => {
    useAccountProfile.setState({ balance: 0, riskPercent: 0.02 })

    await new Promise(process.nextTick)

    localStorage.setItem(
      "account-profile",
      JSON.stringify({
        state: { balance: 25_000_000, riskPercent: 0.03 },
        version: 0,
      })
    )

    await useAccountProfile.persist.rehydrate()

    const state = useAccountProfile.getState()
    expect(state.balance).toBe(25_000_000)
    expect(state.riskPercent).toBe(0.03)
  })
})
