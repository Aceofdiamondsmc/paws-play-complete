

## Add Star Rating Input to Admin Service Form

### Current State
The admin service form already stores `rating` in state and saves it to the database, but there's no visible UI control for it. The rating displays correctly on the Explore page (as "★ 4.5") and ServiceDetails page (with a filled star icon), so those need no changes.

### Changes (Single File: `src/pages/admin/AdminServices.tsx`)

1. **Add a star rating input** in the Create/Edit modal form, placed alongside the Price field in a two-column grid layout.

2. **Interactive star display**: Render 5 clickable star icons that fill based on the current rating value. Clicking a star sets the rating (1-5). Also include a small numeric input next to the stars for precise decimal values (e.g., 4.7).

3. **Visual design**: Use filled amber stars for the selected rating and outline stars for unselected, matching the existing star styling used in Explore.tsx and ServiceDetails.tsx.

### Technical Details

- Import `Star` from `lucide-react` (already imported in file for other uses or available)
- Add a row of 5 `Star` icons with `onClick` handlers that set `editForm.rating` to `'1'` through `'5'`
- Include a small number `Input` (step 0.1, min 0, max 5) for fine-tuning
- Stars below or equal to the rating value get `fill-amber-400 text-amber-400` classes; others get `text-muted-foreground`
- No database changes needed -- the `rating` column already exists and the save logic already includes it

### UI Layout
```text
Price: [$$$]     Rating: ★★★★☆  [4.0]
```

The stars are clickable for quick whole-number selection, and the number input allows decimal precision.

