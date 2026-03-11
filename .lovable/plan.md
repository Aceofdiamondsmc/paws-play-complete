

## Add redirect from `/explore` to `/services`

Add a single `<Route>` in `src/App.tsx` that redirects `/explore` (and `/explore/:id`) to the new `/services` paths using `<Navigate replace />`.

### Changes

**`src/App.tsx`**
- Add `<Route path="/explore" element={<Navigate to="/services" replace />} />`
- Add `<Route path="/explore/:id" element={<Navigate to="/services/:id" replace />} />` (using a small wrapper component to preserve the `:id` param)

