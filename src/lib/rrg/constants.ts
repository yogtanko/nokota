export const SECTOR_TICKERS = [
  { ticker: "^JKSE", name: "IHSG" },
  { ticker: "IDXENERGY.JK", name: "Energy" },
  { ticker: "IDXBASIC.JK", name: "Basic Materials" },
  { ticker: "IDXINDUST.JK", name: "Industrials" },
  { ticker: "IDXNONCYC.JK", name: "Non-Cyclicals" },
  { ticker: "IDXCYCLIC.JK", name: "Cyclicals" },
  { ticker: "IDXHEALTH.JK", name: "Healthcare" },
  { ticker: "IDXFIN.JK", name: "Financials" },
  { ticker: "IDXPROP.JK", name: "Property & Real Estate" },
  { ticker: "IDXTECH.JK", name: "Technology" },
  { ticker: "IDXINFRA.JK", name: "Infrastructure" },
  { ticker: "IDXTRANS.JK", name: "Transportation & Logistics" },
] as const

export const CHART_CONFIG = {
  daily: { interval: "1d" as const, periods: 64 },
  weekly: { interval: "1wk" as const, periods: 64 },
} as const

export const CACHE_KEYS = {
  ohlcv: (ticker: string, tf: string) => `idx:${ticker}:ohlcv:${tf}`,
  rrg: (tf: string) => `rrg:${tf}`,
}

export function getAdaptiveTTL(): number {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const utcDay = now.getUTCDay()
  const wibHour = (utcHour + 7) % 24

  const isWeekend = utcDay === 0 || utcDay === 6
  const isMarketHours = !isWeekend && wibHour >= 9 && wibHour < 16

  if (isMarketHours) {
    return 900
  }

  return 43200
}
