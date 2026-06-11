"use client"

import { useState } from "react"
import { useAccountProfile } from "@/store/account-profile"
import ProfileSection from "@/components/profile-section"
import StockLookup from "@/components/stock-lookup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  calculatePositionSize,
  calculateLots,
  calculateRiskRewardRatio,
  calculatePotentialProfit,
  calculatePotentialLoss,
  formatCurrency,
  formatShares,
  formatLots,
} from "@/lib/calculator"

export default function RiskCalculatorPage() {
  const balance = useAccountProfile((s) => s.balance)
  const riskPercent = useAccountProfile((s) => s.riskPercent)

  const [entryPrice, setEntryPrice] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [takeProfit, setTakeProfit] = useState("")

  const entry = Number(entryPrice)
  const sl = Number(stopLoss)
  const tp = Number(takeProfit)

  const positionSize = calculatePositionSize(balance, riskPercent * 100, entry, sl)
  const lots = calculateLots(positionSize)
  const rr = calculateRiskRewardRatio(entry, sl, tp)
  const profit = calculatePotentialProfit(tp, entry, positionSize)
  const loss = calculatePotentialLoss(entry, sl, positionSize)

  const hasTradeInputs = entry > 0 && sl > 0 && tp > 0
  const entryAboveSL = entry > sl
  const hasProfile = balance > 0 && riskPercent > 0

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Risk Calculator</h1>
        <p className="text-muted-foreground">
          Calculate your position size, risk, and potential reward for IDX trades.
        </p>
      </div>

      <ProfileSection />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Trade Setup</CardTitle>
          <CardDescription>
            Look up a stock or enter price manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockLookup entryPrice={entryPrice} onEntryPriceChange={setEntryPrice} />

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-2">
              <label
                htmlFor="stop-loss"
                className="text-sm font-medium leading-none"
              >
                Stop Loss
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                  Rp
                </span>
                <input
                  id="stop-loss"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={stopLoss ? Number(stopLoss).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    setStopLoss(raw)
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="take-profit"
                className="text-sm font-medium leading-none"
              >
                Take Profit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                  Rp
                </span>
                <input
                  id="take-profit"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={takeProfit ? Number(takeProfit).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    setTakeProfit(raw)
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasTradeInputs && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Position sizing and risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                  Position Size
                </p>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  {!hasProfile ? "\u2014" : entryAboveSL ? `${formatLots(lots)} lot${lots !== 1 ? "s" : ""}` : "0 lots"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!hasProfile ? "\u2014" : entryAboveSL ? `${formatShares(positionSize)} shares` : "0 shares"}
                </p>
              </div>

              <div className="h-px bg-border" />

              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Risk:Reward
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {!hasProfile || !entryAboveSL || rr <= 0 ? "\u2014" : `1:${rr.toFixed(1)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Max Loss
                  </p>
                  <p className="text-xl font-bold tabular-nums text-destructive">
                    {!hasProfile || !entryAboveSL || loss <= 0 ? "\u2014" : `\u2212${formatCurrency(loss)}`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Potential Profit
                  </p>
                  <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {!hasProfile || !entryAboveSL || profit <= 0 ? "\u2014" : `+${formatCurrency(profit)}`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
