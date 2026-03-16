

## Add Legal & Support Links Below Help & Support

### What
Add three external link buttons (Privacy Policy, Terms of Service, Contact Support) below the Help & Support card on the Me tab. These open the hosted HTML pages in a new browser tab — required for Apple App Store compliance.

### Changes

**`src/pages/Me.tsx`** (lines ~543-544, after the Help & Support card)

Insert a small section with three list-style buttons linking to:
- `https://pawsplayrepeat.app/privacy.html` — Privacy Policy
- `https://pawsplayrepeat.app/tos.html` — Terms of Service  
- `https://pawsplayrepeat.app/support.html` — Contact Support

Each rendered as an `<a>` with `target="_blank" rel="noopener noreferrer"`, styled as a subtle card/list with icons (Shield, Scale, Mail) matching the existing design language. Grouped in a single Card with a "Legal & Support" header or presented as individual tappable rows — consistent with the rest of the profile page.

```text
┌─────────────────────────────────┐
│ 🔒 Privacy Policy            → │
│ 📄 Terms of Service          → │
│ ✉️  Contact Support           → │
└─────────────────────────────────┘
```

Uses `ExternalLink` or chevron icon to indicate external navigation. No new components or state needed — just anchor tags styled as list items.

