import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { playReminderSound, playUrgentSound, initAudioContext } from '@/lib/alert-sounds';
import type { CareReminder } from './useCareReminders';

interface MissedMedication {
  reminder_id: string;
  user_id: string;
  task_details: string | null;
}

const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();

export function useCareNotifications(reminders: CareReminder[]) {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [triggeredReminder, setTriggeredReminder] = useState<CareReminder | null>(null);
  const [missedMedications, setMissedMedications] = useState<MissedMedication[]>([]);
  const triggeredIdsRef = useRef<Set<string>>(new Set());
  const missedNotifiedIdsRef = useRef<Set<string>>(new Set());

  // Pre-warm AudioContext on first user interaction for mobile
  useEffect(() => {
    initAudioContext();
  }, []);

  // On native, check actual push permission status on mount
  useEffect(() => {
    if (!isNative()) return;
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const result = await PushNotifications.checkPermissions();
        setPermissionStatus(result.receive === 'granted' ? 'granted' : result.receive === 'denied' ? 'denied' : 'default');
      } catch (e) {
        console.warn('Could not check native push permissions:', e);
      }
    })();
  }, []);

  const hasMissedDose = missedMedications.length > 0;

  const requestPermission = useCallback(async () => {
    if (isNative()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const result = await PushNotifications.requestPermissions();
        const granted = result.receive === 'granted';
        setPermissionStatus(granted ? 'granted' : 'denied');
        if (granted) {
          await PushNotifications.register();
        }
        return granted;
      } catch (e) {
        console.warn('Native push permission request failed:', e);
        return false;
      }
    }

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

  const clearMissedMedication = useCallback((reminderId: string) => {
    setMissedMedications(prev => prev.filter(m => m.reminder_id !== reminderId));
    missedNotifiedIdsRef.current.delete(reminderId);
  }, []);

  // Check for missed medications
  useEffect(() => {
    if (!user) return;

    const checkMissedMedications = async () => {
      const { data, error } = await supabase
        .from('missed_medications')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking missed medications:', error);
        return;
      }

      if (!data || data.length === 0) {
        setMissedMedications([]);
        return;
      }

      // Filter out snoozed reminders
      const now = new Date();
      const activeMissed = (data as MissedMedication[]).filter(missed => {
        const reminder = reminders.find(r => r.id === missed.reminder_id);
        if (reminder?.snoozed_until) {
          const snoozeExpiry = new Date(reminder.snoozed_until);
          if (snoozeExpiry > now) return false;
        }
        return true;
      });

      setMissedMedications(activeMissed);

      // Trigger high-priority notifications for each missed medication
      if (permissionStatus === 'granted') {
        activeMissed.forEach((missed) => {
          if (!missedNotifiedIdsRef.current.has(missed.reminder_id)) {
            missedNotifiedIdsRef.current.add(missed.reminder_id);

            const title = '⚠️ Urgent: Missed Medication';
            const body = missed.task_details
              ? `${missed.task_details} was due 30 minutes ago!`
              : 'A medication was due 30 minutes ago!';

            playUrgentSound();
            if (!isNative()) {
              new Notification(title, {
                body,
                icon: '/favicon.png',
                tag: `missed-${missed.reminder_id}`,
                requireInteraction: true,
              });
            }
          }
        });
      }
    };

    // Check immediately
    checkMissedMedications();

    // Check every 60 seconds
    const interval = setInterval(checkMissedMedications, 60000);

    return () => clearInterval(interval);
  }, [user, permissionStatus, reminders]);

  // Check for triggered reminders (existing logic)
  useEffect(() => {
    if (permissionStatus !== 'granted' || reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');

      reminders.forEach((reminder) => {
        if (!reminder.is_enabled) return;

        // Skip if snoozed and snooze hasn't expired
        if (reminder.snoozed_until) {
          const snoozeExpiry = new Date(reminder.snoozed_until);
          if (snoozeExpiry > now) return;
        }

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

          playReminderSound();
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
    missedMedications,
    hasMissedDose,
    clearMissedMedication,
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
