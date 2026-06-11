"use client"

import { useState, useEffect } from "react"
import { useAccountProfile } from "@/store/account-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCursorFix } from "@/hooks/use-cursor-fix"

export default function ProfileSection() {
  const balance = useAccountProfile((s) => s.balance)
  const riskPercent = useAccountProfile((s) => s.riskPercent)
  const hydrated = useAccountProfile((s) => s.hydrated)
  const setBalance = useAccountProfile((s) => s.setBalance)
  const setRiskPercent = useAccountProfile((s) => s.setRiskPercent)
  const { ref: balanceRef, preserveCursor: preserveBalanceCursor } = useCursorFix()

  const [riskText, setRiskText] = useState(() =>
    String(riskPercent * 100).replace(".", ",")
  )

  useEffect(() => {
    if (hydrated) {
      setRiskText(String(riskPercent * 100).replace(".", ","))
    }
  }, [hydrated])

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Account Profile</CardTitle>
        <CardDescription>
          Set your account balance and default risk per trade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="balance"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Account Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                Rp
              </span>
              <input
                id="balance"
                ref={balanceRef}
                type="text"
                inputMode="numeric"
                value={balance > 0 ? balance.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  preserveBalanceCursor(e)
                  const raw = e.target.value.replace(/\D/g, "")
                  if (raw === "") {
                    setBalance(0)
                  } else {
                    setBalance(Math.min(Number(raw), 1_000_000_000_000))
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="risk-percent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Risk per Trade
            </label>
            <div className="relative">
              <input
                id="risk-percent"
                type="text"
                inputMode="decimal"
                value={riskText}
                onChange={(e) => {
                  let raw = e.target.value.replace(/[^\d,]/g, "")
                  const commaIdx = raw.indexOf(",")
                  if (commaIdx !== -1) {
                    let before = raw.slice(0, commaIdx)
                    let after = raw.slice(commaIdx + 1).replace(/,/g, "").slice(0, 2)
                    if (before === "") {
                      raw = "0," + after
                    } else {
                      raw = before + "," + after
                    }
                  }
                  setRiskText(raw)
                  const parsed = raw.replace(",", ".")
                  if (parsed === "" || parsed === ".") {
                    setRiskPercent(0)
                  } else {
                    setRiskPercent(Number(parsed) / 100)
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-7 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
