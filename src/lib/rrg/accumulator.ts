import { getRedis } from "@/lib/redis"
import { CACHE_KEYS, CLOSES_TTL, TRIM_THRESHOLD } from "./constants"

async function trimHash(key: string, redis: NonNullable<ReturnType<typeof getRedis>>): Promise<void> {
  try {
    const count = await redis.hlen(key)
    if (count <= TRIM_THRESHOLD) return

    const fields = await redis.hkeys(key)
    fields.sort()
    const toRemove = fields.slice(0, fields.length - TRIM_THRESHOLD)
    if (toRemove.length > 0) {
      await redis.hdel(key, ...toRemove)
    }
  } catch {
    // trim best-effort
  }
}

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
    await trimHash(key, redis)
  } catch {
    // Redis unavailable — swallow
  }
}

export async function storeWeeklyClose(
  ticker: string,
  weekKey: string,
  price: number,
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const key = CACHE_KEYS.weeklyCloses(ticker)
    await redis.hset(key, { [weekKey]: price })
    await redis.expire(key, CLOSES_TTL)
    await trimHash(key, redis)
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

export async function readWeeklyClosesWithDates(
  ticker: string,
): Promise<{ date: string; close: number }[]> {
  const redis = getRedis()
  if (!redis) return []

  try {
    const data = await redis.hgetall<Record<string, string>>(CACHE_KEYS.weeklyCloses(ticker))
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
