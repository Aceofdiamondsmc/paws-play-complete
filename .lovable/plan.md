
User asking about the **Reauthentication** template — does it need the logo too?

Context: They're editing Supabase dashboard auth email templates and adding a logo `<img>`. They asked if they should also add it to Reauthentication.

Reauthentication = OTP code sent when a user re-confirms identity for sensitive actions (e.g. password change while logged in). Supabase has it as a separate template in the dashboard.

Answer: Yes, add it for consistency — same snippet works. But note it's rarely triggered (only fires if `secure_password_change` or similar reauth-required settings are enabled). Most apps never send it. Optional but harmless.

Pure guidance, no code.
