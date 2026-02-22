

## Fix: Global Care Notifications

### Root Cause
The `CareNotificationProvider` approach is correct in principle, but two issues prevent it from working reliably:

1. **Duplicate hook instances**: `CareScheduleSection` (line 66) still independently calls `useCareNotifications(reminders)`. When the user is on the Dates tab, two separate instances run with separate refs and state, potentially causing conflicts or double notifications.

2. **Timing race**: The provider's `useCareReminders` fetches data asynchronously. The notification check runs immediately on mount with an empty `reminders` array, then the effect re-runs when data arrives -- but the initial empty-array run can mask issues.

### Solution

**1. Remove `useCareNotifications` from `CareScheduleSection`**

Stop calling the hook directly in `CareScheduleSection`. Instead, lift the notification state so the global provider is the single source of truth.

**2. Create a React Context for care notification state**

Since `CareScheduleSection` needs access to `triggeredReminder`, `missedMedications`, `permissionStatus`, etc. for its UI banners, expose these via a context from the provider.

**3. Update `CareNotificationProvider` to provide context**

Wrap children (or use a standalone context) so any component can consume the notification state.

### Files to Change

| File | Change |
|------|--------|
| `src/components/CareNotificationProvider.tsx` | Convert to a context provider that exposes notification state from `useCareNotifications` |
| `src/components/layout/AppLayout.tsx` | Wrap content with the care notification context provider |
| `src/components/dates/CareScheduleSection.tsx` | Remove direct `useCareNotifications` call; consume from context instead |

### Technical Details

**New context shape:**
```text
CareNotificationContext {
  permissionStatus
  requestPermission()
  triggeredReminder
  clearTriggeredReminder()
  missedMedications
  hasMissedDose
  clearMissedMedication()
  reminders        // from useCareReminders
  addReminder()
  deleteReminder()
  snoozeReminder()
  loading
}
```

- `CareNotificationProvider` will call both `useCareReminders()` and `useCareNotifications(reminders)` in a single place, then expose all values via React context.
- `CareScheduleSection` will consume this context instead of calling the hooks directly, eliminating duplicate instances.
- This guarantees exactly one notification polling loop runs globally, regardless of which tab is active.

