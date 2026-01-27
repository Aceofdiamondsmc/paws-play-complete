
## Change Default Tab to "All" on Dates Page

A simple one-line update to change the default landing view for authenticated users from "Booked" to "All".

---

### Current Behavior

When an authenticated user navigates to `/dates`, the **Booked** tab is displayed by default.

### New Behavior

When an authenticated user navigates to `/dates`, the **All** tab will be displayed by default, showing all playdates regardless of status.

---

### Implementation

**File:** `src/pages/Dates.tsx`

**Line 76** - Change:
```tsx
<Tabs defaultValue="booked" className="p-4">
```

To:
```tsx
<Tabs defaultValue="all" className="p-4">
```

---

### Summary

| Aspect | Details |
|--------|---------|
| File to modify | `src/pages/Dates.tsx` |
| Line number | 76 |
| Change | `defaultValue="booked"` → `defaultValue="all"` |
| Impact | Authenticated users will see the "All" tab first when opening the Dates page |
