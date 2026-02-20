import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = '47e18c4a-2002-4fec-9e3a-4984745e7cd5';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload));

    // Extract the new comment record
    const comment = payload.record;
    if (!comment) {
      console.log('No record in payload');
      return new Response(JSON.stringify({ error: 'No record provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { post_id, author_id: commenterId, body: commentBody, id: commentId } = comment;

    // Validate required fields
    if (!post_id || !commenterId || !commentId) {
      console.log('Missing required fields in payload');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the comment actually exists in the database (prevents fake payloads)
    const { data: verifiedComment, error: verifyError } = await supabase
      .from('post_comments')
      .select('id, post_id, author_id')
      .eq('id', commentId)
      .eq('post_id', post_id)
      .eq('author_id', commenterId)
      .single();

    if (verifyError || !verifiedComment) {
      console.error('Comment verification failed - payload does not match database:', verifyError);
      return new Response(JSON.stringify({ error: 'Invalid or non-existent comment' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the post to find the owner
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

    // Skip if commenter is the post owner (don't notify yourself)
    if (commenterId === postOwnerId) {
      console.log('Commenter is post owner, skipping notification');
      return new Response(JSON.stringify({ message: 'Skipped - self comment' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up commenter's profile for display name
    const { data: commenterProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', commenterId)
      .single();

    const commenterName = commenterProfile?.display_name || 
                          commenterProfile?.username || 
                          'Someone';

    // Create in-app notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: postOwnerId,
        type: 'comment',
        title: 'New Comment',
        body: `${commenterName} commented on your post!`,
        data: { postId: post_id, commentId: commentId },
      });

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    } else {
      console.log('In-app notification created');
    }

    // Send push notification via OneSignal
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
        contents: { en: `${commenterName} commented on your post!` },
        headings: { en: 'New Comment 💬' },
        data: { type: 'comment', postId: post_id },
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
    console.error('Error processing notification:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
