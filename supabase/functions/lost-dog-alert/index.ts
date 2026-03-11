import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dog_name, last_seen, description, type } = await req.json();

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('OneSignal not configured, skipping push notification');
      return new Response(JSON.stringify({ success: true, push: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Template 2: Reunited
    if (type === 'reunited') {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ['All'],
          headings: { en: `🎉 Good News: Pack Reunited!` },
          contents: {
            en: `${dog_name || 'A dog'} is Safe & Sound! Thank you to everyone who kept a lookout. The pack is back together!`,
          },
          priority: 10,
          android_sound: 'notification',
          ios_sound: 'default',
        }),
      });

      const result = await response.json();
      console.log('OneSignal reunited broadcast result:', result);

      return new Response(JSON.stringify({ success: true, push: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Template 1: Urgent (default)
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: `🚨 PAWS ALERT: Missing Member!` },
        contents: {
          en: `${dog_name || 'A dog'} was last seen at ${last_seen || 'unknown location'}. Our pack needs your eyes on the street. Tap for details and contact info.`,
        },
        priority: 10,
        android_sound: 'notification',
        ios_sound: 'default',
      }),
    });

    const result = await response.json();
    console.log('OneSignal broadcast result:', result);

    // TODO: Template 3 (Proximity Alert) — future geo-fenced "Near You" template
    // Title: 📍 Pack Alert: Near You
    // Body: A neighbor's dog is missing nearby in [Neighborhood]. Can you help bring [Dog Name] home?
    // Requires location-based user segmentation in OneSignal.

    return new Response(JSON.stringify({ success: true, push: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lost-dog-alert:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
