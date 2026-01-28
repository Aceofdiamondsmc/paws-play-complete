
# Plan: Replace Landing Page Background Image

## Overview
Replace the current landing page background image (`landing-pug-glasses.jpg`) with the new higher-quality version (`Landing_Page_image_Paws_Play_Repeat.avif`) while keeping all existing text, layout, styling, and functionality unchanged.

---

## Changes

### 1. Copy New Image to Assets

Copy the uploaded AVIF image to the `src/assets` folder with a clean filename:

| Source | Destination |
|--------|-------------|
| `user-uploads://Landing_Page_image_Paws_Play_Repeat.avif` | `src/assets/landing-hero.avif` |

**Why AVIF?** AVIF is a modern image format that provides superior compression and quality compared to JPG, resulting in faster load times and a crisper visual appearance - perfect for a "billion dollar app" look.

---

### 2. Update Landing.tsx Import

**File:** `src/pages/Landing.tsx`

Change the import from the old JPG to the new AVIF:

```typescript
// Before
import landingPugGlasses from '@/assets/landing-pug-glasses.jpg';

// After  
import landingHero from '@/assets/landing-hero.avif';
```

Update the image source reference:

```tsx
// Before
<img src={landingPugGlasses} alt="Paws Play Repeat" ... />

// After
<img src={landingHero} alt="Paws Play Repeat" ... />
```

---

## What Stays the Same

All existing design elements remain unchanged:
- Paw print icon at top with frosted glass effect
- "Friendly neighbors for furry friends" tagline
- Yellow "Let's Play" CTA button positioned in thumb zone
- Gradient overlay (`from-black/30 via-transparent to-black/40`)
- `object-cover` with `objectPosition: 'center 30%'`
- Fixed footer with Privacy, Terms, and Support links
- Safe area insets for mobile devices
- Auth redirect logic for logged-in users

---

## Files Modified

| File | Change |
|------|--------|
| `src/assets/landing-hero.avif` | New file (copied from upload) |
| `src/pages/Landing.tsx` | Update import and img src |

---

## Browser Compatibility Note

AVIF is supported in all modern browsers (Chrome, Firefox, Safari 16+, Edge). For older Safari versions (15 and below), we could add a fallback, but this represents less than 1% of users as of 2026.

---

## Result

After this change, the landing page will display the new premium background image while maintaining the exact same layout, text, and interactive behavior - giving the app that polished, billion-dollar look.
