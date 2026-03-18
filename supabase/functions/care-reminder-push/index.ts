import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = '47e18c4a-2002-4fec-9e3a-4984745e7cd5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!ONESIGNAL_REST_API_KEY) {
      console.error('ONESIGNAL_REST_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    console.log(`Server UTC time: ${now.toISOString()}`);

    const { data: reminders, error: remindersError } = await supabase
      .from('care_reminders')
      .select('id, user_id, category, task_details, reminder_time, snoozed_until, user_timezone, reminder_date, recurrence_pattern')
      .eq('is_enabled', true);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch reminders' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reminders || reminders.length === 0) {
      console.log('No enabled reminders found');
      return new Response(JSON.stringify({ message: 'No reminders' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    function getLocalTimeAndDate(utcNow: Date, timezone: string): { hhmm: string; dateStr: string; month: string; day: string } {
      const localTimeStr = utcNow.toLocaleString('en-US', { timeZone: timezone, hour12: false });
      const localDate = new Date(localTimeStr);
      const hh = String(localDate.getHours()).padStart(2, '0');
      const mm = String(localDate.getMinutes()).padStart(2, '0');
      const yyyy = localDate.getFullYear();
      const mo = String(localDate.getMonth() + 1).padStart(2, '0');
      const dd = String(localDate.getDate()).padStart(2, '0');
      return { hhmm: `${hh}:${mm}`, dateStr: `${yyyy}-${mo}-${dd}`, month: mo, day: dd };
    }

    const dueReminders = reminders.filter((r) => {
      const tz = r.user_timezone || 'America/New_York';
      const { hhmm: userHHMM, dateStr: localDateStr, month: localMonth, day: localDay } = getLocalTimeAndDate(now, tz);
      const reminderHHMM = r.reminder_time.slice(0, 5);
      if (reminderHHMM !== userHHMM) return false;

      // Check snooze
      if (r.snoozed_until) {
        const snoozeExpiry = new Date(r.snoozed_until);
        if (snoozeExpiry > now) return false;
      }

      // Date-specific reminder: only fire on that exact date
      if (r.reminder_date) {
        if (r.recurrence_pattern === 'yearly') {
          // Yearly: match month and day only
          const [, rMonth, rDay] = r.reminder_date.split('-');
          return rMonth === localMonth && rDay === localDay;
        }
        // One-time: exact date match
        return r.reminder_date === localDateStr;
      }

      // Recurring reminders fire every matching time (existing behavior)
      return true;
    });

    console.log(`Found ${dueReminders.length} due reminders out of ${reminders.length} total`);

    if (dueReminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No due reminders' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reminderIds = dueReminders.map((r) => r.id);
    const reminderLocalDates = new Map<string, string>();
    for (const r of dueReminders) {
      const tz = r.user_timezone || 'America/New_York';
      const { dateStr } = getLocalTimeAndDate(now, tz);
      reminderLocalDates.set(r.id, dateStr);
    }

    const { data: alreadySent, error: sentError } = await supabase
      .from('care_reminder_sent_log')
      .select('reminder_id, sent_date')
      .in('reminder_id', reminderIds);

    if (sentError) {
      console.error('Error checking sent log:', sentError);
    }

    const sentSet = new Set(
      (alreadySent || []).map((s) => `${s.reminder_id}|${s.sent_date}`)
    );
    const toSend = dueReminders.filter((r) => {
      const localDate = reminderLocalDates.get(r.id)!;
      return !sentSet.has(`${r.id}|${localDate}`);
    });

    console.log(`${toSend.length} reminders to send (${sentSet.size} already sent)`);

    let sentCount = 0;

    for (const reminder of toSend) {
      const { title, body } = getNotificationContent(reminder.category, reminder.task_details);
      const localDate = reminderLocalDates.get(reminder.id)!;

      try {
        const osResponse = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [reminder.user_id],
            channel_for_external_user_ids: 'push',
            contents: { en: body },
            headings: { en: title },
            data: { type: 'care_reminder', reminderId: reminder.id, category: reminder.category },
            android_sound: reminder.category === 'medication' ? 'paws_urgent' : 'paws_reminder',
            ios_sound: reminder.category === 'medication' ? 'paws_urgent.wav' : 'paws_reminder.wav',
            priority: 10,
          }),
        });

        const osResult = await osResponse.json();
        console.log(`Push for reminder ${reminder.id}:`, JSON.stringify(osResult));

        const { error: logError } = await supabase
          .from('care_reminder_sent_log')
          .insert({ reminder_id: reminder.id, sent_date: localDate });

        if (logError) {
          console.error(`Failed to log sent reminder ${reminder.id}:`, logError);
        }

        sentCount++;
      } catch (pushError) {
        console.error(`Failed to send push for reminder ${reminder.id}:`, pushError);
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sentCount} reminder(s)`, checked: dueReminders.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('care-reminder-push error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getNotificationContent(category: string, taskDetails: string | null): { title: string; body: string } {
  switch (category) {
    case 'medication':
      return { title: '💊 Medication Reminder', body: taskDetails ? `Time for ${taskDetails}` : 'Time to give medication' };
    case 'feeding':
      return { title: '🥣 Feeding Reminder', body: taskDetails ? `Time to feed: ${taskDetails}` : 'Time to feed your pup!' };
    case 'grooming':
      return { title: '✂️ Grooming Reminder', body: taskDetails ? `Grooming reminder: ${taskDetails}` : 'Time for grooming!' };
    case 'training':
      return { title: '🎓 Training Reminder', body: taskDetails ? `Training reminder: ${taskDetails}` : 'Time for training!' };
    case 'vet_visit':
      return { title: '🩺 Vet Visit Reminder', body: taskDetails ? `Vet visit: ${taskDetails}` : 'You have a vet appointment today!' };
    case 'birthday':
      return { title: '🎂 Birthday!', body: taskDetails ? `Happy Birthday, ${taskDetails}! 🎉🐾` : "It's your pup's birthday! 🎉" };
    default:
      return { title: '🐾 Dog Walk Reminder', body: 'Time to take your pup for a walk!' };
  }
}
