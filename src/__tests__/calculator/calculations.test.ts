import {
  calculatePositionSize,
  calculateLots,
  calculateRiskRewardRatio,
  calculatePotentialProfit,
  calculatePotentialLoss,
  calculatePurchaseCost,
  calculateMaxAffordableShares,
} from "@/lib/calculator/calculations"
import { LOT_SIZE } from "@/lib/calculator/constants"

describe("calculatePositionSize", () => {
  it("returns correct shares for a valid trade setup", () => {
    const result = calculatePositionSize(10_000_000, 2, 5000, 4800)
    expect(result).toBe(1000)
  })

  it("returns 0 for zero balance", () => {
    expect(calculatePositionSize(0, 2, 5000, 4800)).toBe(0)
  })

  it("returns 0 for zero risk percent", () => {
    expect(calculatePositionSize(10_000_000, 0, 5000, 4800)).toBe(0)
  })

  it("returns 0 when entry price equals stop loss (zero diff)", () => {
    expect(calculatePositionSize(10_000_000, 2, 5000, 5000)).toBe(0)
  })

  it("returns 0 when stop loss exceeds entry price (negative diff)", () => {
    expect(calculatePositionSize(10_000_000, 2, 4800, 5000)).toBe(0)
  })

  it("handles large position sizes", () => {
    const result = calculatePositionSize(100_000_000, 5, 1000, 800)
    expect(result).toBe(25_000)
  })

  it("handles small price differences", () => {
    const result = calculatePositionSize(1_000_000, 1, 1500, 1490)
    expect(result).toBe(1000)
  })

  it("returns 0 for negative balance", () => {
    expect(calculatePositionSize(-1000, 2, 5000, 4800)).toBe(0)
  })

  it("returns 0 for negative risk percent", () => {
    expect(calculatePositionSize(10_000_000, -1, 5000, 4800)).toBe(0)
  })
})

describe("calculateLots", () => {
  it("returns correct lots for given shares", () => {
    expect(calculateLots(2500)).toBe(25)
  })

  it("uses LOT_SIZE constant as default", () => {
    const result = calculateLots(2500)
    expect(result).toBe(Math.floor(2500 / LOT_SIZE))
  })

  it("accepts custom lot size", () => {
    expect(calculateLots(500, 50)).toBe(10)
  })

  it("returns 0 for zero shares", () => {
    expect(calculateLots(0)).toBe(0)
  })

  it("floors fractional lots", () => {
    expect(calculateLots(2499)).toBe(24)
  })

  it("returns 0 for negative shares", () => {
    expect(calculateLots(-100)).toBe(0)
  })
})

describe("calculateRiskRewardRatio", () => {
  it("returns correct R:R ratio for a valid setup", () => {
    const result = calculateRiskRewardRatio(5000, 4800, 5500)
    expect(result).toBe(2.5)
  })

  it("returns 0 when take profit equals entry price", () => {
    const result = calculateRiskRewardRatio(5000, 4800, 5000)
    expect(result).toBe(0)
  })

  it("returns negative when take profit is below entry price", () => {
    const result = calculateRiskRewardRatio(5000, 4800, 4700)
    expect(result).toBe(-1.5)
  })

  it("returns 0 when entry price equals stop loss (zero diff)", () => {
    const result = calculateRiskRewardRatio(5000, 5000, 5500)
    expect(result).toBe(0)
  })

  it("handles large ratios", () => {
    const result = calculateRiskRewardRatio(1000, 990, 5000)
    expect(result).toBe(400)
  })
})

describe("calculatePotentialProfit", () => {
  it("returns correct profit for a valid setup", () => {
    const result = calculatePotentialProfit(5500, 5000, 1000)
    expect(result).toBe(500_000)
  })

  it("returns 0 when take profit equals entry price", () => {
    expect(calculatePotentialProfit(5000, 5000, 1000)).toBe(0)
  })

  it("returns negative profit (loss) when take profit is below entry", () => {
    const result = calculatePotentialProfit(4800, 5000, 1000)
    expect(result).toBe(-200_000)
  })

  it("returns 0 for zero shares", () => {
    expect(calculatePotentialProfit(5500, 5000, 0)).toBe(0)
  })

  it("handles large profits", () => {
    const result = calculatePotentialProfit(10000, 1000, 100_000)
    expect(result).toBe(900_000_000)
  })
})

describe("calculatePurchaseCost", () => {
  it("returns correct purchase cost for valid lots and entry price", () => {
    const result = calculatePurchaseCost(12, 5000)
    expect(result).toBe(6_000_000)
  })

  it("returns 0 for zero lots", () => {
    expect(calculatePurchaseCost(0, 5000)).toBe(0)
  })

  it("returns 0 for zero entry price", () => {
    expect(calculatePurchaseCost(12, 0)).toBe(0)
  })

  it("floors fractional lots before computing cost", () => {
    const result = calculatePurchaseCost(3.2, 2000)
    expect(result).toBe(600_000)
  })

  it("returns 0 for negative lots", () => {
    expect(calculatePurchaseCost(-5, 5000)).toBe(0)
  })

  it("returns 0 for negative entry price", () => {
    expect(calculatePurchaseCost(12, -100)).toBe(0)
  })

  it("accepts custom lot size", () => {
    const result = calculatePurchaseCost(10, 5000, 50)
    expect(result).toBe(2_500_000)
  })
})

describe("calculateMaxAffordableShares", () => {
  it("returns max affordable shares when balance exceeds entry price", () => {
    const result = calculateMaxAffordableShares(5_000_000, 5000)
    expect(result).toBe(1000)
  })

  it("returns 0 when balance is zero", () => {
    expect(calculateMaxAffordableShares(0, 5000)).toBe(0)
  })

  it("returns 0 when entry price is zero", () => {
    expect(calculateMaxAffordableShares(5_000_000, 0)).toBe(0)
  })

  it("returns 0 when balance cannot afford a single lot", () => {
    expect(calculateMaxAffordableShares(50_000, 5000)).toBe(0)
  })

  it("rounds down to nearest lot", () => {
    const result = calculateMaxAffordableShares(5_050_000, 5000)
    expect(result).toBe(1000)
  })

  it("handles large values", () => {
    const result = calculateMaxAffordableShares(1_000_000_000, 5000)
    expect(result).toBe(200_000)
  })

  it("returns 0 for negative balance", () => {
    expect(calculateMaxAffordableShares(-1000, 5000)).toBe(0)
  })

  it("accepts custom lot size", () => {
    const result = calculateMaxAffordableShares(500_000, 5000, 50)
    expect(result).toBe(100)
  })
})

describe("calculatePotentialLoss", () => {
  it("returns correct loss for a valid setup", () => {
    const result = calculatePotentialLoss(5000, 4800, 1000)
    expect(result).toBe(200_000)
  })

  it("returns 0 when stop loss equals entry price", () => {
    expect(calculatePotentialLoss(5000, 5000, 1000)).toBe(0)
  })

  it("returns negative when stop loss exceeds entry price", () => {
    const result = calculatePotentialLoss(4800, 5000, 1000)
    expect(result).toBe(-200_000)
  })

  it("returns 0 for zero shares", () => {
    expect(calculatePotentialLoss(5000, 4800, 0)).toBe(0)
  })
})
