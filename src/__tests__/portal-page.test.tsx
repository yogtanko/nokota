import { render, screen } from "@testing-library/react"
import PortalPage from "@/app/(portal)/page"

describe("Portal Landing Page", () => {
  it("renders the app title 'Trade Deck'", () => {
    render(<PortalPage />)
    expect(screen.getByText("Trade Deck")).toBeInTheDocument()
  })

  it("renders a card with a link to the risk calculator app", () => {
    render(<PortalPage />)
    const link = screen.getByRole("link", { name: /risk calculator/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/apps/risk-calculator")
  })

  it("displays a description for the risk calculator card", () => {
    render(<PortalPage />)
    expect(
      screen.getByText(/calculate position sizing and risk/i)
    ).toBeInTheDocument()
  })
})
