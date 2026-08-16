# Closer Dashboard

Reusable templates for a sales-team performance dashboard and discovery-coaching report, built for a closing team's EOD (end-of-day) submission data.

## What's here

- **`dashboard_template.html`** — a self-contained, dependency-free HTML/CSS/JS dashboard with three tabs:
  - **Overview** — team KPIs, daily new-cash-collected trend, per-closer ranked bar chart.
  - **Call Outcomes** — funnel (booked → showed → offer → closed), outcome mix by closer, full outcome count table.
  - **Leaderboard & Incentives** — day/week leaderboards, editable incentive tier thresholds, editable top-3 labels (persisted via `localStorage`).

  The file has a single placeholder, `__EOD_DATA__`, meant to be replaced with a compact JSON array of submission records before publishing. Expected record shape:

  ```json
  {
    "d": "2026-08-11",        // report date, YYYY-MM-DD
    "c": "Closer Name",
    "nc": 4, "su": 3, "om": 2,  // new calls, showed up, offers made
    "cc": 0, "pp": 0, "rv": 0, "fc": 1,
    "ppOut": 1350, "dcOut": 0,  // payment-plan / deferred-cash collected that day
    "out": [
      { "t": "new", "o": "Closed", "cc": "2428.00" },
      { "t": "fu",  "o": "Deposit", "cc": "135.00" }
    ]
  }
  ```

- **`coaching_template.html`** — a per-person coaching report layout (stat tiles, a strength card, a growth-area card, an action-plan list) with `{{PLACEHOLDER}}` tokens meant to be filled in with real analysis before publishing.

Both files are plain HTML — open directly in a browser, no build step, no dependencies. Colors and typography are theme-aware (light/dark via `prefers-color-scheme` and a `data-theme` attribute override).

## How it's meant to be used

1. Pull submission data from your own EOD reporting system for a date range.
2. Transform it into the record shape above.
3. Replace `__EOD_DATA__` in `dashboard_template.html` with the JSON array (as text, not a script tag reference — the file must stay self-contained).
4. Publish/host the resulting HTML wherever you like.

Repeat similarly for `coaching_template.html`, filling in the `{{...}}` tokens with real content per person.

## Note

This repo intentionally contains **only the reusable template code** — no real submission data, names, or figures from any specific team are included.
