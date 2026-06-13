import { getRedis } from "@/lib/redis"
import { computeRRG } from "./calculations"
import { readAccumulatedClosesWithDates } from "./accumulator"
import { SECTOR_TICKERS, CACHE_KEYS, getAdaptiveTTL } from "./constants"
import { Quadrant, type RRGTimeframe, type TailPoint } from "./types"

export interface SectorRRGData {
  ticker: string
  name: string
  rsRatio: number
  rsMomentum: number
  quadrant: Quadrant
  tail: TailPoint[]
}

export interface RRGApiResponse {
  timeframe: RRGTimeframe
  computed_at: string
  stale: boolean
  dataAvailable: boolean
  sectors: SectorRRGData[]
}

const MIN_CLOSES_FOR_RRG = 30

function aggregateWeekly(
  dailyData: { date: string; close: number }[],
): number[] {
  const weekly = new Map<string, number>()
  for (const { date, close } of dailyData) {
    const d = new Date(date + "T00:00:00Z")
    const dayOfWeek = d.getUTCDay()
    const monday = new Date(d)
    const offset = (dayOfWeek + 6) % 7
    monday.setUTCDate(d.getUTCDate() - offset)
    const weekKey = monday.toISOString().slice(0, 10)
    weekly.set(weekKey, close)
  }
  return Array.from(weekly.values())
}

async function computeFromAccumulator(
  timeframe: RRGTimeframe,
): Promise<RRGApiResponse | null> {
  const ihsgDaily = await readAccumulatedClosesWithDates("^JKSE")
  if (ihsgDaily.length < MIN_CLOSES_FOR_RRG) return null

  const ihsgCloses = timeframe === "weekly"
    ? aggregateWeekly(ihsgDaily)
    : ihsgDaily.map((d) => d.close)

  const sectorTickers = SECTOR_TICKERS.filter((t) => t.ticker !== "^JKSE")
  const sectors: SectorRRGData[] = []

  for (const t of sectorTickers) {
    const sectorDaily = await readAccumulatedClosesWithDates(t.ticker)
    if (sectorDaily.length < MIN_CLOSES_FOR_RRG) return null

    const sectorCloses = timeframe === "weekly"
      ? aggregateWeekly(sectorDaily)
      : sectorDaily.map((d) => d.close)

    const result = computeRRG(sectorCloses, ihsgCloses, timeframe)
    const safeTail = result.tail.map((p) => ({
      rsRatio: isNaN(p.rsRatio) ? 100 : p.rsRatio,
      rsMomentum: isNaN(p.rsMomentum) ? 100 : p.rsMomentum,
    }))
    sectors.push({
      ticker: t.ticker,
      name: t.name,
      rsRatio: isNaN(result.rsRatio) ? 100 : result.rsRatio,
      rsMomentum: isNaN(result.rsMomentum) ? 100 : result.rsMomentum,
      quadrant: result.quadrant,
      tail: safeTail,
    })
  }

  return {
    timeframe,
    computed_at: new Date().toISOString(),
    stale: false,
    dataAvailable: true,
    sectors,
  }
}

export async function getRRGData(
  timeframe: RRGTimeframe,
): Promise<RRGApiResponse> {
  const cacheKey = CACHE_KEYS.rrg(timeframe)
  const redis = getRedis()

  if (redis) {
    try {
      const cached = await redis.get<RRGApiResponse>(cacheKey)
      if (cached) return cached
    } catch {
      // Redis unavailable — fall through
    }
  }

  const fromAccumulator = await computeFromAccumulator(timeframe)
  if (fromAccumulator) {
    if (redis) {
      redis
        .set(cacheKey, fromAccumulator, { ex: getAdaptiveTTL() })
        .catch(() => {})
    }
    return fromAccumulator
  }

  const stale = redis
    ? await redis.get<RRGApiResponse>(cacheKey).catch(() => null)
    : null
  if (stale) {
    return { ...stale, stale: true, dataAvailable: true }
  }

  return {
    timeframe,
    computed_at: new Date().toISOString(),
    stale: false,
    dataAvailable: false,
    sectors: [],
  }
}
