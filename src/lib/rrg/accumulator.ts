import { getRedis } from "@/lib/redis"
import { CACHE_KEYS, CLOSES_TTL } from "./constants"

export async function storeClose(
  ticker: string,
  date: string,
  price: number,
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const key = CACHE_KEYS.closes(ticker)
    await redis.hset(key, { [date]: price })
    await redis.expire(key, CLOSES_TTL)
  } catch {
    // Redis unavailable — swallow
  }
}

export async function readAccumulatedCloses(
  ticker: string,
): Promise<number[]> {
  const redis = getRedis()
  if (!redis) return []

  try {
    const data = await redis.hgetall<Record<string, string>>(CACHE_KEYS.closes(ticker))
    if (!data || Object.keys(data).length === 0) return []

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, price]) => parseFloat(price))
      .filter((p) => !isNaN(p))
  } catch {
    return []
  }
}

export async function readAccumulatedClosesWithDates(
  ticker: string,
): Promise<{ date: string; close: number }[]> {
  const redis = getRedis()
  if (!redis) return []

  try {
    const data = await redis.hgetall<Record<string, string>>(CACHE_KEYS.closes(ticker))
    if (!data || Object.keys(data).length === 0) return []

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, price]) => ({ date, close: parseFloat(price) }))
      .filter((item) => !isNaN(item.close))
  } catch {
    return []
  }
}

export async function getAccumulatedCount(ticker: string): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const data = await redis.hgetall<Record<string, string>>(CACHE_KEYS.closes(ticker))
    if (!data) return 0
    return Object.keys(data).length
  } catch {
    return 0
  }
}
