const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
})

const percentFormatter = new Intl.NumberFormat("id-ID", {
  style: "percent",
  minimumFractionDigits: 1,
})

const sharesFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
})

const lotsFormatter = new Intl.NumberFormat("id-ID")

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value)
}

export function formatShares(value: number): string {
  return sharesFormatter.format(value)
}

export function formatLots(value: number): string {
  return lotsFormatter.format(value)
}
