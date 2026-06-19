import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, createBooking, joinWaitlist, rateEvent, getEvents, emailTicketImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { generateTicketPDF } from '../utils/ticketImage';
import { launchConfetti } from '../utils/confetti';

const CAT = {
  Tech:     { color:'#00F2FE', bg:'#0B1929', emoji:'💻', label:'TECHNOLOGY' },
  Music:    { color:'#9B51E0', bg:'#1A0B2E', emoji:'🎵', label:'LIVE MUSIC' },
  Sports:   { color:'#05FF9B', bg:'#0B1F14', emoji:'⚽', label:'SPORTS' },
  Food:     { color:'#FFB300', bg:'#1F1400', emoji:'🍽️', label:'FOOD & DINING' },
  Art:      { color:'#FF4081', bg:'#1F0B14', emoji:'🎨', label:'ART & CULTURE' },
  Business: { color:'#4FC3F7', bg:'#0B1520', emoji:'💼', label:'CONFERENCE' },
  Other:    { color:'var(--muted)', bg:'#111827', emoji:'⭐', label:'EVENT' },
};

/* ── Countdown ──────────────────────────────────────────────── */
function Countdown({ date }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date) - Date.now();
      if (diff <= 0) return setT({ expired: true });
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [date]);
  if (t.expired) return <span style={{ color:'var(--pink)', fontWeight:700, fontSize:13 }}>Event Ended</span>;
  return (
    <div style={{ display:'flex', gap:8 }}>
      {[['D', t.d],['H', t.h],['M', t.m],['S', t.s]].map(([l, v]) => (
        <div key={l} style={{ textAlign:'center', background:'rgba(0,0,0,0.3)', borderRadius:10, padding:'10px 14px', minWidth:56, border:'1px solid rgba(0,242,254,0.15)' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.6rem', color:'var(--cyan)', lineHeight:1 }}>{String(v||0).padStart(2,'0')}</div>
          <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', marginTop:3, letterSpacing:1 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Seat Grid ──────────────────────────────────────────────── */
function SeatGrid({ event, selectedSeats, bookedSeatNumbers = [], onToggleSeat }) {
  if (!event?.tiers?.length) return null;

  const COLS = 30; // seats per row
  const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Sort tiers: VIP first, General last
  const tierOrder = ['VIP','Premium','Gold','Silver','General','Standard','Economy'];
  const sorted = [...event.tiers].sort((a, b) => {
    const ai = tierOrder.findIndex(t => a.name.toLowerCase().includes(t.toLowerCase()));
    const bi = tierOrder.findIndex(t => b.name.toLowerCase().includes(t.toLowerCase()));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Build flat seat list with row/col labels
  let globalNum = 0;
  let rowIndex = 0;
  const tierBlocks = sorted.map(tier => {
    const totalSeats = tier.seats;
    const rows = Math.ceil(totalSeats / COLS);
    const tierSeatRows = [];
    // Note: bookedSeats count shown in header, not tracked per-seat
    for (let r = 0; r < rows; r++) {
      const rowLabel = ROWS[rowIndex % 26];
      rowIndex++;
      const rowSeats = [];
      for (let c = 0; c < COLS; c++) {
        const seatIndex = r * COLS + c;
        if (seatIndex >= totalSeats) break;
        globalNum++;
        rowSeats.push({
          id: `${rowLabel}${c + 1}`,
          num: globalNum,
          row: rowLabel,
          col: c + 1,
          tier: tier.name,
          price: tier.price,
          booked: bookedSeatNumbers.map(Number).includes(globalNum),
        });
      }
      tierSeatRows.push({ rowLabel, seats: rowSeats });
    }
    return { tier, rows: tierSeatRows };
  });

  const tierColors = {
    VIP: '#FFB300', Premium: '#9B51E0', Gold: '#FFD700',
    Silver: 'var(--muted)', General: '#00F2FE', Standard: '#4FC3F7', Economy: '#05FF9B',
  };
  // Fallback palette cycles for any custom tier name (e.g. "Tier 3", "Balcony", etc.)
  const fallbackPalette = ['#00F2FE', '#9B51E0', '#05FF9B', '#FFB300', '#FF4081', '#4FC3F7'];
  const getTierColor = (name, index = 0) => {
    for (const [k, v] of Object.entries(tierColors)) {
      if (name.toLowerCase().includes(k.toLowerCase())) return v;
    }
    return fallbackPalette[index % fallbackPalette.length];
  };

  return (
    <div>
      {/* Stage */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', padding: '10px 80px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: 5 }}>
          🎭  STAGE / SCREEN
        </div>
        <div style={{ width: '80%', height: 3, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', margin: '8px auto 0', borderRadius: 4 }} />
      </div>

      {/* Tier blocks */}
      {tierBlocks.map(({ tier, rows }, tierIdx) => {
        const tColor = getTierColor(tier.name, tierIdx);
        return (
          <div key={tier.name} style={{ marginBottom: 28 }}>
            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 12px', borderRadius: 10, background: `${tColor}10`, border: `1px solid ${tColor}25` }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: tColor, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 12, color: tColor, letterSpacing: 2 }}>{tier.name.toUpperCase()}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>₹{tier.price.toLocaleString()}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 700 }}>{tier.seats - (tier.bookedSeats || 0)} available</span>
            </div>

            {/* Rows */}
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              {rows.map(({ rowLabel, seats }) => (
                <div key={rowLabel} style={{ display: 'grid', gridTemplateColumns: `22px repeat(${seats.length}, 26px)`, gap: 3, marginBottom: 5, alignItems: 'center', width: 'max-content' }}>
                  {/* Row label */}
                  <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 11, color: tColor }}>
                    {rowLabel}
                  </div>
                  {/* Seats */}
                  {seats.map(seat => {
                    const isBooked = seat.booked;
                    const isSelected = selectedSeats.includes(seat.num);
                    return (
                      <div
                        key={seat.id}
                        onClick={() => { if (!isBooked) onToggleSeat(seat.num); }}
                        title={isBooked ? `${seat.id} — Booked` : isSelected ? `${seat.id} — Selected ✓` : `${seat.id} — ${tier.name} ₹${tier.price}`}
                        style={{
                          width:'100%', height:24, borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.12s',
                          userSelect: 'none',
                          background: isBooked
                            ? 'rgba(5,255,155,0.75)'
                            : isSelected
                              ? '#05FF9B'
                              : 'rgba(255,255,255,0.06)',
                          border: isBooked
                            ? '1px solid rgba(5,255,155,0.6)'
                            : isSelected
                              ? '2px solid #05FF9B'
                              : `1px solid ${tColor}20`,
                          color: (isBooked || isSelected) ? '#000' : 'rgba(255,255,255,0.2)',
                          boxShadow: isSelected ? '0 0 12px rgba(5,255,155,0.9)' : 'none',
                          transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                        }}
                      >
                        {seat.col}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        {[
          { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', label: 'Available' },
          { bg: 'rgba(5,255,155,0.75)',   border: 'rgba(5,255,155,0.6)',   label: 'Booked' },
          { bg: '#05FF9B',               border: '#05FF9B',               label: 'Your Selection' },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: l.bg, border: `1px solid ${l.border}`, display: 'inline-block', flexShrink: 0 }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [event, setEvent]               = useState(null);
  const [loading, setLoading]           = useState(true);
  // No selectedTier needed — user selects seats freely from grid
  
  // Build seat info map once (num -> {label, tier, price})
  const buildSeatMap = (tiers) => {
    const COLS = 30;
    const ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const order = ['VIP','Premium','Gold','Silver','General','Standard','Economy'];
    const sorted = [...(tiers||[])].sort((a,b) => {
      const ai = order.findIndex(t => a.name.toLowerCase().includes(t.toLowerCase()));
      const bi = order.findIndex(t => b.name.toLowerCase().includes(t.toLowerCase()));
      return (ai===-1?99:ai) - (bi===-1?99:bi);
    });
    let globalNum = 0, rowIdx = 0;
    const map = {};
    sorted.forEach(tier => {
      const totalRows = Math.ceil(tier.seats / COLS);
      for (let r = 0; r < totalRows; r++) {
        const rowLabel = ROWS[rowIdx % 26];
        rowIdx++;
        for (let c = 0; c < COLS; c++) {
          if (r * COLS + c >= tier.seats) break;
          globalNum++;
          map[globalNum] = { label: `${rowLabel}${c+1}`, tier: tier.name, price: tier.price };
        }
      }
    });
    return map;
  };
  const [seats, setSeats]               = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [booking, setBooking]           = useState(null);
  const [bookingLoading, setBL]         = useState(false);
  const [bookingMsg, setBMsg]           = useState('');
  const [rating, setRating]             = useState(0);
  const [comment, setComment]           = useState('');
  const [ratingDone, setRatingDone]     = useState(false);
  const [shareMsg, setShareMsg]         = useState('');
  const [aiRecs, setAiRecs]             = useState(null);
  const [aiRecsLoading, setAiRecsLoading] = useState(false);
  const [allEvents, setAllEvents]       = useState([]);

  useEffect(() => { fetchEvent(); }, [id]);

  const fetchEvent = async () => {
    try {
      const [evRes, allRes] = await Promise.all([
        getEvent(id),
        getEvents().catch(() => ({ data: { events: [] } })),
      ]);
      setEvent(evRes.data);
      setAllEvents(allRes.data?.events || []);
    } catch { navigate('/'); }
    finally { setLoading(false); }
  };

  const fetchAiRecs = async (ev) => {
    if (aiRecs || aiRecsLoading) return;
    setAiRecsLoading(true);
    try {
      const others = allEvents
        .filter(e => e._id !== ev._id && e.status === 'approved')
        .slice(0, 20)
        .map(e => ({ id: e._id, title: e.title, category: e.category, city: e.city, price: e.tiers?.[0]?.price || 0, tags: e.tags?.slice(0,3) || [] }));

      if (others.length < 2) { setAiRecsLoading(false); return; }

      const prompt = `You are an event recommendation engine for EventSphere (India).

Current event the user is viewing:
- Title: "${ev.title}"
- Category: ${ev.category}
- City: ${ev.city}
- Tags: ${ev.tags?.join(', ') || 'none'}

Available events (pick the 3 best matches):
${JSON.stringify(others, null, 2)}

Return ONLY a JSON array of exactly 3 objects (no markdown):
[
  { "id": "<event_id>", "reason": "one sentence why this matches the user's interest" },
  ...
]

Base your reasoning on category similarity, city match, price range, and tag overlap. Be specific and human.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '[]';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

      const recs = parsed
        .map(r => ({ ...others.find(e => e.id === r.id), reason: r.reason }))
        .filter(r => r.id)
        .slice(0, 3);

      setAiRecs(recs);
    } catch (e) {
      // Fallback: simple category/city filter
      const fallback = allEvents
        .filter(e => e._id !== ev._id && (e.category === ev.category || e.city === ev.city))
        .slice(0, 3)
        .map(e => ({ id: e._id, title: e.title, category: e.category, city: e.city, price: e.tiers?.[0]?.price || 0, reason: `Same ${e.category === ev.category ? 'category' : 'city'} as the event you're viewing` }));
      if (fallback.length) setAiRecs(fallback);
    }
    setAiRecsLoading(false);
  };

  const toggleSeat = (num) => {
    setSelectedSeats(prev => {
      if (prev.includes(num)) {
        // Deselect — also decrease count
        const next = prev.filter(s => s !== num);
        setSeats(Math.max(1, next.length));
        return next;
      }
      // Select — auto-increment count
      const next = [...prev, num];
      setSeats(next.length);
      return next;
    });
  };

  // Compute total from selected seats across tiers using unified seat map
  const getSelectedTotal = () => {
    if (!event?.tiers) return 0;
    const seatMap = buildSeatMap(event.tiers);
    return selectedSeats.reduce((sum, s) => sum + (seatMap[s]?.price||0), 0);
  };

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setBL(true); setBMsg('');
    try {
      const seatMap3 = buildSeatMap(event.tiers);

      if (selectedSeats.length === 0) {
        setBMsg('Please select at least one seat from the grid');
        setBL(false); return;
      }

      // Create one booking per seat
      const createdBookings = [];
      for (const seatNum of selectedSeats) {
        const seatInfo = seatMap3[seatNum] || { tier:'General', price: event.tiers?.[0]?.price||0 };
        try {
          const { data } = await createBooking({
            eventId: id,
            tier: seatInfo.tier,
            tierPrice: seatInfo.price,
            seats: 1,
            seatNumbers: [seatNum],
            totalAmount: seatInfo.price,
          });
          createdBookings.push(data);

          // Generate the real visual ticket as a PDF (same design as
          // "Download Ticket", with a clickable Google Maps link over the
          // venue line) and send it to the backend to email as a real
          // attachment. Fire-and-forget — never blocks the UI.
          generateTicketPDF(data)
            .then(base64Pdf => emailTicketImage(data._id, base64Pdf, 'pdf'))
            .catch(e => console.log('Ticket PDF email failed (non-fatal):', e));
        } catch (seatErr) {
          // If some seats already booked successfully before this one failed,
          // still show those as confirmed instead of losing them silently.
          const reason = seatErr.response?.data?.message || 'Booking failed for this seat';
          if (createdBookings.length > 0) {
            setBooking(createdBookings);
            setBMsg(`Seat ${seatInfo.tier === 'General' ? '' : ''}#${seatNum} couldn't be booked (${reason}). Your other ${createdBookings.length} seat${createdBookings.length>1?'s':''} ${createdBookings.length>1?'are':'is'} confirmed below.`);
            launchConfetti();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setBL(false);
            return;
          }
          throw seatErr; // no successful bookings yet — bubble up to outer catch
        }
      }
      setBooking(createdBookings); // array of bookings
      launchConfetti();
      // Auto-scroll to top so the success message is immediately visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const reason = err.response?.data?.message
        || (err.code === 'ECONNABORTED' ? 'Request timed out — the server may be waking up, please try again in 30 seconds.' : null)
        || (!err.response ? 'Cannot reach the server. It may be waking up (free hosting can take up to a minute) — please try again shortly.' : null)
        || 'Booking failed';
      setBMsg(reason);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    finally { setBL(false); }
  };

  const openMap = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue||''} ${event.city||''}`)}`, '_blank');

  const handleShare = (p) => {
    const url = window.location.href, text = `Check out ${event.title} on EventSphere!`;
    if (p==='whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text+' '+url)}`);
    else if (p==='twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    else { navigator.clipboard.writeText(url); setShareMsg('Copied!'); setTimeout(()=>setShareMsg(''),2000); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'80px'}}><div style={{width:44,height:44,borderRadius:'50%',border:'3px solid var(--surface2)',borderTopColor:'var(--cyan)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>;
  if (!event) return null;

  const isSoldOut = event.bookedSeats >= event.totalSeats;
  const cat = CAT[event.category] || CAT.Other;
  const isOrg = user?.role === 'organizer' || user?.role === 'admin';

  return (
    <div className="fade-up" style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px 12px 24px' : '28px 24px' }}>

      {/* ── BOOKING SUCCESS ── */}
      {booking && (
        <div className="fade-up" style={{ marginBottom:24, borderRadius:20, padding:24, background:'linear-gradient(135deg,rgba(5,255,155,0.08),rgba(0,242,254,0.06))', border:'1px solid rgba(5,255,155,0.3)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div style={{ fontSize:36 }}>🎉</div>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.2rem', color:'var(--mint)' }}>
                {Array.isArray(booking) ? `${booking.length} Ticket${booking.length>1?'s':''} Confirmed!` : 'Booking Confirmed!'}
              </div>
              <div style={{ color:'var(--muted)', fontSize:13 }}>Go to My Tickets to view and download each ticket</div>
            </div>
          </div>
          {/* Individual booking codes */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {(Array.isArray(booking) ? booking : [booking]).map((bk, i) => {
              const seatMap4 = buildSeatMap(event?.tiers||[]);
              const seatLabel = bk.seatNumbers?.[0] ? seatMap4[bk.seatNumbers[0]]?.label : null;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,242,254,0.06)', border:'1px solid rgba(0,242,254,0.2)', borderRadius:10, padding:'8px 14px' }}>
                  {seatLabel && <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:12, color:'var(--mint)' }}>{seatLabel}</span>}
                  <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:13, color:'var(--cyan)', letterSpacing:2 }}>{bk.bookingCode}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/my-tickets')}
            style={{ padding:'10px 22px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:'var(--mint)', color:'#000', border:'none', cursor:'pointer' }}>
            <i className="bi bi-ticket-perforated me-2"/>View & Download All Tickets
          </button>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', marginBottom:20 }}>
        {/* Top color bar */}
        <div style={{ height:5, background:`linear-gradient(90deg,${cat.color},#9B51E0,#05FF9B)` }} />

        <div style={{ padding:'28px 32px' }}>
          {/* Badges row */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <span style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:700, background:`${cat.color}18`, color:cat.color, display:'flex', alignItems:'center', gap:6 }}>
              {cat.emoji} {event.category}
            </span>
            {event.isFree && <span style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(5,255,155,0.1)', color:'var(--mint)' }}>FREE</span>}
            {isSoldOut && <span style={{ padding:'4px 14px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(255,64,129,0.1)', color:'var(--pink)' }}>SOLD OUT</span>}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', color:'var(--heading)', lineHeight:1.2, marginBottom:24 }}>{event.title}</h1>

          {/* Info grid — 2 cols */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'12px 32px', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${cat.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-calendar3" style={{ color:cat.color }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Date</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{new Date(event.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(155,81,224,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-clock" style={{ color:'var(--purple)' }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Time</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{event.time}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,64,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-geo-alt-fill" style={{ color:'var(--pink)' }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Venue</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{event.venue}, {event.city}</div>
                <button onClick={openMap} style={{ marginTop:4, padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(255,64,129,0.1)', color:'var(--pink)', border:'1px solid rgba(255,64,129,0.2)', cursor:'pointer' }}>
                  <i className="bi bi-map me-1"/>View on Maps
                </button>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(5,255,155,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-people-fill" style={{ color:'var(--mint)' }} />
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--muted)', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Seats</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{event.bookedSeats} / {event.totalSeats} booked</div>
                <div style={{ marginTop:4, height:4, background:'var(--surface2)', borderRadius:4, width:120 }}>
                  <div style={{ height:'100%', width:`${Math.min(100,(event.bookedSeats/event.totalSeats)*100)}%`, background:'var(--mint)', borderRadius:4 }}/>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>EVENT STARTS IN</div>
            <Countdown date={event.date} />
          </div>

          {/* Share */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', letterSpacing:1 }}>SHARE:</span>
            {[{icon:'bi-whatsapp',p:'whatsapp',c:'#25D366'},{icon:'bi-twitter-x',p:'twitter',c:'var(--muted)'},{icon:'bi-link-45deg',p:'copy',c:'var(--cyan)'}].map(s=>(
              <button key={s.p} onClick={()=>handleShare(s.p)} style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${s.c}12`,border:`1px solid ${s.c}25`,color:s.c,cursor:'pointer',fontSize:15 }}>
                <i className={`bi ${s.icon}`}/>
              </button>
            ))}
            {shareMsg && <span style={{ color:'var(--mint)', fontSize:12, fontWeight:700 }}>{shareMsg}</span>}
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display:'grid', gridTemplateColumns: (isOrg || isMobile) ? '1fr' : '1fr 360px', gap:20 }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:20, minWidth:0, order: isMobile ? 2 : 0 }}>

          {/* About */}
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:cat.color, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-info-circle"/>About This Event
            </h2>
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.85 }}>{event.description}</p>
            {event.tags?.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:14 }}>
                {event.tags.map(t => <span key={t} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'var(--surface2)', color:'var(--muted)', border:'1px solid var(--border)' }}>#{t}</span>)}
              </div>
            )}
          </div>

          {/* Seat Grid */}
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--purple)', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-grid-3x3-gap"/>{isOrg ? 'Seat Availability' : 'Select Your Seat'}
            </h2>
            <p style={{ color:'var(--muted)', fontSize:12, marginBottom:20 }}>
              {isOrg ? 'Seat availability overview for this event.' : `Click seats below to choose specific seats (optional) — ${selectedSeats.length} selected`}
            </p>
            <SeatGrid
              event={event}
              selectedSeats={isOrg ? [] : selectedSeats}
              bookedSeatNumbers={event.bookedSeatNumbers || []}
              onToggleSeat={isOrg ? ()=>{} : toggleSeat}
            />
          </div>

          {/* Tier pricing cards */}
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--amber)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-tags-fill"/>Ticket Pricing
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
              {[...(event.tiers||[])].sort((a,b)=>{
                const o=['VIP','Premium','Gold','Silver','General','Standard','Economy'];
                return (o.findIndex(t=>a.name.toLowerCase().includes(t.toLowerCase()))||99)-(o.findIndex(t=>b.name.toLowerCase().includes(t.toLowerCase()))||99);
              }).map((tier,i) => {
                const avail = tier.seats - (tier.bookedSeats||0);
                const pct = Math.round(((tier.bookedSeats||0)/tier.seats)*100);
                return (
                  <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:14, padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, color:'var(--heading)' }}>{tier.name}</span>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:14, color:cat.color }}>{tier.price===0?'FREE':'₹'+tier.price}</span>
                    </div>
                    <div style={{ height:3, background:'var(--surface)', borderRadius:4, marginBottom:6 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: avail<=0?'var(--pink)':avail<=10?'var(--amber)':'var(--mint)', borderRadius:4 }}/>
                    </div>
                    <div style={{ fontSize:11, color: avail<=0?'var(--pink)':avail<=10?'var(--amber)':'var(--muted)' }}>
                      {avail<=0 ? '✕ Sold Out' : avail<=10 ? `⚠ Only ${avail} left` : `${avail} available`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rate this event — attendees only, not organizers/admins */}
          {!isOrg && (
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--amber)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-star-fill"/>Rate This Event
            </h2>
            {ratingDone ? (
              <p style={{ color:'var(--mint)', fontWeight:700 }}>✅ Thank you for your rating!</p>
            ) : (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={()=>setRating(s)} style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', transition:'transform 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
                      <i className={`bi ${s<=rating?'bi-star-fill':'bi-star'}`} style={{ color:s<=rating?'var(--amber)':'var(--muted)' }}/>
                    </button>
                  ))}
                </div>
                <textarea className="fta" placeholder="Share your thoughts about this event..." value={comment} onChange={e=>setComment(e.target.value)} style={{ marginBottom:12, minHeight:80 }}/>
                <button onClick={async()=>{ if(!user){navigate('/login');return;} if(!rating){alert('Please select stars');return;} try{await rateEvent(id,{rating,comment});setRatingDone(true);}catch(e){alert(e.response?.data?.message||'Error');}}}
                  style={{ padding:'10px 24px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:'linear-gradient(135deg,var(--amber),var(--pink))', color:'#000', border:'none', cursor:'pointer' }}>
                  Submit Rating
                </button>
              </>
            )}
          </div>
          )}

          {/* ── AI SMART RECOMMENDATIONS ── */}
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--purple)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#9B51E0,#00F2FE)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-stars" style={{ color:'#fff', fontSize:12 }}/>
                </div>
                AI-Powered Recommendations
              </h2>
              {!aiRecs && !aiRecsLoading && (
                <button
                  onClick={() => fetchAiRecs(event)}
                  style={{ padding:'7px 16px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, background:'linear-gradient(135deg,rgba(155,81,224,0.15),rgba(0,242,254,0.15))', color:'var(--purple)', border:'1px solid rgba(155,81,224,0.3)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                >
                  <i className="bi bi-magic"/>Find Similar Events
                </button>
              )}
            </div>

            {!aiRecs && !aiRecsLoading && (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
                <div style={{ fontWeight:600 }}>Claude AI will find events you'll love</div>
                <div style={{ fontSize:12, marginTop:4 }}>Based on this event's category, city, and tags</div>
              </div>
            )}

            {aiRecsLoading && (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ width:36,height:36,border:'3px solid var(--surface2)',borderTopColor:'var(--purple)',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
                  <div style={{ fontSize:13, color:'var(--muted)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>Claude is thinking...</div>
                </div>
              </div>
            )}

            {aiRecs && aiRecs.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {aiRecs.map((rec, i) => {
                  const recEvent = allEvents.find(e => e._id === rec.id);
                  if (!recEvent) return null;
                  const recCat = CAT[recEvent.category] || CAT.Other;
                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/events/${recEvent._id}`)}
                      className="card-hover"
                      style={{ background:'var(--surface2)', border:`1px solid ${recCat.color}20`, borderRadius:14, padding:14, cursor:'pointer', position:'relative', overflow:'hidden' }}
                    >
                      <div style={{ position:'absolute', top:0, left:0, width:3, bottom:0, background:`linear-gradient(to bottom,${recCat.color},transparent)`, borderRadius:'14px 0 0 14px' }}/>
                      <div style={{ paddingLeft:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:'var(--heading)', lineHeight:1.3 }}>{recEvent.title}</div>
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:`${recCat.color}15`, color:recCat.color, flexShrink:0 }}>{recEvent.category}</span>
                        </div>
                        <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--muted)', marginBottom:8 }}>
                          <span><i className="bi bi-geo-alt me-1"/>{recEvent.city}</span>
                          <span><i className="bi bi-tag me-1"/>{recEvent.tiers?.[0]?.price === 0 ? 'Free' : `₹${recEvent.tiers?.[0]?.price?.toLocaleString()}`}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:6, padding:'7px 10px', borderRadius:8, background:`rgba(155,81,224,0.06)`, border:'1px solid rgba(155,81,224,0.12)' }}>
                          <i className="bi bi-stars" style={{ color:'var(--purple)', fontSize:11, marginTop:1, flexShrink:0 }}/>
                          <span style={{ fontSize:11, color:'var(--muted)', fontStyle:'italic', lineHeight:1.5 }}>{rec.reason}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center', paddingTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <i className="bi bi-stars" style={{ color:'var(--purple)' }}/>Powered by Claude AI
                </div>
              </div>
            )}

            {aiRecs && aiRecs.length === 0 && (
              <p style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'16px 0' }}>No similar events found right now. Check back later!</p>
            )}
          </div>
        </div>

        {/* RIGHT — Booking / Organizer Panel */}
        <div style={{ width:'100%', minWidth:0, order: isMobile ? 1 : 0 }}>
          {!isOrg ? (
            /* Booking panel */
            <div style={{ background:'var(--card-bg)', border:`1px solid ${cat.color}30`, borderRadius:20, overflow:'hidden', position: isMobile ? 'static' : 'sticky', top:86, width:'100%' }}>
              <div style={{ height:4, background:`linear-gradient(90deg,${cat.color},#9B51E0)` }}/>
              <div style={{ padding:24 }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.1rem', marginBottom:20, color:'var(--heading)' }}>Book Tickets</h3>

                {/* Tier pricing info (read only) */}
                <div style={{ marginBottom:16 }}>
                  <label className="fl">Ticket Pricing</label>
                  {[...(event.tiers||[])].sort((a,b)=>{
                    const o=['VIP','Premium','Gold','Silver','General','Standard','Economy'];
                    return (o.findIndex(t=>a.name.toLowerCase().includes(t.toLowerCase()))||99)-(o.findIndex(t=>b.name.toLowerCase().includes(t.toLowerCase()))||99);
                  }).map((tier,i) => {
                    const avail = tier.seats-(tier.bookedSeats||0);
                    const tierColors2 = {VIP:'#FFB300',Premium:'#9B51E0',Gold:'#FFD700',Silver:'var(--muted)',General:'#00F2FE',Standard:'#4FC3F7',Economy:'#05FF9B'};
                    const fallbackPalette2 = ['#00F2FE','#9B51E0','#05FF9B','#FFB300','#FF4081','#4FC3F7'];
                    const tCol = Object.entries(tierColors2).find(([k])=>tier.name.toLowerCase().includes(k.toLowerCase()))?.[1] || fallbackPalette2[i % fallbackPalette2.length];
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, marginBottom:6, background:'var(--surface2)', border:'1px solid var(--border)', opacity:avail<=0?0.5:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:tCol, display:'inline-block' }}/>
                          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:'var(--heading)' }}>{tier.name}</span>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:13, color:tCol }}>{tier.price===0?'FREE':'₹'+tier.price}</div>
                          <div style={{ fontSize:10, color:avail<=0?'var(--pink)':avail<=10?'var(--amber)':'var(--muted)' }}>{avail<=0?'Sold Out':`${avail} left`}</div>
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:8, lineHeight:1.5 }}>
                    <i className="bi bi-info-circle me-1"/>Select your seats from the grid above — pricing is automatic
                  </p>
                </div>

                {/* Seat count */}
                <div style={{ marginBottom:16 }}>
                  <label className="fl">Number of Seats</label>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <button onClick={()=>{setSeats(Math.max(1,seats-1));setSelectedSeats([]);}} style={{ width:40,height:40,borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:18,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',cursor:'pointer' }}>−</button>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:22, flex:1, textAlign:'center', color:'var(--heading)' }}>{seats}</span>
                    <button onClick={()=>{setSeats(Math.min(10,seats+1));setSelectedSeats([]);}} style={{ width:40,height:40,borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:18,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',cursor:'pointer' }}>+</button>
                  </div>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>Then click {seats} seat{seats>1?'s':''} in the grid ↑</p>
                </div>

                {/* Selected seats */}
                {selectedSeats.length > 0 && (() => {
                  const seatMap = buildSeatMap(event.tiers);
                  return (
                    <div style={{ background:'rgba(5,255,155,0.06)', border:'1px solid rgba(5,255,155,0.2)', borderRadius:12, padding:12, marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#05FF9B', marginBottom:8, letterSpacing:1 }}>SELECTED SEATS</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {selectedSeats.map(s => {
                          const info = seatMap[s];
                          return (
                            <div key={s} style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(5,255,155,0.15)', color:'#05FF9B', border:'1px solid rgba(5,255,155,0.3)', display:'flex', alignItems:'center', gap:4 }}>
                              <span style={{ fontFamily:'monospace' }}>{info?.label||`#${s}`}</span>
                              <span style={{ fontSize:9, opacity:0.7 }}>({info?.tier})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Dynamic total from selected seats */}
                {selectedSeats.length > 0 && (
                  <div style={{ background:'var(--surface2)', borderRadius:12, padding:14, marginBottom:14, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', marginBottom:8, letterSpacing:1 }}>SEAT BREAKDOWN</div>
                    {(() => {
                      const seatMap = buildSeatMap(event.tiers);
                      return selectedSeats.map(sNum => {
                        const info = seatMap[sNum]||{label:`#${sNum}`,tier:'Unknown',price:0};
                        return (
                          <div key={sNum} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:4, gap:8 }}>
                            <span style={{ fontFamily:'monospace', fontWeight:700, color:'#05FF9B', minWidth:36 }}>{info.label}</span>
                            <span style={{ color:'var(--muted)', flex:1 }}>{info.tier}</span>
                            <span style={{ color:'var(--text)', fontWeight:600 }}>{info.price===0?'FREE':'₹'+info.price.toLocaleString()}</span>
                          </div>
                        );
                      });
                    })()}
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, borderTop:'1px solid var(--border)', paddingTop:8, marginTop:4 }}>
                      <span style={{ color:'var(--heading)' }}>Total</span>
                      <span style={{ color:cat.color, fontSize:16 }}>{getSelectedTotal()===0?'FREE':'₹'+getSelectedTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {bookingMsg && <p style={{ fontSize:12, color:'var(--pink)', marginBottom:12 }}>{bookingMsg}</p>}

                {isSoldOut ? (
                  <button onClick={async()=>{if(!user){navigate('/login');return;}try{await joinWaitlist(id);alert("Added to waitlist!");}catch(e){alert(e.response?.data?.message||'Already on waitlist');}}}
                    style={{ width:'100%', padding:'13px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:'rgba(255,64,129,0.1)', color:'var(--pink)', border:'1px solid rgba(255,64,129,0.25)', cursor:'pointer' }}>
                    <i className="bi bi-clock me-2"/>Join Waitlist
                  </button>
                ) : (
                  <button onClick={handleBook} disabled={bookingLoading}
                    style={{ width:'100%', padding:'13px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, color:'#000', border:'none', cursor:'pointer', opacity:bookingLoading?0.7:1, background:`linear-gradient(135deg,${cat.color},#9B51E0)`, boxShadow:`0 4px 20px ${cat.color}25` }}>
                    {bookingLoading
                      ? <><i className="bi bi-arrow-repeat me-2" style={{animation:'spin 0.7s linear infinite',display:'inline-block'}}/>Booking...</>
                      : <><i className="bi bi-lightning-charge me-2"/>Book Now{selectedSeats.length > 0 ? ` — ${selectedSeats.length} seat${selectedSeats.length>1?'s':''} selected` : ''}</>}
                  </button>
                )}

                {!user && <p style={{ fontSize:12, textAlign:'center', marginTop:10, color:'var(--muted)' }}>
                  <span onClick={()=>navigate('/login')} style={{ color:cat.color, cursor:'pointer', fontWeight:700 }}>Login</span> to book tickets
                </p>}

                <button onClick={openMap} style={{ width:'100%', marginTop:10, padding:'10px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, background:'var(--surface2)', color:'var(--pink)', border:'1px solid rgba(255,64,129,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <i className="bi bi-map-fill"/>View Venue on Google Maps
                </button>

                <div style={{ marginTop:12, borderRadius:12, padding:12, background:'rgba(5,255,155,0.04)', border:'1px solid rgba(5,255,155,0.12)' }}>
                  <div style={{ fontSize:11, color:'var(--mint)', fontWeight:700, marginBottom:4 }}>🎫 Instant Ticket</div>
                  <p style={{ fontSize:11, color:'var(--muted)', lineHeight:1.5 }}>Book confirmed → go to My Tickets to download your beautiful event ticket</p>
                </div>
              </div>
            </div>
          ) : (
            /* Organizer / Admin panel — manage, don't book */
            <div style={{ background:'var(--card-bg)', border:`1px solid ${cat.color}30`, borderRadius:20, overflow:'hidden', position: isMobile ? 'static' : 'sticky', top:86, width:'100%' }}>
              <div style={{ height:4, background:`linear-gradient(90deg,${cat.color},#9B51E0)` }}/>
              <div style={{ padding:24 }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.1rem', marginBottom:20, color:'var(--heading)', display:'flex', alignItems:'center', gap:8 }}>
                  <i className="bi bi-megaphone-fill" style={{ color:cat.color }}/>Organizer View
                </h3>

                {/* Seat fill stat */}
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'var(--muted)' }}>Seats Booked</span>
                    <span style={{ fontSize:13, fontWeight:800, color:cat.color }}>{event.bookedSeats} / {event.totalSeats}</span>
                  </div>
                  <div style={{ height:6, background:'var(--surface2)', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${Math.min(100,(event.bookedSeats/event.totalSeats)*100)}%`, background:`linear-gradient(90deg,${cat.color},#9B51E0)`, borderRadius:4, transition:'width 0.4s' }}/>
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ marginBottom:18, padding:'10px 14px', borderRadius:12, background: event.status==='approved' ? 'rgba(52,211,153,0.08)' : event.status==='pending' ? 'rgba(251,191,36,0.08)' : 'rgba(244,114,182,0.08)', border:`1px solid ${event.status==='approved' ? 'rgba(52,211,153,0.25)' : event.status==='pending' ? 'rgba(251,191,36,0.25)' : 'rgba(244,114,182,0.25)'}`, display:'flex', alignItems:'center', gap:8 }}>
                  <i className={`bi ${event.status==='approved'?'bi-check-circle-fill':event.status==='pending'?'bi-hourglass-split':'bi-x-circle-fill'}`}
                    style={{ color: event.status==='approved' ? 'var(--mint)' : event.status==='pending' ? 'var(--amber)' : 'var(--pink)' }}/>
                  <span style={{ fontSize:12, fontWeight:700, color: event.status==='approved' ? 'var(--mint)' : event.status==='pending' ? 'var(--amber)' : 'var(--pink)', textTransform:'capitalize' }}>
                    {event.status === 'approved' ? 'Live & accepting bookings' : event.status === 'pending' ? 'Awaiting admin approval' : 'Rejected'}
                  </span>
                </div>

                {/* Quick actions */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <button onClick={() => navigate('/org-dashboard')}
                    style={{ width:'100%', padding:'12px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:`linear-gradient(135deg,${cat.color},#9B51E0)`, color:'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <i className="bi bi-graph-up-arrow"/>View Bookings & Analytics
                  </button>
                  <button onClick={() => navigate('/scan-qr')}
                    style={{ width:'100%', padding:'12px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <i className="bi bi-qr-code-scan"/>Scan Tickets at Entry
                  </button>
                </div>

                <div style={{ marginTop:18, padding:'10px 12px', borderRadius:10, background:'var(--surface2)', fontSize:11, color:'var(--muted)', display:'flex', alignItems:'flex-start', gap:6 }}>
                  <i className="bi bi-info-circle" style={{ marginTop:1, flexShrink:0 }}/>
                  You're viewing this as the organizer — bookings and ratings are managed by attendees, not shown here.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}