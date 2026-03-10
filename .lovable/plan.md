

## Plan: Build Admin Settings — Command Center

### Overview
Transform the placeholder Settings page into a powerful admin command center with real-time platform health monitoring, maintenance mode control, broadcast notifications, and data management tools.

### Database Changes

**Migration: Create `app_settings` key-value table**

```sql
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for maintenance banner)
CREATE POLICY "app_settings_read_public" ON public.app_settings
FOR SELECT TO public USING (true);

-- Only admins can write
CREATE POLICY "app_settings_write_admin" ON public.app_settings
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are performing scheduled maintenance. Be back shortly!"}'::jsonb),
  ('registration_open', '{"enabled": true}'::jsonb);
```

**Migration: Create `admin_get_platform_stats()` function**

A `SECURITY DEFINER` function that returns aggregate counts across all core tables in a single efficient call — users, posts, dogs, parks, services, park suggestions pending.

### Frontend: `src/pages/admin/AdminSettings.tsx` — Full Rewrite

Organized into tabbed sections using the existing `Tabs` component:

**Tab 1: Platform Health**
- Stat cards: Total Users, Total Posts, Total Dogs, Total Parks, Total Services, Pending Suggestions
- Fetched via `admin_get_platform_stats()` RPC in one call
- Color-coded cards with icons matching each entity
- "Pending Suggestions" highlighted in amber if count > 0

**Tab 2: App Controls**
- **Maintenance Mode Toggle** — Switch + editable message textarea. When enabled, a banner appears for all users (reads from `app_settings`). Saves via upsert to `app_settings`.
- **Registration Control** — Toggle to open/close new signups (informational for now, expandable later).
- Each control shows who last updated it and when.

**Tab 3: Broadcast**
- Title + body inputs for a push notification
- "Send to All Users" button that invokes the existing `send-test-notification` edge function in a loop, or a new broadcast endpoint
- Preview card showing what the notification will look like
- Confirmation dialog before sending (destructive action)

**Tab 4: Quick Links**
- Direct links to Supabase Dashboard sections (SQL Editor, Auth Users, Storage, Edge Functions, Logs)
- Each as a card with icon + description
- Opens in new tab

### Files

| File | Action |
|------|--------|
| Database migration | New `app_settings` table + `admin_get_platform_stats()` function |
| `src/pages/admin/AdminSettings.tsx` | Full rewrite |

### Patterns Followed
- Same card/badge styling as AdminTools and AdminUsers
- Uses `supabase.rpc()` for stats, `.from('app_settings')` for config reads/writes
- Sonner toasts for feedback
- Loading skeletons during data fetch

