

## Replace "Retry" with "Sign In" for Unauthenticated Users

The error state in `ParksMap.tsx` (line 662-673) shows a generic "Retry" button that reloads the page. When the error is `'Please sign in to view the map'` (line 149), retry is pointless — the user needs to authenticate.

### Changes

**`src/components/parks/ParksMap.tsx`**

In the error state block (~line 662-673):
- Check if `mapError` contains the sign-in message
- If yes: render a "Sign In" button that navigates to `/me` (the auth page) using `useNavigate`
- If no (other errors like network failure): keep the existing "Retry" button
- Add `useNavigate` import from `react-router-dom`

