import type { CurrencyCode, FxRateMap } from '../data/types'

export function formatCurrency(value: number, currency: CurrencyCode = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

export function formatCompactCurrency(value: number, currency: CurrencyCode = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatSignedCurrency(value: number, currency: CurrencyCode = 'EUR') {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatCurrency(value, currency)}`
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))
}

export function formatDateLong(date: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function monthKey(date: string) {
  const parsed = new Date(date)
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(new Date(year, month - 1, 1))
}

export function convertWithEuroBaseRates(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: FxRateMap,
) {
  if (from === to) return amount
  if (from === 'EUR') return amount * rates[to]
  if (to === 'EUR') return amount / rates[from]
  const euroValue = amount / rates[from]
  return euroValue * rates[to]
}

export function safeNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
