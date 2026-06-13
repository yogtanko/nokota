import { NextRequest, NextResponse } from "next/server"
import { getRRGData } from "@/lib/rrg/rrg-service"
import type { RRGTimeframe } from "@/lib/rrg/types"

const VALID_TIMEFRAMES = new Set(["daily", "weekly"])

export async function GET(request: NextRequest) {
  const timeframe = request.nextUrl.searchParams.get("timeframe")

  if (!timeframe || !VALID_TIMEFRAMES.has(timeframe)) {
    return NextResponse.json(
      { error: "Invalid timeframe. Use 'daily' or 'weekly'." },
      { status: 400 },
    )
  }

  try {
    const data = await getRRGData(timeframe as RRGTimeframe)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "RRG data unavailable. Please try again later." },
      { status: 503 },
    )
  }
}
