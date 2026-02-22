import { useCareReminders } from '@/hooks/useCareReminders';
import { useCareNotifications } from '@/hooks/useCareNotifications';

export function CareNotificationProvider() {
  const { reminders } = useCareReminders();
  useCareNotifications(reminders);
  return null;
}
