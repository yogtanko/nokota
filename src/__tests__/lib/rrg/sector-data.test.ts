import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("yahoo-finance2", () => {
  class MockYahooFinance {
    chart = vi.fn()
  }
  return { default: MockYahooFinance }
})

import { fetchSectorOHLCV } from "@/lib/rrg/sector-data"

import YahooFinance from "yahoo-finance2"

function makeChartQuote(close: number | null, dateOffset = 0) {
  return {
    close,
    date: new Date(Date.now() - dateOffset * 86400000),
    high: null,
    low: null,
    open: null,
    volume: null,
  }
}

describe("fetchSectorOHLCV", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches all 12 tickers and returns close prices", async () => {
    const closes = Array.from({ length: 64 }, (_, i) => 5000 + i)
    const quotes = closes.map((c, i) => makeChartQuote(c, 64 - i))

    const yf = new YahooFinance()
    ;(yf.chart as any).mockResolvedValue({ quotes })

    const result = await fetchSectorOHLCV("daily", yf as any)

    expect(yf.chart).toHaveBeenCalledTimes(12)
    expect(result.size).toBe(12)
    expect(result.get("^JKSE")).toHaveLength(64)
  })

  it("calls yahooFinance.chart with correct params for daily", async () => {
    const quotes = Array.from({ length: 64 }, (_, i) => makeChartQuote(5000 + i, 64 - i))
    const yf = new YahooFinance()
    ;(yf.chart as any).mockResolvedValue({ quotes })

    await fetchSectorOHLCV("daily", yf as any)

    expect(yf.chart).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ interval: "1d" }),
    )
  })

  it("calls yahooFinance.chart with correct params for weekly", async () => {
    const quotes = Array.from({ length: 64 }, (_, i) => makeChartQuote(5000 + i, 64 - i))
    const yf = new YahooFinance()
    ;(yf.chart as any).mockResolvedValue({ quotes })

    await fetchSectorOHLCV("weekly", yf as any)

    expect(yf.chart).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ interval: "1wk" }),
    )
  })

  it("filters out null closes from quotes", async () => {
    const quotes = [
      makeChartQuote(null, 2),
      makeChartQuote(5100, 1),
      makeChartQuote(5200, 0),
    ]
    const yf = new YahooFinance()
    ;(yf.chart as any).mockResolvedValue({ quotes })

    const result = await fetchSectorOHLCV("daily", yf as any)
    const ihsg = result.get("^JKSE")
    expect(ihsg).toEqual([5100, 5200])
  })

  it("gracefully handles failed ticker fetch without throwing", async () => {
    const yf = new YahooFinance()
    ;(yf.chart as any)
      .mockResolvedValueOnce({ quotes: [makeChartQuote(5000, 0)] })
      .mockRejectedValueOnce(new Error("Network error"))

    await expect(fetchSectorOHLCV("daily", yf as any)).resolves.toBeDefined()
  })
})
