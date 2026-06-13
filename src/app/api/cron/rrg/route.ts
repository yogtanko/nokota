import { NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"
import { storeClose, readAccumulatedCloses } from "@/lib/rrg/accumulator"
import { SECTOR_TICKERS, CHART_CONFIG } from "@/lib/rrg/constants"
import { computeRRG } from "@/lib/rrg/calculations"
import { getRedis } from "@/lib/redis"
import { getAdaptiveTTL, CACHE_KEYS } from "@/lib/rrg/constants"
import type { RRGTimeframe, TailPoint } from "@/lib/rrg/types"
import { Quadrant } from "@/lib/rrg/types"
import type { SectorRRGData, RRGApiResponse } from "@/lib/rrg/rrg-service"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("x-cron-secret") === secret
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

async function backfillIhsg(
  period1: Date,
  yf: YahooFinance,
): Promise<void> {
  const chart = await yf.chart("^JKSE", {
    period1,
    interval: "1d",
  })
  for (const q of chart.quotes) {
    if (q.close !== null) {
      const date = q.date instanceof Date
        ? q.date.toISOString().slice(0, 10)
        : String(q.date)
      await storeClose("^JKSE", date, q.close)
    }
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const yf = new YahooFinance()
  const today = todayStr()

  try {
    const symbols = SECTOR_TICKERS.map((t) => t.ticker)
    const quotes = await yf.quote(symbols)
    const quoteArray = Array.isArray(quotes) ? quotes : [quotes]

    let stored = 0
    const todayDate = todayStr()

    for (const q of quoteArray) {
      const price = q.regularMarketPrice
      if (price != null && typeof price === "number") {
        await storeClose(q.symbol ?? q.Symbol ?? "", todayDate, price)
        stored++
      }
    }

    const config = CHART_CONFIG.daily
    const period1 = new Date(
      Date.now() - config.periods * 1.5 * 86400000,
    )

    try {
      const ihsgCount = (await readAccumulatedCloses("^JKSE")).length
      if (ihsgCount < 30) {
        await backfillIhsg(period1, yf)
      }
    } catch {
      // backfill failure is non-fatal
    }

    const ihsgCloses = await readAccumulatedCloses("^JKSE")
    const sectors: SectorRRGData[] = []

    for (const t of SECTOR_TICKERS) {
      if (t.ticker === "^JKSE") continue
      const sectorCloses = await readAccumulatedCloses(t.ticker)
      const result = computeRRG(sectorCloses, ihsgCloses, "daily")
      const safeTail = result.tail.map((p: TailPoint) => ({
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

    const response: RRGApiResponse = {
      timeframe: "daily",
      computed_at: new Date().toISOString(),
      stale: false,
      sectors,
    }

    const redis = getRedis()
    if (redis) {
      try {
        await redis.set(CACHE_KEYS.rrg("daily"), response, {
          ex: getAdaptiveTTL(),
        })
      } catch {
        // cache write is non-critical
      }
    }

    return NextResponse.json({ success: true, stored })
  } catch (err) {
    console.error("[cron/rrg] Failed:", err)
    return NextResponse.json(
      { error: "RRG cron job failed" },
      { status: 503 },
    )
  }
}
