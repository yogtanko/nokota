"use client";

import { IconChartDots3 } from "@tabler/icons-react";

export function RRGComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-4xl bg-muted/30 ring-1 ring-border text-center gap-5">
      <div className="rounded-full bg-muted p-4 ring-1 ring-border">
        <IconChartDots3 size={36} className="text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">
          Work in Progress
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          SektorTrend is accumulating daily closing prices for IDX sector
          indices. The RRG chart and table will become available once enough
          historical data has been collected (approximately 30 trading days).
        </p>
      </div>
    </div>
  );
}
