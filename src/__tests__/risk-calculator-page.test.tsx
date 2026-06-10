import { render, screen } from "@testing-library/react"
import RiskCalculatorPage from "@/app/(app)/apps/risk-calculator/page"

describe("Risk Calculator Page", () => {
  beforeEach(() => {
    localStorage.clear()
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
})
