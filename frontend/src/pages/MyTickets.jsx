import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSeatLabels, CAT_CONFIG, downloadTicketPNG } from '../utils/ticketImage';

/* ── Ticket Modal ────────────────────────────────────────────── */
function TicketModal({ bk, onClose, onDownload }) {
  const cat = CAT_CONFIG[bk.event?.category] || CAT_CONFIG.Other;
  const [imgLoaded, setImgLoaded] = useState(false);
  const isMobile = window.innerWidth < 640;

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding: isMobile ? 12 : 24, animation:'fadeIn 0.2s ease',
      overflowY:'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:860 }}>

        {/* ── THE TICKET ── */}
        <div style={{
          display:'flex', flexDirection: isMobile ? 'column' : 'row', borderRadius:20, overflow:'hidden',
          boxShadow:`0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${cat.color}30`,
          border:`1px solid ${cat.color}40`,
          marginBottom:20,
        }}>

          {/* LEFT — Image + Info */}
          <div style={{ flex:1, position:'relative', minHeight: isMobile ? 260 : 320, overflow:'hidden' }}>
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
            <div style={{ position:'relative', zIndex:2, padding: isMobile ? 20 : 36, height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
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
            width: isMobile ? '100%' : 210, flexShrink:0,
            background:`linear-gradient(160deg, ${cat.dark} 0%, #000 100%)`,
            display:'flex', flexDirection: isMobile ? 'row' : 'column', alignItems:'center',
            justifyContent:'center', gap:14, padding: isMobile ? '20px 16px' : '28px 20px',
            borderLeft: isMobile ? 'none' : `1px solid ${cat.color}20`,
            borderTop: isMobile ? `1px dashed ${cat.color}40` : 'none',
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
      const booking = bookings.find(bk => bk._id === id);
      await cancelBooking(id);
      setBookings(b => b.map(bk => bk._id === id ? { ...bk, status:'cancelled' } : bk));
      if (booking?.totalAmount > 0) {
        alert(`Booking cancelled. ₹${booking.totalAmount.toLocaleString()} has been refunded to your original payment method.`);
      }
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
    <div className="fade-up" style={{maxWidth:980,margin:'0 auto',padding: isMobile ? '16px 14px 24px' : '28px 24px'}}>

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