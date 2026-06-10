import Link from "next/link"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back to apps
          </Link>
          <span className="text-sm font-medium">Trade Deck</span>
        </div>
      </header>
      <main className="flex flex-col flex-1">{children}</main>
    </div>
  )
}
