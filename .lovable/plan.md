

## Fix Feeding Icon Color

### Problem
The `UtensilsCrossed` icon for the "feeding" category uses `text-accent-foreground` while every other category icon uses `text-primary`. Depending on the theme, `accent-foreground` may blend into the background, making it invisible.

### Fix
**File:** `src/components/dates/CareScheduleSection.tsx`, line 35

Change:
```tsx
return <UtensilsCrossed className="w-4 h-4 text-accent-foreground" />;
```
To:
```tsx
return <UtensilsCrossed className="w-4 h-4 text-primary" />;
```

One line change. No other files or logic affected.
