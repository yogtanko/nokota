/**
 * fetch-idx-history.ts
 *
 * Fetches 128 daily klines from iTick API for IDX sector indices (9 of 11 available),
 * plus ^JKSE via yf.chart(). Outputs data/idx-closes.csv.
 *
 * Strategy:
 *   - Individual requests per ticker (batch endpoint is capped on free tier)
 *   - 5 req/min limit → 15s spacing, retry on 429 after 65s
 *   - ^JKSE via yahoo-finance2 chart()
 *
 * Usage: ITICK_API_KEY=xxx npx tsx scripts/fetch-idx-history.ts
 */
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const API_KEY = process.env.ITICK_API_KEY
if (!API_KEY) {
  console.error("ERROR: ITICK_API_KEY environment variable is required")
  process.exit(1)
}

const BASE = "https://api-free.itick.org"
const HEADERS = { token: API_KEY, accept: "application/json" }
const LIMIT = 128
const CSV_PATH = join(import.meta.dirname, "..", "data", "idx-closes.csv")
const WEEKLY_CSV_PATH = join(import.meta.dirname, "..", "data", "idx-weekly-closes.csv")

const ITICK_TICKERS: [itickCode: string, yahooTicker: string][] = [
  ["IDXENERGY", "IDXENERGY.JK"],
  ["IDXBASIC", "IDXBASIC.JK"],
  ["IDXINDUST", "IDXINDUST.JK"],
  ["IDXNONCYC", "IDXNONCYC.JK"],
  ["IDXCYCLIC", "IDXCYCLIC.JK"],
  ["IDXHEALTH", "IDXHEALTH.JK"],
  ["IDXFINANCE", "IDXFIN.JK"],
  ["IDXPROPERT", "IDXPROP.JK"],
  ["IDXTECHNO", "IDXTECH.JK"],
  ["IDXINFRA", "IDXINFRA.JK"],
  ["IDXTRANS", "IDXTRANS.JK"],
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchOne(
  itickCode: string,
  yahooTicker: string,
): Promise<{ date: string; close: number }[] | null> {
  const url = `${BASE}/stock/kline?region=ID&code=${itickCode}&kType=8&limit=${LIMIT}`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      const text = await res.text()

      if (text.includes("request limit exceeded")) {
        console.warn(`  ⏳ ${yahooTicker}: rate limited, waiting 65s...`)
        await sleep(65000)
        continue
      }

      const body = JSON.parse(text)
      if (body.code !== 0) {
        console.warn(`  ❌ ${yahooTicker}: API code=${body.code} msg=${body.msg}`)
        return null
      }

      const klines = body.data as { t: number; c: number }[]
      if (!Array.isArray(klines) || klines.length === 0) {
        console.warn(`  ⚠ ${yahooTicker}: no data`)
        return null
      }

      return klines
        .map((k) => ({ date: new Date(k.t).toISOString().slice(0, 10), close: k.c }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (err) {
      console.error(`  💥 ${yahooTicker}: ${err instanceof Error ? err.message : String(err)}`)
      return null
    }
  }

  console.error(`  💥 ${yahooTicker}: failed after retries`)
  return null
}

async function fetchOneWeekly(
  itickCode: string,
  yahooTicker: string,
): Promise<{ date: string; close: number }[] | null> {
  const url = `${BASE}/stock/kline?region=ID&code=${itickCode}&kType=9&limit=${LIMIT}`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      const text = await res.text()
      if (text.includes("request limit exceeded")) {
        console.warn(`  ⏳ ${yahooTicker}: rate limited, waiting 65s...`)
        await sleep(65000)
        continue
      }
      const body = JSON.parse(text)
      if (body.code !== 0 || !Array.isArray(body.data) || body.data.length === 0) {
        console.warn(`  ❌ ${yahooTicker}: no weekly data`)
        return null
      }
      return body.data
        .map((k: { t: number; c: number }) => ({ date: new Date(k.t).toISOString().slice(0, 10), close: k.c }))
        .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))
    } catch (err) {
      console.error(`  💥 ${yahooTicker}: ${err instanceof Error ? err.message : String(err)}`)
      return null
    }
  }
  return null
}

async function fetchYahooJKSE(): Promise<{ date: string; close: number }[] | null> {
  console.log("\n📡 Fetching ^JKSE via Yahoo Finance chart...")
  try {
    const { default: YahooFinance } = await import("yahoo-finance2")
    const yf = new YahooFinance()
    const chart = await yf.chart("^JKSE", { period1: "2022-01-01", interval: "1d" })
    const quotes = chart.quotes ?? []
    const closes = quotes
      .filter((q): q is { date: Date; close: number } & typeof q =>
        q.close != null && q.date != null
      )
      .map((q) => ({
        date: new Date(q.date).toISOString().slice(0, 10),
        close: q.close,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    console.log(`  ✅ ^JKSE: ${closes.length} closes`)
    return closes
  } catch (err) {
    console.error(`  ❌ ^JKSE: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function main() {
  console.log("🚀 Fetching IDX historical closes\n")
  mkdirSync(join(import.meta.dirname, "..", "data"), { recursive: true })

  const allCloses: Record<string, { date: string; close: number }[]> = {}

  // Phase 1: iTick individual requests with 15s spacing
  for (let i = 0; i < ITICK_TICKERS.length; i++) {
    const [itickCode, yahooTicker] = ITICK_TICKERS[i]
    console.log(`[${i + 1}/${ITICK_TICKERS.length}] ${yahooTicker}...`)

    const closes = await fetchOne(itickCode, yahooTicker)
    if (closes) {
      allCloses[yahooTicker] = closes
      console.log(`  ✅ ${yahooTicker}: ${closes.length} closes (${closes[0].date} ~ ${closes[closes.length - 1].date})`)
    }

    if (i < ITICK_TICKERS.length - 1) {
      console.log("  ⏳ Waiting 15s...")
      await sleep(15000)
    }
  }

  // Phase 2: Yahoo ^JKSE
  const jkse = await fetchYahooJKSE()
  if (jkse) allCloses["^JKSE"] = jkse

  // Phase 3: Write CSV
  if (Object.keys(allCloses).length === 0) {
    console.error("\n❌ No data fetched, CSV not written")
    process.exit(1)
  }

  const rows: string[] = ["ticker,date,close"]
  for (const [ticker, closes] of Object.entries(allCloses)) {
    for (const c of closes) {
      rows.push(`${ticker},${c.date},${c.close}`)
    }
  }

  writeFileSync(CSV_PATH, rows.join("\n") + "\n", "utf-8")
  console.log(`\n📄 ${CSV_PATH}`)
  console.log(`   ${Object.keys(allCloses).length} tickers, ${rows.length - 1} rows`)

  // Phase 4: Fetch weekly klines from iTick
  console.log("\n📅 Fetching weekly klines from iTick...")
  const weeklyData: Record<string, { date: string; close: number }[]> = {}
  for (let i = 0; i < ITICK_TICKERS.length; i++) {
    const [itickCode, yahooTicker] = ITICK_TICKERS[i]
    console.log(`[${i + 1}/${ITICK_TICKERS.length}] ${yahooTicker} weekly...`)

    const closes = await fetchOneWeekly(itickCode, yahooTicker)
    if (closes) {
      weeklyData[yahooTicker] = closes
      console.log(`  ✅ ${yahooTicker}: ${closes.length} weeks (${closes[0].date} ~ ${closes[closes.length - 1].date})`)
    }

    if (i < ITICK_TICKERS.length - 1) {
      console.log("  ⏳ Waiting 15s...")
      await sleep(15000)
    }
  }

  // Write weekly CSV
  if (Object.keys(weeklyData).length > 0) {
    const weeklyRows: string[] = ["ticker,date,close"]
    for (const [ticker, closes] of Object.entries(weeklyData)) {
      for (const c of closes) {
        weeklyRows.push(`${ticker},${c.date},${c.close}`)
      }
    }
    writeFileSync(WEEKLY_CSV_PATH, weeklyRows.join("\n") + "\n", "utf-8")
    console.log(`\n📄 ${WEEKLY_CSV_PATH}`)
    console.log(`   ${Object.keys(weeklyData).length} tickers, ${weeklyRows.length - 1} rows`)
  }

  console.log("🏁 Done")
}

main().catch(console.error)
