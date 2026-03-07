

## Plan: Three Changes

### A. Reorder Bottom Nav
In `src/components/layout/BottomNav.tsx`, reorder the `navItems` array to: Dates, Social, Explore, Pack, Shop, Parks, Me.

### B. Landing Page "Let's Play" Link
In `src/pages/Landing.tsx`, change `navigate('/social')` to `navigate('/dates')` in `handleLetsPlay`.

### C. Fix Grooming & Training Quick Log
The `care_history` table has a CHECK constraint (`walk_history_category_check`) that only permits `'walk'`, `'medication'`, and `'feeding'`. Grooming and training inserts fail silently because of this.

**Fix**: Run a migration to drop and recreate the constraint to include all five categories:
```sql
ALTER TABLE care_history DROP CONSTRAINT walk_history_category_check;
ALTER TABLE care_history ADD CONSTRAINT care_history_category_check 
  CHECK (category = ANY (ARRAY['walk','medication','feeding','grooming','training']));
```

