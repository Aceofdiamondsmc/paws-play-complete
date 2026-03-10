

## Plan: Enhance Floating "Add Park" Button Visibility

### Problem
The floating `+` button on the Parks page blends in with the primary-colored tab bar, making it easy to miss.

### Solution
Replace the plain icon-only FAB with a slightly wider pill-shaped button that includes a small label. This makes it self-documenting and visually distinct without being intrusive.

### Change: `src/pages/Parks.tsx` (lines 271-280)

Replace the current icon-only `Button` with a pill-shaped FAB:

```tsx
{user && (
  <Button
    onClick={() => setSuggestOpen(true)}
    className="fixed bottom-24 right-4 z-30 rounded-full h-12 px-4 shadow-lg gap-1.5 bg-[#228B22] hover:bg-[#1a6b1a] text-white"
  >
    <Plus className="h-5 w-5" />
    <span className="text-xs font-semibold">Add Park</span>
  </Button>
)}
```

**What changes:**
- Pill shape with label "Add Park" next to the `+` icon — instantly communicable.
- Uses the green accent color (`#228B22`, matching the active nav icon) instead of the default primary orange — visually differentiates from the bottom nav.
- Bumped to `bottom-24` so it sits comfortably above the nav bar.
- No other files or components touched.

