

## Notification Button & Parks Header Fixes

This plan addresses two UI improvements: fixing the notification enable button behavior on the Dates tab and making the Parks tab header sticky.

---

### What You'll Get

**1. Fixed Notification Enable Button (Dates tab)**
- Checks `Notification.permission` on component mount
- Shows "🔔 Notifications Active" status when already granted
- Shows green "Active" state with success toast when user clicks Enable
- Shows red "Notifications Blocked" button with info tooltip when denied
- State preserved across scrolling (no resets)

**2. Sticky Parks Header**
- Header and filter pills stick to top while scrolling
- Professional backdrop blur effect with semi-transparent background
- Content scrolls smoothly underneath without overlap

---

### Implementation Details

**Part 1: CareScheduleSection.tsx - Notification Button Fix**

The current code only shows the Enable button when `permissionStatus !== 'granted'`. We need to expand this to handle all three states:

```text
Permission States:
┌─────────────┬────────────────────────────────────────────────┐
│ granted     │ 🔔 Notifications Active (green badge/text)     │
├─────────────┼────────────────────────────────────────────────┤
│ default     │ Enable button (current behavior + toast)       │
├─────────────┼────────────────────────────────────────────────┤
│ denied      │ ❌ Notifications Blocked (red button + info)   │
└─────────────┴────────────────────────────────────────────────┘
```

Updated UI section:
```jsx
{/* Notification Status */}
{permissionStatus === 'granted' ? (
  <div className="mb-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center gap-2">
    <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
    <span className="text-sm font-medium text-green-700 dark:text-green-300">
      🔔 Notifications Active
    </span>
  </div>
) : permissionStatus === 'denied' ? (
  <div className="mb-4 p-3 rounded-lg bg-destructive/10 flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm text-destructive">
      <BellOff className="w-4 h-4" />
      <span>Notifications Blocked</span>
    </div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="w-4 h-4 text-destructive" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Enable in browser settings: Settings → Site Settings → Notifications</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
) : (
  <div className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <BellOff className="w-4 h-4" />
      <span>Enable notifications for reminders</span>
    </div>
    <Button 
      size="sm" 
      variant="outline" 
      className="rounded-full" 
      onClick={handleEnableNotifications}
    >
      <Bell className="w-4 h-4 mr-1" />
      Enable
    </Button>
  </div>
)}
```

Add handler with toast feedback:
```typescript
const handleEnableNotifications = async () => {
  const granted = await requestPermission();
  if (granted) {
    toast.success('Notifications enabled! You will be reminded for walks, meals, and medications.');
  } else {
    toast.error('Notifications were not enabled. You can enable them in browser settings.');
  }
};
```

**Part 2: Parks.tsx - Sticky Header**

Current structure:
- Header div with z-10 (not sticky)
- Content div with flex-1

Updated structure:
- Header div with `sticky top-0 z-20 backdrop-blur-md bg-card/95`
- Content area adjusted with no extra padding needed (sticky doesn't remove from flow)

```jsx
<div className="h-screen flex flex-col">
  {/* Sticky Header */}
  <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border p-4 space-y-3 shrink-0">
    {/* Title and Map/List toggle */}
    {/* Filter Pills */}
    {/* Active filter count */}
  </div>

  {/* Content */}
  {viewMode === 'map' ? (
    <div className="flex-1 relative">
      <ParksMap ... />
    </div>
  ) : (
    <div className="flex-1 overflow-y-auto">
      <ParksList ... />
    </div>
  )}
</div>
```

Note: Since we're using `sticky` instead of `fixed`, the content naturally flows below the header - no extra padding-top is needed.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dates/CareScheduleSection.tsx` | Add three-state notification UI (granted/denied/default), add toast feedback, import Tooltip components and Info icon |
| `src/pages/Parks.tsx` | Add `sticky top-0 z-20 backdrop-blur-md bg-card/95` to header div |

---

### Technical Notes

**Notification Permission State**
- The `useCareNotifications` hook already checks `Notification.permission` on mount (line 16-18)
- The state updates automatically when `requestPermission()` is called
- No global context needed - the hook already preserves state during scrolling (React state persists during re-renders)

**Sticky vs Fixed Positioning**
- Using `sticky` rather than `fixed` because:
  - Doesn't need manual padding adjustments
  - Works naturally within the flex container
  - Content flows correctly underneath
  - Better mobile behavior

**Backdrop Blur**
- `backdrop-blur-md` applies 12px blur
- `bg-card/95` (95% opacity) allows slight transparency for the blur effect to show
- High z-index (20) ensures it stays above content

