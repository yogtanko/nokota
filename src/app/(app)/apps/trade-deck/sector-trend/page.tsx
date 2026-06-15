"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { RRGToolbar } from "@/components/rrg-toolbar"
import { RRGSkeleton } from "@/components/rrg-skeleton"
import { RRGComingSoon } from "@/components/rrg-coming-soon"
import { ErrorBoundary } from "@/components/error-boundary"
import type { RRGApiResponse } from "@/lib/rrg/rrg-service"
import type { RRGTimeframe } from "@/lib/rrg/types"
import { useState, useEffect } from "react"

const RRGChart = dynamic(() => import("@/components/rrg-chart").then((m) => ({ default: m.RRGChart })), {
  ssr: false,
  loading: () => <div className="lg:w-2/5 aspect-square rounded-4xl bg-muted/30 ring-1 ring-border animate-pulse" />,
})

const RRGTable = dynamic(() => import("@/components/rrg-table").then((m) => ({ default: m.RRGTable })), {
  ssr: false,
  loading: () => <div className="lg:w-3/5 h-96 rounded-4xl bg-muted/30 ring-1 ring-border animate-pulse" />,
})

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SectorTrendPage() {
  const [timeframe, setTimeframe] = useState<RRGTimeframe>("daily")
  const [showTabSkeleton, setShowTabSkeleton] = useState(false)

  const { data, error, isLoading } = useSWR<RRGApiResponse>(
    `/api/rrg?timeframe=${timeframe}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 15000,
      errorRetryCount: 3,
      keepPreviousData: true,
    },
  )

  useEffect(() => {
    if (isLoading && data) {
      const timer = setTimeout(() => setShowTabSkeleton(true), 300)
      return () => clearTimeout(timer)
    }
    setShowTabSkeleton(false)
  }, [isLoading, data])

  return (
    <ErrorBoundary>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-7xl mx-auto w-full gap-6">
        <RRGToolbar
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          stale={data?.stale}
          computedAt={data?.computed_at}
        />

        {isLoading && !data ? (
          <RRGSkeleton />
        ) : showTabSkeleton ? (
          <RRGSkeleton />
        ) : error && !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-lg font-medium">Failed to load sector data</p>
            <p className="text-sm text-muted-foreground">
              The RRG data service is currently unavailable. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : data && !data.dataAvailable ? (
          <RRGComingSoon />
        ) : data ? (
          <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/5 min-w-[320px]">
            <RRGChart sectors={data.sectors} />
          </div>
            <div className="lg:w-3/5">
              <div className="rounded-4xl bg-muted/30 ring-1 ring-border overflow-hidden">
                <RRGTable sectors={data.sectors} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  )
}
