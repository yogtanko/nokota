import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apps } from "@/config/apps"
import { IconCalculator } from "@tabler/icons-react"

const appIcons: Record<string, React.ReactNode> = {
  "risk-calculator": <IconCalculator size={20} />,
}

export default function PortalPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Trade Deck</h1>
      <p className="text-muted-foreground mb-12 text-center max-w-md">
        Your centralized hub for financial market tools
      </p>
      <div className="grid gap-4 w-full max-w-sm">
        {apps.map((app) => (
          <Link key={app.id} href={app.path}>
            <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {appIcons[app.id] && (
                    <span className="text-primary shrink-0">{appIcons[app.id]}</span>
                  )}
                  <div>
                    <CardTitle>{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
