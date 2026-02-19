import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const postId = url.searchParams.get("postId");

  if (!postId) {
    return new Response("Missing postId", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const appOrigin = "https://pawsplayrepeat.lovable.app";

  // Fetch the post
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, content, image_url, author_id, author_display_name, pup_name")
    .eq("id", postId)
    .single();

  if (error || !post) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${appOrigin}/social` },
    });
  }

  // Resolve author name
  let authorName = post.author_display_name || "";
  if (!authorName) {
    const { data: profile } = await supabase
      .from("public_profiles")
      .select("display_name")
      .eq("id", post.author_id)
      .single();
    authorName = profile?.display_name || "A pup parent";
  }

  const title = `${authorName} on Paws Play Repeat`;
  const description = post.content
    ? post.content.length > 200
      ? post.content.substring(0, 200) + "..."
      : post.content
    : "Check out this post on Paws Play Repeat!";

  const imageUrl = post.image_url || `${appOrigin}/og-image.png`;
  const appUrl = `${appOrigin}/social/post/${postId}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(appUrl)}" />
  <meta property="og:site_name" content="Paws Play Repeat" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(appUrl)}">Paws Play Repeat</a>...</p>
  <script>window.location.replace("${appUrl}");</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
});
