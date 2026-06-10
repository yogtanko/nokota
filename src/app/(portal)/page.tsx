import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PortalPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Trade Deck</h1>
      <p className="text-muted-foreground mb-12 text-center max-w-md">
        Your centralized hub for financial market tools
      </p>
      <div className="grid gap-4 w-full max-w-sm">
        <Link href="/apps/risk-calculator">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Risk Calculator</CardTitle>
              <CardDescription>
                Calculate position sizing and risk/reward ratio for your trades
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
