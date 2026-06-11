import AppHeader from "@/components/app-header"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex flex-col flex-1">{children}</main>
    </div>
  )
}
