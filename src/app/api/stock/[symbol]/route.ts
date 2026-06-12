import { NextRequest, NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"
import { getRedis } from "@/lib/redis"

const yahooFinance = new YahooFinance()
const CACHE_TTL = 60

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params

  if (!symbol || symbol.trim() === "") {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
  }

  const query = `${symbol.trim().toUpperCase()}.JK`
  const cacheKey = `stock:${query}`

  const redis = getRedis()
  if (redis) {
    try {
      const cached = await redis.get<{ price: number; symbol: string }>(cacheKey)
      if (cached) return NextResponse.json(cached)
    } catch {
      // Redis unavailable — fall through to Yahoo
    }
  }

  try {
    const quotes = await yahooFinance.quote(query)
    const quote = Array.isArray(quotes) ? quotes[0] : quotes

    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json(
        { error: `Symbol "${symbol}" not found on IDX` },
        { status: 404 },
      )
    }

    const data = {
      price: quote.regularMarketPrice,
      symbol: symbol.trim().toUpperCase(),
    }

    if (redis) {
      redis.set(cacheKey, data, { ex: CACHE_TTL }).catch(() => {})
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Stock price service unavailable. Please try again later." },
      { status: 503 },
    )
  }
}
