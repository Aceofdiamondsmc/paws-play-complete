

## Fix SOS Button: Proper Dog Face Emoji Shape

The current clip-path has disconnected ear pieces (separate `M` commands) creating a carved-out pumpkin look. Let me take a completely different approach.

### Strategy: Drop clip-path, use an inline SVG instead

Clip-path with complex organic shapes is fragile and hard to get right. Instead, I'll use an **inline SVG dog-face silhouette** as the button background — this gives pixel-perfect control and is the same technique emoji renderers use.

### Design

The button will render an SVG that traces the 🐶 dog face emoji silhouette:
- **Round head** — large circle/ellipse
- **Two floppy ears** — rounded shapes drooping down from the top-sides of the head, wider than the head itself
- All filled with the destructive (red) color
- "SOS" text layered on top via SVG `<text>` element

This is a single connected SVG shape, not a clip-path hack. The SVG path will trace: start at left ear tip → curve down along left ear → merge into left side of head → curve around bottom → up right side → right ear down and back up → across top → back to start. One continuous filled path.

### File: `src/components/lost-dog/LostDogFAB.tsx`

Replace the `<button>` with a button wrapping an inline SVG (viewBox `0 0 60 64`). The SVG contains:
1. A single `<path>` for the dog head + floppy ears silhouette
2. A `<text>` element for "SOS" centered on the face

Remove the `clipPath` style entirely. Keep all existing classes (fixed positioning, z-index, animation, hover behavior).

