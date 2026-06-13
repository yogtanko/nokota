export enum Quadrant {
  LEADING = "LEADING",
  WEAKENING = "WEAKENING",
  LAGGING = "LAGGING",
  IMPROVING = "IMPROVING",
}

export interface TailPoint {
  rsRatio: number
  rsMomentum: number
}

export type RRGTimeframe = "daily" | "weekly"

export interface RRGResult {
  rsRatio: number
  rsMomentum: number
  quadrant: Quadrant
  tail: TailPoint[]
}
