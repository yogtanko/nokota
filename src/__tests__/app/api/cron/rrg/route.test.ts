import { describe, it, expect, vi, beforeEach } from "vitest"

const mockStoreClose = vi.fn()
const mockStoreWeeklyClose = vi.fn()
const mockReadAccumulated = vi.fn()
const mockGetAccumulatedCount = vi.fn()

const mockQuote = vi.fn()
const mockChartFn = vi.fn()

vi.mock("@/lib/rrg/accumulator", () => ({
  storeClose: (...args: any[]) => mockStoreClose(...args),
  storeWeeklyClose: (...args: any[]) => mockStoreWeeklyClose(...args),
  readAccumulatedCloses: (...args: any[]) => mockReadAccumulated(...args),
  getAccumulatedCount: (...args: any[]) => mockGetAccumulatedCount(...args),
}))

vi.mock("yahoo-finance2", () => {
  class MockYahooFinance {
    quote = mockQuote
    chart = mockChartFn
  }
  return { default: MockYahooFinance }
})

const mockHget = vi.fn()
const mockSet = vi.fn()

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ get: mockHget, set: mockSet }),
}))

import { POST } from "@/app/api/cron/rrg/route"
import { SECTOR_TICKERS } from "@/lib/rrg/constants"

const OLD_ENV = process.env

describe("POST /api/cron/rrg", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...OLD_ENV, CRON_SECRET: "test-secret" }

    mockStoreClose.mockResolvedValue(undefined)
    mockStoreWeeklyClose.mockResolvedValue(undefined)
    mockReadAccumulated.mockResolvedValue([])
    mockGetAccumulatedCount.mockResolvedValue(0)

    mockQuote.mockResolvedValue([
      { symbol: "^JKSE", regularMarketPrice: 6007.65 },
      { symbol: "IDXENERGY.JK", regularMarketPrice: 2851.89 },
      { symbol: "IDXBASIC.JK", regularMarketPrice: 1572.53 },
      { symbol: "IDXINDUST.JK", regularMarketPrice: 1200.0 },
      { symbol: "IDXNONCYC.JK", regularMarketPrice: 2500.0 },
      { symbol: "IDXCYCLIC.JK", regularMarketPrice: 1800.0 },
      { symbol: "IDXHEALTH.JK", regularMarketPrice: 1900.0 },
      { symbol: "IDXFIN.JK", regularMarketPrice: 3200.0 },
      { symbol: "IDXPROP.JK", regularMarketPrice: 800.0 },
      { symbol: "IDXTECH.JK", regularMarketPrice: 1500.0 },
      { symbol: "IDXINFRA.JK", regularMarketPrice: 2100.0 },
      { symbol: "IDXTRANS.JK", regularMarketPrice: 1400.0 },
    ])
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  function makeRequest(headers: Record<string, string> = {}): Request {
    return new Request("http://localhost:3000/api/cron/rrg", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
    })
  }

  it("returns 401 when CRON_SECRET is missing", async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it("returns 401 when CRON_SECRET is wrong", async () => {
    const res = await POST(makeRequest({ "x-cron-secret": "wrong" }))
    expect(res.status).toBe(401)
  })

  it("stores closes for all tickers with correct secret", async () => {
    const res = await POST(makeRequest({ "x-cron-secret": "test-secret" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.stored).toBe(SECTOR_TICKERS.length)
  })

  it("calls storeClose for each ticker with correct date and price", async () => {
    await POST(makeRequest({ "x-cron-secret": "test-secret" }))

    expect(mockStoreClose).toHaveBeenCalledWith(
      "^JKSE",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      6007.65,
    )
    expect(mockStoreClose).toHaveBeenCalledWith(
      "IDXENERGY.JK",
      expect.any(String),
      2851.89,
    )
  })

  it("quotes all tickers at once via yahooFinance.quote", async () => {
    expect(mockQuote).not.toHaveBeenCalled()
  })

  it("handles partial quote failure with null entries", async () => {
    mockQuote.mockResolvedValueOnce([
      { symbol: "^JKSE", regularMarketPrice: 6007.65 },
      { symbol: "IDXENERGY.JK", regularMarketPrice: null },
    ])

    const res = await POST(makeRequest({ "x-cron-secret": "test-secret" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it("returns 503 when quote fails entirely", async () => {
    mockQuote.mockRejectedValueOnce(new Error("Yahoo unavailable"))

    const res = await POST(makeRequest({ "x-cron-secret": "test-secret" }))
    expect(res.status).toBe(503)
  })

  it("uses today's date in YYYY-MM-DD format for storage", async () => {
    await POST(makeRequest({ "x-cron-secret": "test-secret" }))

    const today = new Date().toISOString().slice(0, 10)
    expect(mockStoreClose).toHaveBeenCalledWith(
      "^JKSE",
      today,
      expect.any(Number),
    )
  })
})
