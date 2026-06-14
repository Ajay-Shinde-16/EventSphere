import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, getMyBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ══════════════════════════════════════════════════════════════
   ATTENDEE DASHBOARD
══════════════════════════════════════════════════════════════ */
function AttendeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>

      {/* Welcome banner */}
      <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:28 }}>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
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
  useEffect(()=>{ navigate('/admin'); },[]);
  return null;
}

function OrganizerRedirect() {
  const navigate = useNavigate();
  useEffect(()=>{ navigate('/org-dashboard'); },[]);
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
   PUBLIC HOME  (SkillBridge style)
══════════════════════════════════════════════════════════════ */
function PublicHome() {
  const navigate    = useNavigate();
  const [liveCount, setLiveCount] = useState(10247);

  useEffect(() => {
    const id = setInterval(()=>setLiveCount(c=>c+Math.floor(Math.random()*3)),4000);
    return ()=>clearInterval(id);
  },[]);

  const STEPS = [
    { n:'01', icon:'bi-person-plus-fill', color:'var(--cyan)',   title:'Create Account',  desc:'Register free as Attendee or Organizer in under 60 seconds.' },
    { n:'02', icon:'bi-search',           color:'var(--purple)', title:'Browse Events',   desc:'Discover 500+ events by city, category or keyword.' },
    { n:'03', icon:'bi-credit-card-fill', color:'var(--mint)',   title:'Book Your Seat',  desc:'Pick your seat & book instantly. VIP, General — your choice.' },
    { n:'04', icon:'bi-qr-code-scan',     color:'var(--amber)',  title:'Scan & Enjoy',    desc:'Show QR at the gate. No printing needed — ever.' },
  ];

  const FEATURES = [
    { icon:'bi-qr-code-scan',     color:'var(--cyan)',   title:'Real QR Tickets',    desc:'Scannable by any phone camera' },
    { icon:'bi-grid-3x3-gap',     color:'var(--purple)', title:'Seat Selection',     desc:'Pick your exact seat on visual grid' },
    { icon:'bi-lightning-charge', color:'var(--mint)',   title:'AI Suggestions',     desc:'Claude-powered event intelligence' },
    { icon:'bi-graph-up-arrow',   color:'var(--amber)',  title:'Live Analytics',     desc:'Chart.js organizer dashboards' },
    { icon:'bi-envelope-check',   color:'var(--pink)',   title:'Email Tickets',      desc:'QR code delivered to your inbox' },
    { icon:'bi-award-fill',       color:'var(--sky)',    title:'Certificates',       desc:'Auto-generated attendance certs' },
    { icon:'bi-camera-video',     color:'var(--cyan)',   title:'Camera Scanner',     desc:'Webcam QR check-in for organizers' },
    { icon:'bi-shield-check',     color:'var(--purple)', title:'Secure Auth',        desc:'JWT + bcrypt role-based access' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── HERO ── */}
      <section style={{ padding:'88px 24px 72px', textAlign:'center', position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 70% -10%,rgba(155,81,224,0.07),transparent 55%),radial-gradient(ellipse at 20% 100%,rgba(0,242,254,0.05),transparent 50%)' }}>
        <div style={{ position:'relative', zIndex:1, maxWidth:760, margin:'0 auto' }}>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:50, fontSize:12, fontWeight:700, background:'rgba(0,242,254,0.08)', border:'1px solid rgba(0,242,254,0.2)', color:'var(--cyan)', fontFamily:"'Space Grotesk',sans-serif", marginBottom:28 }}>
            <span className="pulse-dot" style={{ width:8, height:8, borderRadius:'50%', background:'var(--mint)', display:'inline-block' }}/>
            500+ Live Events · India's Smartest Ticketing Platform
          </div>

          <h1 className="font-grotesk" style={{ fontWeight:900, lineHeight:1.2, fontSize:'clamp(1.8rem,5vw,3.4rem)', marginBottom:20, color:'var(--heading)' }}>
            <HeroSlider /><br/>
            <span style={{ color:'var(--heading)', fontWeight:900 }}>at EventSphere</span>
          </h1>

          <p style={{ color:'var(--muted)', maxWidth:500, margin:'0 auto 40px', fontSize:'1.05rem', lineHeight:1.7 }}>
            Real QR tickets, interactive seat grids, AI suggestions, and instant email delivery — all in one platform.
          </p>

          {/* CTA buttons — SkillBridge style */}
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
        </div>

        {/* Connecting line (desktop) */}
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:1, height:40, background:'linear-gradient(to bottom,transparent,var(--border))' }}/>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'28px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:0 }}>
          {[
            { val:'500+',                    label:'Events Available',  icon:'bi-calendar-event', color:'var(--cyan)'   },
            { val:liveCount.toLocaleString(), label:'Attendees Served', icon:'bi-people-fill',    color:'var(--purple)' },
            { val:'50+',                     label:'Cities Covered',   icon:'bi-geo-alt-fill',   color:'var(--mint)'   },
            { val:'100%',                    label:'QR Tickets',       icon:'bi-qr-code-scan',   color:'var(--amber)'  },
          ].map((s,i,arr)=>(
            <div key={i} style={{ textAlign:'center', padding:'20px 16px', borderRight:i<arr.length-1?'1px solid var(--border)':'none' }}>
              <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:24, display:'block', marginBottom:8 }}/>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.8rem', color:s.color, lineHeight:1, marginBottom:4 }}>{s.val}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'72px 24px', background:'var(--surface2)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:3, fontFamily:"'Space Grotesk',sans-serif", marginBottom:10 }}>Production-grade features</p>
            <h2 className="font-grotesk" style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.4rem)', color:'var(--heading)', marginBottom:12 }}>
              Why <span className="grad">EventSphere?</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
            {FEATURES.map((f,i)=>(
              <div key={i} className="stat-card card-hover">
                <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, background:`${f.color}15`, border:`1px solid ${f.color}25` }}>
                  <i className={`bi ${f.icon}`} style={{ color:f.color, fontSize:18 }}/>
                </div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'0.9rem', marginBottom:6, color:'var(--heading)' }}>{f.title}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--muted)', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'80px 24px', background:'var(--bg)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--cyan)', textTransform:'uppercase', letterSpacing:3, fontFamily:"'Space Grotesk',sans-serif", marginBottom:10 }}>Simple 4-step process</p>
            <h2 className="font-grotesk" style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.4rem)', color:'var(--heading)', marginBottom:12 }}>How It Works</h2>
            <p style={{ color:'var(--muted)', maxWidth:440, margin:'0 auto', fontSize:'0.95rem', lineHeight:1.7 }}>From signup to scanning your ticket at the gate — EventSphere makes it effortless.</p>
          </div>

          {/* Connector line */}
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', top:38, left:'10%', right:'10%', height:2, background:`linear-gradient(90deg,var(--cyan),var(--purple),var(--mint),var(--amber))`, opacity:0.2, zIndex:0 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20, position:'relative', zIndex:1 }}>
              {STEPS.map((s,i)=>(
                <div key={i} className="card-hover" style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 24px', textAlign:'center', boxShadow:'var(--shadow)' }}>
                  <div style={{ width:68, height:68, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', background:`${s.color}15`, border:`2px solid ${s.color}30` }}>
                    <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:26 }}/>
                  </div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:10, color:s.color, letterSpacing:3, marginBottom:8, textTransform:'uppercase' }}>STEP {s.n}</div>
                  <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--heading)', marginBottom:10 }}>{s.title}</h3>
                  <p style={{ color:'var(--muted)', fontSize:'0.83rem', lineHeight:1.7 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding:'80px 24px', textAlign:'center', background:'var(--bg)', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <h2 className="font-grotesk" style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', color:'var(--heading)', marginBottom:16 }}>
            Ready to find your next event?
          </h2>
          <p style={{ color:'var(--muted)', marginBottom:36, fontSize:'1rem', lineHeight:1.7 }}>
            Join thousands of attendees and organizers on EventSphere.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>navigate('/register')}
              style={{ padding:'14px 36px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer', boxShadow:'0 6px 28px rgba(0,242,254,0.25)', transition:'all 0.3s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <i className="bi bi-person-plus me-2"/>Join as Attendee
            </button>
            <button onClick={()=>navigate('/events-browse')}
              style={{ padding:'14px 32px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15, background:'transparent', color:'var(--text)', border:'2px solid var(--border)', cursor:'pointer', transition:'all 0.3s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.color='var(--cyan)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'; }}>
              <i className="bi bi-calendar-event me-2"/>Browse Events
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', padding:'28px 24px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="bi bi-calendar-event" style={{ color:'#000', fontSize:13 }}/>
          </div>
          <span className="grad2 font-grotesk" style={{ fontWeight:900, fontSize:15 }}>EventSphere</span>
        </div>
        <p style={{ color:'var(--muted)', fontSize:12 }}>© 2026 EventSphere — PGCP AC, C-DAC Bangalore &nbsp;·&nbsp; Built by Ajay Shinde</p>
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