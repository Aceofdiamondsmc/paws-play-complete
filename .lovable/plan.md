

## Fix QR Code Getting Cropped on Lost Dog Flyer

### Problem
The large 384px dog photo plus all the content sections push the footer (with the QR code) past the bottom of the 11-inch page.

### Solution
Move the QR code from the bottom footer into the **contact section**, placing it inline next to the phone number. This keeps it visible, scannable, and within the page bounds regardless of photo size.

**Layout change for the contact/footer area:**

```text
Before:
┌─────────────────────────┐
│     CONTACT OWNER       │
│    555-123-4567          │
└─────────────────────────┘
┌─────────────────────────┐
│ PawsPlayRepeat.com  [QR]│
└─────────────────────────┘

After:
┌─────────────────────────┐
│     CONTACT OWNER       │
│  555-123-4567     [QR]  │
│                 SCAN ME │
└─────────────────────────┘
  PawsPlayRepeat.com
```

### Changes

**File: `src/components/lost-dog/FlyerTemplate.tsx`**

1. **React component** (lines 129-152): Replace the separate contact box + footer with a single contact box that has the phone number on the left and QR code on the right, then a small "Created on PawsPlayRepeat.com" line below it
2. **`generateFlyerHTML` function** (lines 230-245): Same layout change in the standalone HTML version — merge QR into the contact section, move branding text below

### What stays the same
- Dog photo size unchanged (384px)
- Header, dog info, last seen, reward sections all unchanged
- QR code size unchanged (96px)
- All image readiness logic unchanged
- No iOS build needed

