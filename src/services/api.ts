import { seedFxRates, seedIndices, seedOpportunities } from '../data/seed'
import type { FxRateMap, MarketIndex, OpportunityItem } from '../data/types'

interface FxLatestResponse {
  rates: FxRateMap
  updatedAt: string
  source: string
  status: 'live' | 'fallback'
}

interface HistoricalFxResponse {
  rates: FxRateMap
  date: string
}

interface MarketQuote {
  symbol: string
  price: number
  change: number
}

interface MarketSnapshotResponse {
  indices: MarketIndex[]
  quotes: MarketQuote[]
  opportunities: OpportunityItem[]
  source: string
  status: 'live' | 'fallback'
}

async function fetchJson<T>(input: RequestInfo | URL) {
  const response = await fetch(input)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

export async function getLatestFxRates() {
  if (import.meta.env.DEV) {
    return fetchJson<FxLatestResponse>('/api/fx/latest')
  }

  try {
    const data = await fetchJson<{ date: string; rates: Record<string, number> }>(
      'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,JPY,CHF,CAD',
    )

    return {
      rates: {
        EUR: 1,
        USD: data.rates.USD,
        GBP: data.rates.GBP,
        JPY: data.rates.JPY,
        CHF: data.rates.CHF,
        CAD: data.rates.CAD,
      } satisfies FxRateMap,
      updatedAt: data.date,
      source: 'Frankfurter / ECB',
      status: 'live' as const,
    }
  } catch {
    return {
      rates: seedFxRates,
      updatedAt: 'fallback locale',
      source: 'Seed locale',
      status: 'fallback' as const,
    }
  }
}

export async function getHistoricalFxRate(date: string) {
  if (import.meta.env.DEV) {
    const data = await fetchJson<HistoricalFxResponse>(`/api/fx/historical?date=${date}`)
    return data.rates
  }

  const data = await fetchJson<{ rates: Record<string, number> }>(
    `https://api.frankfurter.dev/v1/${date}?base=EUR&symbols=USD,GBP,JPY,CHF,CAD`,
  )

  return {
    EUR: 1,
    USD: data.rates.USD,
    GBP: data.rates.GBP,
    JPY: data.rates.JPY,
    CHF: data.rates.CHF,
    CAD: data.rates.CAD,
  } satisfies FxRateMap
}

export async function getMarketSnapshot(symbols: string[]) {
  if (import.meta.env.DEV) {
    const query = new URLSearchParams()
    symbols.forEach((symbol) => query.append('symbol', symbol))
    return fetchJson<MarketSnapshotResponse>(`/api/market/snapshot?${query.toString()}`)
  }

  try {
    const query = encodeURIComponent(symbols.join(','))
    const quotes = await fetchJson<Array<{ symbol: string; price: number; changePercentage?: number }>>(
      `https://financialmodelingprep.com/stable/quote?symbol=${query}&apikey=demo`,
    )
    const quoteMap = new Map(
      quotes.map((quote) => [
        quote.symbol,
        { symbol: quote.symbol, price: quote.price, change: quote.changePercentage ?? 0 },
      ]),
    )

    return {
      indices: seedIndices.map((item) => {
        const live = quoteMap.get(item.symbol)
        return live ? { ...item, price: live.price, change: live.change } : item
      }),
      quotes: symbols.map((symbol) => quoteMap.get(symbol)).filter(Boolean) as MarketQuote[],
      opportunities: seedOpportunities,
      source: 'Financial Modeling Prep',
      status: 'live' as const,
    }
  } catch {
    return {
      indices: seedIndices,
      quotes: [],
      opportunities: seedOpportunities,
      source: 'Seed locale',
      status: 'fallback' as const,
    }
  }
}
