

## Fix: Notification Bell Prompt Overlapping Bottom Nav

**Problem**: The notification prompt card sits too low on the screen (`bottom-24` / 6rem), causing the bell icon to overlap with the "Me" icon in the bottom navigation bar (which is `h-20` / 5rem tall).

**Solution**: Increase the bottom offset of the notification prompt so it clears the bottom nav entirely.

### Changes

**File: `src/components/notifications/NotificationPrompt.tsx`**
- Change the container's positioning class from `bottom-24` to `bottom-28` (7rem), giving more clearance above the bottom navigation bar. This ensures the card floats comfortably above all nav icons without overlapping.

This is a single-line CSS class change -- quick and minimal.

