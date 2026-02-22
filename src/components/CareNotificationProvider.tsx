import { createContext, useContext } from 'react';
import { useCareReminders, type CareReminder } from '@/hooks/useCareReminders';
import { useCareNotifications } from '@/hooks/useCareNotifications';

interface MissedMedication {
  reminder_id: string;
  user_id: string;
  task_details: string | null;
  reminder_time: string;
}

interface CareNotificationContextType {
  // Reminders
  reminders: CareReminder[];
  loading: boolean;
  addReminder: ReturnType<typeof useCareReminders>['addReminder'];
  deleteReminder: ReturnType<typeof useCareReminders>['deleteReminder'];
  toggleEnabled: ReturnType<typeof useCareReminders>['toggleEnabled'];
  snoozeReminder: ReturnType<typeof useCareReminders>['snoozeReminder'];
  refetch: ReturnType<typeof useCareReminders>['refetch'];
  // Notifications
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  triggeredReminder: CareReminder | null;
  clearTriggeredReminder: () => void;
  missedMedications: MissedMedication[];
  hasMissedDose: boolean;
  clearMissedMedication: (reminderId: string) => void;
}

const CareNotificationContext = createContext<CareNotificationContextType | null>(null);

export function useCareNotificationContext() {
  const ctx = useContext(CareNotificationContext);
  if (!ctx) {
    throw new Error('useCareNotificationContext must be used within CareNotificationProvider');
  }
  return ctx;
}

export function CareNotificationProvider({ children }: { children: React.ReactNode }) {
  const remindersHook = useCareReminders();
  const notificationsHook = useCareNotifications(remindersHook.reminders);

  const value: CareNotificationContextType = {
    ...remindersHook,
    ...notificationsHook,
  };

  return (
    <CareNotificationContext.Provider value={value}>
      {children}
    </CareNotificationContext.Provider>
  );
}
