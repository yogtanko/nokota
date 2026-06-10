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

  it("shows empty balance input when balance is 0", () => {
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i) as HTMLInputElement
    expect(balanceInput.value).toBe("")
  })

  it("renders balance input with formatted current store value", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i) as HTMLInputElement
    expect(balanceInput.value).toBe("50.000.000")
  })

  it("renders Rp prefix", () => {
    render(<ProfileSection />)
    expect(screen.getByText("Rp")).toBeInTheDocument()
  })

  it("shows formatted balance with thousand separators in input", () => {
    useAccountProfile.getState().setBalance(1_000_000)
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i) as HTMLInputElement
    expect(balanceInput.value).toBe("1.000.000")
  })

  it("renders risk percent input as whole number", () => {
    useAccountProfile.getState().setRiskPercent(0.05)
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i) as HTMLInputElement
    expect(riskInput.value).toBe("5")
  })

  it("renders percent suffix", () => {
    render(<ProfileSection />)
    expect(screen.getByText("%")).toBeInTheDocument()
  })

  it("updates store when balance input changes", () => {
    render(<ProfileSection />)

    const balanceInput = screen.getByLabelText(/account balance/i)
    fireEvent.change(balanceInput, { target: { value: "75.000.000" } })

    expect(useAccountProfile.getState().balance).toBe(75_000_000)
  })

  it("updates store when risk percent input changes", () => {
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i)
    fireEvent.change(riskInput, { target: { value: "3" } })

    expect(useAccountProfile.getState().riskPercent).toBe(0.03)
  })

  it("accepts decimal with comma separator", () => {
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i)
    fireEvent.change(riskInput, { target: { value: "2,5" } })

    expect(useAccountProfile.getState().riskPercent).toBe(0.025)
  })

  it("limits to 2 decimal places after comma", () => {
    render(<ProfileSection />)

    const riskInput = screen.getByLabelText(/risk per trade/i) as HTMLInputElement
    fireEvent.change(riskInput, { target: { value: "2,555" } })

    expect(riskInput.value).toBe("2,55")
    expect(useAccountProfile.getState().riskPercent).toBe(0.0255)
  })
})
