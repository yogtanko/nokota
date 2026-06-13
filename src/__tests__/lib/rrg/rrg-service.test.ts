import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockGetRedis = vi.fn()
const mockReadAccumulatedClosesWithDates = vi.fn()
const mockReadWeeklyClosesWithDates = vi.fn()

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockGetRedis(),
}))

vi.mock("@/lib/rrg/accumulator", () => ({
  readAccumulatedClosesWithDates: (...args: any[]) => mockReadAccumulatedClosesWithDates(...args),
  readWeeklyClosesWithDates: (...args: any[]) => mockReadWeeklyClosesWithDates(...args),
}))

import { getRRGData } from "@/lib/rrg/rrg-service"
import { SECTOR_TICKERS } from "@/lib/rrg/constants"

function makeAccumulatedData(
  basePrice: number,
  length: number,
  startDate = "2026-01-05",
): { date: string; close: number }[] {
  const start = new Date(startDate + "T00:00:00Z")
  return Array.from({ length }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      close: basePrice + i * 10,
    }
  })
}

describe("getRRGData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedis.mockReturnValue({ get: mockGet, set: mockSet })
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue("OK")
    mockReadAccumulatedClosesWithDates.mockResolvedValue(makeAccumulatedData(7000, 60))
    mockReadWeeklyClosesWithDates.mockResolvedValue(makeAccumulatedData(7000, 60))
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
    expect(result).toHaveProperty("timeframe", "daily")
    expect(result.sectors).toHaveLength(11)
  })

  it("returns dataAvailable false when accumulator has no data and no stale cache", async () => {
    mockReadAccumulatedClosesWithDates.mockResolvedValue([])

    const result = await getRRGData("daily")
    expect(result).toHaveProperty("dataAvailable", false)
    expect(result.sectors).toEqual([])
  })

  it("returns stale cache when accumulator empty and stale exists (weekly)", async () => {
    mockReadAccumulatedClosesWithDates.mockResolvedValue([])
    const cached = {
      timeframe: "weekly" as const,
      computed_at: new Date(Date.now() - 3600000).toISOString(),
      stale: false,
      dataAvailable: true,
      sectors: [] as any[],
    }
    mockGet
      .mockResolvedValueOnce(null)   // cache miss
      .mockResolvedValueOnce(cached)  // stale fallback

    const result = await getRRGData("weekly")
    expect(result.stale).toBe(true)
  })

  it("returns dataAvailable false when accumulator empty and no stale cache (weekly)", async () => {
    mockReadAccumulatedClosesWithDates.mockResolvedValue([])
    mockGet.mockResolvedValue(null)

    const result = await getRRGData("weekly")
    expect(result).toHaveProperty("dataAvailable", false)
    expect(result.sectors).toEqual([])
  })

  it("returns data for weekly timeframe via accumulator", async () => {
    mockReadAccumulatedClosesWithDates.mockResolvedValue(makeAccumulatedData(7000, 60))
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

  it("falls through when Redis .get() throws on cache check (daily uses accumulator)", async () => {
    mockGet.mockRejectedValue(new Error("Redis error"))

    const result = await getRRGData("daily")
    expect(result.sectors).toHaveLength(11)
    expect(result.stale).toBe(false)
  })

  it("falls through when Redis .get() throws on stale cache retrieval (weekly)", async () => {
    mockReadAccumulatedClosesWithDates.mockResolvedValue([])
    mockGet
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Redis error"))

    const result = await getRRGData("weekly")
    expect(result).toHaveProperty("dataAvailable", false)
  })
})
