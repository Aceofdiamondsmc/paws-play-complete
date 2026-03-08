

## Plan: Celebratory Micro-Animation on Restock

When the tracker transitions from red/empty to green/stocked, play a one-shot celebration effect — a brief scale-bounce + green glow pulse on the card.

### Changes

**1. `src/index.css` — Add two keyframes**

```css
@keyframes restock-celebrate {
  0% { transform: scale(1); }
  30% { transform: scale(1.03); }
  50% { transform: scale(0.98); }
  70% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

@keyframes glow-success {
  0% { box-shadow: 0 0 0 0 hsl(145 60% 45% / 0.6); }
  50% { box-shadow: 0 0 0 12px hsl(145 60% 45% / 0); }
  100% { box-shadow: 0 0 0 0 hsl(145 60% 45% / 0); }
}
```

And a utility class:
```css
.animate-restock-celebrate {
  animation: restock-celebrate 0.5s ease-out, glow-success 1s ease-out;
}
```

**2. `src/components/dates/FoodSupplyTracker.tsx` — Track previous status and apply animation**

- Add `useRef` + `useEffect` to detect when `status` transitions from `'out'` or `'unknown'` → `'stocked'`.
- When that transition occurs, set a local `celebrating` state to `true`, then clear it after 1.5s.
- Apply `animate-restock-celebrate` class to the Card when `celebrating` is true.
- Also show a brief "Restocked!" text flash on the icon area (swap the CheckCircle for a Party Popper or keep CheckCircle with a scale-bounce).

The logic:
```tsx
const [celebrating, setCelebrating] = useState(false);
const prevStatusRef = useRef(status);

useEffect(() => {
  const prev = prevStatusRef.current;
  prevStatusRef.current = status;
  if ((prev === 'out' || prev === 'unknown') && status === 'stocked') {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 1500);
  }
}, [status]);
```

Then on the known-status Card:
```tsx
<Card className={cn('p-4 mb-4 border-2 transition-all duration-500', config.cardClass, celebrating && 'animate-restock-celebrate')}>
```

### Files Changed
- `src/index.css` — add `restock-celebrate` and `glow-success` keyframes + utility class
- `src/components/dates/FoodSupplyTracker.tsx` — add celebration state detection + apply animation class

