const ALLOWED_ORIGINS = [
  'https://ralphiestudios.com',
  'https://www.ralphiestudios.com',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };
}

function confirmationEmail() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>You're on the list</title>
<link href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#07101f;padding:20px 28px;border-radius:6px 6px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            <span style="font-family:'Russo One',Arial Black,sans-serif;font-size:16px;letter-spacing:0.08em;color:#e8620e;">RALPHIE</span><span style="font-family:'Russo One',Arial Black,sans-serif;font-size:16px;letter-spacing:0.08em;color:#6aa3e8;">STUDIOS</span>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <img src="https://ralphiestudios.com/images/favicon.png" alt="Ralphie Studios" width="36" height="36" style="display:inline-block;border:0;border-radius:4px;">
          </td>
        </tr></table>
      </td></tr>

      <!-- Orange rule -->
      <tr><td style="background:#e8620e;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:40px 32px 36px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#e8620e;">Wheelchair Rugby League</p>
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#07101f;line-height:1.25;">You're on the list.</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#3d4f62;line-height:1.65;">We'll be in touch when there's something worth sharing — alpha access, development updates, and a first look at what we're building.</p>
        <p style="margin:0 0 32px;font-size:15px;color:#3d4f62;line-height:1.65;">This is the first Wheelchair Rugby League video game. We're building it in public, and you're now part of that journey.</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:#07101f;border-radius:3px;">
            <a href="https://ralphiestudios.com/wrl" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">Follow the build &rarr;</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f5f6f8;padding:20px 32px;border-top:1px solid #e4e8ec;border-radius:0 0 6px 6px;">
        <p style="margin:0;font-size:12px;color:#8a96a4;line-height:1.7;">You signed up at <a href="https://ralphiestudios.com/wrl" style="color:#8a96a4;text-decoration:underline;">ralphiestudios.com/wrl</a>. No spam &mdash; development updates only. Every update email includes a one-click unsubscribe link.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    let email;
    try {
      const formData = await request.formData();
      email = (formData.get('email') || '').trim().toLowerCase();
    } catch {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Confirmation email to subscriber
    const confirmRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ralphie Studios <updates@ralphiestudios.com>',
        to: [email],
        subject: "You're on the list — Wheelchair Rugby League",
        html: confirmationEmail(),
      }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.text();
      console.error('Resend error (confirmation):', err);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Add to Resend audience
    await fetch('https://api.resend.com/audiences/2c4e099a-d353-48c5-9283-810d33281463/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    // Notification to studio
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WRL Signups <updates@ralphiestudios.com>',
        to: ['contact@ralphiestudios.com'],
        subject: `New WRL signup: ${email}`,
        html: `<p style="font-family:sans-serif;">New waitlist signup: <strong>${email}</strong></p>`,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
