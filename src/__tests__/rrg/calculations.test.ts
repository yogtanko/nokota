import {
  computeRawRSRatio,
  ema,
  roc,
  zScore,
  normalizeMomentum,
  mapQuadrant,
  computeTail,
  computeRRG,
} from "@/lib/rrg/calculations"
import { Quadrant } from "@/lib/rrg/types"

describe("computeRawRSRatio", () => {
  it("computes (sector / ihsg) * 100 for each pair", () => {
    const sector = [5000, 6000, 7500]
    const ihsg = [7000, 7000, 7000]
    const result = computeRawRSRatio(sector, ihsg)
    expect(result).toHaveLength(3)
    expect(result[0]).toBeCloseTo(71.42857, 4)
    expect(result[1]).toBeCloseTo(85.71429, 4)
    expect(result[2]).toBeCloseTo(107.14286, 4)
  })

  it("returns empty array for empty inputs", () => {
    expect(computeRawRSRatio([], [])).toEqual([])
  })

  it("returns Infinity when IHSG is 0", () => {
    const result = computeRawRSRatio([1000], [0])
    expect(result[0]).toBe(Infinity)
  })

  it("handles sector above IHSG (ratio > 100)", () => {
    const result = computeRawRSRatio([12000], [10000])
    expect(result[0]).toBe(120)
  })

  it("handles sector equal to IHSG", () => {
    const result = computeRawRSRatio([10000], [10000])
    expect(result[0]).toBe(100)
  })
})

describe("ema", () => {
  it("computes EMA with SMA seed for period 3", () => {
    const result = ema([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)
    expect(result).toHaveLength(10)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeCloseTo(2, 10)
    expect(result[3]).toBeCloseTo(3, 10)
    expect(result[4]).toBeCloseTo(4, 10)
    expect(result[5]).toBeCloseTo(5, 10)
    expect(result[6]).toBeCloseTo(6, 10)
    expect(result[7]).toBeCloseTo(7, 10)
    expect(result[8]).toBeCloseTo(8, 10)
    expect(result[9]).toBeCloseTo(9, 10)
  })

  it("returns input as-is for period 1", () => {
    const input = [10, 20, 30]
    expect(ema(input, 1)).toEqual([10, 20, 30])
  })

  it("returns empty array for empty input", () => {
    expect(ema([], 3)).toEqual([])
  })

  it("returns all NaN when input is shorter than period", () => {
    const result = ema([1, 2], 3)
    expect(result).toHaveLength(2)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
  })

  it("computes EMA-21 on increasing sequence", () => {
    const values = Array.from({ length: 30 }, (_, i) => i + 1)
    const result = ema(values, 21)
    expect(result).toHaveLength(30)

    for (let i = 0; i < 20; i++) {
      expect(result[i]).toBeNaN()
    }

    expect(result[20]).toBeCloseTo(11, 0)
  })
})

describe("roc", () => {
  it("computes period-1 ROC on increasing values", () => {
    const result = roc([100, 110, 121, 133.1], 1)
    expect(result).toHaveLength(4)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeCloseTo(10, 10)
    expect(result[2]).toBeCloseTo(10, 10)
    expect(result[3]).toBeCloseTo(10, 10)
  })

  it("computes period-2 ROC", () => {
    const result = roc([100, 105, 110, 120, 130], 2)
    expect(result).toHaveLength(5)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeCloseTo(10, 10)
    expect(result[3]).toBeCloseTo(14.285714, 4)
    expect(result[4]).toBeCloseTo(18.181818, 4)
  })

  it("returns empty array for empty input", () => {
    expect(roc([], 1)).toEqual([])
  })

  it("returns NaN for all periods when input shorter than period", () => {
    const result = roc([100], 3)
    expect(result[0]).toBeNaN()
  })

  it("returns 0 for constant values", () => {
    const result = roc([50, 50, 50, 50], 1)
    expect(result[1]).toBeCloseTo(0, 10)
    expect(result[2]).toBeCloseTo(0, 10)
    expect(result[3]).toBeCloseTo(0, 10)
  })

  it("returns negative for decreasing values", () => {
    const result = roc([100, 90, 81], 1)
    expect(result[1]).toBeCloseTo(-10, 10)
    expect(result[2]).toBeCloseTo(-10, 10)
  })
})

describe("zScore", () => {
  it("computes rolling Z-score with window 3", () => {
    const result = zScore([10, 20, 30, 40, 50], 3)
    expect(result).toHaveLength(5)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeCloseTo(1.22474, 4)
    expect(result[3]).toBeCloseTo(1.22474, 4)
    expect(result[4]).toBeCloseTo(1.22474, 4)
  })

  it("returns 0 for constant values (zero stddev)", () => {
    const result = zScore([5, 5, 5, 5, 5], 3)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBe(0)
    expect(result[3]).toBe(0)
    expect(result[4]).toBe(0)
  })

  it("returns NaN when data is shorter than window", () => {
    const result = zScore([1, 2], 3)
    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
  })

  it("returns empty array for empty input", () => {
    expect(zScore([], 3)).toEqual([])
  })

  it("handles negative values", () => {
    const result = zScore([-10, -5, 0, 5, 10], 3)
    expect(result[2]).toBeCloseTo(1.22474, 4)
  })
})

describe("normalizeMomentum", () => {
  it("converts Z-score to basis-100", () => {
    expect(normalizeMomentum([-1, 0, 1])).toEqual([90, 100, 110])
  })

  it("handles empty array", () => {
    expect(normalizeMomentum([])).toEqual([])
  })

  it("handles decimal Z-scores", () => {
    const result = normalizeMomentum([-0.5, 0.5])
    expect(result[0]).toBeCloseTo(95, 10)
    expect(result[1]).toBeCloseTo(105, 10)
  })
})

describe("mapQuadrant", () => {
  it("returns LEADING when both > 100", () => {
    expect(mapQuadrant(105, 110)).toBe(Quadrant.LEADING)
  })

  it("returns WEAKENING when RS-R > 100 and RS-M < 100", () => {
    expect(mapQuadrant(105, 90)).toBe(Quadrant.WEAKENING)
  })

  it("returns LAGGING when both < 100", () => {
    expect(mapQuadrant(95, 90)).toBe(Quadrant.LAGGING)
  })

  it("returns IMPROVING when RS-R < 100 and RS-M > 100", () => {
    expect(mapQuadrant(95, 110)).toBe(Quadrant.IMPROVING)
  })

  it("returns LEADING at exact boundary (both 100)", () => {
    expect(mapQuadrant(100, 100)).toBe(Quadrant.LEADING)
  })

  it("returns WEAKENING at RS-R=100 boundary with RS-M < 100", () => {
    expect(mapQuadrant(100, 90)).toBe(Quadrant.WEAKENING)
  })

  it("returns IMPROVING at RS-M=100 boundary with RS-R < 100", () => {
    expect(mapQuadrant(90, 100)).toBe(Quadrant.IMPROVING)
  })
})

describe("computeTail", () => {
  const rsRatios = [90, 95, 100, 105, 110, 115]
  const rsMomentums = [100, 95, 105, 100, 95, 110]

  it("returns last 5 points by default", () => {
    const tail = computeTail(rsRatios, rsMomentums)
    expect(tail).toHaveLength(5)
    expect(tail[0]).toEqual({ rsRatio: 95, rsMomentum: 95 })
    expect(tail[4]).toEqual({ rsRatio: 115, rsMomentum: 110 })
  })

  it("returns custom number of periods", () => {
    const tail = computeTail(rsRatios, rsMomentums, 2)
    expect(tail).toHaveLength(2)
    expect(tail[0]).toEqual({ rsRatio: 110, rsMomentum: 95 })
    expect(tail[1]).toEqual({ rsRatio: 115, rsMomentum: 110 })
  })

  it("returns all points when fewer than requested periods", () => {
    const tail = computeTail([100], [100], 5)
    expect(tail).toHaveLength(1)
  })

  it("returns empty array for empty inputs", () => {
    expect(computeTail([], [])).toEqual([])
  })

  it("skips trailing NaN values", () => {
    const tail = computeTail([90, 95, 100], [NaN, NaN, 100])
    expect(tail).toHaveLength(1)
    expect(tail[0]).toEqual({ rsRatio: 100, rsMomentum: 100 })
  })
})

describe("computeRRG", () => {
  const sectorCloses = Array.from({ length: 100 }, (_, i) => 5000 + i * 20)
  const ihsgCloses = Array.from({ length: 100 }, (_, i) => 7000 + i * 5)

  it("returns RRGResult with daily timeframe", () => {
    const result = computeRRG(sectorCloses, ihsgCloses, "daily")
    expect(result).toHaveProperty("rsRatio")
    expect(result).toHaveProperty("rsMomentum")
    expect(result).toHaveProperty("quadrant")
    expect(result).toHaveProperty("tail")
    expect(typeof result.rsRatio).toBe("number")
    expect(typeof result.rsMomentum).toBe("number")
    expect(Object.values(Quadrant)).toContain(result.quadrant)
    expect(Array.isArray(result.tail)).toBe(true)
  })

  it("returns RRGResult with weekly timeframe", () => {
    const result = computeRRG(sectorCloses, ihsgCloses, "weekly")
    expect(result).toHaveProperty("rsRatio")
    expect(result).toHaveProperty("rsMomentum")
    expect(result).toHaveProperty("quadrant")
    expect(result).toHaveProperty("tail")
  })

  it("tail contains exactly 5 points with sufficient data", () => {
    const result = computeRRG(sectorCloses, ihsgCloses, "daily")
    expect(result.tail).toHaveLength(5)
    result.tail.forEach((point) => {
      expect(point).toHaveProperty("rsRatio")
      expect(point).toHaveProperty("rsMomentum")
      expect(typeof point.rsRatio).toBe("number")
      expect(typeof point.rsMomentum).toBe("number")
      expect(isNaN(point.rsRatio)).toBe(false)
      expect(isNaN(point.rsMomentum)).toBe(false)
    })
  })

  it("computes RS-Ratio and RS-Momentum correctly", () => {
    const result = computeRRG(sectorCloses, ihsgCloses, "daily")
    expect(result.rsRatio).not.toBeNaN()
    expect(result.rsMomentum).not.toBeNaN()
  })

  it("handles insufficient data gracefully", () => {
    const shortSector = [5000, 5100, 5200]
    const shortIhsg = [7000, 7100, 7200]
    const result = computeRRG(shortSector, shortIhsg, "daily")
    expect(result).toHaveProperty("rsRatio")
    expect(result).toHaveProperty("rsMomentum")
    expect(result).toHaveProperty("quadrant")
    expect(result).toHaveProperty("tail")
    expect(Array.isArray(result.tail)).toBe(true)
  })
})
