

## Make the "Meet [Pup Name]" Button Fancy and Eye-Catching

### Overview

Transform the plain text "Meet" button into an animated, pill-shaped mini badge that draws attention and delights users -- fitting the playful pet social network aesthetic.

---

### Design Concept

The "Meet [Name]" action becomes a **gradient pill button** with a paw print icon, subtle shimmer animation, and a bounce-on-hover effect. It will feel like a mini call-to-action that stands out from the other post actions (like, comment, share).

**Visual details:**
- Warm coral-to-teal gradient background (matches the app's primary/accent palette)
- White text with the paw icon inside the pill
- A subtle **shimmer sweep** animation that plays once on load (like a glint of light)
- On hover: slight scale-up + glow shadow
- On tap: satisfying bounce-down effect
- Always visible (remove the `hidden sm:inline` so it shows on mobile too)
- Rounded-full pill shape to differentiate it from the flat icon buttons

---

### Changes

**1. `src/index.css` -- Add shimmer + glow keyframes**

Add a shimmer sweep animation and a paw-glow utility:

```css
@keyframes shimmer-sweep {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.meet-button-shimmer {
  background-size: 200% 100%;
  animation: shimmer-sweep 2s ease-in-out 0.5s 1;
}
```

**2. `src/pages/Social.tsx` -- Redesign the Meet button**

Replace the current plain text button with a gradient pill:

```tsx
<button
  onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
  className={cn(
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
    "bg-gradient-to-r from-primary via-primary to-accent text-white",
    "shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
    "transition-all duration-200 meet-button-shimmer",
    "ml-auto"
  )}
  aria-label={post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}
>
  <PawPrint className="w-3.5 h-3.5" />
  <span>{post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}</span>
</button>
```

This also moves it to `ml-auto` so it sits at the right end of the action bar, swapping position with the Share button (which becomes inline with like/comment).

**3. Move the Share button left, Meet button right**

Reorder the action buttons so the layout is:
- Left side: Like, Comment, Share (utility actions)
- Right side: Meet pill (primary CTA, stands out)

This makes the Meet button the visual anchor of each post card.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Add shimmer-sweep keyframe + `.meet-button-shimmer` class |
| `src/pages/Social.tsx` | Redesign Meet button as gradient pill, reorder action buttons |

---

### Result

Each post card will have a polished, animated "Meet Ace" pill button that catches the eye, invites interaction, and feels premium -- while staying consistent with the app's warm, playful design system.
