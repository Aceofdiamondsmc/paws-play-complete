

## Fix: Right-Side Playdate Preview Card Not Visible

The card has `opacity: 0` in its inline style, expecting the animation to bring it to `opacity: 1`. But the `float-right` keyframes only handle `transform` — they never touch opacity. So the card stays invisible forever.

### Fix: `src/index.css`

Update the `float-right` keyframes to include `opacity: 1`:

```css
@keyframes float-right {
  0%, 100% { transform: translateY(0) rotate(3deg); opacity: 1; }
  50% { transform: translateY(-8px) rotate(3deg); opacity: 1; }
}
```

This single change makes the card appear once the 1.5s delay elapses, then bob continuously — matching the left card's behavior.

