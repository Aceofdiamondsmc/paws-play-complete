

# Plan: Add "Paws Play Repeat" Title to Landing Page

## Overview
Add the missing colorful "Paws Play Repeat" title text back to the landing page with the exact brand colors and add a shadow backdrop around the letters for improved visibility against the background image.

---

## What Will Be Added

**File:** `src/pages/Landing.tsx`

Insert the colorful title between the Paw Print icon and the tagline (lines 48-50):

```tsx
{/* Colorful Title */}
<h1 className="text-4xl font-extrabold italic mb-2 text-center">
  <span 
    className="text-[#FF6B6B]" 
    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
  >
    Paws
  </span>
  <span 
    className="text-[#4ECDC4]" 
    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
  >
    Play
  </span>
  <span 
    className="text-[#95D44A]" 
    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
  >
    Repeat
  </span>
</h1>
```

---

## Design Details

| Element | Value |
|---------|-------|
| "Paws" color | `#FF6B6B` (coral/red) |
| "Play" color | `#4ECDC4` (teal/turquoise) |
| "Repeat" color | `#95D44A` (green) |
| Font | Nunito (inherited from body) |
| Weight | `font-extrabold` (800) |
| Style | `italic` |
| Size | `text-4xl` (2.25rem / 36px) |
| Shadow | `2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)` |

The text shadow creates a soft dark glow behind each word, ensuring the colorful text pops against any background - exactly as shown in your reference image.

---

## What Stays Unchanged

- Background image (`landing-hero.avif`)
- Gradient overlay
- Paw print icon with frosted glass effect
- Tagline text
- "Let's Play" button styling and positioning
- Footer with links
- Safe area insets
- All authentication redirect logic

---

## File Modified

| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | Add colorful title with shadow at lines 48-50 |

