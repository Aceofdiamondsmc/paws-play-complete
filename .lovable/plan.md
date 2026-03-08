

## Food Supply Tracker: Default to "Empty" Red Pulse State

Great instinct — the red pulsating "Out of Stock" state is visually magnetic. Instead of hiding the tracker by default, we show it in its most urgent, eye-catching state to draw users in and prompt their first interaction.

### Approach

**Default behavior change**: When a user has never logged a restock (status is `unknown`), instead of showing the current dull dashed-border "Log a restock to start tracking" card, we render the full tracker UI in its `out` (red pulse) state with an empty progress bar and a CTA to log their first restock.

### Changes

**1. `FoodSupplyTracker.tsx` — Replace the `unknown` state card (lines 20-38)**

Instead of the muted placeholder, render the tracker using the `out` config visuals: red gradient, `animate-pulse-urgent`, pulsing icon, empty progress bar (0%), and a subtitle like "Log a restock to start tracking your supply." This reuses the existing `out` styling so it looks identical to the critical state — the moth-to-flame effect.

**2. `CareScheduleSection.tsx` — Default `trackerEnabled` to `true` (keep current behavior, line 72-74)**

Keep defaulting to `true` so new users see the attractive red-pulsing tracker immediately. No change needed here — current default is already `true`.

**3. `CareScheduleSection.tsx` — Auto-enable on restock logs (inside `handleQuickLog`, ~line 161)**

When a user logs a `restock` action, auto-enable the tracker if it was dismissed, so restocking always brings it back.

**4. `CareScheduleSection.tsx` — Show `EnableFoodTrackerButton` prominently when dismissed + has data (~line 206)**

When tracker is off but has history, show the re-enable button in the tracker's normal position (not buried in the quick log scroll).

### Result

- New users see a pulsating red "empty" tracker — visually compelling, drives first interaction
- After first restock log, it transitions to green "Stocked" — satisfying feedback loop
- Dismissed tracker can be re-enabled easily via prominent button or by logging a restock
- The red pulse acts as a persistent engagement hook until the user takes action

