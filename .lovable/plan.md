

## Add "Pack Reunited" Button to Alert Banners

Add a button on each alert banner that lets the alert owner mark it as resolved directly from the Social feed. Only visible to the alert's owner.

### Changes

**`src/pages/Social.tsx`**

1. Destructure `resolveAlert` from `useLostDogAlerts()` (line 125)
2. Pass `resolveAlert` and `user` to `PackAlertBanners`
3. In the `PackAlertBanners` component, for each alert where `alert.user_id === user?.id`, render a "Pack Reunited" button (green, with a checkmark icon) on the right side of the banner
4. On click, call `resolveAlert(alert.id)` — the hook already handles the reunited sound, push notification, and status update

The button will use a compact style so it fits in the banner without breaking the layout. Non-owners see the banner as-is (no button).

