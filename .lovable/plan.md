

## Feature Preview Card on Unauthenticated Dates Page

Add a floating "feature preview" card in the top-left corner of the unauthenticated splash screen that gives new users a tantalizing glimpse of what awaits them inside.

### Approach

Rather than embedding the actual screenshots, create a **miniature mock-up card** styled to look like a condensed version of the Care Schedule features — the Food Supply Tracker + reminders. This acts as a "peek behind the curtain" that entices sign-up.

### Change: `src/pages/Dates.tsx` (unauthenticated block, lines 90-108)

Add a decorative preview card positioned `absolute top-6 left-4` (or similar) with:

- **Glassmorphism card**: `backdrop-blur-xl bg-white/15 border border-white/25 rounded-2xl shadow-2xl` — frosted glass floating over the background image
- **Slight rotation**: `rotate-[-3deg]` for a casual, pinned-note feel — visually dynamic
- **Compact mock content** (non-interactive, purely decorative):
  - A mini "Stocked" status row with a green CheckCircle icon + green progress bar
  - A mini "Reminders" row showing "6:00 AM · Daily" with a feeding icon
  - A mini "Food Restock" category chip
- **"Unlock" overlay**: A subtle gradient fade at the bottom of the card with tiny lock icon and "Sign in to unlock" text in white/70
- **Floating animation**: `animate-float` — a gentle up/down CSS keyframe (3s ease-in-out infinite) so it feels alive

### Additional CSS (`src/index.css`)

Add a `@keyframes float` animation:
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-8px) rotate(-3deg); }
}
```

### Visual Result

The main CTA stays centered. In the top-left, a small tilted glassmorphic card shows a beautiful miniature of the tracker features, gently bobbing — making it clear this tab has powerful care tools worth signing up for.

