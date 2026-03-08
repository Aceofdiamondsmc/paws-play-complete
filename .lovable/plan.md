

## Plan

### 1. Fix Food Restock Reminder Save Failure

The `care_reminders` table likely has a CHECK constraint on `category` (similar to `care_history`) that only allows the original categories and doesn't include `'restock'`. The migration only updated the `care_history` constraint but missed `care_reminders`.

**Database migration**: Drop and recreate the category constraint on `care_reminders` to include `'restock'`:
```sql
ALTER TABLE care_reminders DROP CONSTRAINT IF EXISTS care_reminders_category_check;
ALTER TABLE care_reminders ADD CONSTRAINT care_reminders_category_check
  CHECK (category = ANY (ARRAY['walk','medication','feeding','grooming','training','restock']));
```

### 2. Add Delete Button to Individual Activity Logs

**`src/hooks/useCareHistory.tsx`**:
- Add a `deleteEntry` function that deletes a row from `care_history` by ID, then refreshes the list.

**`src/components/dates/CareScheduleSection.tsx`**:
- Add a trash icon button on each history entry row (same style as reminder delete buttons).
- Wire it to the new `deleteEntry` function with a success/error toast.

