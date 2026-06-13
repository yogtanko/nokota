"use client"

import type { RRGTimeframe } from "@/lib/rrg/types"
import { cn } from "@/lib/utils"
import { IconClock } from "@tabler/icons-react"

interface RRGToolbarProps {
  timeframe: RRGTimeframe
  onTimeframeChange: (tf: RRGTimeframe) => void
  stale?: boolean
  computedAt?: string
}

export function RRGToolbar({
  timeframe,
  onTimeframeChange,
  stale,
  computedAt,
}: RRGToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SektorTrend</h1>
          <p className="text-muted-foreground">
            Relative Rotation Graph for IDX sectors vs IHSG
          </p>
        </div>

        <div
          role="group"
          aria-label="Timeframe selection"
          className="inline-flex rounded-full border bg-muted p-0.5"
        >
          <button
            onClick={() => onTimeframeChange("daily")}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full font-medium transition-all",
              timeframe === "daily"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Daily
          </button>
          <button
            onClick={() => onTimeframeChange("weekly")}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full font-medium transition-all",
              timeframe === "weekly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Weekly
          </button>
        </div>
      </div>

      {stale && computedAt && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          <IconClock size={16} className="shrink-0" />
          <span>
            Data loaded is not real-time — last updated at{" "}
            {new Date(computedAt).toLocaleString("id-ID")}
          </span>
        </div>
      )}
    </div>
  )
}
