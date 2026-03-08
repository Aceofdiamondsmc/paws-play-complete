

## Add "Food Restock" to Care Schedule

### Naming Decision
The best term for this is **"Food Restock"** — displayed as the label, with `restock` as the database category value. It's concise, action-oriented, and immediately understood. The Lucide `ShoppingBag` icon pairs naturally with it.

### How It Works
Unlike timed reminders (walks, meds), this is primarily a **quick-action log** with two modes:
- **As a Quick Log button**: Tap "Food Restock" to instantly log that you bought food or ran out today
- **As a scheduled reminder**: Set a recurring reminder (e.g., weekly) to check food supply levels

### Changes

**1. Database migration** — Update the `care_history` CHECK constraint to include `'restock'`:
```sql
ALTER TABLE care_history DROP CONSTRAINT care_history_category_check;
ALTER TABLE care_history ADD CONSTRAINT care_history_category_check 
  CHECK (category = ANY (ARRAY['walk','medication','feeding','grooming','training','restock']));
```

**2. `src/components/dates/CareScheduleSection.tsx`**
- Import `ShoppingBag` from lucide-react
- Add `'restock'` case to `getCategoryIcon()` returning the ShoppingBag icon
- Add `<SelectItem value="restock">` in the category dropdown with "Food Restock" label
- Add task details input for restock (placeholder: "e.g., 30lb bag Purina Pro Plan")
- Add triggered reminder text: `'Time to restock dog food!'`
- Add Quick Log button for "Food Restock"

**3. `src/hooks/useCareHistory.tsx`** — No changes needed (already accepts any category string)

**4. `src/hooks/useCareReminders.tsx`** — No changes needed (category is a free string field)

This keeps the feature lightweight — one migration, one UI file update.

