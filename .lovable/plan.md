

## Add Playdate Preview Card (Right Side)

### Change: `src/pages/Dates.tsx` (after line 135, before the Main CTA)

Add a second floating glassmorphic card positioned `absolute top-16 right-4` with a delayed float animation (`animation-delay: 1.5s`) so the two cards bob out of sync.

**Content:**
- Two overlapping mini dog avatars (colored circle fallbacks with paw emojis)
- Dog names: "Bella & Max"
- A mini date/time row with CalendarDays + Clock icons: "Mar 15 · 2:00 PM"
- A mini location row with MapPin: "Central Bark Park"
- A green "Accepted ✓" status chip
- Same "Sign in to unlock" gradient overlay at the bottom

**Styling:** Matches the left card — `backdrop-blur-xl bg-white/15 border-white/25 rounded-2xl shadow-2xl`, but with `rotate-[3deg]` (mirrored tilt from the left card's `-3deg`). Slightly different width (`w-44`) for visual variety.

### CSS Addition: `src/index.css`

Add a second float keyframe variant with the opposite rotation:
```css
@keyframes float-right {
  0%, 100% { transform: translateY(0) rotate(3deg); }
  50% { transform: translateY(-8px) rotate(3deg); }
}
```

This creates a balanced, symmetrical layout — care features teaser on the left, playdate teaser on the right, main CTA centered between them.

