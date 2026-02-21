

## Make Block Button Clearly Labeled

### The Problem
The block button on incoming playdate request cards is currently just a small shield icon with no text. Users can't tell what it does at a glance.

### The Fix
Change the block button from an icon-only ghost button to a clearly labeled button that says **"Block"** with the shield icon next to it. This makes the action unmistakable.

### What Changes

**File: `src/pages/Dates.tsx` (line 291-294)**

The current icon-only button:
```
<ShieldBan className="w-4 h-4" />
```

Will become a labeled button:
```
<ShieldBan className="w-4 h-4 mr-1" />
Block
```

The button keeps its destructive red styling so it's visually distinct from Accept/Decline, but now includes the word "Block" so users immediately understand the capability.

### Summary

| File | Change |
|------|--------|
| `src/pages/Dates.tsx` | Add "Block" text label to the block button on incoming playdate cards |

