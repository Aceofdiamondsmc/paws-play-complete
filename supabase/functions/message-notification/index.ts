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
    console.log('Message notification payload:', JSON.stringify(payload));

    const message = payload.record;
    if (!message) {
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { conversation_id, sender_id, content } = message;

    if (!conversation_id || !sender_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get conversation to find recipient
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversation_id)
      .single();

    if (convoError || !conversation) {
      console.error('Error fetching conversation:', convoError);
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientId = conversation.participant_1_id === sender_id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    // Skip self-messages
    if (recipientId === sender_id) {
      return new Response(JSON.stringify({ message: 'Skipped - self message' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', sender_id)
      .single();

    const senderName = senderProfile?.display_name || senderProfile?.username || 'Someone';
    const preview = content?.length > 50 ? content.substring(0, 50) + '...' : content || '';

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'message',
        title: 'New Message',
        body: `${senderName}: ${preview}`,
        data: { conversationId: conversation_id, senderId: sender_id },
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send push via OneSignal
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!oneSignalApiKey) {
      console.error('ONESIGNAL_REST_API_KEY not configured');
      return new Response(JSON.stringify({ message: 'In-app notification created, push skipped' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [recipientId],
        channel_for_external_user_ids: 'push',
        contents: { en: `${senderName}: ${preview}` },
        headings: { en: 'New Message 💬' },
        data: { type: 'message', conversationId: conversation_id },
        ios_sound: 'paws_happy.wav',
        android_sound: 'paws_happy',
        priority: 10,
      }),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log('OneSignal response:', JSON.stringify(oneSignalResult));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing message notification:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
