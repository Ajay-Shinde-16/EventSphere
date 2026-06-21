// Uses Brevo's HTTPS API (formerly Sendinblue) instead of raw SMTP because
// Render's free tier blocks/throttles outbound SMTP ports (465/587), causing
// "Connection timeout" errors with Gmail. Brevo works over normal HTTPS
// (port 443), which is never blocked — AND, unlike Resend's sandbox mode,
// Brevo's free tier lets you send to ANY real user email address from day
// one with no domain verification required. This is what makes "email
// actually reaches the user who booked" work in production immediately.
//
// Setup (5 min):
//   1. Go to https://www.brevo.com → sign up free (300 emails/day free, no card needed)
//   2. Go to Settings (gear icon) → SMTP & API → API Keys tab
//   3. Click "Generate a new API key" → copy it (starts with "xkeysib-")
//   4. On Render, set: BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
//   5. EMAIL_USER can stay as your Gmail (eventsphere.cdac@gmail.com) —
//      Brevo lets you use any address as the "from" sender without
//      verification for their free tier sending limits.

const sendEmail = async ({ to, subject, html, attachments }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_USER || 'eventsphere.cdac@gmail.com';

  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn(`⚠️  EMAIL NOT SENT — BREVO_API_KEY not configured on this server. Set it in your Render environment variables. (Would have sent "${subject}" to ${to})`);
    return;
  }

  try {
    const payload = {
      sender: { name: 'EventSphere', email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    // Brevo expects base64 content + name for attachments
    if (attachments?.length) {
      payload.attachment = attachments.map(a => ({
        name: a.filename,
        content: a.content, // already base64 in our QR code flow
      }));
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Brevo API ${response.status}: ${errText}`);
    }

    console.log(`📧 Email sent successfully to ${to} — "${subject}"`);
  } catch (err) {
    console.error(`❌ Email FAILED to ${to} — "${subject}": ${err.message}`);
    throw err;
  }
};

/* Convert raw seat number to A-01 format using event tiers */
function getSeatLabel(num, tiers) {
  if (!num || !tiers?.length) return String(num);
  const COLS = 30;
  const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const order = ['VIP','Premium','Gold','Silver','General','Standard','Economy'];
  const sorted = [...tiers].sort((a, b) => {
    const ai = order.findIndex(t => a.name.toLowerCase().includes(t.toLowerCase()));
    const bi = order.findIndex(t => b.name.toLowerCase().includes(t.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  let g = 0, ri = 0;
  for (const tier of sorted) {
    const rows = Math.ceil(tier.seats / COLS);
    for (let r = 0; r < rows; r++) {
      const rowLabel = ROWS[ri % 26]; ri++;
      for (let c = 0; c < COLS; c++) {
        if (r * COLS + c >= tier.seats) break;
        g++;
        if (g === Number(num)) return `${rowLabel}-${String(c + 1).padStart(2, '0')}`;
      }
    }
  }
  return String(num);
}

function getSeatLabels(seatNumbers, tiers) {
  if (!seatNumbers?.length) return '';
  return seatNumbers.map(n => getSeatLabel(n, tiers)).join('  |  ');
}

const bookingConfirmationEmail = (user, event, booking) => {
  const dateStr = new Date(event.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  
  // Category color
  const catColors = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'#8892A4' };
  const catColor = catColors[event.category] || '#00F2FE';

  // Seat numbers display — convert raw numbers to A-01 format
  const seatDisplay = booking.seatNumbers?.length
    ? getSeatLabels(booking.seatNumbers, event.tiers)
    : booking.seats + ' seat(s)';

  // QR code is embedded directly inline as a base64 data URI in the <img> tag
  // below (no attachment / cid needed — Brevo's API doesn't resolve cid:
  // references the way SMTP clients like nodemailer do, so this is the
  // reliable cross-client way to show the QR code inside the email body).

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0B0F19; font-family: 'Segoe UI', Arial, sans-serif; color: #E2E8F0; padding: 20px; }
    .wrap { max-width: 640px; margin: 0 auto; }

    /* Header */
    .header { background: linear-gradient(135deg, ${catColor}22, #9B51E022); border: 1px solid ${catColor}33; border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${catColor}, #9B51E0, #05FF9B); }
    .logo { font-size: 22px; font-weight: 900; color: ${catColor}; letter-spacing: 2px; margin-bottom: 6px; }
    .header h2 { font-size: 14px; color: #8892A4; font-weight: 400; }

    /* Ticket body */
    .ticket { background: #171E2E; border: 1px solid rgba(255,255,255,0.07); border-top: none; border-radius: 0; overflow: hidden; }

    /* Ticket top band */
    .ticket-header { background: linear-gradient(135deg, #1E2840, #0F1929); padding: 24px 32px; border-bottom: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: flex-start; }
    .event-title { font-size: 22px; font-weight: 900; color: #fff; line-height: 1.2; }
    .event-meta { font-size: 12px; color: #8892A4; margin-top: 6px; }
    .cat-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${catColor}18; color: ${catColor}; border: 1px solid ${catColor}33; }

    /* Booking code */
    .code-box { background: #0B0F19; border: 2px solid ${catColor}44; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 32px; }
    .code-label { font-size: 10px; font-weight: 700; color: #8892A4; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
    .code-val { font-size: 28px; font-weight: 900; color: ${catColor}; letter-spacing: 5px; font-family: 'Courier New', monospace; }

    /* Details grid */
    .details { padding: 0 32px 24px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 12px; color: #8892A4; display: flex; align-items: center; gap: 8px; }
    .detail-label span { font-size: 16px; }
    .detail-val { font-size: 14px; font-weight: 700; color: #E2E8F0; text-align: right; }
    .amount-val { color: ${catColor}; font-size: 18px; }

    /* QR section */
    .qr-section { background: #0B0F19; border-top: 1px dashed rgba(255,255,255,0.1); padding: 24px 32px; text-align: center; }
    .qr-section img { width: 160px; height: 160px; border-radius: 12px; background: #fff; padding: 8px; display: inline-block; }
    .qr-note { font-size: 12px; color: #8892A4; margin-top: 10px; }

    /* Seat highlight */
    .seat-box { background: ${catColor}10; border: 1px solid ${catColor}30; border-radius: 10px; padding: 12px 20px; margin: 0 32px 20px; display: flex; align-items: center; justify-content: space-between; }
    .seat-label { font-size: 11px; font-weight: 700; color: #8892A4; letter-spacing: 2px; }
    .seat-val { font-size: 18px; font-weight: 900; color: ${catColor}; font-family: monospace; letter-spacing: 3px; }

    /* Footer */
    .footer { background: #0B0F19; border: 1px solid rgba(255,255,255,0.05); border-top: none; border-radius: 0 0 16px 16px; padding: 16px 32px; text-align: center; color: #8892A4; font-size: 11px; line-height: 1.8; }

    /* Checkin badge */
    .checkin-badge { background: rgba(5,255,155,0.08); border: 1px solid rgba(5,255,155,0.2); border-radius: 10px; padding: 12px 20px; margin: 0 32px 20px; text-align: center; color: #05FF9B; font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">

    <!-- Header -->
    <div class="header">
      <div class="logo">⬡ EVENTSPHERE</div>
      <h2>Elite Event Management Platform</h2>
    </div>

    <div class="ticket">
      <!-- Event info -->
      <div class="ticket-header">
        <div>
          <div class="cat-badge">${event.category}</div>
          <div class="event-title" style="margin-top:10px">${event.title}</div>
          <div class="event-meta">${dateStr} &nbsp;·&nbsp; ${event.time}</div>
          <div class="event-meta" style="margin-top:4px">📍 ${event.venue}, ${event.city}</div>
        </div>
      </div>

      <!-- Booking code -->
      <div class="code-box">
        <div class="code-label">Your Booking Code</div>
        <div class="code-val">${booking.bookingCode}</div>
      </div>

      <!-- Seat number if available -->
      ${booking.seatNumbers?.length ? `
      <div class="seat-box">
        <div class="seat-label">💺 SEAT NUMBER</div>
        <div class="seat-val">${seatDisplay}</div>
      </div>` : ''}

      <!-- Details -->
      <div class="details">
        <div class="detail-row">
          <span class="detail-label"><span>👤</span> Attendee</span>
          <span class="detail-val">${user.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label"><span>🎟️</span> Tier</span>
          <span class="detail-val">${booking.tier}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label"><span>🪑</span> Seats</span>
          <span class="detail-val">${booking.seats}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label"><span>💰</span> Amount Paid</span>
          <span class="detail-val amount-val">${booking.totalAmount === 0 ? 'FREE' : '₹' + booking.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <!-- Check-in note -->
      <div class="checkin-badge">
        ✅ Show your QR code at the venue gate for instant check-in
      </div>

      <!-- QR Code -->
      ${booking.qrData ? `
      <div class="qr-section">
        <div style="font-size:12px;color:#8892A4;margin-bottom:12px;letter-spacing:2px;font-weight:700;">SCAN TO CHECK IN</div>
        <img src="${booking.qrData}" alt="QR Code" />
        <div class="qr-note">Powered by EventSphere — One QR, instant entry</div>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong style="color:#E2E8F0">EventSphere — Elite Event Management Platform</strong><br/>
      PGCP AC, C-DAC Bangalore 2026 &nbsp;·&nbsp; Built by Ajay Shinde<br/>
      <span style="color:#8892A4">This is your official booking confirmation. Keep it safe.</span>
    </div>

  </div>
</body>
</html>`;

  return { to: user.email, subject: `🎫 Your Ticket — ${event.title} | EventSphere`, html };
};

// (module.exports moved to end of file)

// ── Waitlist notification email ───────────────────────────────
const waitlistNotificationEmail = (user, event) => {
  const dateStr = new Date(event.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const catColors = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'#8892A4' };
  const catColor = catColors[event.category] || '#00F2FE';
  const minPrice = event.tiers?.length ? Math.min(...event.tiers.map(t => t.price)) : 0;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#0B0F19; font-family:'Segoe UI',Arial,sans-serif; color:#E2E8F0; padding:20px; }
  .wrap { max-width:580px; margin:0 auto; }
  .header { background:linear-gradient(135deg,${catColor}18,#9B51E018); border:1px solid ${catColor}30; border-radius:16px 16px 0 0; padding:28px 32px; text-align:center; position:relative; overflow:hidden; }
  .header::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,${catColor},#9B51E0,#05FF9B); }
  .logo { font-size:20px; font-weight:900; color:${catColor}; letter-spacing:2px; margin-bottom:6px; }
  .body { background:#171E2E; border:1px solid rgba(255,255,255,0.07); border-top:none; padding:28px 32px; }
  .alert-box { background:rgba(5,255,155,0.06); border:1px solid rgba(5,255,155,0.25); border-radius:14px; padding:20px; margin-bottom:22px; text-align:center; }
  .alert-icon { font-size:36px; margin-bottom:10px; }
  .alert-title { font-size:20px; font-weight:900; color:#05FF9B; margin-bottom:4px; }
  .alert-sub { font-size:13px; color:#8892A4; }
  .event-card { background:#1E2840; border:1px solid ${catColor}25; border-radius:12px; padding:18px; margin-bottom:20px; }
  .event-title { font-size:18px; font-weight:800; color:#fff; margin-bottom:8px; }
  .event-detail { display:flex; align-items:center; gap:8px; font-size:13px; color:#8892A4; margin-bottom:6px; }
  .cta-btn { display:block; width:100%; padding:14px; border-radius:12px; background:linear-gradient(135deg,${catColor},#9B51E0); color:#000; font-size:15px; font-weight:900; text-align:center; text-decoration:none; margin-top:20px; letter-spacing:0.5px; }
  .urgency { background:rgba(255,179,0,0.08); border:1px solid rgba(255,179,0,0.2); border-radius:10px; padding:12px 16px; margin-top:16px; font-size:12px; color:#FFB300; text-align:center; }
  .footer { background:#0B0F19; border:1px solid rgba(255,255,255,0.05); border-top:none; border-radius:0 0 16px 16px; padding:16px 32px; text-align:center; color:#8892A4; font-size:11px; line-height:1.8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">⬡ EVENTSPHERE</div>
    <div style="font-size:13px;color:#8892A4;">Waitlist Notification</div>
  </div>
  <div class="body">
    <div class="alert-box">
      <div class="alert-icon">🎫</div>
      <div class="alert-title">A Seat Just Opened Up!</div>
      <div class="alert-sub">Hi ${user.name}, you're on the waitlist — grab it before someone else does</div>
    </div>

    <div class="event-card">
      <div style="margin-bottom:8px"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${catColor}18;color:${catColor}">${event.category}</span></div>
      <div class="event-title">${event.title}</div>
      <div class="event-detail">📅 ${dateStr}</div>
      <div class="event-detail">⏰ ${event.time}</div>
      <div class="event-detail">📍 ${event.venue}, ${event.city}</div>
      <div class="event-detail">💰 From ${minPrice === 0 ? 'FREE' : '₹' + minPrice.toLocaleString()}</div>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://eventsphere-wine.vercel.app'}/events/${event._id}" class="cta-btn">
      Book Your Seat Now →
    </a>

    <div class="urgency">⚡ Seats are filling fast — this notification was sent to all waitlisted users simultaneously</div>
  </div>
  <div class="footer">
    <strong style="color:#E2E8F0">EventSphere</strong><br/>
    You received this because you joined the waitlist for this event.<br/>
    <span style="color:#8892A4">© 2026 EventSphere — C-DAC Bangalore</span>
  </div>
</div>
</body>
</html>`;

  return { to: user.email, subject: `🎫 Seat available — ${event.title} | EventSphere Waitlist`, html };
};


// ── Forgot password email ─────────────────────────────────────
const forgotPasswordEmail = (user, resetUrl) => {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#080C14; font-family:'Segoe UI',Arial,sans-serif; color:#E2E8F0; padding:20px; }
  .wrap { max-width:560px; margin:0 auto; }
  .header { background:linear-gradient(135deg,rgba(244,114,182,0.1),rgba(167,139,250,0.1)); border:1px solid rgba(167,139,250,0.25); border-radius:16px 16px 0 0; padding:28px 32px; text-align:center; position:relative; overflow:hidden; }
  .header::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#F472B6,#A78BFA,#38BDF8); }
  .logo { font-size:20px; font-weight:900; color:#A78BFA; letter-spacing:2px; margin-bottom:6px; }
  .body { background:#111827; border:1px solid rgba(255,255,255,0.07); border-top:none; padding:32px; }
  .icon-wrap { width:72px; height:72px; border-radius:50%; background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.3); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; text-align:center; line-height:72px; font-size:32px; }
  .title { font-size:22px; font-weight:900; color:#F1F5F9; margin-bottom:8px; text-align:center; }
  .sub { font-size:14px; color:#64748B; text-align:center; margin-bottom:28px; line-height:1.7; }
  .btn { display:block; width:fit-content; margin:0 auto 24px; padding:14px 40px; border-radius:50px; background:linear-gradient(135deg,#F472B6,#A78BFA,#38BDF8); color:#000; font-size:15px; font-weight:900; text-align:center; text-decoration:none; letter-spacing:0.5px; }
  .note { background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2); border-radius:10px; padding:14px 18px; margin-bottom:20px; font-size:12px; color:#FBBF24; line-height:1.8; }
  .url-box { background:#1A2235; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 16px; margin-bottom:20px; word-break:break-all; font-size:11px; color:#64748B; font-family:monospace; }
  .footer { background:#080C14; border:1px solid rgba(255,255,255,0.05); border-top:none; border-radius:0 0 16px 16px; padding:16px 32px; text-align:center; color:#4B5563; font-size:11px; line-height:1.8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">⬡ EVENTSPHERE</div>
    <div style="font-size:13px;color:#8892A4;">Password Reset Request</div>
  </div>
  <div class="body">
    <div class="icon-wrap">🔐</div>
    <div class="title">Reset Your Password</div>
    <div class="sub">Hi ${user.name}, we received a request to reset your EventSphere password.<br/>Click the button below — this link expires in <strong style="color:#F1F5F9">30 minutes</strong>.</div>
    <a href="${resetUrl}" class="btn">Reset My Password →</a>
    <div class="note">
      ⚠️ If you didn't request this, ignore this email — your account is safe and your password won't change.
    </div>
    <div style="font-size:12px;color:#64748B;margin-bottom:8px;">Or paste this link in your browser:</div>
    <div class="url-box">${resetUrl}</div>
  </div>
  <div class="footer">
    <strong style="color:#E2E8F0">EventSphere</strong><br/>
    This link is valid for 30 minutes only.<br/>
    <span style="color:#4B5563">© 2026 EventSphere — C-DAC Bangalore</span>
  </div>
</div>
</body>
</html>`;

  return { to: user.email, subject: `🔐 Reset your EventSphere password`, html };
};

// Sent on every booking cancellation, regardless of whether it was paid or
// free — for paid bookings, clearly states the exact refund amount and that
// it's already been processed, so the user isn't left wondering whether
// they'll get their money back (this was the actual feature requested:
// users had no email confirming a refund happened, only an in-app notice).
const cancellationRefundEmail = (user, event, booking, refundAmount) => {
  const isPaid = refundAmount > 0;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#0B0F19; font-family:'Segoe UI',Arial,sans-serif; color:#E2E8F0; padding:20px; }
  .wrap { max-width:580px; margin:0 auto; }
  .header { background:linear-gradient(135deg,#F4728218,#9B51E018); border:1px solid #F4728230; border-radius:16px 16px 0 0; padding:28px 32px; text-align:center; position:relative; overflow:hidden; }
  .header::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#F47282,#9B51E0); }
  .logo { font-size:20px; font-weight:900; color:#F47282; letter-spacing:2px; margin-bottom:6px; }
  .body { background:#171E2E; border:1px solid rgba(255,255,255,0.07); border-top:none; padding:28px 32px; }
  .alert-box { background:${isPaid ? 'rgba(5,255,155,0.06)' : 'rgba(244,114,130,0.06)'}; border:1px solid ${isPaid ? 'rgba(5,255,155,0.25)' : 'rgba(244,114,130,0.2)'}; border-radius:14px; padding:20px; margin-bottom:22px; text-align:center; }
  .alert-icon { font-size:36px; margin-bottom:10px; }
  .alert-title { font-size:20px; font-weight:900; color:${isPaid ? '#05FF9B' : '#F47282'}; margin-bottom:4px; }
  .alert-sub { font-size:13px; color:#8892A4; }
  .refund-amount { font-size:32px; font-weight:900; color:#05FF9B; margin:14px 0 4px; }
  .event-card { background:#1E2840; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:18px; margin-bottom:20px; }
  .event-title { font-size:18px; font-weight:800; color:#fff; margin-bottom:8px; }
  .event-detail { display:flex; align-items:center; gap:8px; font-size:13px; color:#8892A4; margin-bottom:6px; }
  .footer { background:#0B0F19; border:1px solid rgba(255,255,255,0.05); border-top:none; border-radius:0 0 16px 16px; padding:16px 32px; text-align:center; color:#8892A4; font-size:11px; line-height:1.8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">⬡ EVENTSPHERE</div>
    <div style="font-size:13px;color:#8892A4;">Booking Cancelled</div>
  </div>
  <div class="body">
    <div class="alert-box">
      <div class="alert-icon">${isPaid ? '💸' : '❌'}</div>
      <div class="alert-title">${isPaid ? 'Refund Processed' : 'Booking Cancelled'}</div>
      <div class="alert-sub">Booking code: ${booking.bookingCode}</div>
      ${isPaid ? `<div class="refund-amount">₹${refundAmount.toLocaleString()}</div><div class="alert-sub">refunded to your original payment method</div>` : ''}
    </div>
    <div class="event-card">
      <div class="event-title">${event.title}</div>
      <div class="event-detail">📅 ${new Date(event.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      <div class="event-detail">📍 ${event.venue}, ${event.city}</div>
    </div>
    <p style="font-size:13px;color:#8892A4;line-height:1.7;">
      ${isPaid
        ? `Your refund of <strong style="color:#E2E8F0;">₹${refundAmount.toLocaleString()}</strong> has already been processed and should reflect in your original payment method within 5-7 business days, depending on your bank.`
        : `This was a free booking, so there is no payment to refund. The seat has been released back into the event's availability.`}
    </p>
  </div>
  <div class="footer">
    Hi ${user.name}, this confirms your cancellation request was completed.<br/>
    <span style="color:#4B5563">© 2026 EventSphere — C-DAC Bangalore</span>
  </div>
</div>
</body>
</html>`;

  return { to: user.email, subject: `${isPaid ? '💸 Refund Processed' : '❌ Booking Cancelled'} — ${event.title}`, html };
};

module.exports = { sendEmail, bookingConfirmationEmail, waitlistNotificationEmail, forgotPasswordEmail, cancellationRefundEmail };