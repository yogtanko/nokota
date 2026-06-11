import { useRef, useLayoutEffect, useCallback } from "react"

export function useCursorFix() {
  const ref = useRef<HTMLInputElement>(null)
  const cursor = useRef<number | null>(null)

  const preserveCursor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    cursor.current = e.target.selectionStart
  }, [])

  useLayoutEffect(() => {
    if (ref.current && cursor.current !== null) {
      const pos = Math.min(cursor.current, ref.current.value.length)
      ref.current.setSelectionRange(pos, pos)
      cursor.current = null
    }
  })

  return { ref, preserveCursor }
}
