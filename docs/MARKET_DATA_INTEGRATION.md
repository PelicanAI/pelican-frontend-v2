# Market Data Integration Guide

This guide explains how to integrate real market data into the Trading Context Panel.

## Overview

The Trading Context Panel is designed to display real-time market information including:
- Major market indices (S&P 500, Nasdaq, Dow Jones)
- VIX (Volatility Index)
- Sector performance
- User's watchlist

Currently, the panel displays placeholder data with a structure ready for real market data integration.

## Architecture

### Components

1. **TradingContextPanel** (`components/chat/trading-context-panel.tsx`)
   - UI component that displays market data
   - Accepts data via props
   - Handles loading states and error display

2. **useMarketData Hook** (`hooks/use-market-data.ts`)
   - Custom hook for fetching market data
   - Manages auto-refresh and caching
   - Provides utility functions for formatting

### Data Flow

```
API Endpoint → useMarketData Hook → Chat Page → TradingContextPanel
```

## Integration Steps

### Step 1: Create the API Endpoint

Create a new API route at `/api/market-data/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { watchlistSymbols } = await request.json()

    // Option 1: Use a market data provider (e.g., Alpha Vantage, Polygon.io, Yahoo Finance)
    const marketData = await fetchMarketData(watchlistSymbols)

    return NextResponse.json({
      indices: marketData.indices,
      vix: marketData.vix,
      vixChange: marketData.vixChange,
      sectors: marketData.sectors,
      watchlist: marketData.watchlist,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Market data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
```

### Step 2: Choose a Market Data Provider

Popular options:

1. **Alpha Vantage** (Free tier available)
   - API: https://www.alphavantage.co/
   - Good for: Basic stock quotes, indices
   - Rate limit: 5 calls/minute (free)

2. **Polygon.io** (Free tier available)
   - API: https://polygon.io/
   - Good for: Real-time data, comprehensive coverage
   - Rate limit: Varies by plan

3. **Yahoo Finance (unofficial)**
   - Library: `yahoo-finance2` npm package
   - Good for: Quick prototyping, no API key needed
   - Note: Unofficial, use at your own risk

4. **Finnhub** (Free tier available)
   - API: https://finnhub.io/
   - Good for: Real-time data, news, sentiment
   - Rate limit: 60 calls/minute (free)

### Step 3: Implement Data Fetching

Example using Polygon.io:

```typescript
// lib/market-data-provider.ts
import { MarketIndex, SectorData, WatchlistTicker } from '@/hooks/use-market-data'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY

export async function fetchMarketData(watchlistSymbols: string[]) {
  // Fetch indices
  const indices = await Promise.all([
    fetchQuote('SPX', 'S&P 500'),
    fetchQuote('IXIC', 'Nasdaq'),
    fetchQuote('DJI', 'Dow Jones'),
  ])

  // Fetch VIX
  const vixData = await fetchQuote('VIX', 'VIX')

  // Fetch sector data
  const sectors = await fetchSectorPerformance()

  // Fetch watchlist
  const watchlist = await Promise.all(
    watchlistSymbols.map(symbol => fetchQuote(symbol))
  )

  return {
    indices,
    vix: vixData.price,
    vixChange: vixData.changePercent,
    sectors,
    watchlist,
  }
}

async function fetchQuote(symbol: string, name?: string): Promise<MarketIndex> {
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`
  )
  const data = await response.json()

  const result = data.results[0]
  const change = result.c - result.o
  const changePercent = (change / result.o) * 100

  return {
    symbol,
    name: name || symbol,
    price: result.c,
    change,
    changePercent,
  }
}

async function fetchSectorPerformance(): Promise<SectorData[]> {
  // Implement sector performance fetching
  // This might use sector ETFs like XLK, XLF, XLV, XLE
  const sectorEtfs = [
    { symbol: 'XLK', name: 'Technology' },
    { symbol: 'XLF', name: 'Financials' },
    { symbol: 'XLV', name: 'Healthcare' },
    { symbol: 'XLE', name: 'Energy' },
  ]

  const sectors = await Promise.all(
    sectorEtfs.map(async ({ symbol, name }) => {
      const quote = await fetchQuote(symbol)
      return {
        name,
        changePercent: quote.changePercent,
      }
    })
  )

  return sectors
}
```

### Step 4: Update the useMarketData Hook

Uncomment the SWR fetcher in `hooks/use-market-data.ts`:

```typescript
export function useMarketData({ ... }: UseMarketDataOptions = {}) {
  // Uncomment this block:
  const { data, error, isLoading, mutate } = useSWR(
    '/api/market-data',
    async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistSymbols })
      })
      if (!response.ok) throw new Error('Failed to fetch market data')
      return response.json()
    },
    {
      refreshInterval: autoRefresh ? refreshInterval : 0,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    ...data,
    error,
    isLoading,
    refresh: mutate,
  }
}
```

### Step 5: Connect to Chat Page

Uncomment the hook usage in `app/chat/page.tsx`:

```typescript
import { useMarketData } from "@/hooks/use-market-data"

// Inside the component:
const {
  indices,
  vix,
  vixChange,
  sectors,
  watchlist,
  isLoading: isLoadingMarketData,
  refresh: refreshMarketData
} = useMarketData({
  refreshInterval: 60000,
  autoRefresh: true,
  watchlistSymbols: ['AAPL', 'TSLA', 'NVDA', 'SPY']
})

// Then pass to TradingContextPanel:
<TradingContextPanel
  indices={indices}
  vix={vix}
  vixChange={vixChange}
  sectors={sectors}
  watchlist={watchlist}
  isLoading={isLoadingMarketData}
  onRefresh={refreshMarketData}
  collapsed={tradingPanelCollapsed}
/>
```

## Environment Variables

Add your API keys to `.env.local`:

```env
POLYGON_API_KEY=your_api_key_here
ALPHA_VANTAGE_API_KEY=your_api_key_here
FINNHUB_API_KEY=your_api_key_here
```

## Caching Strategy

To avoid rate limits and improve performance:

1. **Client-side caching**: SWR automatically caches responses (30 seconds in config)
2. **Server-side caching**: Consider using Redis or similar
3. **Stale-while-revalidate**: Show cached data while fetching fresh data

Example with Redis:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

export async function getCachedMarketData(key: string, ttl: number = 60) {
  const cached = await redis.get(key)
  if (cached) return cached

  const fresh = await fetchMarketData()
  await redis.setex(key, ttl, fresh)
  return fresh
}
```

## User Watchlist Management

To persist user watchlists:

1. Add a `watchlists` table to your database:

```sql
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  symbols TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. Create API endpoints for CRUD operations:
   - `GET /api/watchlist` - Get user's watchlist
   - `POST /api/watchlist` - Add symbol to watchlist
   - `DELETE /api/watchlist/:symbol` - Remove symbol

3. Update the hook to fetch user's watchlist on mount

## Testing

Test with mock data before connecting to real APIs:

```typescript
// __tests__/market-data.test.ts
import { renderHook } from '@testing-library/react'
import { useMarketData } from '@/hooks/use-market-data'

test('fetches and formats market data', async () => {
  const { result } = renderHook(() => useMarketData())

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  expect(result.current.indices).toHaveLength(3)
  expect(result.current.vix).toBeGreaterThan(0)
})
```

## Error Handling

The component gracefully handles errors:

- Network errors: Shows "---" for prices
- API errors: Displays error message in panel
- Rate limits: Falls back to cached data

## Performance Considerations

1. **Debounce refreshes**: Avoid refreshing too frequently
2. **Conditional fetching**: Only fetch when panel is visible
3. **Background updates**: Use service workers for updates
4. **Optimize bundle**: Lazy load the panel component

## Next Steps

1. Implement the API endpoint
2. Choose and integrate a market data provider
3. Test with small watchlists first
4. Add user watchlist management
5. Implement caching strategy
6. Monitor API usage and costs

## Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [Polygon.io Docs](https://polygon.io/docs/stocks/getting-started)
- [Finnhub API Docs](https://finnhub.io/docs/api)
- [SWR Documentation](https://swr.vercel.app/)