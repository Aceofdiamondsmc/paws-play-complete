

## Care Schedule Feature Implementation

This plan implements a complete "Care Schedule" section on the Dates tab with support for walks, medications, and feeding reminders.

---

### What You'll Get

1. **Care Schedule Card** - A new section on the Dates page with:
   - Dropdown to select category: Walk, Medication, or Feeding
   - Time picker (30-minute intervals from 6 AM to 9 PM)
   - Daily/Weekly recurrence toggle
   - Conditional input field for task details:
     - Medication: "Medication Name/Dosage" input
     - Feeding: "Food Amount" input
   - "Save Reminder" button

2. **Active Reminders List** - Shows your saved reminders with:
   - Category icon (paw for walks, pill for meds, bowl for feeding)
   - Time and recurrence info
   - Delete button

3. **History Log with Icons** - Last 5 completed activities showing:
   - Paw icon for walks
   - Pill icon for medications
   - Bowl icon for feedings (using `UtensilsCrossed` from lucide-react)
   - Relative timestamps ("2 hours ago", "Yesterday")

4. **Browser Notifications** - Alerts when reminder time matches with "Log Activity" button

---

### Implementation Steps

**1. Create useCareReminders Hook** (`src/hooks/useCareReminders.tsx`)

CRUD operations for care reminders:
- Fetch all reminders for current user from `care_reminders` table
- Add new reminder with category ('walk', 'medication', 'feeding') and task_details
- Delete reminder
- Toggle `is_enabled` status

**2. Create useCareHistory Hook** (`src/hooks/useCareHistory.tsx`)

History logging operations:
- Fetch last 5 entries from `care_history` ordered by `completed_at` desc
- Log new activity (insert with category and notes)
- Accept optional `reminder_id` to link to specific reminder

**3. Create useCareNotifications Hook** (`src/hooks/useCareNotifications.tsx`)

Browser notification management:
- Track `Notification.permission` status
- Provide `requestPermission()` function
- Run `setInterval` every 60 seconds checking current HH:MM against enabled reminders
- Track `activeReminder` when time matches (for showing "Log Activity" button)
- Trigger browser notification with category-specific message

**4. Create CareScheduleSection Component** (`src/components/dates/CareScheduleSection.tsx`)

```text
Card Layout:
+------------------------------------------+
| Heart + Clock icon   "Care Schedule"     |
+------------------------------------------+
| [Enable Notifications button if needed]  |
+------------------------------------------+
| Category: [Walk v] [Medication] [Feeding]|
+------------------------------------------+
| Time: [Select dropdown - 30min intervals]|
+------------------------------------------+
| Recurrence: [Daily] [Weekly]             |
+------------------------------------------+
| [Medication Name/Dosage input]  <- shown |
| [Food Amount input]             <- when  |
|                                  relevant|
+------------------------------------------+
| [Save Reminder] button                   |
+------------------------------------------+
| Active Reminders:                        |
| - Paw 8:00 AM Daily              [X]     |
| - Pill 9:00 AM Apoquel 16mg      [X]     |
+------------------------------------------+
| [Log Activity] button <- when triggered  |
+------------------------------------------+
| Recent Activity:                         |
| - Paw  Walked           2 hours ago      |
| - Pill Apoquel 16mg     Yesterday        |
| - Bowl 1 cup kibble     2 days ago       |
+------------------------------------------+
```

**5. Update Dates Page** (`src/pages/Dates.tsx`)

- Import and add `CareScheduleSection` below the Tabs component
- Only render for authenticated users (already handled)

---

### Technical Details

**Database Tables (Already Exist):**

```text
care_reminders:
- id (UUID, PK)
- user_id (UUID)
- reminder_time (TIME)
- is_recurring (BOOLEAN)
- recurrence_pattern (TEXT: 'none'/'daily'/'weekly')
- is_enabled (BOOLEAN)
- category (TEXT: 'walk'/'medication'/'feeding')
- task_details (TEXT: medication name/dosage or food amount)
- created_at (TIMESTAMPTZ)

care_history:
- id (UUID, PK)
- reminder_id (UUID, nullable)
- user_id (UUID)
- completed_at (TIMESTAMPTZ)
- status (TEXT)
- notes (TEXT: copied from task_details)
- category (TEXT: 'walk'/'medication'/'feeding')

Both have RLS: user_id = auth.uid()
```

**Icon Mapping (using lucide-react):**

```typescript
import { PawPrint, Pill, UtensilsCrossed } from 'lucide-react';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'medication':
      return <Pill className="w-4 h-4 text-purple-500" />;
    case 'feeding':
      return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
    default: // 'walk'
      return <PawPrint className="w-4 h-4 text-primary" />;
  }
};
```

**Conditional Details Input:**

```typescript
{(category === 'medication' || category === 'feeding') && (
  <div className="space-y-2">
    <Label>
      {category === 'medication' ? 'Medication Name & Dosage' : 'Food Amount'}
    </Label>
    <Input
      placeholder={category === 'medication' 
        ? 'e.g., Apoquel 16mg' 
        : 'e.g., 1 cup kibble'}
      value={taskDetails}
      onChange={(e) => setTaskDetails(e.target.value)}
    />
  </div>
)}
```

**Notification Trigger Flow:**

1. `useCareNotifications` runs interval every 60 seconds
2. Gets current time as HH:MM and compares to enabled reminders
3. When match found:
   - Shows browser `Notification` with category-specific message
   - Sets `triggeredReminder` state
4. UI shows "Log Activity" button when `triggeredReminder` is set
5. Clicking logs to `care_history` and clears state

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCareReminders.tsx` | Create | CRUD for care_reminders table |
| `src/hooks/useCareHistory.tsx` | Create | CRUD for care_history table |
| `src/hooks/useCareNotifications.tsx` | Create | Browser notification scheduler |
| `src/components/dates/CareScheduleSection.tsx` | Create | Main UI component |
| `src/pages/Dates.tsx` | Modify | Add CareScheduleSection below tabs |

---

### UI Design Notes

The component will match the existing app theme:
- Uses `Card` with `bg-card` background
- Primary color for walk icons, purple for medication, orange for feeding
- `rounded-full` buttons matching playdate UI
- `Select` dropdown for category (Walk/Medication/Feeding)
- `ToggleGroup` with outline variant for recurrence selection
- Clean `space-y-4` spacing
- Muted foreground for secondary text and timestamps
- `formatDistanceToNow` from date-fns for relative times

