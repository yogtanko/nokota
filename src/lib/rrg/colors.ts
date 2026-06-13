export const QUADRANT_STYLES = {
  LEADING:    "bg-chart-7/10 text-chart-7 border-chart-7/20",
  WEAKENING:  "bg-primary/10 text-primary border-primary/20",
  LAGGING:    "bg-destructive/10 text-destructive border-destructive/20",
  IMPROVING:  "bg-chart-9/10 text-chart-9 border-chart-9/20",
} as const

export const QUADRANT_FILLS = {
  LEADING:    "var(--chart-7)",
  WEAKENING:  "var(--primary)",
  LAGGING:    "var(--destructive)",
  IMPROVING:  "var(--chart-9)",
} as const

export type QuadrantKey = keyof typeof QUADRANT_STYLES
