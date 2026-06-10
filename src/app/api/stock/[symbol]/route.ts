import { NextRequest, NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yahooFinance = new YahooFinance()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params

  if (!symbol || symbol.trim() === "") {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
  }

  const query = `${symbol.trim().toUpperCase()}.JK`

  try {
    const quotes = await yahooFinance.quote(query)
    const quote = Array.isArray(quotes) ? quotes[0] : quotes

    if (!quote || !quote.regularMarketPrice) {
      return NextResponse.json(
        { error: `Symbol "${symbol}" not found on IDX` },
        { status: 404 },
      )
    }

    return NextResponse.json({
      price: quote.regularMarketPrice,
      symbol: symbol.trim().toUpperCase(),
    })
  } catch {
    return NextResponse.json(
      { error: "Stock price service unavailable. Please try again later." },
      { status: 503 },
    )
  }
}
