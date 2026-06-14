import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── Convert raw seat number to label like A-01, B-10 ───────── */
function getSeatLabel(num, tiers) {
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

function getSeatLabels(seatNumbers, tiers) {
  if (!seatNumbers?.length) return '';
  return seatNumbers.map(n => getSeatLabel(n, tiers)).join('  |  ');
}

/* ── Category backgrounds (Unsplash free images) ────────────── */
const CAT_CONFIG = {
  Tech:     { color:'#00F2FE', dark:'#0B1929', emoji:'💻', img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80', label:'TECHNOLOGY' },
  Music:    { color:'#9B51E0', dark:'#1A0B2E', emoji:'🎵', img:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80', label:'LIVE MUSIC' },
  Sports:   { color:'#05FF9B', dark:'#0B1F14', emoji:'⚽', img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80', label:'SPORTS' },
  Food:     { color:'#FFB300', dark:'#1F1400', emoji:'🍽️', img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', label:'FOOD & DINING' },
  Art:      { color:'#FF4081', dark:'#1F0B14', emoji:'🎨', img:'https://images.unsplash.com/photo-1541367777708-7905fe3296c4?w=900&q=80', label:'ART & CULTURE' },
  Business: { color:'#4FC3F7', dark:'#0B1520', emoji:'💼', img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80', label:'CONFERENCE' },
  Other:    { color:'var(--muted)', dark:'#111827', emoji:'⭐', img:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80', label:'EVENT' },
};

/* ── Ticket Modal ────────────────────────────────────────────── */
function TicketModal({ bk, onClose, onDownload }) {
  const cat = CAT_CONFIG[bk.event?.category] || CAT_CONFIG.Other;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, animation:'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:860 }}>

        {/* ── THE TICKET ── */}
        <div style={{
          display:'flex', borderRadius:20, overflow:'hidden',
          boxShadow:`0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${cat.color}30`,
          border:`1px solid ${cat.color}40`,
          marginBottom:20,
        }}>

          {/* LEFT — Image + Info */}
          <div style={{ flex:1, position:'relative', minHeight:320, overflow:'hidden' }}>
            {/* Background image */}
            <img
              src={cat.img}
              alt={cat.label}
              onLoad={() => setImgLoaded(true)}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35) saturate(1.2)' }}
            />
            {/* Gradient overlay */}
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${cat.dark}EE 0%, ${cat.dark}99 40%, transparent 100%)` }} />
            {/* Color tint */}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 80% 20%, ${cat.color}25 0%, transparent 60%)` }} />

            {/* Top accent bar */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${cat.color},#9B51E0,#05FF9B)` }} />

            {/* Content */}
            <div style={{ position:'relative', zIndex:2, padding:36, height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              {/* Header */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{cat.emoji}</span>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:11, color:cat.color, letterSpacing:4, textTransform:'uppercase' }}>{cat.label}</span>
                </div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:28, color:'#fff', lineHeight:1.2, marginBottom:6, textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>
                  {bk.event?.title}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <span style={{ padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:`${cat.color}22`, color:cat.color, border:`1px solid ${cat.color}44` }}>{bk.tier}</span>
                  <span style={{ padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(5,255,155,0.15)', color:'#05FF9B', border:'1px solid rgba(5,255,155,0.3)' }}>CONFIRMED ✓</span>
                </div>
              </div>

              {/* Event details */}
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                  {[
                    { icon:'📅', label:'DATE', val: bk.event?.date ? new Date(bk.event.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '-' },
                    { icon:'⏰', label:'TIME', val: bk.event?.time || '-' },
                    { icon:'📍', label:'VENUE', val: `${bk.event?.venue||''}, ${bk.event?.city||''}` },
                    { icon:'🪑', label:'SEATS', val: `${bk.seats} × ${bk.tier}` },
                    ...(bk.seatNumbers?.length ? [{ icon:'💺', label:'SEAT NO', val: getSeatLabels(bk.seatNumbers, bk.event?.tiers) }] : []),
                  ].map((d,i) => (
                    <div key={i}>
                      <div style={{ fontSize:9, fontWeight:700, color:`${cat.color}99`, letterSpacing:2, marginBottom:3, fontFamily:"'Space Grotesk',sans-serif" }}>{d.icon} {d.label}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{d.val}</div>
                    </div>
                  ))}
                </div>

                {/* Booking code */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:`${cat.color}12`, border:`1.5px solid ${cat.color}40`, borderRadius:12, padding:'10px 18px' }}>
                  <span style={{ fontSize:9, fontWeight:700, color:`${cat.color}80`, letterSpacing:2, fontFamily:"'Space Grotesk',sans-serif" }}>BOOKING CODE</span>
                  <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:20, color:cat.color, letterSpacing:3 }}>{bk.bookingCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div style={{ width:2, background:`repeating-linear-gradient(to bottom, ${cat.color}50 0px, ${cat.color}50 8px, transparent 8px, transparent 16px)`, flexShrink:0, position:'relative' }}>
            <div style={{ position:'absolute', top:-12, left:-10, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.85)' }} />
            <div style={{ position:'absolute', bottom:-12, left:-10, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.85)' }} />
          </div>

          {/* RIGHT — QR + Price stub */}
          <div style={{
            width:210, flexShrink:0,
            background:`linear-gradient(160deg, ${cat.dark} 0%, #000 100%)`,
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:14, padding:'28px 20px',
            borderLeft:`1px solid ${cat.color}20`,
          }}>
            {/* Price */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:`${cat.color}80`, letterSpacing:2, fontFamily:"'Space Grotesk',sans-serif", marginBottom:4 }}>TOTAL PAID</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:28, color:'#fff' }}>
                {bk.totalAmount === 0 ? 'FREE' : `₹${bk.totalAmount?.toLocaleString()}`}
              </div>
            </div>

            {/* Seat number */}
            {bk.seatNumbers?.length > 0 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, fontWeight:700, color:`${cat.color}80`, letterSpacing:2, marginBottom:3, fontFamily:"'Space Grotesk',sans-serif" }}>SEAT NO</div>
                <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:20, color:cat.color, letterSpacing:2 }}>{getSeatLabels(bk.seatNumbers, bk.event?.tiers)}</div>
              </div>
            )}

            {/* QR */}
            {bk.qrData && (
              <div style={{ background:'#fff', borderRadius:12, padding:10, boxShadow:`0 0 24px ${cat.color}30` }}>
                <img src={bk.qrData} alt="QR Code" style={{ width:130, height:130, display:'block' }} />
              </div>
            )}

            <div style={{ fontSize:9, fontWeight:700, color:`${cat.color}70`, letterSpacing:3, fontFamily:"'Space Grotesk',sans-serif", textAlign:'center' }}>
              ADMIT {bk.seats > 1 ? bk.seats : 'ONE'}
            </div>

            {/* EventSphere brand */}
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, letterSpacing:1 }}>⬡ EVENTSPHERE</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={onDownload}
            style={{ padding:'13px 32px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, background:`linear-gradient(135deg,${cat.color},#9B51E0)`, color:'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:`0 6px 24px ${cat.color}40` }}>
            <i className="bi bi-download" />Download Ticket
          </button>
          <button onClick={onClose}
            style={{ padding:'13px 28px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, background:'rgba(255,255,255,0.06)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Canvas download ─────────────────────────────────────────── */
async function downloadTicketPNG(bk) {
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
    // Draw image on left 2/3
    ctx.drawImage(bgImg, 0, 0, 800, H);
    // Darken it
    ctx.fillStyle = `${cat.dark}DD`;
    ctx.fillRect(0, 0, 800, H);
  } catch {
    // Fallback gradient
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

  // Top bar
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
  ctx.font = '500 15px Arial, sans-serif'; ctx.fillStyle = 'var(--muted)';
  const dateStr = bk.event?.date ? new Date(bk.event.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '';
  ctx.fillText(`📅  ${dateStr}`, 50, 215);
  ctx.fillText(`⏰  ${bk.event?.time || ''}`, 50, 245);
  ctx.fillText(`📍  ${bk.event?.venue || ''}, ${bk.event?.city || ''}`, 50, 275);
  ctx.fillText(`🪑  ${bk.seats} Seat${bk.seats>1?'s':''}  ·  ${bk.tier}`, 50, 305);
  if (bk.seatNumbers?.length) {
    ctx.fillStyle = cat.color; ctx.font = '700 15px Arial, sans-serif';
    ctx.fillText(`SEAT: ${getSeatLabels(bk.seatNumbers, bk.event?.tiers)}`, 50, 330);
    ctx.fillStyle = 'var(--muted)'; ctx.font = '500 15px Arial, sans-serif';
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
  ctx.font = '600 13px Arial, sans-serif'; ctx.fillStyle = 'var(--muted)';
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
  const link = document.createElement('a');
  link.download = `EventSphere-Ticket-${bk.bookingCode}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/* ── Certificate Generator ───────────────────────────────────── */
function CertificateGenerator({ booking }) {
  const canvasRef = useRef(null);
  const generate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 900; canvas.height = 620;
    ctx.fillStyle = '#0B0F19'; ctx.fillRect(0,0,900,620);
    const grad = ctx.createLinearGradient(0,0,900,620);
    grad.addColorStop(0,'#00F2FE'); grad.addColorStop(0.5,'#9B51E0'); grad.addColorStop(1,'#05FF9B');
    ctx.strokeStyle=grad; ctx.lineWidth=4; ctx.strokeRect(10,10,880,600);
    ctx.strokeStyle='rgba(0,242,254,0.2)'; ctx.lineWidth=1; ctx.strokeRect(20,20,860,580);
    ctx.textAlign='center';
    ctx.fillStyle='var(--muted)'; ctx.font='13px sans-serif'; ctx.fillText('EVENTSPHERE — CERTIFICATE OF ATTENDANCE',450,70);
    ctx.fillStyle='var(--text)'; ctx.font='bold 15px sans-serif'; ctx.fillText('This is to certify that',450,130);
    ctx.fillStyle='#00F2FE'; ctx.font='bold 38px sans-serif'; ctx.fillText(booking.user?.name||'Attendee',450,190);
    ctx.fillStyle='var(--text)'; ctx.font='15px sans-serif'; ctx.fillText('successfully attended',450,235);
    ctx.fillStyle='#9B51E0'; ctx.font='bold 24px sans-serif'; ctx.fillText(booking.event?.title||'Event',450,288);
    ctx.fillStyle='var(--muted)'; ctx.font='12px sans-serif'; ctx.fillText(`Booking: ${booking.bookingCode}  |  Tier: ${booking.tier}`,450,335);
    ctx.fillStyle='#05FF9B'; ctx.font='bold 12px sans-serif'; ctx.fillText('✓ VERIFIED ATTENDANCE',450,385);
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(160,500,200,1); ctx.fillRect(540,500,200,1);
    ctx.fillStyle='var(--muted)'; ctx.font='11px sans-serif'; ctx.fillText('Event Organizer',260,520); ctx.fillText('EventSphere Platform',640,520);
    const link = document.createElement('a');
    link.download=`Certificate_${booking.bookingCode}.png`; link.href=canvas.toDataURL(); link.click();
  };
  return (
    <div>
      <canvas ref={canvasRef} style={{display:'none'}} />
      <button onClick={generate}
        style={{width:'100%',padding:'9px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:'rgba(5,255,155,0.07)',border:'1px solid rgba(5,255,155,0.2)',color:'var(--mint)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
        <i className="bi bi-award" />Download Certificate
      </button>
    </div>
  );
}

/* ── Map opener ──────────────────────────────────────────────── */
function openMap(bk) {
  const q = encodeURIComponent(`${bk.event?.venue||''} ${bk.event?.city||''}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function MyTickets() {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [expandedQR, setExpandedQR]   = useState(null);
  const [previewTicket, setPreviewTicket] = useState(null);
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyBookings()
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id);
      setBookings(b => b.map(bk => bk._id === id ? { ...bk, status:'cancelled' } : bk));
    } catch (err) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const statusColor = { confirmed:'#05FF9B', cancelled:'#FF4081', pending:'#FFB300' };

  if (loading) return (
    <div style={{textAlign:'center',padding:'80px 24px'}}>
      <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid var(--surface2)',borderTopColor:'var(--cyan)',animation:'spin 0.8s linear infinite',margin:'0 auto'}} />
    </div>
  );

  return (
    <div className="fade-up" style={{maxWidth:980,margin:'0 auto',padding: isMobile ? '16px 14px calc(80px + env(safe-area-inset-bottom))' : '28px 24px'}}>

      {/* Ticket Preview Modal */}
      {previewTicket && (
        <TicketModal
          bk={previewTicket}
          onClose={() => setPreviewTicket(null)}
          onDownload={() => downloadTicketPNG(previewTicket)}
        />
      )}

      {/* Header */}
      <div className="pgh" style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1.3rem',marginBottom:4,display:'flex',alignItems:'center',gap:10,color:'var(--heading)'}}>
          <i className="bi bi-ticket-perforated" style={{color:'var(--cyan)'}} />My Tickets
        </h2>
        <p style={{color:'var(--muted)',fontSize:13}}>{bookings.length} total booking{bookings.length!==1?'s':''}</p>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {['all','confirmed','cancelled'].map(f => (
          <button key={f} className={`cat-pill ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)} ({f==='all'?bookings.length:bookings.filter(b=>b.status===f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 24px',background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20}}>
          <i className="bi bi-ticket-perforated" style={{fontSize:48,color:'var(--muted)',display:'block',marginBottom:16}} />
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,color:'var(--muted)',marginBottom:16}}>No tickets found</p>
          <button onClick={() => navigate('/')} style={{padding:'10px 24px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:'#000',background:'linear-gradient(135deg,#00F2FE,#9B51E0)',border:'none',cursor:'pointer'}}>
            Browse Events
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gap:16,gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(420px,1fr))'}}>
          {filtered.map(bk => {
            const cat = CAT_CONFIG[bk.event?.category] || CAT_CONFIG.Other;
            return (
              <div key={bk._id} className="card-hover" style={{background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden'}}>
                {/* Top accent */}
                <div style={{height:4,background: bk.status==='confirmed' ? `linear-gradient(90deg,${cat.color},#9B51E0,#05FF9B)` : 'var(--surface2)'}} />

                <div style={{padding:20}}>
                  {/* Title + status */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                    <div style={{flex:1,marginRight:12}}>
                      <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1rem',color:'var(--heading)',marginBottom:4}}>{bk.event?.title}</div>
                      <div style={{fontFamily:'monospace',fontWeight:700,fontSize:12,color:cat.color,letterSpacing:2}}>{bk.bookingCode}</div>
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:`${statusColor[bk.status]}15`,color:statusColor[bk.status],border:`1px solid ${statusColor[bk.status]}25`,flexShrink:0}}>{bk.status}</span>
                  </div>

                  {/* Details */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}>
                      <i className="bi bi-calendar3" style={{color:'var(--cyan)'}} />
                      {bk.event?.date ? new Date(bk.event.date).toLocaleDateString('en-IN') : '-'}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}>
                      <i className="bi bi-clock" style={{color:'var(--purple)'}} />{bk.event?.time||'-'}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}>
                      <i className="bi bi-grid" style={{color:'var(--mint)'}} />{bk.tier} × {bk.seats}
                    </div>
                    <button onClick={() => openMap(bk)}
                      style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--pink)',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      <i className="bi bi-geo-alt-fill" style={{color:'var(--pink)'}} />
                      <span style={{textDecoration:'underline'}}>{bk.event?.city||'Map'}</span>
                      <i className="bi bi-box-arrow-up-right" style={{fontSize:10}} />
                    </button>
                  </div>

                  {/* Total */}
                  <div style={{background:'var(--surface2)',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--muted)'}}>Total Paid</span>
                    <span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:15,color:cat.color}}>{bk.totalAmount===0?'FREE':`₹${bk.totalAmount?.toLocaleString()}`}</span>
                  </div>

                  {bk.checkedIn && (
                    <div style={{background:'rgba(5,255,155,0.06)',border:'1px solid rgba(5,255,155,0.2)',borderRadius:10,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                      <i className="bi bi-check-circle-fill" style={{color:'var(--mint)'}} />
                      <span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,color:'var(--mint)'}}>Checked In ✓</span>
                    </div>
                  )}

                  {/* Actions */}
                  {bk.status === 'confirmed' && bk.qrData && (
                    <div>
                      {/* QR expanded */}
                      {expandedQR === bk._id && (
                        <div style={{textAlign:'center',marginBottom:12}}>
                          <div style={{display:'inline-block',background:'#fff',borderRadius:12,padding:10}}>
                            <img src={bk.qrData} alt="QR" style={{width:150,height:150,display:'block'}} />
                          </div>
                          <p style={{fontSize:11,color:'var(--muted)',marginTop:6}}>Show this QR at the entry gate</p>
                        </div>
                      )}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                        <button onClick={() => setExpandedQR(expandedQR===bk._id?null:bk._id)}
                          style={{padding:'10px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                          <i className={`bi ${expandedQR===bk._id?'bi-chevron-up':'bi-qr-code-scan'}`} />
                          {expandedQR===bk._id?'Hide QR':'Show QR'}
                        </button>
                        {/* VIEW TICKET → opens modal */}
                        <button onClick={() => setPreviewTicket(bk)}
                          style={{padding:'10px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:`${cat.color}12`,border:`1px solid ${cat.color}30`,color:cat.color,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                          <i className="bi bi-eye" />View Ticket
                        </button>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <CertificateGenerator booking={bk} />
                        {!bk.checkedIn && (
                          <button onClick={() => handleCancel(bk._id)}
                            style={{padding:'9px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:'rgba(255,64,129,0.07)',border:'1px solid rgba(255,64,129,0.2)',color:'var(--pink)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                            <i className="bi bi-x-circle" />Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}