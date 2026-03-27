

## Create a Subscription Plans Page for App Store Screenshots

### What
A new `/plans` page that displays the two IAP subscription tiers (Starter Monthly $9.99/mo, Starter Yearly $99.99/yr) in a clean, App Store screenshot-ready layout. This page will be accessible from a route so you can navigate to it and take a screenshot for the App Store review submission.

### Design
- Full-screen page with the app's branding colors
- Two plan cards side by side (or stacked on mobile) showing:
  - **Starter Monthly** — $9.99/month with monthly billing details
  - **Starter Yearly** — $99.99/year with "Save 17%" badge
- Each card lists included features (directory listing, searchable, contact info, cancel anytime)
- A "Start Free Trial" CTA button on each card
- "Restore Purchases" link at the bottom (required by Apple)
- Clean header with back navigation
- No actual purchase logic needed — this is primarily for the screenshot, but buttons will wire into the existing `useSubscription` hook

### Changes

| File | Change |
|---|---|
| `src/pages/Plans.tsx` | **New file** — Subscription plans page with two tier cards |
| `src/App.tsx` | Add `/plans` route |

### Layout sketch
```text
┌─────────────────────────────┐
│  ← Choose Your Plan         │
├─────────────────────────────┤
│  🐾 Paws Play Repeat Pro    │
│  "Boost your pet business"  │
│                             │
│  ┌───────────┐ ┌───────────┐│
│  │  Monthly  │ │  Yearly   ││
│  │  $9.99/mo │ │ $99.99/yr ││
│  │           │ │ SAVE 17%  ││
│  │  • Listed │ │ • Listed  ││
│  │  • Search │ │ • Search  ││
│  │  • Contact│ │ • Contact ││
│  │  • Cancel │ │ • Cancel  ││
│  │           │ │ • Best    ││
│  │ [Start    │ │   Value   ││
│  │  Trial]   │ │ [Start    ││
│  │           │ │  Trial]   ││
│  └───────────┘ └───────────┘│
│                             │
│  30-day free trial included │
│  Restore Purchases          │
└─────────────────────────────┘
```

The page will use the existing `useSubscription` hook so the buttons actually work on native iOS. On web preview, you can navigate to `/plans` to take the screenshot.

