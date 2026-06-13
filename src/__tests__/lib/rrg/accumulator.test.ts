import { describe, it, expect, vi, beforeEach } from "vitest"

const mockHset = vi.fn()
const mockHgetall = vi.fn()
const mockHget = vi.fn()
const mockExpire = vi.fn()
const mockKeys = vi.fn()

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    hset: mockHset,
    hgetall: mockHgetall,
    hget: mockHget,
    expire: mockExpire,
    keys: mockKeys,
  }),
}))

import { storeClose, readAccumulatedCloses, readAccumulatedClosesWithDates, getAccumulatedCount } from "@/lib/rrg/accumulator"

describe("accumulator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("storeClose", () => {
    it("writes close price to Redis hash", async () => {
      mockHset.mockResolvedValue(1)
      mockExpire.mockResolvedValue(true)

      await storeClose("IDXENERGY.JK", "2026-06-12", 2851.89)

      expect(mockHset).toHaveBeenCalledWith(
        "idx:close:IDXENERGY.JK",
        { "2026-06-12": 2851.89 },
      )
    })

    it("sets TTL on the hash key", async () => {
      mockHset.mockResolvedValue(1)
      mockExpire.mockResolvedValue(true)

      await storeClose("IDXENERGY.JK", "2026-06-12", 2851.89)

      expect(mockExpire).toHaveBeenCalledWith(
        "idx:close:IDXENERGY.JK",
        13651200,
      )
    })

    it("overwrites existing entry for same date", async () => {
      mockHset.mockResolvedValue(0)
      mockExpire.mockResolvedValue(true)

      await storeClose("IDXENERGY.JK", "2026-06-12", 2900.0)

      expect(mockHset).toHaveBeenCalled()
    })

    it("does not throw when Redis is unavailable", async () => {
      vi.mocked(mockHset).mockRejectedValue(new Error("Redis down"))

      await expect(
        storeClose("IDXENERGY.JK", "2026-06-12", 2851.89),
      ).resolves.toBeUndefined()
    })
  })

  describe("readAccumulatedCloses", () => {
    it("returns closes sorted by date ascending", async () => {
      mockHgetall.mockResolvedValue({
        "2026-06-10": "2750.5",
        "2026-06-12": "2851.89",
        "2026-06-11": "2800.0",
      })

      const result = await readAccumulatedCloses("IDXENERGY.JK")

      expect(result).toEqual([2750.5, 2800.0, 2851.89])
    })

    it("returns empty array when no data exists", async () => {
      mockHgetall.mockResolvedValue({})

      const result = await readAccumulatedCloses("IDXENERGY.JK")

      expect(result).toEqual([])
    })

    it("returns empty array when hash is null", async () => {
      mockHgetall.mockResolvedValue(null)

      const result = await readAccumulatedCloses("IDXENERGY.JK")

      expect(result).toEqual([])
    })

    it("parses numeric prices from string values", async () => {
      mockHgetall.mockResolvedValue({ "2026-06-12": "2851.888916015625" })

      const result = await readAccumulatedCloses("IDXENERGY.JK")

      expect(result).toEqual([2851.888916015625])
    })

    it("does not throw when Redis is unavailable", async () => {
      mockHgetall.mockRejectedValue(new Error("Redis down"))

      const result = await readAccumulatedCloses("IDXENERGY.JK")

      expect(result).toEqual([])
    })
  })

  describe("readAccumulatedClosesWithDates", () => {
    it("returns date-close pairs sorted by date ascending", async () => {
      mockHgetall.mockResolvedValue({
        "2026-06-10": "2750.5",
        "2026-06-12": "2851.89",
        "2026-06-11": "2800.0",
      })

      const result = await readAccumulatedClosesWithDates("IDXENERGY.JK")

      expect(result).toEqual([
        { date: "2026-06-10", close: 2750.5 },
        { date: "2026-06-11", close: 2800.0 },
        { date: "2026-06-12", close: 2851.89 },
      ])
    })

    it("returns empty array when no data exists", async () => {
      mockHgetall.mockResolvedValue({})

      const result = await readAccumulatedClosesWithDates("IDXENERGY.JK")

      expect(result).toEqual([])
    })

    it("parses numeric close from string values", async () => {
      mockHgetall.mockResolvedValue({ "2026-06-12": "2851.888916015625" })

      const result = await readAccumulatedClosesWithDates("IDXENERGY.JK")

      expect(result).toEqual([{ date: "2026-06-12", close: 2851.888916015625 }])
    })

    it("does not throw when Redis is unavailable", async () => {
      mockHgetall.mockRejectedValue(new Error("Redis down"))

      const result = await readAccumulatedClosesWithDates("IDXENERGY.JK")

      expect(result).toEqual([])
    })
  })

  describe("getAccumulatedCount", () => {
    it("returns number of stored entries", async () => {
      mockHgetall.mockResolvedValue({
        "2026-06-10": "2750.5",
        "2026-06-11": "2800.0",
        "2026-06-12": "2851.89",
      })

      const result = await getAccumulatedCount("IDXENERGY.JK")

      expect(result).toBe(3)
    })

    it("returns 0 when no data", async () => {
      mockHgetall.mockResolvedValue({})

      const result = await getAccumulatedCount("IDXENERGY.JK")

      expect(result).toBe(0)
    })

    it("returns 0 when Redis unavailable", async () => {
      mockHgetall.mockRejectedValue(new Error("Redis down"))

      const result = await getAccumulatedCount("IDXENERGY.JK")

      expect(result).toBe(0)
    })
  })
})
