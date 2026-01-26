
# Rebuild "Add to Pack" Logic from Scratch

## Root Cause Identified

The `dogs` table was **deleted** from the database at 18:53:56 UTC today (visible in Postgres logs). This is why dog creation fails silently - there's no table to insert into.

## What We Need to Rebuild

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE REBUILD PLAN                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. Recreate dogs table with all columns                           │
│  2. Add RLS policies for security                                  │
│  3. Add storage policies for dog-avatars bucket                    │
│  4. Fix PackMemberForm to call onSuccess callback                  │
│  5. Ensure proper data mapping and refresh flow                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Step 1: Recreate the Dogs Table

Create the `dogs` table with all required columns matching your specification:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| owner_id | uuid | References authenticated user (NOT NULL) |
| name | text | Dog's name (NOT NULL) |
| avatar_url | text | URL from dog-avatars bucket |
| size | text | Small/Medium/Large/Extra Large |
| energy | text | Low/Medium/High/Very High |
| energy_level | text | Duplicate for compatibility |
| breed | text | Dog breed |
| bio | text | Dog personality description |
| age_years | integer | Age in years |
| weight_lbs | numeric | Weight in pounds |
| health_notes | text | Medical/health information |
| play_style | text[] | **Array** for multi-select (Fetch, Chase, etc.) |
| created_at | timestamptz | Auto-set on creation |
| updated_at | timestamptz | Auto-updated |

## Step 2: Add RLS Policies

Secure the table so users can only manage their own dogs:

```text
RLS Policies for dogs table:
┌────────────────────────────────────────────────────┐
│ SELECT: owner_id = auth.uid()                     │
│ INSERT: owner_id = auth.uid()                     │
│ UPDATE: owner_id = auth.uid()                     │
│ DELETE: owner_id = auth.uid()                     │
└────────────────────────────────────────────────────┘
```

## Step 3: Add Storage Policies for dog-avatars Bucket

The bucket exists but needs RLS policies:

```text
Storage Policies for dog-avatars:
┌────────────────────────────────────────────────────┐
│ SELECT (public read): true                        │
│ INSERT: folder matches user.id                    │
│ UPDATE: folder matches user.id                    │
│ DELETE: folder matches user.id                    │
└────────────────────────────────────────────────────┘
```

## Step 4: Fix the onSuccess Callback

Currently `PackMemberForm.tsx` calls `onClose()` but not `onSuccess()` after saving. This prevents the parent component from knowing the operation succeeded.

```text
Current (broken):
  onClose();  // Closes modal but doesn't notify parent

Fixed:
  onSuccess?.();  // Notify parent first
  onClose();      // Then close modal
```

## Step 5: Ensure Data Flow Works

After save:
1. `addDog()` inserts record with owner_id from auth
2. If avatar selected, upload to dog-avatars bucket  
3. Update dog record with avatar_url
4. Call `refreshDogs()` to update the UI
5. Call `onSuccess()` to notify parent
6. Close the modal

## Implementation Details

### Database Migration SQL

```sql
-- Recreate dogs table
CREATE TABLE public.dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  avatar_url text,
  size text DEFAULT 'Medium',
  energy text DEFAULT 'Medium',
  energy_level text DEFAULT 'Medium',
  breed text DEFAULT '',
  bio text DEFAULT '',
  age_years integer,
  weight_lbs numeric,
  health_notes text,
  play_style text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dogs_select_own" ON public.dogs
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "dogs_insert_own" ON public.dogs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_update_own" ON public.dogs
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dogs_delete_own" ON public.dogs
  FOR DELETE USING (owner_id = auth.uid());

-- Create index for filtering by play_style
CREATE INDEX idx_dogs_play_style ON public.dogs USING GIN (play_style);

-- Create index for owner lookups
CREATE INDEX idx_dogs_owner_id ON public.dogs (owner_id);
```

### Storage Bucket Policies SQL

```sql
-- Allow public read access to dog avatars
CREATE POLICY "dog_avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-avatars');

-- Allow authenticated users to upload to their folder
CREATE POLICY "dog_avatars_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dog-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "dog_avatars_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dog-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "dog_avatars_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dog-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Code Fix in PackMemberForm.tsx

```typescript
// After successful save (around line 168-171)
toast.success('Pack member added!');
onSuccess?.();  // ADD THIS LINE - notify parent of success
onClose();
```

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| New migration | Create | Recreate dogs table + RLS |
| New migration | Create | Add storage policies |
| `src/components/profile/PackMemberForm.tsx` | Modify | Add onSuccess callback |

## Expected Outcome

After implementation:
1. The `dogs` table will exist with proper schema
2. RLS will protect user data (owners can only see their own dogs)
3. Dog avatars upload to `dog-avatars` bucket with proper security
4. Play styles save as a `text[]` array (multi-select)
5. `owner_id` is automatically set from the authenticated user
6. After saving, the modal closes and My Pack refreshes to show the new dog

## Summary of What Was Broken

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Dogs not saving | Table was dropped | Recreate table |
| No security | No RLS policies | Add owner-based policies |
| Avatars might fail | Missing storage policies | Add bucket policies |
| UI not refreshing | onSuccess not called | Add callback invocation |
