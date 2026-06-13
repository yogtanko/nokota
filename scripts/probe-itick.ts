/**
 * Probe iTick API to discover correct ticker codes for IDX sector indices.
 * Tests multiple endpoint/code combinations and reports pass/fail.
 *
 * Usage: ITICK_API_KEY=xxx npx tsx scripts/probe-itick.ts
 */
const API_KEY = process.env.ITICK_API_KEY
if (!API_KEY) {
  console.error("ERROR: ITICK_API_KEY environment variable is required")
  process.exit(1)
}

const BASE = "https://api-free.itick.org"
const HEADERS = { token: API_KEY, accept: "application/json" }

type ProbeResult = { label: string; ok: boolean; data?: number; error?: string }

async function probe(
  label: string,
  url: string,
): Promise<ProbeResult> {
  try {
    const res = await fetch(url, { headers: HEADERS })
    const body = await res.json()
    if (body.code === 0 && Array.isArray(body.data) && body.data.length > 0) {
      return { label, ok: true, data: body.data.length }
    }
    return {
      label,
      ok: false,
      error: `code=${body.code} msg=${body.msg} data_count=${body.data?.length ?? 0}`,
    }
  } catch (err: unknown) {
    return {
      label,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function probeSymbolList() {
  const url = `${BASE}/symbol/list?type=stock&region=ID`
  try {
    const res = await fetch(url, { headers: HEADERS })
    const body = await res.json()
    if (body.code === 0 && Array.isArray(body.data)) {
      console.log(`\n📋 Symbol list (stock, ID): ${body.data.length} symbols`)
      for (const s of body.data.slice(0, 30)) {
        console.log(`   ${s.c} | ${s.n} | ${s.e ?? "-"}`)
      }
      if (body.data.length > 30) {
        console.log(`   ... and ${body.data.length - 30} more`)
      }
    } else {
      console.log(
        `\n📋 Symbol list failed: code=${body.code} msg=${body.msg}`,
      )
    }
  } catch (err: unknown) {
    console.log(
      `\n📋 Symbol list error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }
}

async function main() {
  console.log("🚀 Probing iTick IDX ticker codes...\n")

  const tests: ProbeResult[] = await Promise.all([
    // Stock API — without .JK suffix
    probe(
      "stock/kline region=ID code=JKSE",
      `${BASE}/stock/kline?region=ID&code=JKSE&kType=8&limit=5`,
    ),
    probe(
      "stock/kline region=ID code=IDXENERGY",
      `${BASE}/stock/kline?region=ID&code=IDXENERGY&kType=8&limit=5`,
    ),
    probe(
      "stock/kline region=ID code=IDXFINANCE",
      `${BASE}/stock/kline?region=ID&code=IDXFINANCE&kType=8&limit=5`,
    ),

    // Stock API — with .JK suffix
    probe(
      "stock/kline region=ID code=IDXENERGY.JK",
      `${BASE}/stock/kline?region=ID&code=IDXENERGY.JK&kType=8&limit=5`,
    ),

    // Indices API — without caret
    probe(
      "indices/kline region=ID code=JKSE",
      `${BASE}/indices/kline?region=ID&code=JKSE&kType=8&limit=5`,
    ),
    probe(
      "indices/kline region=ID code=IDXENERGY",
      `${BASE}/indices/kline?region=ID&code=IDXENERGY&kType=8&limit=5`,
    ),

    // Also try ^JKSE with stock API (unlikely but complete)
    probe(
      "stock/kline region=ID code=^JKSE",
      `${BASE}/stock/kline?region=ID&code=%5EJKSE&kType=8&limit=5`,
    ),

    // Try a few more sectors without .JK
    probe(
      "stock/kline region=ID code=IDXFIN",
      `${BASE}/stock/kline?region=ID&code=IDXFIN&kType=8&limit=5`,
    ),
    probe(
      "stock/kline region=ID code=IDXTECH",
      `${BASE}/stock/kline?region=ID&code=IDXTECH&kType=8&limit=5`,
    ),
    probe(
      "stock/kline region=ID code=IDXHEALTH",
      `${BASE}/stock/kline?region=ID&code=IDXHEALTH&kType=8&limit=5`,
    ),
  ])

  console.log("--- Results ---")
  for (const t of tests) {
    const icon = t.ok ? "✅" : "❌"
    const detail = t.ok ? `${t.data} klines` : t.error
    console.log(`${icon} ${t.label}  (${detail})`)
  }

  console.log("\n--- Symbol List (stock, region=ID) ---")
  await probeSymbolList()

  console.log("\n🏁 Done")
}

main().catch(console.error)
