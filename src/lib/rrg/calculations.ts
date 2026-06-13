import { Quadrant, RRGResult, RRGTimeframe, TailPoint } from "./types"

const RRG_CONFIG = {
  daily: { emaPeriod: 21, rocPeriod: 8 },
  weekly: { emaPeriod: 55, rocPeriod: 21 },
} as const

export function computeRawRSRatio(
  sectorCloses: number[],
  ihsgCloses: number[],
): number[] {
  const len = Math.min(sectorCloses.length, ihsgCloses.length)
  const result: number[] = []
  for (let i = 0; i < len; i++) {
    result.push((sectorCloses[i] / ihsgCloses[i]) * 100)
  }
  return result
}

export function ema(values: number[], period: number): number[] {
  if (period < 1) return [...values]
  const k = 2 / (period + 1)
  const result: number[] = []

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
    } else if (i === period - 1) {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += values[j]
      }
      result.push(sum / period)
    } else {
      result.push(values[i] * k + result[i - 1] * (1 - k))
    }
  }

  return result
}

export function roc(values: number[], period: number): number[] {
  const result: number[] = []

  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      result.push(NaN)
    } else {
      const prev = values[i - period]
      result.push(((values[i] - prev) / prev) * 100)
    }
  }

  return result
}

export function zScore(values: number[], window: number): number[] {
  const result: number[] = []

  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(NaN)
    } else {
      let sum = 0
      const start = i - window + 1
      for (let j = start; j <= i; j++) {
        sum += values[j]
      }
      const mean = sum / window

      let sqSum = 0
      for (let j = start; j <= i; j++) {
        sqSum += (values[j] - mean) ** 2
      }
      const stddev = Math.sqrt(sqSum / window)

      if (stddev === 0) {
        result.push(0)
      } else {
        result.push((values[i] - mean) / stddev)
      }
    }
  }

  return result
}

export function normalizeMomentum(zScores: number[]): number[] {
  return zScores.map((z) => z * 10 + 100)
}

export function mapQuadrant(
  rsRatio: number,
  rsMomentum: number,
): Quadrant {
  if (rsRatio >= 100 && rsMomentum >= 100) return Quadrant.LEADING
  if (rsRatio >= 100 && rsMomentum < 100) return Quadrant.WEAKENING
  if (rsRatio < 100 && rsMomentum < 100) return Quadrant.LAGGING
  return Quadrant.IMPROVING
}

export function computeTail(
  rsRatios: number[],
  rsMomentums: number[],
  periods: number = 5,
): TailPoint[] {
  const valid: TailPoint[] = []
  const len = Math.min(rsRatios.length, rsMomentums.length)
  for (let i = 0; i < len; i++) {
    if (!isNaN(rsRatios[i]) && !isNaN(rsMomentums[i])) {
      valid.push({ rsRatio: rsRatios[i], rsMomentum: rsMomentums[i] })
    }
  }
  return valid.slice(-periods)
}

function lastValid(values: number[]): number {
  for (let i = values.length - 1; i >= 0; i--) {
    if (!isNaN(values[i])) return values[i]
  }
  return NaN
}

export function computeRRG(
  sectorCloses: number[],
  ihsgCloses: number[],
  timeframe: RRGTimeframe,
): RRGResult {
  const config = RRG_CONFIG[timeframe]
  const raw = computeRawRSRatio(sectorCloses, ihsgCloses)
  const smoothed = ema(raw, config.emaPeriod)
  const momentumRaw = roc(smoothed, config.rocPeriod)
  const momentumZScores = zScore(momentumRaw, 50)
  const momentumNorm = normalizeMomentum(momentumZScores)

  const rsRatio = lastValid(smoothed)
  const rsMomentum = lastValid(momentumNorm)

  const quadrant = mapQuadrant(rsRatio, rsMomentum)
  const tail = computeTail(smoothed, momentumNorm)

  return { rsRatio, rsMomentum, quadrant, tail }
}
