# Smart Input Suggestions

## Overview

The chat input now features intelligent autocomplete suggestions that help users type faster and discover trading-related queries.

## Features

### 1. **Ticker Autocomplete**
Type `$` followed by letters to get stock ticker suggestions:
- `$A` → Shows `$AAPL`, `$AMD`, `$AMZN`
- `$TS` → Shows `$TSLA`
- `$NV` → Shows `$NVDA`

**Supported Tickers:**
- SPY, QQQ, AAPL, MSFT, NVDA, TSLA, AMD, GOOGL, META, AMZN

### 2. **Common Trading Queries**
Start typing or leave input empty to see common trading-related prompts:
- "What's the market outlook for"
- "Analyze my trading strategy"
- "Find bullish options for"
- "Risk management for"
- "What's moving the market today?"
- "Show me high IV stocks"
- "Compare technical indicators for"
- "Explain options strategies for"

### 3. **Recent Searches**
Your last 20 searches are automatically saved and suggested:
- Stored in localStorage
- Filtered by what you're typing
- Mixed with common queries for better UX

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate through suggestions |
| `Enter` / `Tab` | Accept selected suggestion |
| `Esc` | Dismiss suggestions |

## Visual Design

- **Floating dropdown** above input field
- **Purple highlight** on selected item
- **Type indicators**:
  - 🟢 Ticker (green)
  - 🔵 Recent (blue)
  - 🟣 Suggestion (purple)
- **Max 5 suggestions** shown at once
- **Smooth animations** with Framer Motion

## Implementation Details

### Components

**`components/chat/input-suggestions.tsx`**
- Renders the suggestions dropdown
- Handles hover states
- Shows keyboard hints
- Animates with Framer Motion

**`hooks/use-input-suggestions.ts`**
- Manages suggestion state
- Filters suggestions based on input
- Handles keyboard navigation
- Saves/loads recent searches from localStorage

### Integration

The feature is integrated into `components/chat/chat-input.tsx`:
1. Hook manages all suggestion logic
2. Keyboard events are intercepted for navigation
3. Recent searches saved on message send
4. Suggestions cleared on blur (with delay for clicks)

### Data Storage

Recent searches are stored in localStorage:
```typescript
Key: "pelican_recent_searches"
Format: string[] (JSON array)
Max items: 20
```

## Customization

### Adding More Tickers

Edit `hooks/use-input-suggestions.ts`:
```typescript
const TICKERS = [
  "SPY", "QQQ", "AAPL", // ... add more here
]
```

### Adding Common Queries

Edit `hooks/use-input-suggestions.ts`:
```typescript
const COMMON_QUERIES = [
  "What's the market outlook for",
  // ... add more here
]
```

### Changing Max Suggestions

```typescript
const MAX_SUGGESTIONS = 5 // Change this value
```

### Adjusting Recent Search Limit

```typescript
const MAX_RECENT_SEARCHES = 20 // Change this value
```

## Future Enhancements

1. **Dynamic Ticker Loading**
   - Fetch popular tickers from API
   - User's watchlist integration
   - Trending stocks

2. **Smart Ranking**
   - Rank by usage frequency
   - Time-based relevance
   - Context-aware suggestions

3. **More Trigger Patterns**
   - `@` for mentioning assets
   - `/` for commands
   - `#` for hashtags/sectors

4. **Personalization**
   - Learn from user's typing patterns
   - Suggest based on conversation context
   - Time-of-day relevant suggestions

5. **Real-time Search**
   - Search as you type
   - Fuzzy matching
   - Typo correction

## Performance

- **Lightweight**: Suggestions filtered in-memory
- **Debounced**: Updates on every keystroke but optimized
- **Lazy**: Only active when input has focus
- **Cached**: Recent searches persist across sessions

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

localStorage is required for recent searches feature.

## Testing

To test the feature:

1. **Ticker suggestions:**
   ```
   Type: $A
   Expected: See AAPL, AMD, AMZN
   ```

2. **Common queries:**
   ```
   Type: What
   Expected: See "What's the market outlook for"
   ```

3. **Recent searches:**
   ```
   1. Send a message
   2. Clear input
   3. Focus input
   Expected: See your previous message
   ```

4. **Keyboard navigation:**
   ```
   1. Type to show suggestions
   2. Press ↓ to select next
   3. Press Enter to accept
   Expected: Input filled with suggestion
   ```

## Troubleshooting

**Suggestions not appearing:**
- Check if input is focused
- Ensure you've typed at least 2 characters (except for $)
- Verify localStorage is enabled

**Recent searches not saving:**
- Check browser localStorage permissions
- Verify console for errors
- Clear localStorage and try again

**Keyboard navigation not working:**
- Ensure suggestions are visible
- Check for JavaScript errors
- Verify focus is on textarea

## API Reference

### `useInputSuggestions(options)`

```typescript
interface UseInputSuggestionsOptions {
  onAccept?: (text: string) => void
}

Returns: {
  input: string
  updateInput: (value: string) => void
  suggestions: Suggestion[]
  visible: boolean
  selectedIndex: number
  handleKeyDown: (e: React.KeyboardEvent) => boolean
  acceptSuggestion: (suggestion: Suggestion) => void
  saveRecentSearch: (search: string) => void
  clearSuggestions: () => void
  handleSuggestionHover: (index: number) => void
}
```

### `Suggestion` Type

```typescript
interface Suggestion {
  text: string
  type: "ticker" | "query" | "recent"
  icon?: React.ReactNode
}
```