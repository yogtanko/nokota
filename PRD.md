## Problem Statement

A trader needs a centralized portal for financial market tools, starting with a risk calculator for position sizing. Currently, position sizing is done manually or via spreadsheets, with no integration to live stock prices and no persistent profile for account balance and risk preferences.

## Solution

Trade Deck — a monolithic Next.js portal serving as the hub for all financial market applications. The first application is a Trading Risk Calculator that combines position sizing with Risk/Reward analysis, live stock price lookup from Yahoo Finance, persistent account profile via localStorage, and real-time reactive calculations.

## User Stories

1. As a trader, I want to open Trade Deck in a browser, so that I can access financial market tools without installing software.
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

## Implementation Decisions

- **Architecture**: Single Next.js monolith with App Router. Route groups separate portal layout from app layouts. Each application lives in its own route group under the apps namespace.
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent, professional styling with full customizability, --preset b2BoVh7z9.
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

## Testing Decisions

A good test validates external behavior — what the user sees or what a function returns — not internal implementation details. For pure functions, test known input/output pairs and edge cases. For components, test rendered output and user interactions.

**Testing seams (highest to lowest):**

| Seam      | Level          | Tools        | Scope                                           |
| --------- | -------------- | ------------ | ----------------------------------------------- |
| Utility   | Pure functions | Vitest       | Business logic: calculate, format               |
| Store     | State logic    | Vitest       | Zustand store: persist, rehydrate, mutations    |
| Component | UI             | Vitest + RTL | Component rendering, interactions, error states |
| E2E       | Full flow      | Playwright   | Browser: lookup, fill form, verify results      |

**TDD order**: Utility → Store → Component → E2E. Each seam is validated before moving to the next.

**Prior art**: No existing tests in the codebase (greenfield project). Utility tests follow a describe/test pattern covering known inputs, known outputs, and edge cases (zero, negative, missing values).

## Out of Scope

- User authentication and login system
- Supabase or server-side database
- Multi-device data sync
- ARB/ARA validation on entry price
- Real-time streaming prices or WebSocket connections
- Margin, forex, crypto, or futures calculations
- Multi-language support
- Dark mode or theme switching
- PWA or offline support
- Server-side rendering of the calculator (client component by design)

## Further Notes

- Deployment to Vercel requires zero code changes — all chosen technologies (Next.js API Routes, client components, Zustand localStorage) are fully compatible with Vercel's serverless environment.
- The `.JK` auto-append limits lookup to IDX stocks. A market selector can be added later if other exchanges are needed.
- The portal landing page is intentionally minimal — a title and application cards. The dashboard layout is designed to be extended as new apps are added.
- The lot size constant (100) is IDX-specific and centralized in a constants module for easy modification if other markets are supported later.
