

## Dog Face Silhouette FAB — Shape Only

Change only the exterior shape of the Pack Alert button to a dog face silhouette. Keep the existing red color (`bg-destructive`) and pulse animation (`animate-pulse`) exactly as they are.

### Changes — `src/components/lost-dog/LostDogFAB.tsx`

- Replace `rounded-full` pill shape with a `clip-path: path(...)` that creates a dog head outline (round face with two ears poking up)
- Increase button dimensions slightly (roughly 64×72px) so the ear silhouette is visible
- Keep `bg-destructive`, `animate-pulse`, `hover:animate-none` — no color or animation changes
- Replace `AlertTriangle` icon with a small inline SVG paw or keep the text "Alert" centered inside the dog head shape

