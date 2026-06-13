import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RRGChart } from "@/components/rrg-chart"

vi.mock("recharts", () => {
  function mockComponent(name: string) {
    return vi.fn(({ children }: any) => (
      <div data-testid={`recharts-${name}`}>{children}</div>
    ))
  }

  const MockCustomized = vi.fn(({ children }: any) => {
    return <div data-testid="recharts-Customized">{children}</div>
  })

  return {
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="recharts-ResponsiveContainer">{children}</div>
    ),
    ScatterChart: mockComponent("ScatterChart"),
    Scatter: vi.fn(({ data, label: _label }: any) => (
      <div data-testid="recharts-Scatter" data-records={data?.length ?? 0} />
    )),
    XAxis: vi.fn(({ label }: any) => (
      <div data-testid="recharts-XAxis" data-label={label?.value} />
    )),
    YAxis: vi.fn(({ label }: any) => (
      <div data-testid="recharts-YAxis" data-label={label?.value} />
    )),
    ZAxis: mockComponent("ZAxis"),
    Tooltip: vi.fn(() => <div data-testid="recharts-Tooltip" />),
    Legend: mockComponent("Legend"),
    CartesianGrid: mockComponent("CartesianGrid"),
    ReferenceLine: vi.fn(() => <div data-testid="recharts-ReferenceLine" />),
    ReferenceArea: vi.fn(() => <div data-testid="recharts-ReferenceArea" />),
    Customized: MockCustomized,
    useXAxisScale: vi.fn(() => (v: number) => v * 10),
    useYAxisScale: vi.fn(() => (v: number) => v * 10),
  }
})

const mockSectors = [
  {
    ticker: "IDXENERGY.JK",
    name: "Energy",
    rsRatio: 105.2,
    rsMomentum: 110.5,
    quadrant: "LEADING" as const,
    tail: [
      { rsRatio: 100, rsMomentum: 95 },
      { rsRatio: 105.2, rsMomentum: 110.5 },
    ],
  },
  {
    ticker: "IDXBASIC.JK",
    name: "Basic Materials",
    rsRatio: 98.7,
    rsMomentum: 92.3,
    quadrant: "LAGGING" as const,
    tail: [
      { rsRatio: 100, rsMomentum: 100 },
      { rsRatio: 98.7, rsMomentum: 92.3 },
    ],
  },
]

describe("RRGChart", () => {
  it("renders chart container", () => {
    const { container } = render(<RRGChart sectors={mockSectors} />)
    expect(container.querySelector(".rounded-4xl")).toBeInTheDocument()
  })

  it("renders quadrants as 4 ReferenceArea", () => {
    render(<RRGChart sectors={mockSectors} />)
    expect(screen.getAllByTestId("recharts-ReferenceArea")).toHaveLength(4)
  })

  it("renders 2 ReferenceLines (x=100, y=100)", () => {
    render(<RRGChart sectors={mockSectors} />)
    expect(screen.getAllByTestId("recharts-ReferenceLine")).toHaveLength(2)
  })

  it("passes correct number of data points to Scatter", () => {
    render(<RRGChart sectors={mockSectors} />)
    const scatter = screen.getByTestId("recharts-Scatter")
    expect(scatter).toHaveAttribute("data-records", "2")
  })

  it("renders an empty state when no sectors", () => {
    render(<RRGChart sectors={[]} />)
    expect(screen.getByText("No sector data available")).toBeInTheDocument()
  })
})
