# Test Data Examples

## To Test Structured Data Format

Copy and paste this into your chat to see the branded table visualization:

---

## Example 1: VIX Spike Analysis (Matches Your Image)

Based on historical data, here are SPY returns after VIX spikes:

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
    {"date": "May 30, 1997", "return_6m": "16.5%", "pct_pos": "100%", "median_down": "-1.4%", "median_up": null},
    {"date": "Jul 23, 1998", "return_6m": "18.5%", "pct_pos": "10%", "median_down": null, "median_up": null},
    {"date": "Oct 11, 1999", "return_6m": "-1.4%", "pct_pos": "0%", "median_down": null, "median_up": null},
    {"date": "Oct 03, 2019", "return_6m": "12.8%", "pct_pos": "100%", "median_down": "100%", "median_up": null},
    {"date": "Feb 27, 2020", "return_6m": "7.5%", "pct_pos": "100%", "median_down": "100%", "median_up": null},
    {"date": "Jun 11, 2020", "return_6m": "24.1%", "pct_pos": "100%", "median_down": "13.5%", "median_up": "13.5%"},
    {"date": "Sep 03, 2020", "return_6m": "13.5%", "pct_pos": "100%", "median_down": "14.4%", "median_up": null},
    {"date": "Oct 23, 2020", "return_6m": "11.1%", "pct_pos": "86%", "median_down": "-1.4%", "median_up": null}
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

The data shows consistently positive forward returns in 86% of cases after VIX spikes above 30 when near all-time highs.

---

## Example 2: Simple Returns Table

Here are QQQ returns after -3% drops:

<data-table>
{
  "title": "QQQ Returns After -3% Drops",
  "columns": [
    {"key": "date", "label": "Date", "type": "date"},
    {"key": "initial_drop", "label": "Initial Drop", "type": "percentage"},
    {"key": "forward_return", "label": "6M Forward Return", "type": "percentage"}
  ],
  "data": [
    {"date": "2022-01-05", "initial_drop": "-3.07%", "forward_return": "-5.87%"},
    {"date": "2022-02-03", "initial_drop": "-4.05%", "forward_return": "-2.29%"},
    {"date": "2022-03-07", "initial_drop": "-3.69%", "forward_return": "+7.76%"}
  ],
  "summary": {
    "date": "Average",
    "initial_drop": "-3.60%",
    "forward_return": "-0.13%"
  }
}
</data-table>

Mixed results following QQQ drops of 3% or more.

---

## Example 3: Legacy Arrow Format (Still Works)

QQQ Returns After -3% Drops
2022-01-05 –3.07% → –5.87%
2022-02-03 –4.05% → –2.29%
2022-03-07 –3.69% → +7.76%
2023-05-12 –3.21% → +8.44%

---

## Expected Results

### Structured Format:
- ✅ Large Pelican watermark (30% opacity)
- ✅ Purple gradient background
- ✅ Query text displayed at top
- ✅ Custom column headers
- ✅ Color-coded percentages
- ✅ Summary row with purple background
- ✅ "View Raw Text" toggle button

### Legacy Arrow Format:
- ✅ Default columns (Date, Initial Drop, Forward Return, Status)
- ✅ ✓/✗ status indicators
- ✅ Auto-calculated stats
- ✅ Same branding and styling

## How to Test

1. Start your development server: `npm run dev`
2. Navigate to the chat page
3. Copy one of the examples above
4. Paste it as if it were an AI response (you can manually add it to a message for testing)
5. Verify the table renders with proper styling

## Troubleshooting

If the table doesn't render:
1. Check browser console for errors
2. Verify JSON is valid (use JSONLint)
3. Ensure `<data-table>` tags are present
4. Check that all required fields (columns, data) exist
5. View the "Raw Text" to see what was parsed
