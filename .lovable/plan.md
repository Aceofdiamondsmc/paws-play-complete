

## Plan: CTA Button + Simultaneous Preview Cards on Unauthenticated Dates Tab

### Two Changes

**1. Add "Log Your First Restock" CTA to `FoodSupplyTracker.tsx`**

- Add `onLogRestock?: () => void` prop to `FoodSupplyTrackerProps`
- In the `unknown` state card (line 22-73): add a CTA button after the bag size toggle:
  ```tsx
  <Button size="sm" className="w-full mt-3 rounded-full bg-destructive/90 hover:bg-destructive text-white font-semibold" onClick={onLogRestock}>
    <ShoppingBag className="w-4 h-4 mr-1" /> Log Your First Restock
  </Button>
  ```
- In the known-status card: add a "Restock Now" button when status is `out`
- Wire in `CareScheduleSection.tsx` by passing `onLogRestock={() => handleQuickLog('restock', 'Restocked')}` to `<FoodSupplyTracker>`

**2. Make both unauthenticated preview cards appear simultaneously (`Dates.tsx`)**

Currently the right-side Playdate Preview Card has `opacity: 0` with `animationFillMode: 'forwards'` and a `1.5s` delay — it fades in after the left card. To make both appear together in a more aesthetically pleasing way:

- Remove the staggered delay: change both cards to appear immediately with `opacity: 1`
- Instead of sequential fade-in, give them a **synchronized floating dance** — both bob gently but in opposite phase (one rises while the other dips), creating a balanced, lively feel:
  - Left card: `animation: 'float 3s ease-in-out infinite'` (already exists)
  - Right card: `animation: 'float-right 3s ease-in-out infinite'` with NO delay, starts at `opacity: 1`
- Remove `animationFillMode: 'forwards'` from the right card's inline style

This makes the splash screen feel alive and balanced from the first frame — both cards greet the user together in a synchronized floating motion.

### Files Changed
- `src/components/dates/FoodSupplyTracker.tsx` — add `onLogRestock` prop + CTA buttons
- `src/components/dates/CareScheduleSection.tsx` — pass `onLogRestock` callback
- `src/pages/Dates.tsx` — remove opacity/delay from right preview card

