import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockGetRedis = vi.fn()
const mockFetchSectorOHLCV = vi.fn()

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockGetRedis(),
}))

vi.mock("@/lib/rrg/sector-data", () => ({
  fetchSectorOHLCV: (...args: any[]) => mockFetchSectorOHLCV(...args),
}))

import { getRRGData } from "@/lib/rrg/rrg-service"
import { SECTOR_TICKERS } from "@/lib/rrg/constants"

function makeOhlcvData(basePrice: number, length: number): number[] {
  return Array.from({ length }, (_, i) => basePrice + i * 10)
}

function buildMockOhlcvMap(): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (const t of SECTOR_TICKERS) {
    const base = t.ticker === "^JKSE" ? 7000 : 5000 + Math.random() * 1000
    map.set(t.ticker, makeOhlcvData(base, 100))
  }
  return map
}

describe("getRRGData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedis.mockReturnValue({ get: mockGet, set: mockSet })
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue("OK")
    mockFetchSectorOHLCV.mockResolvedValue(buildMockOhlcvMap())
  })

  it("returns RRG response with correct shape on cache miss", async () => {
    const result = await getRRGData("daily")
    expect(result).toHaveProperty("timeframe", "daily")
    expect(result).toHaveProperty("computed_at")
    expect(typeof result.computed_at).toBe("string")
    expect(result).toHaveProperty("stale", false)
    expect(result).toHaveProperty("sectors")
  })

  it("returns 11 sectors (excludes IHSG benchmark)", async () => {
    const result = await getRRGData("daily")
    expect(result.sectors).toHaveLength(11)
  })

  it("each sector has required fields with correct types", async () => {
    const result = await getRRGData("daily")
    for (const sector of result.sectors) {
      expect(sector).toHaveProperty("ticker")
      expect(sector).toHaveProperty("name")
      expect(sector).toHaveProperty("rsRatio")
      expect(sector).toHaveProperty("rsMomentum")
      expect(sector).toHaveProperty("quadrant")
      expect(sector).toHaveProperty("tail")
      expect(Array.isArray(sector.tail)).toBe(true)
      expect(typeof sector.rsRatio).toBe("number")
      expect(typeof sector.rsMomentum).toBe("number")
      expect(isNaN(sector.rsRatio)).toBe(false)
      expect(isNaN(sector.rsMomentum)).toBe(false)
    }
  })

  it("returns cached data on cache hit without fetching from Yahoo", async () => {
    const cached = {
      timeframe: "daily" as const,
      computed_at: new Date().toISOString(),
      stale: false,
      sectors: [{ ticker: "IDXENERGY.JK", name: "Energy", rsRatio: 105, rsMomentum: 110, quadrant: "LEADING", tail: [] }],
    }
    mockGet.mockResolvedValue(cached)

    const result = await getRRGData("daily")
    expect(result).toEqual(cached)
    expect(mockGet).toHaveBeenCalledWith("rrg:daily")
    expect(mockFetchSectorOHLCV).not.toHaveBeenCalled()
  })

  it("stores computed result in Redis on cache miss", async () => {
    const result = await getRRGData("daily")

    expect(mockSet).toHaveBeenCalledWith(
      "rrg:daily",
      expect.objectContaining({ timeframe: "daily", stale: false }),
      expect.objectContaining({ ex: expect.any(Number) }),
    )
  })

  it("works without Redis when getRedis returns null", async () => {
    mockGetRedis.mockReturnValue(null)
    const result = await getRRGData("daily")
    expect(result.sectors).toHaveLength(11)
  })

  it("returns stale cache on Yahoo failure when cache exists", async () => {
    mockFetchSectorOHLCV.mockRejectedValue(new Error("Yahoo unavailable"))
    const cached = {
      timeframe: "daily" as const,
      computed_at: new Date(Date.now() - 3600000).toISOString(),
      stale: false,
      sectors: [] as any[],
    }
    mockGet
      .mockResolvedValueOnce(null)   // first call: cache miss
      .mockResolvedValueOnce(cached)  // second call: stale fallback

    const result = await getRRGData("daily")
    expect(result.stale).toBe(true)
  })

  it("throws when Yahoo fails and no stale cache exists", async () => {
    mockFetchSectorOHLCV.mockRejectedValue(new Error("Yahoo unavailable"))
    mockGet.mockResolvedValue(null)

    await expect(getRRGData("daily")).rejects.toThrow()
  })

  it("returns data for weekly timeframe", async () => {
    const result = await getRRGData("weekly")
    expect(result.timeframe).toBe("weekly")
    expect(result.sectors).toHaveLength(11)
  })

  it("sector tickers match known sector list (excl IHSG)", async () => {
    const result = await getRRGData("daily")
    const tickers = result.sectors.map((s) => s.ticker)
    const expected = SECTOR_TICKERS.filter((t) => t.ticker !== "^JKSE").map((t) => t.ticker)
    expect(tickers.sort()).toEqual(expected.sort())
  })

  it("falls through when Redis .get() throws on cache check", async () => {
    mockGet.mockRejectedValue(new Error("Redis error"))

    const result = await getRRGData("daily")
    expect(result.sectors).toHaveLength(11)
    expect(result.stale).toBe(false)
  })

  it("falls through when Redis .get() throws on stale cache retrieval", async () => {
    mockFetchSectorOHLCV.mockRejectedValue(new Error("Yahoo error"))
    mockGet
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Redis error"))

    await expect(getRRGData("daily")).rejects.toThrow("Yahoo error")
  })
})
