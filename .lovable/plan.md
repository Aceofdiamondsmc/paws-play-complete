

## Update Lost Dog FAB: Dog Face Circle with Subtle Pulse

### Changes

**`src/components/lost-dog/LostDogFAB.tsx`**
- Replace the square clip-path with a **circular dog-face silhouette** clip-path — a circle with two ear bumps on top (like a dog head from the front)
- Remove the paw SVG icon entirely, keep only "SOS" text centered
- Replace `animate-pulse` with a custom `animate-pulse-fade` class

The new clip-path will use a circle base (~60% radius) with two overlapping circles for ears, creating a recognizable dog-head silhouette that reads as round, not square.

```
clipPath: circle body + two ear bumps at top-left and top-right
```

Approximate SVG-style path: a round face with two floppy ear shapes extending from the top.

**`src/index.css`**
- Add `pulse-fade` keyframe that fades opacity from 1 → 0.15 → 1 over 3s
- Add `.animate-pulse-fade` utility class

### Files
| File | Change |
|------|--------|
| `src/components/lost-dog/LostDogFAB.tsx` | New dog-face circle clip-path, remove paw icon, use pulse-fade |
| `src/index.css` | Add pulse-fade keyframe + utility |

