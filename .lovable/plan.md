

## Make Care Reminders Work Globally (All Tabs)

### Problem
The care reminder notification system (walk, medication, feeding alerts) only runs when the Dates tab is open because `useCareNotifications` is called exclusively inside `CareScheduleSection`, which is a child of the Dates page.

### Solution
Create a lightweight global provider component that runs the reminder-checking logic app-wide, independent of which tab is active.

### Changes

**1. New file: `src/components/CareNotificationProvider.tsx`**
- A wrapper component rendered inside `AppLayout` (so it's active on all tabs)
- Fetches the user's care reminders from Supabase (same query as `useCareReminders`)
- Passes them to `useCareNotifications` to run the 30-second/60-second polling intervals
- Renders nothing visible -- it's purely a background service component

**2. Modified file: `src/components/layout/AppLayout.tsx`**
- Import and render `<CareNotificationProvider />` alongside the existing layout elements
- This ensures the polling starts as soon as the user enters any app tab

### How It Works

The existing `CareScheduleSection` on the Dates tab will continue to work as before for the UI (showing reminders, logging activities, etc.). The new provider simply ensures the background notification polling runs regardless of which tab the user is on.

### Technical Details

- The provider fetches reminders once on mount and subscribes to realtime changes on the `care_reminders` table for the current user
- `useCareNotifications` handles browser Notification API calls and missed medication checks using its existing 30s/60s intervals
- No database changes needed -- this is purely a frontend wiring fix
