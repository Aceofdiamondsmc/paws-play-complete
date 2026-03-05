

## Add Dog-Themed Alert Sounds

### Approach
Use the Web Audio API to synthesize two dog-themed notification tones directly in code — no external files needed. This avoids licensing concerns and keeps the bundle small.

1. **Playful yip + bell** (regular reminders): Short high-pitched tone sequence simulating a small dog yip, followed by a soft bell chime
2. **Urgent whimper + double bell** (missed medications): Lower-pitched urgent tone with a repeated bell pattern

### Changes

**1. Create `src/lib/alert-sounds.ts`**
- Export `playReminderSound()` and `playUrgentSound()` functions
- Use `AudioContext` to synthesize tones (oscillator for yip/whimper, higher frequency for bell)
- Wrap in try/catch with silent failure for autoplay restrictions

**2. Update `src/hooks/useCareNotifications.tsx`**
- Import both sound functions
- Call `playReminderSound()` before each regular `new Notification(...)` 
- Call `playUrgentSound()` before each missed medication `new Notification(...)`

No new dependencies or external files required.

