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

    // Get current time in HH:MM format
    const now = new Date();
    const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
    console.log(`Checking reminders for ${currentHHMM}`);

    // Query all enabled reminders matching current minute
    const { data: reminders, error: remindersError } = await supabase
      .from('care_reminders')
      .select('id, user_id, category, task_details, reminder_time, snoozed_until')
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

    // Filter reminders due right now
    const dueReminders = reminders.filter((r) => {
      // Match HH:MM from reminder_time (format "HH:mm:ss")
      const reminderHHMM = r.reminder_time.slice(0, 5);
      if (reminderHHMM !== currentHHMM) return false;

      // Skip snoozed
      if (r.snoozed_until) {
        const snoozeExpiry = new Date(r.snoozed_until);
        if (snoozeExpiry > now) return false;
      }

      return true;
    });

    console.log(`Found ${dueReminders.length} due reminders out of ${reminders.length} total`);

    if (dueReminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No due reminders' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check which have already been sent today
    const reminderIds = dueReminders.map((r) => r.id);
    const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const { data: alreadySent, error: sentError } = await supabase
      .from('care_reminder_sent_log')
      .select('reminder_id')
      .in('reminder_id', reminderIds)
      .eq('sent_date', today);

    if (sentError) {
      console.error('Error checking sent log:', sentError);
    }

    const sentIds = new Set((alreadySent || []).map((s) => s.reminder_id));
    const toSend = dueReminders.filter((r) => !sentIds.has(r.id));

    console.log(`${toSend.length} reminders to send (${sentIds.size} already sent today)`);

    let sentCount = 0;

    for (const reminder of toSend) {
      const { title, body } = getNotificationContent(reminder.category, reminder.task_details);

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
          }),
        });

        const osResult = await osResponse.json();
        console.log(`Push for reminder ${reminder.id}:`, JSON.stringify(osResult));

        // Log as sent
        const { error: logError } = await supabase
          .from('care_reminder_sent_log')
          .insert({ reminder_id: reminder.id, sent_date: today });

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
      return {
        title: '💊 Medication Reminder',
        body: taskDetails ? `Time for ${taskDetails}` : 'Time to give medication',
      };
    case 'feeding':
      return {
        title: '🥣 Feeding Reminder',
        body: taskDetails ? `Time to feed: ${taskDetails}` : 'Time to feed your pup!',
      };
    case 'grooming':
      return {
        title: '✂️ Grooming Reminder',
        body: taskDetails ? `Grooming reminder: ${taskDetails}` : 'Time for grooming!',
      };
    case 'training':
      return {
        title: '🎓 Training Reminder',
        body: taskDetails ? `Training reminder: ${taskDetails}` : 'Time for training!',
      };
    default:
      return {
        title: '🐾 Dog Walk Reminder',
        body: 'Time to take your pup for a walk!',
      };
  }
}
