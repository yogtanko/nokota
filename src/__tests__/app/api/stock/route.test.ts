import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockQuote, mockGet, mockSet } = vi.hoisted(() => ({
  mockQuote: vi.fn(),
  mockGet: vi.fn(),
  mockSet: vi.fn().mockResolvedValue("OK"),
}))

const { mockGetRedis } = vi.hoisted(() => ({
  mockGetRedis: vi.fn().mockReturnValue({ get: mockGet, set: mockSet }),
}))

vi.mock("yahoo-finance2", () => {
  class MockYahooFinance {
    quote = mockQuote
  }
  return { default: MockYahooFinance }
})

vi.mock("@/lib/redis", () => ({
  getRedis: mockGetRedis,
}))

import { GET } from "@/app/api/stock/[symbol]/route"

function makeRequest(symbol: string): NextRequest {
  return new NextRequest(`http://localhost/api/stock/${symbol}`)
}

describe("GET /api/stock/[symbol]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedis.mockReturnValue({ get: mockGet, set: mockSet })
    mockGet.mockResolvedValue(null)
  })

  it("returns price and symbol on successful lookup", async () => {
    mockQuote.mockResolvedValueOnce({ regularMarketPrice: 5050 })

    const response = await GET(makeRequest("BBRI"), {
      params: Promise.resolve({ symbol: "BBRI" }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ price: 5050, symbol: "BBRI" })
    expect(mockQuote).toHaveBeenCalledWith("BBRI.JK")
  })

  it("returns 404 when symbol is not found on IDX", async () => {
    mockQuote.mockResolvedValueOnce(null)

    const response = await GET(makeRequest("INVALID"), {
      params: Promise.resolve({ symbol: "INVALID" }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty("error")
  })

  it("returns 404 when quote has no regularMarketPrice", async () => {
    mockQuote.mockResolvedValueOnce({})

    const response = await GET(makeRequest("BBRI"), {
      params: Promise.resolve({ symbol: "BBRI" }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty("error")
  })

  it("returns 503 when Yahoo Finance throws an error", async () => {
    mockQuote.mockRejectedValueOnce(new Error("API unavailable"))

    const response = await GET(makeRequest("BBRI"), {
      params: Promise.resolve({ symbol: "BBRI" }),
    })
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toHaveProperty("error")
  })

  it("returns 400 for empty symbol", async () => {
    const response = await GET(makeRequest(""), {
      params: Promise.resolve({ symbol: "" }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("returns 400 for whitespace-only symbol", async () => {
    const response = await GET(makeRequest("   "), {
      params: Promise.resolve({ symbol: "   " }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  describe("with Redis cache", () => {
    it("stores Yahoo result in Redis on cache miss", async () => {
      mockGet.mockResolvedValue(null)
      mockQuote.mockResolvedValueOnce({ regularMarketPrice: 5050 })

      const response = await GET(makeRequest("BBRI"), {
        params: Promise.resolve({ symbol: "BBRI" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ price: 5050, symbol: "BBRI" })
      expect(mockQuote).toHaveBeenCalledWith("BBRI.JK")
      expect(mockSet).toHaveBeenCalledWith(
        "stock:BBRI.JK",
        { price: 5050, symbol: "BBRI" },
        { ex: 60 },
      )
    })

    it("returns cached price on cache hit without calling Yahoo", async () => {
      mockGet.mockResolvedValue({ price: 5050, symbol: "BBRI" })

      const response = await GET(makeRequest("BBRI"), {
        params: Promise.resolve({ symbol: "BBRI" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ price: 5050, symbol: "BBRI" })
      expect(mockGet).toHaveBeenCalledWith("stock:BBRI.JK")
      expect(mockQuote).not.toHaveBeenCalled()
      expect(mockSet).not.toHaveBeenCalled()
    })

    it("falls back to Yahoo when Redis is unavailable", async () => {
      mockGetRedis.mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error("Redis down")),
        set: vi.fn().mockRejectedValue(new Error("Redis down")),
      })
      mockQuote.mockResolvedValueOnce({ regularMarketPrice: 5050 })

      const response = await GET(makeRequest("BBRI"), {
        params: Promise.resolve({ symbol: "BBRI" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ price: 5050, symbol: "BBRI" })
      expect(mockQuote).toHaveBeenCalledTimes(1)
    })

    it("works without Redis when getRedis returns null", async () => {
      mockGetRedis.mockReturnValue(null)
      mockQuote.mockResolvedValueOnce({ regularMarketPrice: 5050 })

      const response = await GET(makeRequest("BBRI"), {
        params: Promise.resolve({ symbol: "BBRI" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ price: 5050, symbol: "BBRI" })
      expect(mockQuote).toHaveBeenCalledTimes(1)
    })
  })
})
