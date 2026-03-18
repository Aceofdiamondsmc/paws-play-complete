import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = '47e18c4a-2002-4fec-9e3a-4984745e7cd5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Friend request webhook payload:', JSON.stringify(payload));

    const record = payload.record;
    if (!record) {
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id: friendshipId, requester_id, addressee_id, status } = record;

    if (!requester_id || !addressee_id || !friendshipId) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only notify on pending requests (new friend requests)
    if (status !== 'pending') {
      console.log('Status is not pending, skipping notification');
      return new Response(JSON.stringify({ message: 'Skipped - not a pending request' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the friendship exists
    const { data: verified, error: verifyError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .eq('requester_id', requester_id)
      .eq('addressee_id', addressee_id)
      .single();

    if (verifyError || !verified) {
      console.error('Friendship verification failed:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or non-existent friendship' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get requester's display name
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', requester_id)
      .single();

    const requesterName = requesterProfile?.display_name || requesterProfile?.username || 'Someone';

    // Create in-app notification for the addressee
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: addressee_id,
        type: 'friend_request',
        title: 'New Friend Request',
        body: `${requesterName} sent you a friend request!`,
        data: { friendshipId, requesterId: requester_id },
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    } else {
      console.log('In-app notification created for', addressee_id);
    }

    // Send push via OneSignal
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!oneSignalApiKey) {
      console.error('ONESIGNAL_REST_API_KEY not configured');
      return new Response(JSON.stringify({
        message: 'In-app notification created, push skipped (no API key)'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Sending push notification to user:', addressee_id);

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [addressee_id],
        channel_for_external_user_ids: 'push',
        contents: { en: `${requesterName} sent you a friend request!` },
        headings: { en: 'New Friend Request 🐾' },
        data: { type: 'friend_request', friendshipId },
        ios_sound: 'paws_happy.caf',
        android_sound: 'paws_happy',
        priority: 10,
      }),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log('OneSignal response:', JSON.stringify(oneSignalResult));

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', oneSignalResult);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Friend request notification sent',
      oneSignal: oneSignalResult,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing friend request notification:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
