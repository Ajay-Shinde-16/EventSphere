/* ════════════════════════════════════════════════════════════════
   SHARED TICKET IMAGE GENERATOR
   Draws the exact visual ticket (category bg, title, badges, QR
   code, booking code box) onto an HTML canvas and returns it as a
   PNG data URI. Used by:
     - MyTickets.jsx  → "Download Ticket" button
     - EventDetail.jsx → generates the same image right after a
       successful booking, then sends it to the backend as a real
       email attachment (since canvas only works in the browser,
       not on the Node server).
════════════════════════════════════════════════════════════════ */

/* ── Convert raw seat number to label like A-01, B-10 ───────── */
export function getSeatLabel(num, tiers) {
  if (!num || !tiers?.length) return String(num);
  const COLS = 30;
  const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const order = ['VIP','Premium','Gold','Silver','General','Standard','Economy'];
  const sorted = [...tiers].sort((a,b) => {
    const ai = order.findIndex(t => a.name.toLowerCase().includes(t.toLowerCase()));
    const bi = order.findIndex(t => b.name.toLowerCase().includes(t.toLowerCase()));
    return (ai===-1?99:ai)-(bi===-1?99:bi);
  });
  let g = 0, ri = 0;
  for (const tier of sorted) {
    const rows = Math.ceil(tier.seats / COLS);
    for (let r = 0; r < rows; r++) {
      const rowLabel = ROWS[ri % 26]; ri++;
      for (let c = 0; c < COLS; c++) {
        if (r * COLS + c >= tier.seats) break;
        g++;
        if (g === Number(num)) return `${rowLabel}-${String(c+1).padStart(2,'0')}`;
      }
    }
  }
  return String(num);
}

export function getSeatLabels(seatNumbers, tiers) {
  if (!seatNumbers?.length) return '';
  return seatNumbers.map(n => getSeatLabel(n, tiers)).join('  |  ');
}

/* ── Category backgrounds (Unsplash free images) ────────────── */
export const CAT_CONFIG = {
  Tech:     { color:'#00F2FE', dark:'#0B1929', emoji:'💻', img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80', label:'TECHNOLOGY' },
  Music:    { color:'#9B51E0', dark:'#1A0B2E', emoji:'🎵', img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80', label:'LIVE MUSIC' },
  Sports:   { color:'#05FF9B', dark:'#0B1F14', emoji:'⚽', img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80', label:'SPORTS' },
  Food:     { color:'#FFB300', dark:'#1F1400', emoji:'🍽️', img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', label:'FOOD & DINING' },
  Art:      { color:'#FF4081', dark:'#1F0B14', emoji:'🎨', img:'https://images.unsplash.com/photo-1541367777708-7905fe3296c4?w=900&q=80', label:'ART & CULTURE' },
  Business: { color:'#4FC3F7', dark:'#0B1520', emoji:'💼', img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80', label:'CONFERENCE' },
  Other:    { color:'var(--muted)', dark:'#111827', emoji:'⭐', img:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80', label:'EVENT' },
};

/**
 * Draws the full visual ticket onto a canvas and returns a PNG data URI.
 * Does NOT trigger a download — caller decides what to do with the result
 * (download it, or POST it to the backend as an email attachment).
 */
export async function generateTicketImage(bk) {
  const cat = CAT_CONFIG[bk.event?.category] || CAT_CONFIG.Other;
  const W = 1200, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Load background image
  try {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      bgImg.onload = res; bgImg.onerror = rej;
      bgImg.src = cat.img;
      setTimeout(rej, 5000);
    });
    ctx.drawImage(bgImg, 0, 0, 800, H);
    ctx.fillStyle = `${cat.dark}DD`;
    ctx.fillRect(0, 0, 800, H);
  } catch {
    const bg = ctx.createLinearGradient(0, 0, 800, H);
    bg.addColorStop(0, cat.dark); bg.addColorStop(1, '#000');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 800, H);
  }

  // Right panel
  ctx.fillStyle = '#000';
  ctx.fillRect(820, 0, 380, H);
  const rg = ctx.createLinearGradient(820, 0, 1200, H);
  rg.addColorStop(0, cat.dark + 'CC'); rg.addColorStop(1, '#000');
  ctx.fillStyle = rg; ctx.fillRect(820, 0, 380, H);

  // Glow
  const glow = ctx.createRadialGradient(700, 0, 0, 700, 0, 400);
  glow.addColorStop(0, cat.color + '30'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 800, H);

  // Top/bottom bar
  const bar = ctx.createLinearGradient(0, 0, 800, 0);
  bar.addColorStop(0, cat.color); bar.addColorStop(0.5, '#9B51E0'); bar.addColorStop(1, '#05FF9B');
  ctx.fillStyle = bar; ctx.fillRect(0, 0, 800, 5);
  ctx.fillRect(0, H-5, 800, 5);

  // Perforated line
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = cat.color + '60';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(815, 0); ctx.lineTo(815, H); ctx.stroke();
  ctx.setLineDash([]);

  // Category label
  ctx.font = '700 11px monospace';
  ctx.fillStyle = cat.color;
  ctx.fillText(`${cat.emoji}  ${cat.label}`, 50, 55);

  // Title
  const title = bk.event?.title || 'Event';
  let fs = 44; ctx.font = `900 ${fs}px Arial, sans-serif`;
  while (ctx.measureText(title).width > 700 && fs > 22) { fs -= 2; ctx.font = `900 ${fs}px Arial, sans-serif`; }
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = cat.color; ctx.shadowBlur = 20;
  ctx.fillText(title, 50, 130);
  ctx.shadowBlur = 0;

  // Badges
  ctx.font = '700 12px Arial, sans-serif';
  ctx.fillStyle = cat.color + '33';
  ctx.strokeStyle = cat.color + '66'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(50, 148, 80, 26, 13); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cat.color; ctx.font = '700 11px Arial, sans-serif';
  ctx.fillText(bk.tier, 90 - ctx.measureText(bk.tier).width/2, 166);

  ctx.fillStyle = 'rgba(5,255,155,0.2)';
  ctx.strokeStyle = 'rgba(5,255,155,0.4)';
  ctx.beginPath(); ctx.roundRect(140, 148, 110, 26, 13); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#05FF9B'; ctx.font = '700 11px Arial, sans-serif';
  ctx.fillText('CONFIRMED ✓', 195 - ctx.measureText('CONFIRMED ✓').width/2, 166);

  // Details
  ctx.font = '500 15px Arial, sans-serif'; ctx.fillStyle = '#94A3B8';
  const dateStr = bk.event?.date ? new Date(bk.event.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '';
  ctx.fillText(`📅  ${dateStr}`, 50, 215);
  ctx.fillText(`⏰  ${bk.event?.time || ''}`, 50, 245);
  ctx.fillText(`📍  ${bk.event?.venue || ''}, ${bk.event?.city || ''}`, 50, 275);
  ctx.fillText(`🪑  ${bk.seats} Seat${bk.seats>1?'s':''}  ·  ${bk.tier}`, 50, 305);
  if (bk.seatNumbers?.length) {
    ctx.fillStyle = cat.color; ctx.font = '700 15px Arial, sans-serif';
    ctx.fillText(`SEAT: ${getSeatLabels(bk.seatNumbers, bk.event?.tiers)}`, 50, 330);
    ctx.fillStyle = '#94A3B8'; ctx.font = '500 15px Arial, sans-serif';
  }

  // Code box
  ctx.fillStyle = cat.color + '15'; ctx.strokeStyle = cat.color + '50'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(50, 330, 360, 68, 14); ctx.fill(); ctx.stroke();
  ctx.font = '600 10px monospace'; ctx.fillStyle = cat.color + '80';
  ctx.fillText('BOOKING CODE', 70, 350);
  ctx.font = '900 24px monospace'; ctx.fillStyle = cat.color;
  ctx.fillText(bk.bookingCode, 70, 382);

  // Right panel content
  ctx.textAlign = 'center';
  ctx.font = '600 10px Arial, sans-serif'; ctx.fillStyle = cat.color + '80';
  ctx.fillText('TOTAL PAID', 1010, 70);
  ctx.font = `900 ${bk.totalAmount > 99999 ? 32 : 40}px Arial, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(bk.totalAmount === 0 ? 'FREE' : '₹' + bk.totalAmount?.toLocaleString(), 1010, 120);
  ctx.font = '600 13px Arial, sans-serif'; ctx.fillStyle = '#94A3B8';
  ctx.fillText(`${bk.seats} Seat${bk.seats>1?'s':''}`, 1010, 148);

  // QR
  if (bk.qrData) {
    const qr = new Image();
    await new Promise(r => { qr.onload = r; qr.onerror = r; qr.src = bk.qrData; });
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
    ctx.roundRect(880, 168, 260, 230, 14); ctx.fill();
    ctx.drawImage(qr, 896, 178, 228, 210);
  }

  ctx.font = '800 11px monospace'; ctx.fillStyle = cat.color + '80';
  ctx.letterSpacing = '3px';
  ctx.fillText(`ADMIT  ${bk.seats > 1 ? bk.seats : 'ONE'}`, 1010, 435);
  ctx.font = '600 9px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('⬡ EVENTSPHERE', 1010, 460);

  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png', 1.0);
}

/* Triggers a real browser download of the ticket PNG (used by the
   "Download Ticket" button on MyTickets — unchanged behaviour). */
export async function downloadTicketPNG(bk) {
  const dataUrl = await generateTicketImage(bk);
  const link = document.createElement('a');
  link.download = `EventSphere-Ticket-${bk.bookingCode}.png`;
  link.href = dataUrl;
  link.click();
}