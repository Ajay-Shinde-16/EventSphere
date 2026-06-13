const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, attachments }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log(`📧 [Email Skipped - configure EMAIL_USER in .env] To: ${to}, Subject: ${subject}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"EventSphere" <${process.env.EMAIL_USER}>`,
    to, subject, html,
    attachments: attachments || [],
  });
};

/* Convert raw seat number to A-01 format using event tiers */
function getSeatLabel(num, tiers) {
  if (!num || !tiers?.length) return String(num);
  const COLS = 20;
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

  // QR code attachment
  const attachments = [];
  if (booking.qrData && booking.qrData.startsWith('data:image/')) {
    const base64Data = booking.qrData.split(',')[1];
    attachments.push({
      filename: `QR-${booking.bookingCode}.png`,
      content: base64Data,
      encoding: 'base64',
      cid: 'qrcode@eventsphere',
    });
  }

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
        <img src="cid:qrcode@eventsphere" alt="QR Code" />
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

  return { to: user.email, subject: `🎫 Your Ticket — ${event.title} | EventSphere`, html, attachments };
};

module.exports = { sendEmail, bookingConfirmationEmail };