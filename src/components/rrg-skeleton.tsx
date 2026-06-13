export function RRGSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-pulse">
      <div className="lg:w-3/5 aspect-square rounded-4xl bg-muted/30 ring-1 ring-border" />
      <div className="lg:w-2/5 space-y-3">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/50" />
        ))}
      </div>
    </div>
  )
}
