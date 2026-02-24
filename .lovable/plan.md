

## Redesign: Admin Edit Post Modal

### Problem
The modal crams 7+ form sections (author name, content, pup name, image upload, video upload, likes count, comments count) into a fixed-height dialog with no scrolling. On most screens, the Save button gets pushed below the viewport and is nearly impossible to find. The layout feels cluttered and unprofessional.

### Solution
Transform the modal into a clean, scrollable, well-organized admin editor:

1. **Scrollable body** -- wrap the form fields in a `ScrollArea` with a max height so the modal never overflows the screen
2. **Sticky footer** -- keep Cancel and Save buttons always visible at the bottom with a subtle top border separator
3. **Collapsible media sections** -- group Image and Video into a single "Media" section using `Collapsible`, so they don't dominate the form when not needed
4. **Visual hierarchy** -- add section dividers and tighter spacing to make the form scannable
5. **Prominent Save button** -- make Save visually distinct (larger, full-width on mobile)

### Changes

**`src/components/social/AdminEditPostModal.tsx`**

- Import `ScrollArea` from UI components
- Wrap the form body (`div.py-4.space-y-4`) in a `ScrollArea` with `className="max-h-[60vh]"` so the content scrolls while header and footer stay fixed
- Add a top border to `DialogFooter` for visual separation (`border-t pt-4`)
- Group Image and Video sections under a collapsible "Media" area using `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` -- defaults to open if media exists, closed if not
- Make the Save button more prominent: `w-full sm:w-auto` sizing
- Reduce overall padding/spacing slightly for a tighter, more professional feel

### Technical Details

The key structural change:

```text
DialogContent
  +-- DialogHeader (fixed)
  +-- ScrollArea max-h-[60vh]  <-- NEW wrapper
  |     +-- Author Name
  |     +-- Content
  |     +-- Pup Name
  |     +-- Collapsible "Media"  <-- groups image + video
  |     |     +-- Image upload/preview
  |     |     +-- Video upload/preview
  |     +-- Likes / Comments counts
  +-- DialogFooter border-t (fixed, always visible)
        +-- Cancel
        +-- Save Changes (prominent)
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/social/AdminEditPostModal.tsx` | Add ScrollArea wrapper, sticky footer with border, collapsible media section, prominent save button |

