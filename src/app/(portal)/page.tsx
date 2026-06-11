import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categories } from "@/config/apps"
import { IconCalculator } from "@tabler/icons-react"

const appIcons: Record<string, React.ReactNode> = {
  "risk-calculator": <IconCalculator size={20} />,
}

export default function PortalPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-3">Nokota</h1>
      <p className="text-muted-foreground mb-16 text-center max-w-md">
        Personal tools &amp; experiments
      </p>

      {categories.map((category) => (
        <section key={category.id} className="w-full max-w-lg mb-12 last:mb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-border" />
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-medium">
              {category.name}
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>

          {category.description && (
            <p className="text-sm text-muted-foreground text-center mb-5">
              {category.description}
            </p>
          )}

          <div className="grid gap-4">
            {category.apps.map((app) => (
              <Link key={app.id} href={`/apps/${category.id}/${app.id}`}>
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
        </section>
      ))}
    </div>
  )
}
