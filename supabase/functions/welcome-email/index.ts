import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify calling user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user data with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const [profileRes, dogsRes] = await Promise.all([
      adminClient.from("profiles").select("display_name").eq("id", user_id).single(),
      adminClient.from("dogs").select("name").eq("owner_id", user_id).limit(1),
    ]);

    const userName = profileRes.data?.display_name || "there";
    const dogName = dogsRes.data?.[0]?.name || "your pup";
    const profileLink = "https://pawsplayrepeat.lovable.app/me";

    const htmlBody = buildEmailHtml(userName, dogName, profileLink);

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Paws Play Repeat <welcome@system.pawsplayrepeat.app>",
        to: [user.email],
        subject: "Welcome to the Pack! 🐾 (And how we keep your dog safe)",
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      throw new Error(`Resend API error: ${resendRes.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildEmailHtml(userName: string, dogName: string, profileLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Pack!</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#3d2a14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <tr>
      <td style="text-align:center;padding-bottom:24px;">
        <h1 style="color:#e87b35;font-size:28px;margin:0;">🐾 Welcome to the Pack!</h1>
      </td>
    </tr>
    <tr>
      <td style="font-size:16px;line-height:1.6;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Welcome to <strong>Paws Play Repeat</strong>! We're thrilled to have you and <strong>${dogName}</strong> as part of our local community.</p>
        <p>Our app is all about fun, walks, and playdates—but we're also here for each other when things get tough. We hope you never have to use it, but we want you to know about our <strong>Pack Alert</strong> system, just in case.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef7f2;border-radius:12px;padding:20px;">
          <tr>
            <td>
              <h2 style="color:#e87b35;font-size:20px;margin:0 0 12px;">🚨 What is a Pack Alert?</h2>
              <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">If your dog ever goes missing, you can broadcast a Pack Alert to every user in your area with one tap.</p>
              <p style="font-size:15px;line-height:1.6;margin:0 0 4px;"><strong>How it works:</strong></p>
              <ul style="font-size:15px;line-height:1.8;padding-left:20px;margin:0;">
                <li><strong>Hit the SOS Button:</strong> Located right on your home screen.</li>
                <li><strong>Broadcast to the Pack:</strong> Your dog's photo, description, and last-seen location are sent instantly to all nearby neighbors.</li>
                <li><strong>Printable Flyers:</strong> The app automatically generates a professional "Missing Dog" flyer with a QR code, ready for you to print and post in minutes.</li>
                <li><strong>Community Search:</strong> Neighbors can contact you directly through the app if they spot your pup.</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0faf5;border-radius:12px;padding:20px;">
          <tr>
            <td>
              <h2 style="color:#2a9d60;font-size:20px;margin:0 0 12px;">✅ Do This Now (Just in case!)</h2>
              <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">To ensure your Pack Alert is ready to go in seconds, we recommend:</p>
              <ul style="font-size:15px;line-height:1.8;padding-left:20px;margin:0;">
                <li><strong>Uploading a Clear Photo:</strong> Make sure you have a high-quality, recent photo of ${dogName} in your profile.</li>
                <li><strong>Adding Your Phone Number:</strong> This allows us to put your contact info directly on the printable flyers.</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:24px 0;">
        <a href="${profileLink}" style="display:inline-block;background-color:#e87b35;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:12px;">
          Complete Your Profile →
        </a>
      </td>
    </tr>
    <tr>
      <td style="font-size:16px;line-height:1.6;">
        <p>We're all looking out for one another. Let's keep the pack together and the tails wagging!</p>
        <p>See you at the park,<br><strong>The Paws Play Repeat Team</strong></p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding-top:24px;border-top:1px solid #e8ddd4;font-size:12px;color:#8c7a6a;">
        <p>Paws Play Repeat — Keeping the pack safe, together.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
