import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CareReminder {
  id: string;
  user_id: string;
  reminder_time: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  is_enabled: boolean;
  category: string;
  task_details: string | null;
  created_at: string;
  snoozed_until: string | null;
  user_timezone: string | null;
  reminder_date: string | null;
}

export function useCareReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('care_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('reminder_time', { ascending: true });

    if (error) {
      console.error('Error fetching care reminders:', error);
      setLoading(false);
      return;
    }

    const remindersData = data as CareReminder[];
    setReminders(remindersData);
    setLoading(false);

    // Auto-sync timezone for existing reminders
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const mismatchedIds = remindersData
      .filter((r) => r.user_timezone !== browserTimezone)
      .map((r) => r.id);

    if (mismatchedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('care_reminders')
        .update({ user_timezone: browserTimezone })
        .in('id', mismatchedIds);

      if (updateError) {
        console.error('Error syncing reminder timezones:', updateError);
      } else {
        setReminders((prev) =>
          prev.map((r) =>
            mismatchedIds.includes(r.id) ? { ...r, user_timezone: browserTimezone } : r
          )
        );
        console.log(`Synced ${mismatchedIds.length} reminder(s) to timezone: ${browserTimezone}`);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (reminder: {
    reminder_time: string;
    is_recurring: boolean;
    recurrence_pattern: string;
    category: string;
    task_details?: string;
    reminder_date?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data, error } = await supabase
      .from('care_reminders')
      .insert({
        user_id: user.id,
        reminder_time: reminder.reminder_time,
        is_recurring: reminder.is_recurring,
        recurrence_pattern: reminder.recurrence_pattern,
        category: reminder.category,
        task_details: reminder.task_details || null,
        is_enabled: true,
        user_timezone: userTimezone,
        reminder_date: reminder.reminder_date || null,
      })
      .select()
      .maybeSingle();

    if (!error) {
      await fetchReminders();
    }

    return { data, error };
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('care_reminders')
      .delete()
      .eq('id', id);

    if (!error) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }

    return { error };
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('care_reminders')
      .update({ is_enabled: enabled })
      .eq('id', id);

    if (!error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_enabled: enabled } : r))
      );
    }

    return { error };
  };

  const snoozeReminder = async (id: string) => {
    const snoozedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const { error } = await supabase
      .from('care_reminders')
      .update({ snoozed_until: snoozedUntil.toISOString() })
      .eq('id', id);

    if (!error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, snoozed_until: snoozedUntil.toISOString() } : r))
      );
    }

    return { error };
  };

  return {
    reminders,
    loading,
    addReminder,
    deleteReminder,
    toggleEnabled,
    snoozeReminder,
    refetch: fetchReminders,
  };
}
