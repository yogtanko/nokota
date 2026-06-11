export interface AppConfig {
  id: string
  name: string
  description: string
  icon: string
}

export interface CategoryConfig {
  id: string
  name: string
  description?: string
  apps: AppConfig[]
}

export const categories: CategoryConfig[] = [
  {
    id: "trade-deck",
    name: "Trade Deck",
    description: "Position sizing and trade management tools",
    apps: [
      {
        id: "risk-calculator",
        name: "Risk Calculator",
        description: "Calculate position sizing and risk/reward ratio for your trades",
        icon: "Calculator",
      },
    ],
  },
]

export function getAllApps() {
  return categories.flatMap((cat) =>
    cat.apps.map((app) => ({
      ...app,
      path: `/apps/${cat.id}/${app.id}` as const,
    }))
  )
}
