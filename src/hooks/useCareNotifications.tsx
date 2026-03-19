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

  // Schedule local notifications on native for background delivery
  useEffect(() => {
    if (!isNative() || reminders.length === 0) return;

    const scheduleLocalNotifications = async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        // Check/request local notification permission
        const permResult = await LocalNotifications.checkPermissions();
        if (permResult.display === 'prompt' || permResult.display === 'prompt-with-rationale') {
          const reqResult = await LocalNotifications.requestPermissions();
          if (reqResult.display !== 'granted') {
            console.warn('Local notification permission not granted');
            return;
          }
        } else if (permResult.display !== 'granted') {
          console.warn('Local notification permission denied');
          return;
        }

        // Cancel all previously scheduled notifications to reschedule fresh
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const now = new Date();
        const notificationsToSchedule: Array<{
          id: number;
          title: string;
          body: string;
          schedule: { at: Date; allowWhileIdle: boolean };
          sound: string;
        }> = [];

        reminders.forEach((reminder, index) => {
          if (!reminder.is_enabled) return;

          const title = getCategoryTitle(reminder.category);
          const body = getCategoryBody(reminder.category, reminder.task_details);

          // If snoozed and snooze is in the future, schedule at snooze expiry instead
          if (reminder.snoozed_until) {
            const snoozeExpiry = new Date(reminder.snoozed_until);
            if (snoozeExpiry > now) {
              notificationsToSchedule.push({
                id: index + 1000,
                title,
                body,
                schedule: { at: snoozeExpiry, allowWhileIdle: true },
                sound: 'paws_reminder.wav',
              });
              return;
            }
          }

          // Parse reminder time (HH:mm:ss)
          const [hours, minutes] = reminder.reminder_time.split(':').map(Number);

          // Schedule for today if not yet passed, otherwise schedule for tomorrow
          const scheduleDate = new Date();
          scheduleDate.setHours(hours, minutes, 0, 0);
          if (scheduleDate <= now) {
            scheduleDate.setDate(scheduleDate.getDate() + 1);
          }

          // Use index + 1000 offset to avoid ID collisions
          notificationsToSchedule.push({
            id: index + 1000,
            title,
            body,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            sound: 'paws_reminder.wav',
          });
        });

        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: notificationsToSchedule });
          console.log(`Scheduled ${notificationsToSchedule.length} local notifications`);
        }
      } catch (e) {
        console.warn('Failed to schedule local notifications:', e);
      }
    };

    scheduleLocalNotifications();
  }, [reminders]);

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
      // Always show in-app alerts; only use browser Notification API on web
      activeMissed.forEach((missed) => {
        if (!missedNotifiedIdsRef.current.has(missed.reminder_id)) {
          missedNotifiedIdsRef.current.add(missed.reminder_id);

          playUrgentSound();

          if (!isNative() && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const title = '⚠️ Urgent: Missed Medication';
            const body = missed.task_details
              ? `${missed.task_details} was due 30 minutes ago!`
              : 'A medication was due 30 minutes ago!';
            new Notification(title, {
              body,
              icon: '/favicon.png',
              tag: `missed-${missed.reminder_id}`,
              requireInteraction: true,
            });
          }
        }
      });
    };

    checkMissedMedications();
    const interval = setInterval(checkMissedMedications, 60000);
    return () => clearInterval(interval);
  }, [user, reminders]);

  // Check for triggered reminders — runs regardless of push permission
  useEffect(() => {
    if (reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');

      reminders.forEach((reminder) => {
        if (!reminder.is_enabled) return;

        const reminderHHMM = reminder.reminder_time.slice(0, 5);

        // Determine if this reminder should fire right now
        let shouldTrigger = false;
        let triggerKey = '';

        if (reminder.snoozed_until) {
          const snoozeExpiry = new Date(reminder.snoozed_until);
          if (snoozeExpiry > now) {
            // Still snoozed — skip
            return;
          }
          // Snooze has expired — check if the snooze expiry falls in the current minute
          const snoozeHHMM = format(snoozeExpiry, 'HH:mm');
          if (snoozeHHMM === currentHHMM) {
            shouldTrigger = true;
            triggerKey = `${reminder.id}-snooze-${snoozeHHMM}`;
          }
        }

        // Also trigger on the original reminder time (normal behavior)
        if (!shouldTrigger && reminderHHMM === currentHHMM) {
          shouldTrigger = true;
          triggerKey = `${reminder.id}-${currentHHMM}`;
        }

        if (shouldTrigger && triggerKey && !triggeredIdsRef.current.has(triggerKey)) {
          triggeredIdsRef.current.add(triggerKey);

          setTimeout(() => {
            triggeredIdsRef.current.delete(triggerKey);
          }, 120000);

          // Always play sound and show in-app banner
          playReminderSound();

          // Only use browser Notification API on web when granted
          if (!isNative() && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const title = getCategoryTitle(reminder.category);
            const body = getCategoryBody(reminder.category, reminder.task_details);
            new Notification(title, {
              body,
              icon: '/favicon.png',
              tag: reminder.id,
            });
          }

          // Set triggered reminder for UI banner
          setTriggeredReminder(reminder);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

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
    case 'grooming':
      return '✂️ Grooming Reminder';
    case 'training':
      return '🎓 Training Reminder';
    case 'vet_visit':
      return '🏥 Clinic / Urgent Reminder';
    case 'birthday':
      return '🎂 Birthday Reminder';
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
    case 'grooming':
      return taskDetails ? `Time for grooming: ${taskDetails}` : 'Time for grooming!';
    case 'training':
      return taskDetails ? `Training time: ${taskDetails}` : 'Time for training!';
    case 'vet_visit':
      return taskDetails ? `Clinic/Urgent: ${taskDetails}` : 'Clinic or urgent appointment!';
    case 'birthday':
      return taskDetails ? `🎉 ${taskDetails}` : "It's your pup's birthday!";
    default:
      return 'Time to take your pup for a walk!';
  }
}
