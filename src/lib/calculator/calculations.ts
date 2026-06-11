import { LOT_SIZE } from "./constants"

export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
): number {
  if (balance <= 0 || riskPercent <= 0) return 0
  const diff = entryPrice - stopLoss
  if (diff <= 0) return 0
  return Math.floor((balance * (riskPercent / 100)) / diff)
}

export function calculateLots(shares: number, lotSize: number = LOT_SIZE): number {
  if (shares <= 0 || lotSize <= 0) return 0
  return Math.floor(shares / lotSize)
}

export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
): number {
  const diff = entryPrice - stopLoss
  if (diff <= 0) return 0
  return (takeProfit - entryPrice) / diff
}

export function calculatePotentialProfit(
  takeProfit: number,
  entryPrice: number,
  shares: number,
): number {
  return (takeProfit - entryPrice) * shares
}

export function calculatePurchaseCost(
  lots: number,
  entryPrice: number,
  lotSize: number = LOT_SIZE,
): number {
  if (lots <= 0 || entryPrice <= 0 || lotSize <= 0) return 0
  return Math.floor(lots) * lotSize * entryPrice
}

export function calculatePotentialLoss(
  entryPrice: number,
  stopLoss: number,
  shares: number,
): number {
  return (entryPrice - stopLoss) * shares
}
