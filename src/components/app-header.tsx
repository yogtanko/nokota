"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getAllApps } from "@/config/apps"

export default function AppHeader() {
  const pathname = usePathname()
  const apps = getAllApps()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <div className="size-2 rounded-full bg-primary" />
          Nokota
        </Link>

        <nav className="flex items-center gap-1">
          {apps.map((app) => {
            const isActive = pathname.startsWith(app.path)

            return (
              <Link
                key={`${app.path}`}
                href={app.path}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {app.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
