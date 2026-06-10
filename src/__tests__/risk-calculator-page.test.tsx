import { render, screen } from "@testing-library/react"
import RiskCalculatorPage from "@/app/(app)/apps/risk-calculator/page"

describe("Risk Calculator Placeholder Page", () => {
  it("renders the page title 'Risk Calculator'", () => {
    render(<RiskCalculatorPage />)
    expect(screen.getByText("Risk Calculator")).toBeInTheDocument()
  })
})
