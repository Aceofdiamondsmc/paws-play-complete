

## Plan: Regenerate Confetti Particles Per Render

Move the `PARTICLES` array from module-level into the `ConfettiBurst` component body so each mount produces a unique randomized burst pattern.

### Change

**`src/components/dates/ConfettiBurst.tsx`** — Move the `PARTICLES` constant inside the component function (lines 1-20 move inside the component at line 22). No other files change.

