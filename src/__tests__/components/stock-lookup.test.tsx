import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import StockLookup from "@/components/stock-lookup"

function createMockFetch() {
  return vi.fn()
}

describe("StockLookup", () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = createMockFetch()
    vi.stubGlobal("fetch", mockFetch)
  })

  it("renders symbol input and entry price input", () => {
    render(<StockLookup />)

    expect(screen.getByLabelText(/stock symbol/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/entry price/i)).toBeInTheDocument()
  })

  it("calls API on blur with the typed symbol", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ price: 5050, symbol: "BBRI" }),
    })

    render(<StockLookup />)

    const symbolInput = screen.getByLabelText(/stock symbol/i)
    fireEvent.change(symbolInput, { target: { value: "BBRI" } })
    fireEvent.blur(symbolInput)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/stock/BBRI")
    })
  })

  it("auto-fills entry price on successful lookup", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ price: 5050, symbol: "BBRI" }),
    })

    render(<StockLookup />)

    const symbolInput = screen.getByLabelText(/stock symbol/i)
    fireEvent.change(symbolInput, { target: { value: "BBRI" } })
    fireEvent.blur(symbolInput)

    await waitFor(() => {
      const priceInput = screen.getByLabelText(/entry price/i) as HTMLInputElement
      expect(priceInput.value).toBe("5.050")
    })
  })

  it("shows inline error text on lookup failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Symbol "ZZZZ" not found on IDX' }),
    })

    render(<StockLookup />)

    const symbolInput = screen.getByLabelText(/stock symbol/i)
    fireEvent.change(symbolInput, { target: { value: "ZZZZ" } })
    fireEvent.blur(symbolInput)

    await waitFor(() => {
      expect(
        screen.getByText(/symbol.*not found/i),
      ).toBeInTheDocument()
    })
  })

  it("entry price is manually editable after auto-fill", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ price: 5050, symbol: "BBRI" }),
    })

    render(<StockLookup />)

    const symbolInput = screen.getByLabelText(/stock symbol/i)
    fireEvent.change(symbolInput, { target: { value: "BBRI" } })
    fireEvent.blur(symbolInput)

    await waitFor(() => {
      const priceInput = screen.getByLabelText(/entry price/i) as HTMLInputElement
      expect(priceInput.value).toBe("5.050")
    })

    const priceInput = screen.getByLabelText(/entry price/i) as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: "5100" } })
    expect(priceInput.value).toBe("5.100")
  })

  it("manual entry works without any stock lookup", () => {
    render(<StockLookup />)

    const priceInput = screen.getByLabelText(/entry price/i) as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: "5000" } })

    expect(priceInput.value).toBe("5.000")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does not call API when symbol is empty on blur", () => {
    render(<StockLookup />)

    const symbolInput = screen.getByLabelText(/stock symbol/i)
    fireEvent.blur(symbolInput)

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
