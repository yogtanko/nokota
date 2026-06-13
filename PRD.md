## Problem Statement

A trader needs a centralized portal for financial market tools. Currently, position sizing is done manually or via spreadsheets, with no integration to live stock prices and no persistent profile for account balance and risk preferences. Additionally, traders lack a visual tool to identify which IDX sectors are rotationally strengthening or weakening relative to IHSG — forcing them to manually compare sector performance across siloed charting tools.

## Solution

Nokota — a monolithic Next.js portal serving as the hub for personal tools and experiments. It is organized into categories, each containing related applications. The **Trade Deck** category houses:

1. **Trading Risk Calculator** — combines position sizing with Risk/Reward analysis, live stock price lookup from Yahoo Finance, persistent account profile via localStorage, and real-time reactive calculations.
2. **SektorTrend (RRG)** — an interactive Relative Rotation Graph (RRG) engine that plots 11 IDX-IC sectors against IHSG on a 2D scatter chart with four quadrants (Leading, Weakening, Lagging, Improving), timeframe toggles (Daily/Weekly), and an interactive sector heatmap table.

## User Stories

### Risk Calculator (Phase 0 — Implemented)

1. As a visitor, I want to open Nokota in a browser, so that I can access personal tools and experiments.
2. As a trader, I want to see a portal landing page with links to all available apps, so that I can navigate between tools easily.
3. As a trader, I want to save my account balance, so that it persists across sessions.
4. As a trader, I want to save my default risk percentage per trade, so that I don't re-enter it every session.
5. As a trader, I want to edit my saved balance and risk percentage at any time, so that my profile stays current.
6. As a trader, I want to look up a stock symbol and get its current market price, so that I don't have to check prices elsewhere.
7. As a trader, I want to type just the stock name (e.g., "BBRI") without a market suffix, so that lookup is fast and simple.
8. As a trader, I want the entry price to auto-fill from the lookup result, so that I can start calculating immediately.
9. As a trader, I want to manually override the auto-filled entry price, so that I can calculate based on my planned entry level.
10. As a trader, I want to input my stop loss as an absolute price, so that I can use the level I see on my chart.
11. As a trader, I want to input my take profit as an absolute price, so that I can use the level I see on my chart.
12. As a trader, I want to see my maximum loss (modal terancam) calculated automatically, so that I know my downside exposure before entering a trade.
13. As a trader, I want to see position size in both shares and lots, so that I can execute the trade on IDX.
14. As a trader, I want position size rounded down to the nearest full lot, so that I never exceed my risk limits.
15. As a trader, I want to see the Risk/Reward ratio, so that I can evaluate whether the trade is worth taking.
16. As a trader, I want to see the potential profit in rupiah, so that I can compare upside vs downside.
17. As a trader, I want all calculations to update in real-time as I change any input, so that I can explore scenarios quickly.
18. As a trader, I want clear error messages when a stock symbol is not found, so that I know what went wrong.
19. As a trader, I want to use the calculator even when Yahoo Finance is unavailable, so that I am not blocked by external API failures.
20. As a trader, I want numbers displayed in Indonesian format (Rp prefix, dot thousand separator), so that I can read them naturally.
21. As a developer, I want TDD with unit tests for all business logic, so that calculations are reliable and regressions are caught early.
22. As a developer, I want E2E tests covering the full user flow, so that I can confidently ship new versions.

### SektorTrend RRG (Phase 1 — New)

23. As a swing trader, I want to see a 2D scatter plot of all 11 IDX-IC sectors with Relative Strength (RS-Ratio) on the X-axis and RS-Momentum on the Y-axis, so that I can visually identify which sectors are rotating between quadrants.
24. As a swing trader, I want each sector displayed as a uniquely colored dot with its ticker label, so that I can quickly distinguish sectors without cross-referencing a legend.
25. As a swing trader, I want the chart divided into four colored quadrants (Leading, Weakening, Lagging, Improving), so that I can immediately classify each sector's rotational phase.
26. As a swing trader, I want a trajectory tail (5 historical points) trailing behind each sector dot, so that I can see the direction and speed of sector rotation.
27. As a swing trader, I want to hover (desktop) or tap (mobile) any sector dot to see a tooltip with exact RS-Ratio, RS-Momentum, and quadrant status, so that I can make data-driven decisions.
28. As a swing trader, I want to toggle between [Daily] and [Weekly] timeframes, so that I can analyze short-term rotation vs. structural multi-week trends.
29. As a swing trader, I want an interactive heatmap table below or beside the chart listing all sectors with Kode, Nama, RS-Ratio, RS-Momentum, Trend Slope, and Kuadran, so that I can compare sectors in tabular format.
30. As a swing trader, I want the heatmap table sorted by RS-Momentum descending by default, so that the strongest accelerating sectors appear at the top.
31. As a swing trader, I want the layout to adapt to my screen — stacked on mobile (<1024px), side-by-side on desktop — so that the tool is usable on any device.
32. As a swing trader, I want the data to load instantly from cache when I revisit the page, so that I don't wait for a full Yahoo Finance fetch every time.
33. As a swing trader, I want a visible banner when the data being displayed is stale or from a previous session, so that I know the age of the information.
34. As a developer, I want a pure RRG computation module (EMA, ROC, Z-Score, quadrant mapping) decoupled from I/O, so that it can be unit-tested and reused.
35. As a developer, I want the data pipeline (Yahoo fetch → compute → Redis cache → API) to use hybrid caching, so that API calls to Yahoo Finance are minimized regardless of user count.

## Implementation Decisions

### Risk Calculator (Phase 0 — Implemented)

- **Architecture**: Single Next.js monolith with App Router. Route groups separate portal layout from app layouts. Applications are organized by category under the apps namespace (e.g., `/apps/trade-deck/risk-calculator`).
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent, professional styling with full customizability.
- **State Management**: Zustand with `persist` middleware stores account profile (balance, risk percentage) in localStorage. Calculator inputs (symbol, entry price, stop loss, take profit) use local component state and are not persisted.
- **Stock Data**: Yahoo Finance via the `yahoo-finance2` package, proxied through a Next.js API route. The `.JK` suffix is auto-appended for IDX stocks. Entry price auto-fills from lookup but remains manually editable.
- **Lookup Error UX**: Inline helper text below the symbol input (not a popup or modal) showing the error. The calculator remains usable with manual price entry if lookup fails.
- **Calculator Logic**:
  - Position Size (shares) = floor((balance x risk%) / (entryPrice - stopLoss))
  - Position Size (lots) = shares / LOT_SIZE (100), rounded down
  - Risk/Reward Ratio = (takeProfit - entryPrice) / (entryPrice - stopLoss)
  - Potential Profit = (takeProfit - entryPrice) x shares
  - Potential Loss = (entryPrice - stopLoss) x shares
- **Formatting**: Pure utility functions using `Intl.NumberFormat('id-ID')` — formatCurrency, formatPercent, formatShares, formatLots — in a single module.
- **UI Language**: English labels, Indonesian number formatting convention.
- **Git Workflow**: `main` branch as stable baseline. Feature branches for major work. Atomic commits as rollback checkpoints.
- **Package Manager**: npm. Minimum Node.js 18+, verified v24.16.0 available.

### SektorTrend RRG (Phase 1 — New)

- **Navigation**: SektorTrend is the second app in the Trade Deck category at `/apps/trade-deck/sector-trend`, accessible via portal card and dropdown menu.
- **RRG Computation**:
  - **RS-Ratio**: sector close / IHSG close x 100, smoothed with EMA-21 (daily) / EMA-55 (weekly).
  - **RS-Momentum**: ROC of RS-Ratio, period 8 (daily) / 21 (weekly), then Z-score normalized over rolling 50-period window, converted to basis 100 via (Z x 10) + 100.
  - **Quadrant boundaries**: threshold 100 on both axes.
  - **Tail**: 5 trailing historical points per sector.
- **Data pipeline**: Yahoo Finance `chart()` method fetches OHLCV for 12 tickers. Daily uses `1d` interval (64 data points), weekly uses `1wk` interval (64 data points).
- **Ticker list**: ^JKSE (IHSG), IDXENERGY.JK, IDXBASIC.JK, IDXINDUST.JK, IDXNONCYC.JK, IDXCYCLIC.JK, IDXHEALTH.JK, IDXFIN.JK, IDXPROP.JK, IDXTECH.JK, IDXINFRA.JK, IDXTRANS.JK.
- **Storage**: Redis-only (no PostgreSQL). Hybrid cache with two layers:
  - OHLCV data (`idx:{ticker}:ohlcv:{timeframe}`) — TTL 24 hours (data is immutable after market close).
  - Computed RRG results (`rrg:{timeframe}`) — adaptive TTL: 15 minutes during market hours (Mon-Fri 09:00-16:00 WIB), 12-24 hours otherwise.
- **API**: Single route `GET /api/rrg?timeframe=daily|weekly` returns JSON with current positions + tail history for all sectors.
- **Chart visualization**: Recharts Scatter with custom quadrant rectangles, sector dots (11 unique colors), tail trajectory lines, and interactive tooltips.
- **Heatmap table**: shadcn Table component with columns: Kode Sektor | Nama Sektor | RS-Ratio | RS-Momentum | Trend Slope | Status Kuadran.
- **Frontend data fetching**: `swr` library for stale-while-revalidate caching with deduping.
- **Layout**: CSS breakpoint at 1024px — stacked below, side-by-side (chart 60% / table 40%) above.
- **Error UX**: On Yahoo/Redis failure, serve last cached data (stale) with a yellow banner showing `computed_at` timestamp. If no cache exists at all, show error message with retry button.

## Testing Decisions

A good test validates external behavior — what the user sees or what a function returns — not internal implementation details. For pure functions, test known input/output pairs and edge cases. For components, test rendered output and user interactions.

### Risk Calculator (Phase 0 — Prior Art)

| Seam | Level | Tools | Scope |
| --------- | -------------- | ------------ | ----------------------------------------------- |
| Utility | Pure functions | Vitest | Business logic: calculate, format |
| Store | State logic | Vitest | Zustand store: persist, rehydrate, mutations |
| Component | UI | Vitest + RTL | Component rendering, interactions, error states |
| E2E | Full flow | Playwright | Browser: lookup, fill form, verify results |

**TDD order**: Utility → Store → Component → E2E.

### SektorTrend RRG (Phase 1 — New)

| Seam | Level | Tools | Scope |
| --------- | -------------- | ------------ | ----------------------------------------------- |
| Utility | Pure functions | Vitest | RRG computation: EMA, ROC, Z-Score, quadrant mapping, edge cases |
| API/BFF | Integration | Vitest | API route: cache hit/miss, Yahoo failure fallback, TTL logic |
| Component | UI | Vitest + RTL | RRG chart rendering, timeframe toggle, tooltip, stale banner |

**Testing principles**:
- Utility tests: known input/output pairs for EMA-21/55, ROC-8/21, Z-Score normalization, quadrant boundaries. Edge cases: constant prices (zero volatility), gaps in data, single-sector input.
- API tests: verify response shape for both timeframes, Redis hit/miss behavior, graceful degradation when Yahoo is unreachable.
- Component tests: chart renders with mock data, toggle switches timeframe, tooltip appears on hover/click, stale banner shows when `stale: true`.
- **E2E skipped** for Phase 1 — chart data is visually complex and best validated at the API + component level.

**Prior art**: `src/__tests__/calculator/calculations.test.ts` for pure function tests and `src/__tests__/app/api/stock/route.test.ts` for API integration tests serve as templates.

## Out of Scope

- User authentication and login system
- Supabase or server-side database (Redis-only for RRG cache)
- Multi-device data sync
- ARB/ARA validation on entry price
- Real-time streaming prices or WebSocket connections
- Margin, forex, crypto, or futures calculations
- Multi-language support
- Dark mode or theme switching
- PWA or offline support
- Server-side rendering of the calculator or RRG chart (client components by design)
- Clicking a sector to filter downstream stock list (state store deferred)
- Customizable RRG parameters (EMA/ROC periods are fixed per timeframe)
- Export or share functionality for RRG charts
- Historical RRG playback / animation

## Further Notes

- Deployment to Vercel requires zero code changes — all chosen technologies (Next.js API Routes, client components, Zustand localStorage, Redis via Upstash REST API) are fully compatible with Vercel's serverless environment.
- The `.JK` auto-append limits stock lookup to IDX stocks. A market selector can be added later if other exchanges are needed.
- The portal landing page is intentionally minimal — a title and application cards. The dashboard layout is designed to be extended as new apps are added.
- The lot size constant (100) is IDX-specific and centralized in a constants module for easy modification if other markets are supported later.
- Redis is the exclusive data store for RRG — no PostgreSQL dependency. Redis persistence (RDB/AOF snapshots) is recommended to survive restarts but not strictly required; the system degrades gracefully by re-fetching from Yahoo Finance.
- SWR (stale-while-revalidate) ensures the chart displays cached data instantly while re-fetching in the background — users never see a blank loading state unless it's a first-ever visit.
