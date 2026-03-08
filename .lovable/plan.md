

## Fix: Seesaw Motion for Preview Cards

The issue is both `float` and `float-right` keyframes move **up** at the 50% mark. To get the seesaw effect (one rises while the other dips), we just need to invert `float-right` so it goes **down** at 50% instead of up.

### Change: `src/index.css` (lines 261-263)

Update the `float-right` keyframe so it translates **downward** at the midpoint:

```css
@keyframes float-right {
  0%, 100% { transform: translateY(0) rotate(3deg); opacity: 1; }
  50% { transform: translateY(8px) rotate(3deg); opacity: 1; }  /* positive = down */
}
```

That's it — one character change (`-8px` → `8px`). Left card bobs up, right card dips down, perfectly out of phase.

