"use client"

import { useCallback, useMemo } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Customized,
  ResponsiveContainer,
} from "recharts"
import type { SectorRRGData } from "@/lib/rrg/rrg-service"

interface RRGChartProps {
  sectors: SectorRRGData[]
}

const SECTOR_COLORS: Record<string, string> = {
  IDXENERGY: "#e6194b",
  IDXBASIC: "#3cb44b",
  IDXINDUST: "#4363d8",
  IDXNONCYC: "#f58231",
  IDXCYCLIC: "#911eb4",
  IDXHEALTH: "#42d4f4",
  IDXFIN: "#f032e6",
  IDXPROP: "#bfef45",
  IDXTECH: "#fabed4",
  IDXINFRA: "#469990",
  IDXTRANS: "#ffe119",
}

function shortLabel(ticker: string): string {
  return ticker.replace(/^IDX/, "").replace(/\.JK$/, "")
}

function sectorColor(ticker: string): string {
  const key = ticker.replace(/\.JK$/, "")
  return SECTOR_COLORS[key] ?? "#888"
}

const QUADRANT_CONFIG = [
  { label: "LEADING", x: 0.7, y: 0.7, fill: "#22c55e", opacity: 0.08 },
  { label: "WEAKENING", x: 0.3, y: 0.7, fill: "#eab308", opacity: 0.08 },
  { label: "LAGGING", x: 0.3, y: 0.3, fill: "#ef4444", opacity: 0.08 },
  { label: "IMPROVING", x: 0.7, y: 0.3, fill: "#3b82f6", opacity: 0.08 },
]

function CustomDot(props: any) {
  const { cx, cy, fill } = props
  if (cx == null || cy == null) return null

  return (
    <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
  )
}

function CustomLabel(props: any) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const { ticker } = payload
  const label = shortLabel(ticker)

  return (
    <text
      x={cx + 10}
      y={cy + 4}
      fontSize={11}
      fontWeight={500}
      fill="currentColor"
      className="fill-foreground"
    >
      {label}
    </text>
  )
}

function QuadrantLabels(props: any) {
  const { width, height, xAxisMap, yAxisMap } = props
  if (!xAxisMap || !yAxisMap) return null

  const xScale = Object.values(xAxisMap)[0] as any
  const yScale = Object.values(yAxisMap)[0] as any
  if (!xScale || !yScale) return null

  const xRange = xScale.scale.range()
  const yRange = yScale.scale.range()
  const xMid = (xRange[0] + xRange[1]) / 2
  const yMid = (yRange[0] + yRange[1]) / 2
  const xPad = (xRange[1] - xRange[0]) * 0.2
  const yPad = (yRange[1] - yRange[0]) * 0.2

  return (
    <g pointerEvents="none" className="fill-muted-foreground/40">
      <text x={xMid + xPad} y={yMid - yPad} textAnchor="middle" fontSize={14} fontWeight={700}>
        LEADING
      </text>
      <text x={xMid - xPad} y={yMid - yPad} textAnchor="middle" fontSize={14} fontWeight={700}>
        WEAKENING
      </text>
      <text x={xMid - xPad} y={yMid + yPad} textAnchor="middle" fontSize={14} fontWeight={700}>
        LAGGING
      </text>
      <text x={xMid + xPad} y={yMid + yPad} textAnchor="middle" fontSize={14} fontWeight={700}>
        IMPROVING
      </text>
    </g>
  )
}

function TailTrajectories(props: any) {
  const { xAxisMap, yAxisMap } = props
  if (!xAxisMap || !yAxisMap) return null

  const xScale = Object.values(xAxisMap)[0] as any
  const yScale = Object.values(yAxisMap)[0] as any
  if (!xScale || !yScale) return null

  const sectors: SectorRRGData[] = props.sectors
  if (!sectors) return null

  return (
    <g pointerEvents="none">
      {sectors.map((s) => {
        if (!s.tail || s.tail.length < 2) return null
        const points = s.tail
          .map((p) => `${xScale.scale(p.rsRatio)},${yScale.scale(p.rsMomentum)}`)
          .join(" ")

        return (
          <polyline
            key={s.ticker}
            points={points}
            fill="none"
            stroke={sectorColor(s.ticker)}
            strokeWidth={1.5}
            strokeOpacity={0.4}
          />
        )
      })}
    </g>
  )
}

function fmt(value: number | null | undefined, digits: number): string {
  if (value == null || isNaN(value)) return "—"
  return value.toFixed(digits)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const d = payload[0].payload
  return (
    <div className="rounded-xl bg-card px-4 py-3 shadow-lg ring-1 ring-border text-sm space-y-1">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">
        RS-Ratio: <span className="font-medium tabular-nums text-foreground">{fmt(d.x, 2)}</span>
      </p>
      <p className="text-muted-foreground">
        RS-Momentum:{" "}
        <span className="font-medium tabular-nums text-foreground">{fmt(d.y, 2)}</span>
      </p>
      <p className="text-muted-foreground">
        Quadrant:{" "}
        <span className="font-medium text-foreground">{d.quadrant}</span>
      </p>
    </div>
  )
}

export function RRGChart({ sectors }: RRGChartProps) {
  const chartData = useMemo(
    () =>
      sectors.map((s) => ({
        x: s.rsRatio,
        y: s.rsMomentum,
        ticker: s.ticker,
        name: s.name,
        quadrant: s.quadrant,
        fill: sectorColor(s.ticker),
      })),
    [sectors],
  )

  if (!sectors.length) {
    return (
      <div className="flex items-center justify-center h-64 rounded-4xl bg-muted/30 ring-1 ring-border text-muted-foreground">
        No sector data available
      </div>
    )
  }

  return (
    <div className="rounded-4xl bg-muted/30 ring-1 ring-border p-4 md:p-6">
      <ResponsiveContainer width="100%" aspect={1} minWidth={320} initialDimension={{ width: 320, height: 320 }}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name="RS-Ratio"
            domain={["dataMin - 10", "dataMax + 10"]}
            tick={{ fontSize: 12 }}
            label={{ value: "RS-Ratio", position: "bottom", offset: 0, fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="RS-Momentum"
            domain={["dataMin - 10", "dataMax + 10"]}
            tick={{ fontSize: 12 }}
            label={{ value: "RS-Momentum", angle: -90, position: "left", offset: 0, fontSize: 12 }}
          />

          {QUADRANT_CONFIG.map((q) => (
            <ReferenceArea
              key={q.label}
              x1={q.x === 0.3 ? "dataMin" : 100}
              x2={q.x === 0.3 ? 100 : "dataMax"}
              y1={q.y === 0.3 ? "dataMin" : 100}
              y2={q.y === 0.3 ? 100 : "dataMax"}
              fill={q.fill}
              fillOpacity={q.opacity}
            />
          ))}

          <ReferenceLine x={100} stroke="var(--border)" strokeWidth={1.5} />
          <ReferenceLine y={100} stroke="var(--border)" strokeWidth={1.5} />

          <Tooltip content={<CustomTooltip />} cursor={false} />

          <Scatter
            data={chartData}
            shape={<CustomDot />}
            label={<CustomLabel />}
            isAnimationActive={false}
          />

          <Customized component={(props: any) => <TailTrajectories {...props} sectors={sectors} />} />
          <Customized component={QuadrantLabels} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
