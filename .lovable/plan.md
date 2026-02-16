

## Add Grooming and Training Categories to Care Schedule

### What will change

The Care Schedule section will support two new reminder categories -- **Grooming** (Scissors icon) and **Training** (GraduationCap icon) -- everywhere categories appear.

### Changes (single file: `src/components/dates/CareScheduleSection.tsx`)

**1. Import new icons**
- Add `Scissors` and `GraduationCap` to the `lucide-react` import line.

**2. Update `getCategoryIcon` function**
- Add `case 'grooming'` returning `<Scissors className="w-4 h-4 text-primary" />`
- Add `case 'training'` returning `<GraduationCap className="w-4 h-4 text-primary" />`

**3. Category dropdown (Add Reminder form)**
- Add two new `SelectItem` entries for `grooming` (with Scissors icon) and `training` (with GraduationCap icon) after the existing Feeding option.

**4. Conditional task details input**
- Expand the condition to also show the text input for `grooming` and `training`, with appropriate labels/placeholders:
  - Grooming: "Grooming Details" / "e.g., Nail trim, bath"
  - Training: "Training Details" / "e.g., Recall practice"

**5. Quick Log buttons**
- Add two new buttons for Grooming and Training, following the same pattern as Walk/Medication/Feeding.

**6. Recent Activity display text**
- Add rendering lines for `grooming` ("Groomed") and `training` ("Trained") in the history list.

**7. Triggered Reminder alert text**
- Add lines for `grooming` ("Time for grooming!") and `training` ("Time for training!") in the triggered reminder banner.

### What stays the same
- All existing categories (Walk, Medication, Feeding) unchanged
- Database schema (the `category` column is a text field, no migration needed)
- Hooks (`useCareReminders`, `useCareHistory`, `useCareNotifications`) are category-agnostic
- Active Reminders list and all other UI sections remain untouched
