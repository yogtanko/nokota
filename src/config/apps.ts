export interface AppConfig {
  id: string
  name: string
  description: string
  path: string
  icon: string
}

export const apps: AppConfig[] = [
  {
    id: "risk-calculator",
    name: "Risk Calculator",
    description: "Calculate position sizing and risk/reward ratio for your trades",
    path: "/apps/risk-calculator",
    icon: "Calculator",
  },
]
