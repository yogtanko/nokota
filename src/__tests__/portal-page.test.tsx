import { render, screen } from "@testing-library/react"
import PortalPage from "@/app/(portal)/page"

describe("Portal Landing Page", () => {
  it("renders the app title 'Nokota'", () => {
    render(<PortalPage />)
    expect(screen.getByText("Nokota")).toBeInTheDocument()
  })

  it("renders the category heading 'Trade Deck'", () => {
    render(<PortalPage />)
    expect(screen.getByText("Trade Deck")).toBeInTheDocument()
  })

  it("renders a card with a link to the risk calculator app under trade deck", () => {
    render(<PortalPage />)
    const link = screen.getByRole("link", { name: /risk calculator/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/apps/trade-deck/risk-calculator")
  })

  it("displays a description for the risk calculator card", () => {
    render(<PortalPage />)
    expect(
      screen.getByText(/calculate position sizing and risk/i)
    ).toBeInTheDocument()
  })
})
