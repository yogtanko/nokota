import {
  formatCurrency,
  formatPercent,
  formatShares,
  formatLots,
} from "@/lib/calculator/formatting"

describe("formatCurrency", () => {
  it("formats a positive number with IDR currency format", () => {
    const result = formatCurrency(10000)
    expect(result).toMatch(/^Rp/)
    expect(result).toContain("10.000")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toMatch(/^Rp/)
  })

  it("formats large numbers with thousand separators", () => {
    const result = formatCurrency(1_000_000)
    expect(result).toContain("1.000.000")
  })

  it("handles fractional values", () => {
    const result = formatCurrency(1500.5)
    expect(result).toMatch(/^Rp/)
  })
})

describe("formatPercent", () => {
  it("formats a decimal as percentage with locale format", () => {
    const result = formatPercent(0.025)
    expect(result).toMatch(/%$/)
    expect(result).toContain("2,5")
  })

  it("formats 100 percent", () => {
    const result = formatPercent(1)
    expect(result).toMatch(/^100/)
    expect(result).toMatch(/%$/)
  })

  it("formats zero percent", () => {
    const result = formatPercent(0)
    expect(result).toMatch(/^0/)
    expect(result).toMatch(/%$/)
  })

  it("formats negative percentage", () => {
    const result = formatPercent(-0.5)
    expect(result).toMatch(/^-50/)
    expect(result).toMatch(/%$/)
  })

  it("formats whole number percentages", () => {
    const result = formatPercent(0.5)
    expect(result).toMatch(/^50/)
    expect(result).toMatch(/%$/)
  })
})

describe("formatShares", () => {
  it("formats shares as locale integer", () => {
    expect(formatShares(1500)).toBe("1.500")
  })

  it("formats zero shares", () => {
    expect(formatShares(0)).toBe("0")
  })

  it("formats large share counts", () => {
    expect(formatShares(1_000_000)).toBe("1.000.000")
  })

  it("rounds fractional shares to integer", () => {
    const result = formatShares(1500.75)
    expect(result).toBe("1.501")
  })
})

describe("formatLots", () => {
  it("formats lots as locale number", () => {
    expect(formatLots(25)).toBe("25")
  })

  it("formats zero lots", () => {
    expect(formatLots(0)).toBe("0")
  })

  it("formats large lot counts", () => {
    expect(formatLots(1000)).toBe("1.000")
  })
})
