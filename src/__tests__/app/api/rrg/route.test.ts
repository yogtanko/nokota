import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const mockGetRRGData = vi.fn()

vi.mock("@/lib/rrg/rrg-service", () => ({
  getRRGData: (...args: any[]) => mockGetRRGData(...args),
}))

const makeSector = (ticker: string) => ({
  ticker,
  name: "Test Sector",
  rsRatio: 105,
  rsMomentum: 110,
  quadrant: "LEADING",
  tail: [{ rsRatio: 100, rsMomentum: 95 }],
})

import { GET } from "@/app/api/rrg/route"

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

describe("GET /api/rrg", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRRGData.mockResolvedValue({
      timeframe: "daily",
      computed_at: new Date().toISOString(),
      stale: false,
      sectors: [
        makeSector("IDXENERGY.JK"),
        makeSector("IDXBASIC.JK"),
        makeSector("IDXINDUST.JK"),
        makeSector("IDXNONCYC.JK"),
        makeSector("IDXCYCLIC.JK"),
        makeSector("IDXHEALTH.JK"),
        makeSector("IDXFIN.JK"),
        makeSector("IDXPROP.JK"),
        makeSector("IDXTECH.JK"),
        makeSector("IDXINFRA.JK"),
        makeSector("IDXTRANS.JK"),
      ],
    })
  })

  it("returns 200 with correct shape for daily timeframe", async () => {
    const response = await GET(makeRequest("http://localhost/api/rrg?timeframe=daily"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("timeframe", "daily")
    expect(data).toHaveProperty("computed_at")
    expect(data).toHaveProperty("stale", false)
    expect(data).toHaveProperty("sectors")
    expect(data.sectors).toHaveLength(11)
  })

  it("returns 200 with correct shape for weekly timeframe", async () => {
    mockGetRRGData.mockResolvedValue({
      timeframe: "weekly",
      computed_at: new Date().toISOString(),
      stale: false,
      sectors: [makeSector("IDXENERGY.JK")],
    })

    const response = await GET(makeRequest("http://localhost/api/rrg?timeframe=weekly"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.timeframe).toBe("weekly")
  })

  it("returns 400 for invalid timeframe", async () => {
    const response = await GET(makeRequest("http://localhost/api/rrg?timeframe=monthly"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("returns 400 for missing timeframe", async () => {
    const response = await GET(makeRequest("http://localhost/api/rrg"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("passes timeframe to getRRGData", async () => {
    await GET(makeRequest("http://localhost/api/rrg?timeframe=daily"))
    expect(mockGetRRGData).toHaveBeenCalledWith("daily")
  })

  it("returns stale: true when service returns stale data", async () => {
    mockGetRRGData.mockResolvedValue({
      timeframe: "daily",
      computed_at: new Date(Date.now() - 7200000).toISOString(),
      stale: true,
      sectors: [makeSector("IDXENERGY.JK")],
    })

    const response = await GET(makeRequest("http://localhost/api/rrg?timeframe=daily"))
    const data = await response.json()

    expect(data.stale).toBe(true)
  })

  it("returns 503 when getRRGData throws", async () => {
    mockGetRRGData.mockRejectedValue(new Error("Service unavailable"))

    const response = await GET(makeRequest("http://localhost/api/rrg?timeframe=daily"))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toHaveProperty("error")
  })
})
