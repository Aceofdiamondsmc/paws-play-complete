

## Plan: Add App Store Badge to Landing Page

### Summary
Add the Apple Smart App Banner meta tag to `index.html` and a "Coming Soon" App Store badge to the Landing page footer, ready to be activated when the app goes live.

### Changes

**1. `index.html`** — Add Smart App Banner meta tag
- Add `<meta name="apple-itunes-app" content="app-id=6760650358">` in the `<head>` section (after the existing viewport meta tag)

**2. `src/pages/Landing.tsx`** — Add App Store badge in the footer
- Insert a "Coming Soon" App Store badge between the legal links and the copyright line
- Badge links to `https://apps.apple.com/app/id6760650358` but is visually dimmed (`opacity-60`) with `pointer-events-none` to indicate it's not yet available
- Uses the official Apple badge image from `tools.applemediaservices.com`
- Styled with Tailwind classes to match the existing footer design
- When the app goes live on the App Store, simply remove the opacity and pointer-events classes to activate it

### Technical details
- The badge section will be a centered `div` with the "Coming Soon" label in `text-xs text-muted-foreground` and the Apple badge image at 40px height
- No new dependencies required — just an `<img>` tag pointing to Apple's hosted badge URL

