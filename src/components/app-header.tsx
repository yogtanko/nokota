"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { categories } from "@/config/apps"
import { DropdownMenu } from "radix-ui"
import { IconChevronDown } from "@tabler/icons-react"

export default function AppHeader() {
  const pathname = usePathname()

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
          {categories.map((category) => {
            const isCategoryActive = category.apps.some(
              (app) =>
                pathname === `/apps/${category.id}/${app.id}` ||
                pathname.startsWith(`/apps/${category.id}/${app.id}/`)
            )

            return (
              <DropdownMenu.Root key={category.id}>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={cn(
                      "group flex items-center gap-1 px-3 py-1.5 text-sm rounded-full transition-colors",
                      isCategoryActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {category.name}
                    <IconChevronDown
                      size={14}
                      className="transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="DropdownMenuContent min-w-[180px] rounded-xl bg-card p-1.5 shadow-lg ring-1 ring-border"
                    sideOffset={6}
                    align="start"
                  >
                    {category.apps.map((app) => {
                      const appPath = `/apps/${category.id}/${app.id}`
                      const isActive =
                        pathname === appPath ||
                        pathname.startsWith(`${appPath}/`)

                      return (
                        <DropdownMenu.Item key={app.id} asChild>
                          <Link
                            href={appPath}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            {app.name}
                          </Link>
                        </DropdownMenu.Item>
                      )
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
