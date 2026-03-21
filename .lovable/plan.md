

## Fix: App Store Badge Covering "Let's Play" Button

### Problem
The fixed footer (legal links + App Store badge + copyright) is tall enough to overlap the "Let's Play" button. The button has `mb-32` (128px) but the footer with the added badge is taller than that.

### Solution
Increase the button's bottom margin from `mb-32` to `mb-48` (192px) to ensure it sits above the taller footer.

### Change
**`src/pages/Landing.tsx` line 88** — Change `mb-32` to `mb-48` on the Let's Play button.

