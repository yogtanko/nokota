import { render, screen, fireEvent } from "@testing-library/react"
import RiskCalculatorPage from "@/app/(app)/apps/trade-deck/risk-calculator/page"
import { useAccountProfile } from "@/store/account-profile"

describe("Risk Calculator Page", () => {
  beforeEach(() => {
    localStorage.clear()
    useAccountProfile.setState({ balance: 0, riskPercent: 0.02 })
  })

  it("renders the page title 'Risk Calculator'", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByText("Risk Calculator")).toBeInTheDocument()
  })

  it("renders the Account Profile section", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByText("Account Profile")).toBeInTheDocument()
  })

  it("renders the balance input", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByLabelText(/account balance/i)).toBeInTheDocument()
  })

  it("renders the risk per trade input", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByLabelText(/risk per trade/i)).toBeInTheDocument()
  })

  it("renders Trade Setup section", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByText("Trade Setup")).toBeInTheDocument()
  })

  it("renders stock symbol and entry price inputs", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByLabelText(/stock symbol/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/entry price/i)).toBeInTheDocument()
  })

  it("renders stop loss and take profit inputs", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByLabelText(/stop loss/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/take profit/i)).toBeInTheDocument()
  })

  it("shows Results panel with placeholder dashes when no trade inputs", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByText("Results")).toBeInTheDocument()
    expect(screen.getByText("Position Size")).toBeInTheDocument()
    const dashes = screen.getAllByText("\u2014")
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it("shows Results card when all trade inputs are filled", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    expect(screen.getByText("Results")).toBeInTheDocument()
    expect(screen.getByText("Position Size")).toBeInTheDocument()
    expect(screen.getByText("Risk:Reward")).toBeInTheDocument()
    expect(screen.getByText("Max Loss")).toBeInTheDocument()
    expect(screen.getByText("Potential Profit")).toBeInTheDocument()
  })

  it("shows correct position size for valid inputs", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    // 50M * 2% = 1M risk / (5000 - 4500 = 500) = 2000 shares = 20 lots
    expect(screen.getByText(/2\.000/)).toBeInTheDocument()
    expect(screen.getByText(/20 lot/)).toBeInTheDocument()
  })

  it("shows '0' shares and lots when entry price equals stop loss", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "5000" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    expect(screen.getByText(/0 lots/)).toBeInTheDocument()
    expect(screen.getByText(/0 shares/)).toBeInTheDocument()
  })

  it("shows '0' shares and lots when entry price is below stop loss", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "4500" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "5000" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    expect(screen.getByText(/0 lots/)).toBeInTheDocument()
    expect(screen.getByText(/0 shares/)).toBeInTheDocument()
  })

  it("shows purchase cost formatted in rupiah for valid inputs", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    // 20 lots × 100 × 5000 = Rp 10.000.000
    expect(screen.getByText("Purchase Cost")).toBeInTheDocument()
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument()
  })

  it("shows em-dash for purchase cost when balance is zero", () => {
    useAccountProfile.getState().setBalance(0)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    const purchaseCol = screen.getByText("Purchase Cost").closest("div")!
    expect(purchaseCol.textContent).toContain("\u2014")
  })

  it("shows em-dash for results when balance is zero", () => {
    useAccountProfile.getState().setBalance(0)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    const dashes = screen.getAllByText("\u2014")
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it("shows em-dash for results when risk percent is zero", () => {
    useAccountProfile.getState().setBalance(50_000_000)
    useAccountProfile.getState().setRiskPercent(0)
    render(<RiskCalculatorPage />)

    const entryInput = screen.getByLabelText(/entry price/i)
    fireEvent.change(entryInput, { target: { value: "5000" } })

    const slInput = screen.getByLabelText(/stop loss/i)
    fireEvent.change(slInput, { target: { value: "4500" } })

    const tpInput = screen.getByLabelText(/take profit/i)
    fireEvent.change(tpInput, { target: { value: "5500" } })

    const dashes = screen.getAllByText("\u2014")
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })
})
