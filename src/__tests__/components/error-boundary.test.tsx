import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "@/components/error-boundary"

const GoodChild = () => <div>Healthy content</div>

const BadChild = () => {
  throw new Error("Render crash")
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText("Healthy content")).toBeInTheDocument()
  })

  it("renders fallback UI on unhandled error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })
})
