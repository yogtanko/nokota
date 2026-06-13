import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RRGComingSoon } from "@/components/rrg-coming-soon"

describe("RRGComingSoon", () => {
  it("renders work in progress heading", () => {
    render(<RRGComingSoon />)
    expect(screen.getByText("Work in Progress")).toBeInTheDocument()
  })

  it("mentions data accumulation", () => {
    render(<RRGComingSoon />)
    expect(screen.getByText(/accumulating/i)).toBeInTheDocument()
  })

  it("mentions 30 trading days", () => {
    render(<RRGComingSoon />)
    expect(screen.getByText(/30/)).toBeInTheDocument()
  })

  it("renders within a container with rounded classes", () => {
    const { container } = render(<RRGComingSoon />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain("rounded-4xl")
  })
})
