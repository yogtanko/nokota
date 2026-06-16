"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { QUADRANT_STYLES, QUADRANT_FILLS } from "@/lib/rrg";
import type { SectorRRGData } from "@/lib/rrg/rrg-service";

interface RRGChartProps {
  sectors: SectorRRGData[];
}

const DOT_COLOR = "var(--foreground)";

function shortLabel(ticker: string): string {
  return ticker.replace(/^IDX/, "").replace(/\.JK$/, "");
}

const QUADRANT_CONFIG = [
  {
    label: "LEADING",
    x: 0.7,
    y: 0.7,
    fill: QUADRANT_FILLS.LEADING,
    opacity: 0.12,
  },
  {
    label: "IMPROVING",
    x: 0.3,
    y: 0.7,
    fill: QUADRANT_FILLS.IMPROVING,
    opacity: 0.12,
  },
  {
    label: "LAGGING",
    x: 0.3,
    y: 0.3,
    fill: QUADRANT_FILLS.LAGGING,
    opacity: 0.12,
  },
  {
    label: "WEAKENING",
    x: 0.7,
    y: 0.3,
    fill: QUADRANT_FILLS.WEAKENING,
    opacity: 0.12,
  },
];

function CustomDot(props: any) {
  const { cx, cy, fill } = props;
  if (cx == null || cy == null) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={fill}
      stroke="var(--background)"
      strokeWidth={2}
    />
  );
}

function CustomLabel(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const { ticker } = payload;
  const label = shortLabel(ticker);

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
  );
}

function fmt(value: number | null | undefined, digits: number): string {
  if (value == null || isNaN(value)) return "—";
  return value.toFixed(digits);
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-card px-4 py-3 shadow-lg ring-1 ring-border text-sm space-y-1.5">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">
        RS-Ratio:{" "}
        <span className="font-medium tabular-nums text-foreground">
          {fmt(d.x, 2)}
        </span>
      </p>
      <p className="text-muted-foreground">
        RS-Momentum:{" "}
        <span className="font-medium tabular-nums text-foreground">
          {fmt(d.y, 2)}
        </span>
      </p>
      <div>
        <span
          className={cn(
            "inline-block px-2 py-0.5 rounded-full text-xs font-medium border",
            QUADRANT_STYLES[d.quadrant as keyof typeof QUADRANT_STYLES],
          )}
        >
          {d.quadrant}
        </span>
      </div>
    </div>
  );
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
        fill: DOT_COLOR,
      })),
    [sectors],
  );

  const chartLayout = useMemo(() => {
    const xs = chartData.map((d) => d.x);
    const ys = chartData.map((d) => d.y);
    const build = (values: number[]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const dev = Math.max(Math.abs(min - 100), Math.abs(max - 100));
      const pad = 10;
      return {
        domain: [100 - dev - pad, 100 + dev + pad] as [number, number],
        ticks: [100 - dev - pad, 100, 100 + dev + pad],
      };
    };
    return { x: build(xs), y: build(ys) };
  }, [chartData]);

  if (!sectors.length) {
    return (
      <div className="flex items-center justify-center h-64 rounded-4xl bg-muted/30 ring-1 ring-border text-muted-foreground">
        No sector data available
      </div>
    );
  }

  return (
    <div
      className="rounded-4xl bg-gradient-to-br from-muted/30 to-muted/50 ring-1 ring-border p-4 md:p-6"
      onMouseDown={(e) => {
        // Prevent focus on click
        e.preventDefault();
      }}
    >
      <div className="flex justify-center gap-2 pb-4">
        {QUADRANT_CONFIG.map((q) => (
          <span
            key={q.label}
            className={cn(
              "inline-block px-2 py-0.5 rounded-full text-xs font-medium border",
              QUADRANT_STYLES[q.label as keyof typeof QUADRANT_STYLES],
            )}
          >
            {q.label}
          </span>
        ))}
      </div>
      <ResponsiveContainer
        width="100%"
        aspect={1}
        minWidth={320}
        initialDimension={{ width: 320, height: 320 }}
      >
        <ScatterChart margin={{ top: 0, right: 5, bottom: 15, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name="RS-Ratio"
            domain={chartLayout.x.domain}
            ticks={chartLayout.x.ticks}
            allowDataOverflow
            tickFormatter={() => ""}
            label={{
              value: "RS-Ratio",
              position: "bottom",
              offset: 0,
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="RS-Momentum"
            domain={chartLayout.y.domain}
            ticks={chartLayout.y.ticks}
            allowDataOverflow
            tickFormatter={() => ""}
            label={{
              value: "RS-Momentum",
              angle: -90,
              position: "left",
              offset: 0,
              fontSize: 11,
            }}
          />

          {QUADRANT_CONFIG.map((q) => (
            <ReferenceArea
              key={q.label}
              x1={q.x === 0.3 ? chartLayout.x.domain[0] : 100}
              x2={q.x === 0.3 ? 100 : chartLayout.x.domain[1]}
              y1={q.y === 0.3 ? chartLayout.y.domain[0] : 100}
              y2={q.y === 0.3 ? 100 : chartLayout.y.domain[1]}
              fill={q.fill}
              fillOpacity={q.opacity}
            />
          ))}

          <Tooltip
            content={<CustomTooltip />}
            cursor={false}
            isAnimationActive={false}
          />

          <Scatter
            data={chartData}
            shape={<CustomDot />}
            label={<CustomLabel />}
            isAnimationActive={false}
          />

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
