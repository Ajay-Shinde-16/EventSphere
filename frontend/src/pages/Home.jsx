import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { getEvents, getMyBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ══════════════════════════════════════════════════════════════
   ATTENDEE DASHBOARD
══════════════════════════════════════════════════════════════ */
function AttendeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [bookings, setBookings] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const CAT_COLOR = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'var(--muted)' };

  useEffect(() => {
    Promise.all([
      getMyBookings().then(r=>setBookings(r.data)).catch(()=>{}),
      getEvents().then(r=>setEvents(r.data.events||[])).catch(()=>{}),
    ]).finally(()=>setLoading(false));
  }, []);

  const upcoming    = bookings.filter(b=>b.status==='confirmed'&&new Date(b.event?.date)>new Date()).slice(0,3);
  const recommended = events.filter(e=>!bookings.find(b=>b.event?._id===e._id)).slice(0,4);
  const initials    = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'U';

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px 14px 24px' : '28px 24px' }}>

      {/* Welcome banner */}
      <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding: isMobile ? '18px 16px' : '28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,var(--cyan),var(--purple),var(--mint))' }}/>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,242,254,0.05),transparent 70%)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', position:'relative' }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:20, color:'#fff', flexShrink:0 }}>{initials}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.5rem', color:'var(--heading)' }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</div>
            <div style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>Ready to discover your next event?</div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={()=>navigate('/my-tickets')}
              style={{ padding:'10px 20px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'var(--surface2)', color:'var(--cyan)', border:'1px solid rgba(0,242,254,0.2)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-ticket-perforated"/>My Tickets ({bookings.length})
            </button>
            <button onClick={()=>navigate('/events-browse')}
              style={{ padding:'10px 20px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-search"/>Browse Events
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:28 }}>
        {[
          { icon:'bi-ticket-perforated-fill', val:bookings.length, label:'Total Bookings',  color:'var(--cyan)'   },
          { icon:'bi-check-circle-fill',      val:bookings.filter(b=>b.status==='confirmed').length, label:'Confirmed', color:'var(--mint)' },
          { icon:'bi-calendar-event-fill',    val:upcoming.length, label:'Upcoming',         color:'var(--purple)' },
          { icon:'bi-lightning-charge-fill',  val:events.length,   label:'Events Available', color:'var(--amber)'  },
        ].map((s,i)=>(
          <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${s.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:18 }}/>
            </div>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.4rem', color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'var(--heading)', display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-calendar-check" style={{ color:'var(--mint)' }}/>Upcoming Events
            </h2>
            <button onClick={()=>navigate('/my-tickets')} style={{ fontSize:12, color:'var(--cyan)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>View All →</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {upcoming.map(bk => {
              const col = CAT_COLOR[bk.event?.category]||'var(--muted)';
              return (
                <div key={bk._id} onClick={()=>navigate('/my-tickets')}
                  className="card-hover"
                  style={{ background:'var(--card-bg)', border:`1px solid ${col}25`, borderRadius:16, padding:20, cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${col},transparent)` }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'0.95rem', color:'var(--heading)', marginBottom:4 }}>{bk.event?.title}</div>
                      <div style={{ fontFamily:'monospace', fontSize:11, color:col, letterSpacing:1 }}>{bk.bookingCode}</div>
                    </div>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(5,255,155,0.12)', color:'var(--mint)', flexShrink:0 }}>confirmed</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:12, color:'var(--muted)' }}>
                    <span><i className="bi bi-calendar3" style={{ color:'var(--cyan)', marginRight:4 }}/>{bk.event?.date?new Date(bk.event.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'-'}</span>
                    <span><i className="bi bi-clock" style={{ color:'var(--purple)', marginRight:4 }}/>{bk.event?.time||'-'}</span>
                    <span><i className="bi bi-geo-alt" style={{ color:'var(--pink)', marginRight:4 }}/>{bk.event?.city||'-'}</span>
                    <span><i className="bi bi-grid" style={{ color:'var(--mint)', marginRight:4 }}/>{bk.tier} ×{bk.seats}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'var(--heading)', display:'flex', alignItems:'center', gap:8 }}>
            <i className="bi bi-stars" style={{ color:'var(--amber)' }}/>Recommended For You
          </h2>
          <button onClick={()=>navigate('/events-browse')} style={{ fontSize:12, color:'var(--cyan)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>View All →</button>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid var(--surface2)',borderTopColor:'var(--cyan)',animation:'spin 0.8s linear infinite',margin:'0 auto' }}/></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {recommended.map(ev => {
              const col = CAT_COLOR[ev.category]||'var(--muted)';
              return (
                <div key={ev._id} className="card-hover" onClick={()=>navigate(`/events/${ev._id}`)}
                  style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', cursor:'pointer' }}>
                  <div style={{ height:3, background:`linear-gradient(90deg,${col},transparent)` }}/>
                  <div style={{ padding:18 }}>
                    <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                      <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:`${col}18`,color:col }}>{ev.category}</span>
                      {ev.isFree&&<span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(5,255,155,0.12)',color:'var(--mint)' }}>FREE</span>}
                    </div>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--heading)',marginBottom:8,lineHeight:1.3 }}>{ev.title}</div>
                    <div style={{ display:'flex',gap:10,fontSize:12,color:'var(--muted)',marginBottom:10,flexWrap:'wrap' }}>
                      <span><i className="bi bi-calendar3" style={{ color:'var(--cyan)',marginRight:4 }}/>{new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                      <span><i className="bi bi-geo-alt" style={{ color:'var(--pink)',marginRight:4 }}/>{ev.city}</span>
                    </div>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.9rem',color:ev.isFree?'var(--mint)':'var(--cyan)' }}>
                      {ev.isFree?'Free':`₹${(ev.tiers?.[0]?.price||0).toLocaleString()}+`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ORGANIZER REDIRECT
══════════════════════════════════════════════════════════════ */
function AdminRedirect() {
  const navigate = useNavigate();
  useEffect(()=>{ navigate('/admin'); },[navigate]);
  return null;
}

function OrganizerRedirect() {
  const navigate = useNavigate();
  useEffect(()=>{ navigate('/org-dashboard'); },[navigate]);
  return null;
}


/* ── Animated sliding hero text (SkillBridge style) ─────────── */
function HeroSlider() {
  const phrases = [
    'Discover Events That Inspire You',
    'Book Your Seat in Seconds',
    'From VIP to General — Pick Your Spot',
    'Real QR Tickets, Instant Entry',
    'Concerts, Conferences & Everything Between',
    'Your Next Experience Starts Here',
    '500+ Events Across India',
    'Scan. Enter. Enjoy — No Printing Needed',
    'Host Events. Sell Tickets. Track Everything.',
    "India's Smartest Event Platform",
    'Turn Any Moment Into a Memory',
    'Where Every Event Feels Effortless',
    'One Platform. Infinite Experiences.',
    'Skip the Queue. Just Scan & Walk In.',
    'Tickets Delivered to Your Inbox Instantly',
    'Choose Your Seat. Own Your Moment.',
    'From Bangalore to Mumbai — Events Everywhere',
    'Organise Smarter. Sell Faster. Grow Bigger.',
    'Live Music, Tech Talks & So Much More',
    'Trusted by Thousands of Event-Goers',
    'Your Weekend Plans, Sorted.',
    'Smart Ticketing for the Modern Attendee',
  ];
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % phrases.length);
        setAnimating(false);
      }, 400);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display:'inline-block', overflow:'hidden', verticalAlign:'bottom' }}>
      <span style={{
        display:'inline-block',
        background:'linear-gradient(135deg,#38BDF8,#A78BFA)',
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        transform: animating ? 'translateY(-100%)' : 'translateY(0)',
        opacity: animating ? 0 : 1,
        transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {phrases[current]}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC HOME — Aurora Glass UI (Unique Design)
══════════════════════════════════════════════════════════════ */
function PublicHome() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [liveCount, setLiveCount] = useState(10247);

  useEffect(() => {
    const id = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3)), 4000);
    return () => clearInterval(id);
  }, []);

  const FEATURES = [
    { icon:'bi-qr-code-scan',     color:'var(--cyan)',   title:'Real QR Tickets',       desc:'Camera-scannable. No printing ever needed.' },
    { icon:'bi-grid-3x3-gap',     color:'var(--purple)', title:'Visual Seat Selection',  desc:'Pick your exact seat from an interactive grid.' },
    { icon:'bi-stars',            color:'var(--mint)',   title:'Claude AI Powered',      desc:'Real AI writes event content & finds your next event.' },
    { icon:'bi-graph-up-arrow',   color:'var(--amber)',  title:'Live Analytics',         desc:'Real-time charts for organizers via Chart.js.' },
    { icon:'bi-envelope-check',   color:'var(--pink)',   title:'Instant Email Tickets',  desc:'QR code delivered to inbox the moment you book.' },
    { icon:'bi-award-fill',       color:'var(--sky)',    title:'Attendance Certs',       desc:'Auto-generated certificates, downloadable instantly.' },
    { icon:'bi-camera-video',     color:'var(--indigo)', title:'Camera QR Scanner',      desc:'Webcam-powered check-in for event organisers.' },
    { icon:'bi-bell-fill',        color:'var(--cyan)',   title:'Waitlist Alerts',        desc:'Auto email when a seat opens on sold-out events.' },
  ];

  const STEPS = [
    { n:'01', icon:'bi-person-plus-fill', color:'var(--cyan)',   title:'Create Account',  desc:'Register free as Attendee or Organizer in 60 seconds.' },
    { n:'02', icon:'bi-search',           color:'var(--purple)', title:'Browse Events',   desc:'Find 500+ events by city, category, or keyword.' },
    { n:'03', icon:'bi-grid-3x3-gap',     color:'var(--mint)',   title:'Pick Your Seat',  desc:'Select your exact seat on an interactive grid.' },
    { n:'04', icon:'bi-qr-code-scan',     color:'var(--amber)',  title:'Scan & Enter',    desc:'Your QR ticket arrives by email instantly. Just scan.' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', position:'relative', overflow:'hidden' }}>

      {/* Aurora background */}
      <div className="aurora-bg"/>

      {/* ── HERO ── */}
      <section style={{ padding: isMobile ? '52px 16px 48px' : '88px 24px 72px', textAlign:'center', position:'relative', overflow:'hidden', zIndex:1, background:'radial-gradient(ellipse at 70% -10%,rgba(155,81,224,0.07),transparent 55%),radial-gradient(ellipse at 20% 100%,rgba(0,242,254,0.05),transparent 50%)' }}>
        <div style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto' }}>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:50, fontSize:12, fontWeight:700, background:'rgba(0,242,254,0.08)', border:'1px solid rgba(0,242,254,0.2)', color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif", marginBottom:28 }}>
            <span className="pulse-dot" style={{ width:8, height:8, borderRadius:'50%', background:'var(--mint)', display:'inline-block' }}/>
            500+ Live Events · India's Smartest Ticketing Platform
          </div>

          {/* Hero headline — exact original style: HeroSlider + "at EventSphere" */}
          <h1 className="font-grotesk" style={{ fontWeight:900, lineHeight:1.2, fontSize: isMobile ? '1.7rem' : 'clamp(1.8rem,5vw,3.4rem)', marginBottom:20, color:'var(--heading)' }}>
            <HeroSlider/><br/>
            <span style={{ color:'var(--heading)', fontWeight:900 }}>at EventSphere</span>
          </h1>

          <p style={{ color:'var(--muted)', maxWidth:500, margin:'0 auto 40px', fontSize:'1.05rem', lineHeight:1.7 }}>
            Real QR tickets, interactive seat grids, AI suggestions, and instant email delivery — all in one platform.
          </p>

          {/* CTA buttons — exact original style */}
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>navigate('/register')}
              style={{ padding:'14px 32px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer', boxShadow:'0 6px 28px rgba(0,242,254,0.28)', transition:'all 0.3s', display:'flex', alignItems:'center', gap:8 }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <i className="bi bi-person-plus"/>Join as Attendee
            </button>
            <button onClick={()=>navigate('/register')}
              style={{ padding:'14px 32px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15, background:'transparent', color:'var(--text)', border:'2px solid var(--border)', cursor:'pointer', transition:'all 0.3s', display:'flex', alignItems:'center', gap:8 }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--purple)'; e.currentTarget.style.color='var(--purple)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'; }}>
              <i className="bi bi-megaphone"/>Host an Event
            </button>
          </div>

          {/* Floating event preview chips */}
          {!isMobile && (
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:48, flexWrap:'wrap' }}>
              {[{cat:'Tech',t:'AI Summit 2026',c:'#38BDF8'},{cat:'Music',t:'Neon Nights Fest',c:'#A78BFA'},{cat:'Sports',t:'City Marathon',c:'#34D399'},{cat:'Food',t:'Grand Food Carnival',c:'#FBBF24'}].map((e,i)=>(
                <div key={i} onClick={()=>navigate('/events-browse')} className="card-hover"
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:50, background:'var(--surface)', border:`1px solid ${e.c}25`, cursor:'pointer', animation:`fadeUp ${0.5+i*0.1}s ease` }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:e.c, flexShrink:0 }}/>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{e.t}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:e.c }}>{e.cat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── STATS BAR — Unique frosted glass style ── */}
      <section style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 24px', display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, paddingTop: isMobile ? 28 : 40, paddingBottom:48 }}>
          {[
            { val:'500+',                     label:'Live Events',       icon:'bi-calendar-event-fill', color:'var(--cyan)'   },
            { val:liveCount.toLocaleString(), label:'Attendees Served',  icon:'bi-people-fill',         color:'var(--purple)' },
            { val:'50+',                      label:'Cities Covered',    icon:'bi-geo-alt-fill',        color:'var(--mint)'   },
            { val:'100%',                     label:'Digital Tickets',   icon:'bi-qr-code-scan',        color:'var(--amber)'  },
          ].map((s,i)=>(
            <div key={i} className="glass card-hover" style={{ borderRadius:18, padding:'22px 20px', textAlign:'center', border:'1px solid var(--border)' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${s.color}12`, border:`1px solid ${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:18 }}/>
              </div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'clamp(1.5rem,3vw,2rem)', color:s.color, lineHeight:1, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:12, color:'var(--muted)', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES — Unique bento layout ── */}
      <section style={{ padding: isMobile ? '48px 16px' : '80px 24px', background:'var(--bg2)', position:'relative', zIndex:1, borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', borderRadius:50, fontSize:11, fontWeight:700, color:'var(--purple)', background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', marginBottom:16, fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:2 }}>
              <i className="bi bi-stars"/>Production-grade features
            </div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--heading)', lineHeight:1.2 }}>
              Why <span className="grad">EventSphere?</span>
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
            {FEATURES.map((f,i)=>(
              <div key={i} className="stat-card card-hover holo-card" style={{ borderRadius:18 }}>
                <div style={{ width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, background:`${f.color}12`, border:`1px solid ${f.color}20`, flexShrink:0 }}>
                  <i className={`bi ${f.icon}`} style={{ color:f.color, fontSize:18 }}/>
                </div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'0.88rem', marginBottom:6, color:'var(--heading)' }}>{f.title}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--muted)', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Unique horizontal timeline ── */}
      <section style={{ padding: isMobile ? '56px 16px' : '96px 24px', background:'var(--bg)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 16px', borderRadius:50, fontSize:11, fontWeight:700, color:'var(--cyan)', background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', marginBottom:16, fontFamily:"'Space Grotesk',sans-serif", textTransform:'uppercase', letterSpacing:2 }}>
              <i className="bi bi-lightning-charge-fill"/>Simple 4-step process
            </div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'var(--heading)', lineHeight:1.2 }}>
              How It <span className="grad2">Works</span>
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:16, position:'relative' }}>
            {/* Connector line (desktop only) */}
            {!isMobile && !isTablet && (
              <div style={{ position:'absolute', top:'40px', left:'15%', right:'15%', height:2, background:'linear-gradient(90deg,var(--cyan),var(--purple),var(--mint),var(--amber))', opacity:0.15, zIndex:0 }}/>
            )}
            {STEPS.map((s,i)=>(
              <div key={i} className="card-hover" style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:22, padding:'32px 22px', textAlign:'center', position:'relative', zIndex:1, transition:'all 0.25s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=s.color+'60'; e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,0.3), 0 0 24px ${s.color}18`; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}>
                {/* Step number badge */}
                <div style={{ position:'absolute', top:16, right:16, fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:10, color:`${s.color}60`, letterSpacing:2 }}>{s.n}</div>
                <div style={{ width:70, height:70, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', background:`${s.color}10`, border:`2px solid ${s.color}25`, transition:'all 0.25s' }}>
                  <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:28 }}/>
                </div>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.05rem', color:'var(--heading)', marginBottom:10 }}>{s.title}</h3>
                <p style={{ color:'var(--muted)', fontSize:'0.83rem', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER — Unique gradient mesh ── */}
      <section style={{ position:'relative', overflow:'hidden', zIndex:1, borderTop:'1px solid var(--border)' }}>
        <div style={{ padding: isMobile ? '64px 16px' : '96px 24px', textAlign:'center', position:'relative', background:'linear-gradient(180deg,var(--bg2),var(--bg))' }}>
          {/* Decorative blobs */}
          <div style={{ position:'absolute', top:'50%', left:'10%', transform:'translateY(-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.05),transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'50%', right:'10%', transform:'translateY(-50%)', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(167,139,250,0.06),transparent 70%)', pointerEvents:'none' }}/>

          <div style={{ position:'relative', maxWidth:600, margin:'0 auto' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:16 }}>🚀</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.5rem)', color:'var(--heading)', marginBottom:18, lineHeight:1.2 }}>
              Ready to <span className="grad">elevate</span> your event experience?
            </h2>
            <p style={{ color:'var(--muted)', marginBottom:40, fontSize:'1rem', lineHeight:1.8 }}>
              Join thousands of attendees and organizers on EventSphere — India's smartest ticketing platform.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={()=>navigate('/register')} className="btn-neon"
                style={{ padding: isMobile ? '13px 28px' : '15px 40px', fontSize: isMobile ? 14 : 15 }}>
                <i className="bi bi-person-plus" style={{ marginRight:8 }}/>Get Started Free
              </button>
              <button onClick={()=>navigate('/events-browse')}
                style={{ padding: isMobile ? '13px 28px' : '15px 36px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize: isMobile ? 14 : 15, background:'transparent', color:'var(--text)', border:'1.5px solid var(--border)', cursor:'pointer', transition:'all 0.3s', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.color='var(--cyan)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'; }}>
                <i className="bi bi-calendar-event"/>Browse Events
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', padding: isMobile ? '24px 16px' : '32px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="bi bi-calendar-event" style={{ color:'#000', fontSize:14 }}/>
            </div>
            <span className="grad2 font-grotesk" style={{ fontWeight:900, fontSize:15 }}>EventSphere</span>
          </div>
          <p style={{ color:'var(--muted)', fontSize:12 }}>© 2026 EventSphere · PGCP AC, C-DAC Bangalore · Built by Ajay Shinde</p>
          <div style={{ display:'flex', gap:10 }}>
            {[{i:'bi-shield-check',t:'/admin-login',c:'var(--pink)'},{i:'bi-calendar-event',t:'/events-browse',c:'var(--cyan)'},{i:'bi-person-plus',t:'/register',c:'var(--purple)'}].map((l,i)=>(
              <button key={i} onClick={()=>navigate(l.t)}
                style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${l.c}10`,border:`1px solid ${l.c}20`,color:l.c,cursor:'pointer',fontSize:14,transition:'all 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background=`${l.c}20`}
                onMouseLeave={e=>e.currentTarget.style.background=`${l.c}10`}>
                <i className={`bi ${l.i}`}/>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════════
   MAIN ROUTER BY ROLE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
  if (!user) return <PublicHome/>;
  if (user.role === 'admin')     return <AdminRedirect/>;
  if (user.role === 'organizer') return <OrganizerRedirect/>;
  return <AttendeeDashboard/>;
}