import { useRef, useLayoutEffect, useCallback } from "react"

function countDigitsBefore(value: string, pos: number): number {
  let count = 0
  for (let i = 0; i < pos && i < value.length; i++) {
    if (/\d/.test(value[i])) count++
  }
  return count
}

function findDigitPosition(value: string, targetDigits: number): number {
  let remaining = targetDigits
  for (let i = 0; i < value.length; i++) {
    if (remaining <= 0) return i
    if (/\d/.test(value[i])) remaining--
  }
  return value.length
}

export function useCursorFix() {
  const ref = useRef<HTMLInputElement>(null)
  const cursor = useRef<number | null>(null)
  const prevVal = useRef("")

  const preserveCursor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    cursor.current = e.target.selectionStart
    prevVal.current = e.target.value
  }, [])

  useLayoutEffect(() => {
    if (ref.current && cursor.current !== null) {
      const digitsBefore = countDigitsBefore(prevVal.current, cursor.current)
      const newPos = findDigitPosition(ref.current.value, digitsBefore)
      ref.current.setSelectionRange(newPos, newPos)
      cursor.current = null
    }
  })

  return { ref, preserveCursor }
}
