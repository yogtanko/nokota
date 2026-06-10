import ProfileSection from "@/components/profile-section"

export default function RiskCalculatorPage() {
  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Risk Calculator</h1>
        <p className="text-muted-foreground">
          Calculate your position size, risk, and potential reward for IDX trades.
        </p>
      </div>

      <ProfileSection />

      <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-muted/30">
        <p className="text-muted-foreground text-center max-w-md">
          Calculator inputs and results coming soon.
        </p>
      </div>
    </div>
  )
}
