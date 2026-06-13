/**
 * seed-rrg-closes.ts
 *
 * Loads IDX historical closes from data/idx-closes.csv into Redis,
 * then invalidates RRG cache so next page load recomputes.
 *
 * Usage: npx tsx scripts/seed-rrg-closes.ts
 * Requires: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
 */
import { readFileSync } from "fs"
import { join } from "path"
import { Redis } from "@upstash/redis"

const CSV_PATH = join(import.meta.dirname, "..", "data", "idx-closes.csv")
const WEEKLY_CSV_PATH = join(import.meta.dirname, "..", "data", "idx-weekly-closes.csv")

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("ERROR: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required in .env")
  process.exit(1)
}

const CLOSES_TTL = 158 * 86400 // 158 days
const RRG_DAILY_KEY = "rrg:daily"
const RRG_WEEKLY_KEY = "rrg:weekly"
const RRG_OHLCV_PREFIX = "idx:"

const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })

async function main() {
  console.log("🚀 Seeding RRG closes into Redis\n")

  // Read CSV
  const csv = readFileSync(CSV_PATH, "utf-8").trim()
  const lines = csv.split("\n").slice(1) // skip header

  console.log(`📄 Read ${lines.length} rows from ${CSV_PATH}`)

  // Group by ticker
  const byTicker = new Map<string, { date: string; close: number }[]>()
  for (const line of lines) {
    const [ticker, date, closeStr] = line.split(",")
    const close = Number(closeStr)
    if (isNaN(close)) {
      console.warn(`  ⚠ Skipping invalid row: ${line}`)
      continue
    }
    if (!byTicker.has(ticker)) byTicker.set(ticker, [])
    byTicker.get(ticker)!.push({ date, close })
  }

  console.log(`📊 ${byTicker.size} tickers to seed\n`)

  // Store each ticker's closes in a Redis Hash
  for (const [ticker, closes] of byTicker) {
    const key = `idx:close:${ticker}`
    const entries: Record<string, number> = {}
    for (const c of closes) {
      entries[c.date] = c.close
    }

    console.log(`  Storing ${closes.length} closes for ${ticker}...`)
    await redis.hset(key, entries)
    await redis.expire(key, CLOSES_TTL)
    console.log(`  ✅ ${ticker}: ${closes.length} closes stored (TTL: ${CLOSES_TTL}s)`)
  }

  // Seed weekly closes
  console.log("\n📅 Seeding weekly closes...")

  // Aggregate daily → weekly for every ticker (^JKSE from CSV, others overwritten by iTick data)
  const weeklyByTicker = new Map<string, { date: string; close: number }[]>()
  for (const [ticker, closes] of byTicker) {
    const weekly = new Map<string, number>()
    for (const { date, close } of closes) {
      const d = new Date(date + "T00:00:00Z")
      const monday = new Date(d)
      const offset = (d.getUTCDay() + 6) % 7
      monday.setUTCDate(d.getUTCDate() - offset)
      const weekKey = monday.toISOString().slice(0, 10)
      weekly.set(weekKey, close)
    }
    weeklyByTicker.set(ticker, Array.from(weekly.entries()).map(([date, close]) => ({ date, close })).sort((a, b) => a.date.localeCompare(b.date)))
  }

  // Read iTick weekly CSV and overwrite sector data (128 weeks each)
  try {
    const weeklyCsv = readFileSync(WEEKLY_CSV_PATH, "utf-8").trim()
    const weeklyLines = weeklyCsv.split("\n").slice(1)
    console.log(`📄 Read ${weeklyLines.length} rows from ${WEEKLY_CSV_PATH}`)

    for (const line of weeklyLines) {
      const [ticker, date, closeStr] = line.split(",")
      const close = Number(closeStr)
      if (isNaN(close)) continue
      if (!weeklyByTicker.has(ticker)) weeklyByTicker.set(ticker, [])
      weeklyByTicker.get(ticker)!.push({ date, close })
    }
  } catch {
    console.log("  ⚠ Weekly CSV not found, using aggregated data only")
  }

  // Store all weekly closes
  for (const [ticker, closes] of weeklyByTicker) {
    const deduped = new Map<string, number>()
    for (const c of closes) deduped.set(c.date, c.close)
    const sorted = Array.from(deduped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, close]) => ({ date, close }))

    const key = `idx:close:${ticker}:weekly`
    const entries: Record<string, number> = {}
    for (const c of sorted) entries[c.date] = c.close
    await redis.hset(key, entries)
    await redis.expire(key, 158 * 86400)
    console.log(`  ✅ ${ticker}: ${sorted.length} weeks (${sorted[0].date} ~ ${sorted[sorted.length - 1].date})`)
  }

  // Invalidate RRG cache
  console.log("\n🧹 Invalidating RRG cache...")
  await redis.del(RRG_DAILY_KEY)
  console.log(`  ✅ Deleted ${RRG_DAILY_KEY}`)
  await redis.del(RRG_WEEKLY_KEY)
  console.log(`  ✅ Deleted ${RRG_WEEKLY_KEY}`)

  // Also invalidate any cached OHLCV data
  let deleted = 0
  for (const [ticker] of byTicker) {
    for (const tf of ["daily", "weekly"]) {
      const ohlcvKey = `${RRG_OHLCV_PREFIX}${ticker}:ohlcv:${tf}`
      await redis.del(ohlcvKey)
      deleted++
    }
  }
  console.log(`  ✅ Deleted ${deleted} OHLCV cache entries`)

  console.log("\n📊 Summary:")
  for (const [ticker, closes] of byTicker) {
    const first = closes[0]
    const last = closes[closes.length - 1]
    console.log(`  ${ticker}: ${closes.length} closes (${first.date} ~ ${last.date})`)
  }
  console.log("\n⚠ Cold-start sectors (not seeded, will accumulate via cron): IDXPROP.JK, IDXTECH.JK")
  console.log(`\n🏁 Done. Next: verify at GET /api/rrg?timeframe=daily`)
}

main().catch(console.error)
