"use client"

import { useState, useRef } from "react"
import { useAccountProfile } from "@/store/account-profile"
import ProfileSection from "@/components/profile-section"
import StockLookup from "@/components/stock-lookup"
import { useCursorFix } from "@/hooks/use-cursor-fix"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  calculatePositionSize,
  calculateLots,
  calculateRiskRewardRatio,
  calculatePotentialProfit,
  calculatePotentialLoss,
  calculatePurchaseCost,
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
  const tpManuallyEdited = useRef(false)
  const { ref: slRef, preserveCursor: preserveSlCursor } = useCursorFix()
  const { ref: tpRef, preserveCursor: preserveTpCursor } = useCursorFix()

  const entry = Number(entryPrice)
  const sl = Number(stopLoss)
  const tp = Number(takeProfit)

  const positionSize = calculatePositionSize(balance, riskPercent * 100, entry, sl)
  const lots = calculateLots(positionSize)
  const rr = calculateRiskRewardRatio(entry, sl, tp)
  const profit = calculatePotentialProfit(tp, entry, positionSize)
  const loss = calculatePotentialLoss(entry, sl, positionSize)
  const cost = calculatePurchaseCost(lots, entry)

  const hasEntry = entryPrice !== ""
  const hasStopLoss = stopLoss !== ""
  const entryAboveSL = entry > sl && hasEntry && hasStopLoss
  const hasProfile = balance > 0 && riskPercent > 0
  const autoFillTakeProfit = (entryVal: number, slVal: number) => {
    if (tpManuallyEdited.current) return
    if (entryVal <= 0 || slVal <= 0 || entryVal <= slVal) return
    const autoTp = entryVal + 2 * (entryVal - slVal)
    setTakeProfit(String(Math.round(autoTp)))
  }

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-5xl mx-auto w-full gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Risk Calculator</h1>
        <p className="text-muted-foreground">
          Calculate your position size, risk, and potential reward for IDX trades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
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
                      ref={slRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={stopLoss ? Number(stopLoss).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        preserveSlCursor(e)
                        const raw = e.target.value.replace(/\D/g, "")
                        setStopLoss(raw)
                        autoFillTakeProfit(entry, Number(raw))
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
                      ref={tpRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={takeProfit ? Number(takeProfit).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        preserveTpCursor(e)
                        const raw = e.target.value.replace(/\D/g, "")
                        setTakeProfit(raw)
                        tpManuallyEdited.current = raw !== ""
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 min-w-0">
          <div className="rounded-4xl bg-muted/30 ring-1 ring-border p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-2 rounded-full bg-primary" />
              <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
                Results
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 min-w-0">
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Position Size
                </p>
                <p className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight whitespace-normal break-words transition-all duration-200">
                  {!hasProfile ? "\u2014" : entryAboveSL ? `${formatLots(lots)} lot${lots !== 1 ? "s" : ""}` : "0 lots"}
                </p>
                <p className="text-base text-muted-foreground mt-1.5 transition-all duration-200">
                  {!hasProfile ? "\u2014" : entryAboveSL ? `${formatShares(positionSize)} shares` : "0 shares"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Purchase Cost
                </p>
                <p className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight whitespace-normal break-words transition-all duration-200">
                  {!hasProfile || !entryAboveSL || cost <= 0 ? "\u2014" : formatCurrency(cost)}
                </p>
              </div>
            </div>

            <div className="h-px bg-border mb-8" />

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 min-w-0">
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Risk:Reward
                </p>
                <p className="text-2xl md:text-3xl font-bold tabular-nums whitespace-normal break-words transition-all duration-200">
                  {!hasProfile || !entryAboveSL || rr <= 0 ? "\u2014" : `1:${rr.toFixed(1)}`}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Max Loss
                </p>
                <p className="text-2xl md:text-3xl font-bold tabular-nums text-destructive whitespace-normal break-words transition-all duration-200">
                  {!hasProfile || !entryAboveSL || sl <= 0 || loss <= 0 ? "\u2014" : `\u2212${formatCurrency(loss)}`}
                </p>
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Potential Profit
                </p>
                <p className="text-3xl md:text-4xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-normal break-words transition-all duration-200">
                  {!hasProfile || !entryAboveSL || profit <= 0 ? "\u2014" : `+${formatCurrency(profit)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
