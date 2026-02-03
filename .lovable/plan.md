

## Care Schedule Enhancements: Missed Dose Alerts, Snooze, and Comments UI Fix

This plan implements four major features: missed medication alerts, snooze functionality for reminders, and fixes for the Social tab's comment section.

---

### What You'll Get

1. **Missed Dose Alerts**
   - Checks `missed_medications` view every 60 seconds
   - Triggers high-priority browser notification: "⚠️ Urgent: [Medication Name] was due 30 minutes ago!"
   - Red pulse effect on the "Log Activity" button when a dose is missed
   - Each `reminder_id` treated as a separate task (morning/evening meds get separate alerts)

2. **Snooze 15m Button**
   - "Snooze 15m" button on notification alert cards
   - Updates `snoozed_until` column in `care_reminders` to 15 minutes from now
   - Hides notification and pulse effect until snooze expires
   - Shows "Snoozed" badge on reminders in the list

3. **Fixed Comments UI**
   - Sticky header with post info at top
   - Sticky comment input at bottom
   - Scrollable comments list in the middle
   - Edit button for own comments (`auth.uid() == author_id`)
   - Inline editing with save functionality
   - "(edited)" label when `updated_at > created_at`

---

### Implementation Steps

**1. Enhance useCareNotifications Hook**

Update the notification hook to:
- Check `missed_medications` view every 60 seconds
- Track missed medications with separate state
- Filter out reminders where `snoozed_until > now()`
- Return `missedMedications` array and `hasMissedDose` boolean

```text
New State:
- missedMedications: array of missed medication records
- hasMissedDose: boolean flag for UI styling

New Logic:
- Query missed_medications view for current user
- Each reminder_id is treated independently
- Skip reminders where snoozed_until > current timestamp
- Trigger high-priority notification with requireInteraction: true
```

**2. Add Snooze Functionality to useCareReminders Hook**

Add a new `snoozeReminder` function:
```typescript
const snoozeReminder = async (id: string) => {
  const snoozedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await supabase
    .from('care_reminders')
    .update({ snoozed_until: snoozedUntil.toISOString() })
    .eq('id', id);
  await fetchReminders();
};
```

Also update the `CareReminder` interface to include `snoozed_until: string | null`.

**3. Update CareScheduleSection Component**

Add UI elements:

```text
Updated Card Layout:
+------------------------------------------+
| Heart + Clock icon   "Care Schedule"     |
+------------------------------------------+
| [Enable Notifications button if needed]  |
+------------------------------------------+
| MISSED DOSE ALERT (red border + pulse)   |  <- NEW
| ⚠️ Apoquel 16mg was due 30 min ago!      |
| [Log Activity] [Snooze 15m]              |  <- NEW
+------------------------------------------+
| TRIGGERED REMINDER (normal alert)        |
| Time for medication!                     |
| [Log Activity] [Snooze 15m]              |  <- NEW
+------------------------------------------+
| Category: [Walk v] [Medication] [Feeding]|
+------------------------------------------+
| Active Reminders:                        |
| - Pill 8:00 AM Daily [Snoozed] [X]       |  <- NEW badge
| - Paw 9:00 AM Daily              [X]     |
+------------------------------------------+
```

Styling for missed dose alert:
- Red border: `border-red-500`
- Pulse animation: `animate-pulse` on button or custom CSS
- High-contrast background: `bg-red-100 dark:bg-red-900/20`

**4. Fix CommentsDrawer Component**

Restructure layout with flexbox:

```text
Updated Drawer Layout:
+------------------------------------------+
| STICKY HEADER                            |
| Comments                                 |
+------------------------------------------+
|                                          |
| SCROLLABLE COMMENTS AREA (overflow-y)    |
| - Avatar | Name | Comment body           |
|          | timestamp (edited)  [Edit]    |  <- NEW
| - Avatar | Name | Comment body           |
|          | [Input field for editing]     |  <- Inline edit
|                                          |
+------------------------------------------+
| STICKY INPUT                             |
| [Write a comment...] [Send]              |
+------------------------------------------+
```

**5. Add Edit Comment Function to usePostComments Hook**

```typescript
const updateComment = async (commentId: string, body: string) => {
  const { error } = await supabase
    .from('post_comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author_id', user.id);
  
  if (!error) await fetchComments();
  return { error };
};
```

---

### Technical Details

**Missed Medications View Query:**
```typescript
const { data: missed } = await supabase
  .from('missed_medications')
  .select('*')
  .eq('user_id', user.id);
```

The view returns:
- `reminder_id` (UUID) - unique per reminder
- `user_id` (UUID)
- `task_details` (TEXT) - medication name/dosage
- `reminder_time` (TIME) - when it was due

**Snooze Check Logic:**
```typescript
reminders.forEach((reminder) => {
  // Skip if snoozed and snooze hasn't expired
  if (reminder.snoozed_until) {
    const snoozeExpiry = new Date(reminder.snoozed_until);
    if (snoozeExpiry > new Date()) return; // Still snoozed
  }
  
  // Continue with normal notification logic...
});
```

**High-Priority Notification:**
```typescript
new Notification('⚠️ Urgent: Missed Medication', {
  body: `${taskDetails} was due 30 minutes ago!`,
  icon: '/favicon.png',
  tag: `missed-${reminder_id}`,
  requireInteraction: true, // Stays until dismissed
});
```

**Comments Edit UI State:**
```typescript
const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
const [editText, setEditText] = useState('');

const handleEditClick = (comment: Comment) => {
  setEditingCommentId(comment.id);
  setEditText(comment.body);
};

const handleSaveEdit = async () => {
  await updateComment(editingCommentId, editText);
  setEditingCommentId(null);
};
```

**Pulse Animation CSS:**
```css
@keyframes pulse-urgent {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.animate-pulse-urgent {
  animation: pulse-urgent 2s ease-in-out infinite;
}
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useCareReminders.tsx` | Modify | Add `snoozed_until` to interface, add `snoozeReminder` function |
| `src/hooks/useCareNotifications.tsx` | Modify | Add missed dose checking, snooze filtering, `hasMissedDose` state |
| `src/components/dates/CareScheduleSection.tsx` | Modify | Add missed dose alert UI, snooze button, snoozed badge |
| `src/index.css` | Modify | Add `animate-pulse-urgent` animation |
| `src/hooks/usePosts.tsx` | Modify | Add `updateComment` function to `usePostComments` |
| `src/components/social/CommentsDrawer.tsx` | Modify | Fix layout, add edit button, inline editing, "(edited)" label |

---

### UI Design Notes

**Missed Dose Alert:**
- Red border with pulse effect to grab attention
- Warning emoji ⚠️ in the message
- High contrast background for urgency
- Both "Log Activity" and "Snooze 15m" buttons

**Snoozed Badge:**
- Small yellow/amber badge next to snoozed reminders
- Icon: Clock with arrows or similar
- Text: "Snoozed" or time remaining

**Comments Drawer:**
- Uses flexbox with `flex-col h-full`
- Header: `shrink-0` to stay fixed
- Comments: `flex-1 overflow-y-auto` for scrolling
- Input: `shrink-0` to stay at bottom
- Edit button only visible on own comments
- Inline editing replaces text with input field

