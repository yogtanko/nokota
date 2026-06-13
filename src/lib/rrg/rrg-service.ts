import { getRedis } from "@/lib/redis"
import { fetchSectorOHLCV } from "./sector-data"
import { computeRRG } from "./calculations"
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
    sectors.push({
      ticker: t.ticker,
      name: t.name,
      rsRatio: result.rsRatio,
      rsMomentum: result.rsMomentum,
      quadrant: result.quadrant,
      tail: result.tail,
    })
  }

  return {
    timeframe,
    computed_at: new Date().toISOString(),
    stale: false,
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

  try {
    const result = await fetchAndCompute(timeframe)

    if (redis) {
      redis
        .set(cacheKey, result, { ex: getAdaptiveTTL() })
        .catch(() => {})
    }

    return result
  } catch (err) {
    if (redis) {
      try {
        const stale = await redis.get<RRGApiResponse>(cacheKey)
        if (stale) {
          return { ...stale, stale: true }
        }
      } catch {
        // Stale cache unavailable too
      }
    }
    throw err
  }
}
