import { getRedis } from "@/lib/redis"
import { fetchSectorOHLCV } from "./sector-data"
import { computeRRG } from "./calculations"
import { readAccumulatedCloses } from "./accumulator"
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

async function fetchAndCompute(
  timeframe: RRGTimeframe,
): Promise<RRGApiResponse> {
  const ohlcvMap = await fetchSectorOHLCV(timeframe)

  const ihsgCloses = ohlcvMap.get("^JKSE") ?? []
  const sectorTickers = SECTOR_TICKERS.filter((t) => t.ticker !== "^JKSE")

  const sectors: SectorRRGData[] = []

  for (const t of sectorTickers) {
    const sectorCloses = ohlcvMap.get(t.ticker) ?? []
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

const MIN_CLOSES_FOR_RRG = 30

async function computeFromAccumulator(
  timeframe: RRGTimeframe,
): Promise<RRGApiResponse | null> {
  if (timeframe === "weekly") return null

  const ihsgCloses = await readAccumulatedCloses("^JKSE")
  if (ihsgCloses.length < MIN_CLOSES_FOR_RRG) return null

  const sectorTickers = SECTOR_TICKERS.filter((t) => t.ticker !== "^JKSE")
  const sectors: SectorRRGData[] = []

  for (const t of sectorTickers) {
    const sectorCloses = await readAccumulatedCloses(t.ticker)
    if (sectorCloses.length < MIN_CLOSES_FOR_RRG) return null

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

  if (timeframe === "weekly") {
    try {
      const result = await fetchAndCompute(timeframe)
      if (redis) {
        redis.set(cacheKey, result, { ex: getAdaptiveTTL() }).catch(() => {})
      }
      return result
    } catch (err) {
      throw err
    }
  }

  return {
    timeframe,
    computed_at: new Date().toISOString(),
    stale: false,
    dataAvailable: false,
    sectors: [],
  }
}
