"use client"

import { useState, useCallback } from "react"

interface StockLookupProps {
  entryPrice?: string
  onEntryPriceChange?: (value: string) => void
}

export default function StockLookup({ entryPrice: controlledPrice, onEntryPriceChange }: StockLookupProps) {
  const [symbol, setSymbol] = useState("")
  const [internalPrice, setInternalPrice] = useState("")

  const entryPrice = controlledPrice !== undefined ? controlledPrice : internalPrice
  const setEntryPrice = onEntryPriceChange || setInternalPrice
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLookedUp, setLastLookedUp] = useState<string | null>(null)

  const handleBlur = useCallback(async () => {
    const trimmed = symbol.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Lookup failed")
        return
      }

      setEntryPrice(String(data.price))
      setLastLookedUp(trimmed.toUpperCase())
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [symbol])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor="symbol"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Stock Symbol
        </label>
        <div className="relative">
          <input
            id="symbol"
            type="text"
            placeholder="e.g. BBRI"
            value={symbol}
            disabled={loading}
            onChange={(e) => {
              setSymbol(e.target.value)
              setError(null)
            }}
            onBlur={handleBlur}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {!error && lastLookedUp && entryPrice && (
          <p className="text-sm text-muted-foreground">
            Rp {Number(entryPrice).toLocaleString("id-ID")} filled for {lastLookedUp}
          </p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground">Looking up...</p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="entry-price"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Entry Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
            Rp
          </span>
          <input
            id="entry-price"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={entryPrice}
            disabled={loading}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "")
              setEntryPrice(raw)
              setLastLookedUp(null)
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
