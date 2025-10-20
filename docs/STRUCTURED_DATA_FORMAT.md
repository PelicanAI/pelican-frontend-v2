# Structured Data Table Format

## Overview

The chat interface now supports automatic visualization of structured data using XML-like markers. When the AI wraps data in `<data-table>` tags, it will automatically render as a branded Pelican table.

## Format Specification

```xml
<data-table>
{
  "query": "User's original question (optional)",
  "title": "Table Title",
  "columns": [
    {
      "key": "unique_key",
      "label": "Display Name",
      "type": "date|percentage|number|text",
      "align": "left|center|right"
    }
  ],
  "data": [
    {"unique_key": "value", ...}
  ],
  "summary": {"unique_key": "summary value", ...}  // Optional
}
</data-table>
```

## Example 1: VIX Spike Returns

**AI Response:**
```markdown
Here are the results for SPY returns after VIX spikes:

<data-table>
{
  "query": "Show me SPY returns 6 months after VIX spikes above 30 when we're within 5% of ATH",
  "title": "SPY 6-Month Forward Returns",
  "columns": [
    {"key": "date", "label": "Date", "type": "date"},
    {"key": "return_6m", "label": "6-month Forward Return", "type": "percentage"},
    {"key": "pct_pos", "label": "% Pos", "type": "percentage"},
    {"key": "median_down", "label": "Median Down Market", "type": "percentage"},
    {"key": "median_up", "label": "Median Up Market Return", "type": "percentage"}
  ],
  "data": [
    {
      "date": "May 30, 1997",
      "return_6m": "16.5%",
      "pct_pos": "100%",
      "median_down": "-1.4%",
      "median_up": null
    },
    {
      "date": "Jul 23, 1998",
      "return_6m": "18.5%",
      "pct_pos": "10%",
      "median_down": null,
      "median_up": null
    },
    {
      "date": "Oct 11, 1999",
      "return_6m": "-1.4%",
      "pct_pos": "0%",
      "median_down": null,
      "median_up": null
    }
  ],
  "summary": {
    "date": "All occurrences",
    "return_6m": "11.9%",
    "pct_pos": "86%",
    "median_down": "-86%",
    "median_up": "13.5%"
  }
}
</data-table>

The data shows that in most cases (86%), SPY posted positive returns 6 months after VIX spikes above 30...
```

**Result:** Automatically renders as a branded table with:
- Large Pelican watermark (30% opacity)
- Purple gradient background
- Query text displayed above table
- Color-coded percentages (green/red)
- Summary row at bottom
- Toggle to view raw text

## Example 2: Simple Price Data

```markdown
<data-table>
{
  "title": "QQQ Returns After -3% Drops",
  "columns": [
    {"key": "date", "label": "Date", "type": "date"},
    {"key": "spy_close", "label": "SPY Close", "type": "number"},
    {"key": "return", "label": "Return", "type": "percentage"}
  ],
  "data": [
    {"date": "2022-01-05", "spy_close": "$450.32", "return": "+14.7%"},
    {"date": "2022-02-03", "spy_close": "$438.21", "return": "-2.3%"}
  ]
}
</data-table>
```

## Column Types

| Type | Description | Auto-Formatting |
|------|-------------|-----------------|
| `date` | Date values | Left-aligned, bold |
| `percentage` | Percentage values | Green if positive, red if negative |
| `number` | Numeric values | Right-aligned |
| `text` | Text/string values | Left-aligned |

## Missing Data

Use `null` or omit the key for missing data. Will render as `—`:

```json
{
  "date": "May 30, 1997",
  "return": "16.5%",
  "volume": null  // Shows as —
}
```

## Summary Row

Optional footer row with aggregate statistics:

```json
"summary": {
  "date": "All occurrences",
  "return": "+11.9%",
  "count": "8 instances"
}
```

Renders with purple background and bold text.

## Backward Compatibility

The system still supports the legacy arrow format:

```
QQQ Returns After -3% Drops
2022-01-05 –3.07% → –5.87%
2022-02-03 –4.05% → –2.29%
```

This will automatically render with default columns: Date | Initial Drop | Forward Return | Status

## Best Practices

1. **Use structured format for complex data** - More than 3 columns or custom column names
2. **Include the query** - Helps users understand the context
3. **Provide a title** - If different from the query
4. **Use percentage type** - Automatic color coding for returns
5. **Add summary rows** - For aggregate statistics
6. **Handle missing data** - Use `null` instead of empty strings

## Testing

Test your formatted data by pasting it into the chat. The system will:
1. Detect the `<data-table>` markers
2. Parse the JSON
3. Validate the structure
4. Render as a branded table
5. Show "View Raw Text" toggle

If parsing fails, it will gracefully fall back to showing the raw text as markdown.
