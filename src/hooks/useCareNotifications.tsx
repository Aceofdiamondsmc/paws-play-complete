import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import type { CareReminder } from './useCareReminders';

export function useCareNotifications(reminders: CareReminder[]) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [triggeredReminder, setTriggeredReminder] = useState<CareReminder | null>(null);
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      console.log('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    return permission === 'granted';
  }, []);

  const clearTriggeredReminder = useCallback(() => {
    setTriggeredReminder(null);
  }, []);

  useEffect(() => {
    if (permissionStatus !== 'granted' || reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');

      reminders.forEach((reminder) => {
        if (!reminder.is_enabled) return;

        // Extract HH:MM from reminder_time (which is "HH:mm:ss" format)
        const reminderHHMM = reminder.reminder_time.slice(0, 5);

        // Create a unique key for this reminder + current minute
        const triggerKey = `${reminder.id}-${currentHHMM}`;

        if (reminderHHMM === currentHHMM && !triggeredIdsRef.current.has(triggerKey)) {
          // Mark as triggered for this minute
          triggeredIdsRef.current.add(triggerKey);

          // Clean up old keys after 2 minutes
          setTimeout(() => {
            triggeredIdsRef.current.delete(triggerKey);
          }, 120000);

          // Show browser notification
          const title = getCategoryTitle(reminder.category);
          const body = getCategoryBody(reminder.category, reminder.task_details);

          new Notification(title, {
            body,
            icon: '/favicon.png',
            tag: reminder.id,
          });

          // Set triggered reminder for UI
          setTriggeredReminder(reminder);
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every 30 seconds
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [permissionStatus, reminders]);

  return {
    permissionStatus,
    requestPermission,
    triggeredReminder,
    clearTriggeredReminder,
  };
}

function getCategoryTitle(category: string): string {
  switch (category) {
    case 'medication':
      return '💊 Medication Reminder';
    case 'feeding':
      return '🥣 Feeding Reminder';
    default:
      return '🐾 Dog Walk Reminder';
  }
}

function getCategoryBody(category: string, taskDetails: string | null): string {
  switch (category) {
    case 'medication':
      return taskDetails ? `Time for ${taskDetails}` : 'Time to give medication';
    case 'feeding':
      return taskDetails ? `Time to feed: ${taskDetails}` : 'Time to feed your pup!';
    default:
      return 'Time to take your pup for a walk!';
  }
}
