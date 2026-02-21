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
    console.log('Received like webhook payload:', JSON.stringify(payload));

    const like = payload.record;
    if (!like) {
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { post_id, user_id: likerId, id: likeId } = like;

    if (!post_id || !likerId || !likeId) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the like exists
    const { data: verifiedLike, error: verifyError } = await supabase
      .from('post_likes')
      .select('id, post_id, user_id')
      .eq('id', likeId)
      .eq('post_id', post_id)
      .eq('user_id', likerId)
      .single();

    if (verifyError || !verifiedLike) {
      console.error('Like verification failed:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or non-existent like' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the post owner
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const postOwnerId = post.author_id;

    // Skip self-likes
    if (likerId === postOwnerId) {
      console.log('Liker is post owner, skipping notification');
      return new Response(JSON.stringify({ message: 'Skipped - self like' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get liker's display name
    const { data: likerProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', likerId)
      .single();

    const likerName = likerProfile?.display_name || likerProfile?.username || 'Someone';

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: postOwnerId,
        type: 'like',
        title: 'New Like',
        body: `${likerName} liked your post!`,
        data: { postId: post_id, likeId: likeId },
      });

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    } else {
      console.log('In-app notification created');
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

    console.log('Sending push notification to user:', postOwnerId);

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [postOwnerId],
        channel_for_external_user_ids: 'push',
        contents: { en: `${likerName} liked your post!` },
        headings: { en: 'New Like ❤️' },
        data: { type: 'like', postId: post_id },
      }),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log('OneSignal response:', JSON.stringify(oneSignalResult));

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', oneSignalResult);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification sent',
      oneSignal: oneSignalResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing like notification:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
