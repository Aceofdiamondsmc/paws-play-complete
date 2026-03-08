

## Plan: Add Confetti Burst on Restock Celebration

Add a lightweight CSS-only confetti effect that fires alongside the existing scale-bounce + glow animation when transitioning to "stocked." No external libraries needed — we'll use a set of small colored dots/squares that burst outward from the card using CSS keyframes.

### Approach

Create a `ConfettiBurst` component that renders ~12 small colored spans, each with a randomized radial trajectory via CSS custom properties. It renders only when `celebrating` is true and auto-cleans up.

### Changes

**1. New file: `src/components/dates/ConfettiBurst.tsx`**

A small component that renders confetti particles using CSS animations:
- 12 particles with predefined colors (green, gold, coral, teal — matching the app palette)
- Each particle gets a unique `--angle` and `--distance` CSS variable for its trajectory
- Particles burst outward and fade over ~1s
- Component only mounts when `celebrating` is true

**2. `src/index.css` — Add confetti keyframe**

```css
@keyframes confetti-burst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
```

**3. `src/components/dates/FoodSupplyTracker.tsx` — Render ConfettiBurst**

Import and render `<ConfettiBurst />` inside the Card when `celebrating` is true. Position it absolutely over the card center.

### Files
- **New**: `src/components/dates/ConfettiBurst.tsx`
- **Edit**: `src/index.css` — add `confetti-burst` keyframe
- **Edit**: `src/components/dates/FoodSupplyTracker.tsx` — import and render confetti

