import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

vi.mock("@/components/rrg-chart", () => ({
  RRGChart: vi.fn(({ sectors }) => <div data-testid="rrg-chart">{sectors.length} sectors</div>),
}))

vi.mock("@/components/rrg-table", () => ({
  RRGTable: vi.fn(({ sectors }) => <div data-testid="rrg-table">{sectors.length} sectors</div>),
}))

vi.mock("@/components/rrg-skeleton", () => ({
  RRGSkeleton: () => <div data-testid="rrg-skeleton">Loading...</div>,
}))

vi.mock("@/components/rrg-coming-soon", () => ({
  RRGComingSoon: () => <div data-testid="rrg-coming-soon">Work in progress</div>,
}))

const mockResponse = {
  timeframe: "daily",
  computed_at: new Date().toISOString(),
  stale: false,
  dataAvailable: true,
  sectors: [
    { ticker: "IDXENERGY.JK", name: "Energy", rsRatio: 105, rsMomentum: 110, quadrant: "LEADING", tail: [] },
    { ticker: "IDXBASIC.JK", name: "Basic Materials", rsRatio: 98, rsMomentum: 92, quadrant: "LAGGING", tail: [] },
    { ticker: "IDXINDUST.JK", name: "Industrials", rsRatio: 102, rsMomentum: 95, quadrant: "WEAKENING", tail: [] },
    { ticker: "IDXNONCYC.JK", name: "Non-Cyclicals", rsRatio: 97, rsMomentum: 105, quadrant: "IMPROVING", tail: [] },
    { ticker: "IDXCYCLIC.JK", name: "Cyclicals", rsRatio: 100, rsMomentum: 100, quadrant: "LEADING", tail: [] },
    { ticker: "IDXHEALTH.JK", name: "Healthcare", rsRatio: 103, rsMomentum: 108, quadrant: "LEADING", tail: [] },
    { ticker: "IDXFIN.JK", name: "Financials", rsRatio: 101, rsMomentum: 103, quadrant: "LEADING", tail: [] },
    { ticker: "IDXPROP.JK", name: "Property", rsRatio: 95, rsMomentum: 85, quadrant: "LAGGING", tail: [] },
    { ticker: "IDXTECH.JK", name: "Technology", rsRatio: 99, rsMomentum: 102, quadrant: "IMPROVING", tail: [] },
    { ticker: "IDXINFRA.JK", name: "Infrastructure", rsRatio: 104, rsMomentum: 97, quadrant: "WEAKENING", tail: [] },
    { ticker: "IDXTRANS.JK", name: "Transportation", rsRatio: 96, rsMomentum: 90, quadrant: "LAGGING", tail: [] },
  ],
}

let mockSwrReturn: any
let capturedSwrOptions: any

vi.mock("swr", () => ({
  default: vi.fn((key: string, _fetcher: any, options: any) => {
    capturedSwrOptions = options
    return mockSwrReturn
  }),
}))

import SectorTrendPage from "@/app/(app)/apps/trade-deck/sector-trend/page"

describe("SektorTrend Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSwrReturn = {
      data: mockResponse,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    }
    capturedSwrOptions = undefined
  })

  it("renders page title and description", () => {
    render(<SectorTrendPage />)
    expect(screen.getByText("SektorTrend")).toBeInTheDocument()
    expect(screen.getByText(/Relative Rotation Graph/i)).toBeInTheDocument()
  })

  it("renders timeframe toggle buttons", () => {
    render(<SectorTrendPage />)
    expect(screen.getByRole("button", { name: /daily/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /weekly/i })).toBeInTheDocument()
  })

  it("renders chart and table after data loads", async () => {
    render(<SectorTrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId("rrg-chart")).toBeInTheDocument()
      expect(screen.getByTestId("rrg-table")).toBeInTheDocument()
    })
  })

  it("renders 11 sectors in chart and table", async () => {
    render(<SectorTrendPage />)

    await waitFor(() => {
      expect(screen.getByTestId("rrg-chart")).toHaveTextContent("11 sectors")
      expect(screen.getByTestId("rrg-table")).toHaveTextContent("11 sectors")
    })
  })

  it("shows coming-soon when dataAvailable is false", async () => {
    mockSwrReturn = {
      ...mockSwrReturn,
      data: { ...mockResponse, dataAvailable: false, sectors: [] },
    }
    render(<SectorTrendPage />)
    await waitFor(() => {
      expect(screen.getByTestId("rrg-coming-soon")).toBeInTheDocument()
    })
  })

  it("shows stale data banner when data is stale", async () => {
    mockSwrReturn = {
      ...mockSwrReturn,
      data: { ...mockResponse, stale: true },
    }
    render(<SectorTrendPage />)
    await waitFor(() => {
      expect(screen.getByText(/Data loaded is not real-time/i)).toBeInTheDocument()
    })
  })

  it("shows retry button on error without fallback data", async () => {
    mockSwrReturn = {
      data: undefined,
      error: new Error("Failed to fetch"),
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    }
    render(<SectorTrendPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })
  })

  it("keeps previous data visible while re-fetching", async () => {
    mockSwrReturn = {
      data: mockResponse,
      error: undefined,
      isLoading: false,
      isValidating: true,
      mutate: vi.fn(),
    }
    render(<SectorTrendPage />)
    await waitFor(() => {
      expect(screen.getByTestId("rrg-chart")).toBeInTheDocument()
      expect(screen.getByTestId("rrg-table")).toBeInTheDocument()
    })
  })

  it("passes errorRetryCount: 3 in SWR options", () => {
    render(<SectorTrendPage />)
    expect(capturedSwrOptions?.errorRetryCount).toBe(3)
  })
})
