"use client"

import { useAccountProfile } from "@/store/account-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileSection() {
  const balance = useAccountProfile((s) => s.balance)
  const riskPercent = useAccountProfile((s) => s.riskPercent)
  const setBalance = useAccountProfile((s) => s.setBalance)
  const setRiskPercent = useAccountProfile((s) => s.setRiskPercent)

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
              Account Balance (Rp)
            </label>
            <input
              id="balance"
              type="number"
              inputMode="numeric"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="risk-percent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Risk per Trade (%)
            </label>
            <input
              id="risk-percent"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="100"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
