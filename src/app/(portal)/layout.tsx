export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Trade Deck</span>
        </div>
      </header>
      <main className="flex flex-col flex-1">{children}</main>
    </div>
  )
}
