import { http, HttpResponse } from 'msw'
import { seedFxRates, seedIndices, seedOpportunities, seedWatchlist } from '../data/seed'
import type { FxRateMap, OpportunityItem } from '../data/types'

function seededBump(symbol: string) {
  return Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function tweakNumber(base: number, symbol: string, divisor: number) {
  const delta = (seededBump(symbol) % 7) / divisor
  return Number((base + delta).toFixed(4))
}

function tweakChange(base: number, symbol: string) {
  const direction = seededBump(symbol) % 2 === 0 ? 1 : -1
  const delta = ((seededBump(symbol) % 5) + 1) / 20
  return Number((base + direction * delta).toFixed(2))
}

function buildHistoricalRates(date: string): FxRateMap {
  const factor = Number(date.slice(-2)) % 5
  return {
    EUR: 1,
    USD: Number((seedFxRates.USD - factor * 0.01).toFixed(4)),
    GBP: Number((seedFxRates.GBP - factor * 0.003).toFixed(4)),
    JPY: Number((seedFxRates.JPY + factor * 0.8).toFixed(2)),
    CHF: Number((seedFxRates.CHF - factor * 0.002).toFixed(4)),
    CAD: Number((seedFxRates.CAD + factor * 0.01).toFixed(4)),
  }
}

function buildOpportunities(): OpportunityItem[] {
  return seedOpportunities.map((item) => ({
    ...item,
    price: tweakNumber(item.price, item.symbol, 10),
    performance: {
      day: tweakChange(item.performance.day, `${item.symbol}-day`),
      week: tweakChange(item.performance.week, `${item.symbol}-week`),
      month: tweakChange(item.performance.month, `${item.symbol}-month`),
      threeMonths: tweakChange(item.performance.threeMonths, `${item.symbol}-three`),
      year: tweakChange(item.performance.year, `${item.symbol}-year`),
    },
  }))
}

export const handlers = [
  http.get('/api/fx/latest', () => {
    return HttpResponse.json({
      rates: seedFxRates,
      updatedAt: new Date().toISOString(),
      source: 'msw',
      status: 'live',
    })
  }),

  http.get('/api/fx/historical', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date') ?? '2026-04-18'

    return HttpResponse.json({
      rates: buildHistoricalRates(date),
      date,
    })
  }),

  http.get('/api/market/snapshot', ({ request }) => {
    const url = new URL(request.url)
    const symbols = url.searchParams.getAll('symbol')

    const indices = seedIndices.map((item) => ({
      ...item,
      price: tweakNumber(item.price, item.symbol, 4),
      change: tweakChange(item.change, item.symbol),
    }))

    const watchlistPool = [...seedWatchlist, ...buildOpportunities()]
    const quotes = watchlistPool
      .filter((item) => symbols.length === 0 || symbols.includes(item.symbol))
      .map((item) => ({
        symbol: item.symbol,
        price: tweakNumber(item.price, item.symbol, 8),
        change: 'performance' in item ? tweakChange(item.performance.day, item.symbol) : tweakChange(item.change, item.symbol),
      }))

    return HttpResponse.json({
      indices,
      quotes,
      opportunities: buildOpportunities(),
      source: 'msw',
      status: 'live',
    })
  }),
]
