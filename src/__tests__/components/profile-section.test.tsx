import { render, screen, fireEvent } from "@testing-library/react"
import ProfileSection from "@/components/profile-section"
import { useAccountProfile } from "@/store/account-profile"

describe("Profile Section", () => {
  beforeEach(() => {
    localStorage.clear()
    useAccountProfile.setState({ balance: 0, riskPercent: 0.02 })
  })

  it("renders the account profile heading", () => {
    render(<ProfileSection />)
    expect(screen.getByText("Account Profile")).toBeInTheDocument()
  })

  it("renders balance input with current store value", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i) as HTMLInputElement
    expect(balanceInput.value).toBe("50000000")
  })

  it("renders risk percent input with current store value", () => {
    useAccountProfile.getState().setRiskPercent(0.05)
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i) as HTMLInputElement
    expect(riskInput.value).toBe("0.05")
  })

  it("updates store when balance input changes", () => {
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i)
    fireEvent.change(balanceInput, { target: { value: "75000000" } })

    expect(useAccountProfile.getState().balance).toBe(75_000_000)
  })

  it("updates store when risk percent input changes", () => {
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i)
    fireEvent.change(riskInput, { target: { value: "0.03" } })

    expect(useAccountProfile.getState().riskPercent).toBe(0.03)
  })
})
