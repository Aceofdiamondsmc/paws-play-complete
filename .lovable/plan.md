

## Redesign SOS Button: Dog Face Emoji Shape

The current clip-path creates pointed, triangular ears that read as cat-like. The 🐶 dog face emoji has a key difference: **floppy, rounded ears** that droop outward and down, sitting wider apart on a rounder head.

### New clip-path design

I'll craft a new SVG path on a 56×62 canvas with:
- **Large round face** — a wide circle/oval filling most of the space (center ~28,36, radius ~22)
- **Floppy dog ears** — two wide, rounded teardrop shapes that extend from the upper sides of the head and droop downward/outward (like a Labrador or the 🐶 emoji), not pointy upward like a cat
- Ears wider than the head, hanging down to roughly mid-face level

This creates the unmistakable "dog face" silhouette vs. the current cat-like pointy ears.

### File change

**`src/components/lost-dog/LostDogFAB.tsx`** — Replace the `clipPath` with a new dog-face path featuring floppy rounded ears drooping outward, and adjust dimensions slightly for the new proportions.

