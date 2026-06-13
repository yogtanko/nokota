"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { QUADRANT_STYLES } from "@/lib/rrg"
import type { SectorRRGData } from "@/lib/rrg/rrg-service"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconSortDescending, IconSortAscending } from "@tabler/icons-react"

interface RRGTableProps {
  sectors: SectorRRGData[]
}

type SortKey = "rsMomentum" | "rsRatio"
type SortDir = "desc" | "asc"

function shortLabel(ticker: string): string {
  return ticker.replace(/^IDX/, "").replace(/\.JK$/, "")
}

function fmt(value: number | null | undefined, digits: number): string {
  if (value == null || isNaN(value)) return "—"
  return value.toFixed(digits)
}

export function RRGTable({ sectors }: RRGTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rsMomentum")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const sorted = useMemo(() => {
    return [...sectors].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === "desc" ? -diff : diff
    })
  }, [sectors, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kode Sektor</TableHead>
          <TableHead>Nama Sektor</TableHead>
          <TableHead className="text-right">RS-Ratio</TableHead>
          <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("rsMomentum")}>
            <span className="inline-flex items-center gap-1">
              RS-Momentum
              {sortKey === "rsMomentum" ? (
                sortDir === "desc" ? <IconSortDescending size={14} /> : <IconSortAscending size={14} />
              ) : null}
            </span>
          </TableHead>
          <TableHead className="text-right">Trend Slope</TableHead>
          <TableHead>Kuadran</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((s) => {
          const slope = calculateSlope(s.tail)
          return (
            <TableRow key={s.ticker}>
              <TableCell className="font-mono text-xs">{shortLabel(s.ticker)}</TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(s.rsRatio, 2)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmt(s.rsMomentum, 2)}</TableCell>
              <TableCell className="text-right tabular-nums">{slope}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium border",
                    QUADRANT_STYLES[s.quadrant],
                  )}
                >
                  {s.quadrant}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function calculateSlope(tail: { rsRatio: number; rsMomentum: number }[]): string {
  if (tail.length < 2) return "—"
  const first = tail[0]
  const last = tail[tail.length - 1]
  if (first == null || last == null) return "—"
  const diff = last.rsMomentum - first.rsMomentum
  const steps = tail.length - 1
  const perStep = diff / steps
  if (!isFinite(perStep)) return "—"
  if (Math.abs(perStep) < 0.01) return "0.00"
  return perStep > 0 ? `+${fmt(perStep, 2)}` : fmt(perStep, 2)
}
