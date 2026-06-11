# Fix cursor jump on formatted inputs

## Problem
All four currency inputs (Balance, Stop Loss, Take Profit, Entry Price) use `value={...toLocaleString("id-ID")}` as the value prop. Since the store/state holds raw digits and React reformats on every re-render, the cursor jumps to the end when editing in the middle.

## Solution: Blur-format pattern

Keep a local `displayText` state per input. During typing, show exactly what the user typed (no reformat). On blur, parse raw digits and set the formatted display. No cursor jump because `value` never changes during typing.

## Files to change

### 1. `src/components/profile-section.tsx` — Balance input

**Add:**
```tsx
import { ..., useRef } from "react"
const [balanceText, setBalanceText] = useState("")
const balanceLoaded = useRef(false)

useEffect(() => {
  if (hydrated && !balanceLoaded.current) {
    balanceLoaded.current = true
    if (balance > 0) setBalanceText(balance.toLocaleString("id-ID"))
  }
}, [hydrated])
```

**Change JSX:**
```tsx
<input
  value={balanceText}
  onChange={(e) => setBalanceText(e.target.value)}
  onBlur={() => {
    const raw = balanceText.replace(/\D/g, "")
    if (raw === "") {
      setBalance(0)
      setBalanceText("")
    } else {
      const num = Math.min(Number(raw), 1_000_000_000_000)
      setBalance(num)
      setBalanceText(num.toLocaleString("id-ID"))
    }
  }}
/>
```

### 2. `src/components/stock-lookup.tsx` — Entry Price input

**Add:**
```tsx
const [entryText, setEntryText] = useState("")
const entryLoaded = useRef(false)

useEffect(() => {
  if (controlledPrice !== undefined && !entryLoaded.current) {
    entryLoaded.current = true
    if (controlledPrice) setEntryText(Number(controlledPrice).toLocaleString("id-ID"))
  }
}, [controlledPrice])
```

**Change JSX:**
```tsx
value={entryText}
onChange={(e) => setEntryText(e.target.value)}
onBlur={() => {
  const raw = entryText.replace(/\D/g, "")
  setEntryPrice(raw)
  if (raw) setEntryText(Number(raw).toLocaleString("id-ID"))
  else setEntryText("")
}}
```

### 3. `src/app/(app)/apps/risk-calculator/page.tsx` — SL & TP inputs

**Add after existing state:**
```tsx
const [slText, setSlText] = useState("")
const [tpText, setTpText] = useState("")
```

**For SL input:**
```tsx
value={slText}
onChange={(e) => setSlText(e.target.value)}
onBlur={() => {
  const raw = slText.replace(/\D/g, "")
  setStopLoss(raw)
  setSlText(raw ? Number(raw).toLocaleString("id-ID") : "")
}}
```

**For TP input:**
```tsx
value={tpText}
onChange={(e) => setTpText(e.target.value)}
onBlur={() => {
  const raw = tpText.replace(/\D/g, "")
  setTakeProfit(raw)
  setTpText(raw ? Number(raw).toLocaleString("id-ID") : "")
}}
```

**Auto-fill sync:** In `autoFillTakeProfit`, also call `setTpText(String(Math.round(autoTp)).toLocaleString("id-ID"))`.

## Test impact
Existing tests fire `fireEvent.change` + check rendered text. The change event sets the displayText, and if the test expects the formatted value from the store, it may need `fireEvent.blur` after change to trigger formatting. Tests that assert behavior purely from the store (not the input display) should be unaffected.
