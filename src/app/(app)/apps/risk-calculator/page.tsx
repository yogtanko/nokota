import ProfileSection from "@/components/profile-section"
import StockLookup from "@/components/stock-lookup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RiskCalculatorPage() {
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
          <StockLookup />
        </CardContent>
      </Card>
    </div>
  )
}
