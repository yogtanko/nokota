import YahooFinance from "yahoo-finance2"
import { SECTOR_TICKERS, CHART_CONFIG, type RRGTimeframe } from "./constants"

export async function fetchSectorOHLCV(
  timeframe: RRGTimeframe,
  yf: YahooFinance = new YahooFinance(),
): Promise<Map<string, number[]>> {
  const config = CHART_CONFIG[timeframe]
  const period1 = new Date(
    Date.now() - config.periods * (timeframe === "daily" ? 1.5 : 7) * 86400000,
  )

  const results = await Promise.allSettled(
    SECTOR_TICKERS.map(async (t) => {
      const chart = await yf.chart(t.ticker, {
        period1,
        interval: config.interval,
      })
      return {
        ticker: t.ticker,
        closes: chart.quotes
          .map((q) => q.close)
          .filter((c): c is number => c !== null),
      }
    }),
  )

  const map = new Map<string, number[]>()
  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.ticker, result.value.closes)
    }
  }

  return map
}
