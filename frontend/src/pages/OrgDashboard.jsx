import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { getMyEvents, getEventBookings, deleteEvent, broadcastToAttendees } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const statusColor = { approved:'#05FF9B', pending:'#FFB300', rejected:'#FF4081' };
const CC = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'var(--muted)' };

/* ── CSV Export ─────────────────────────────────────────────── */
function exportCSV(events, allBookings) {
  const rows = [['Event','Category','Date','City','Attendee','Email','Seat','Tier','Amount','Status','Booking Code']];
  allBookings.forEach(bk => {
    rows.push([
      bk.event?.title || '',
      bk.event?.category || '',
      bk.event?.date ? new Date(bk.event.date).toLocaleDateString('en-IN') : '',
      bk.event?.city || '',
      bk.user?.name || '',
      bk.user?.email || '',
      (bk.seatNumbers||[]).join('|') || '',
      bk.tier || '',
      bk.totalAmount || 0,
      bk.status || '',
      bk.bookingCode || '',
    ]);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `EventSphere_Bookings_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

/* ── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ active }) {
  const navigate = useNavigate();
  const items = [
    { id:'orgdash', icon:'bi-speedometer2',  label:'Dashboard',   path:'/org-dashboard' },
    { id:'create',  icon:'bi-plus-circle',   label:'Create Event', path:'/create-event'  },
    { id:'scan',    icon:'bi-qr-code-scan',  label:'QR Check-in', path:'/scan-qr'        },
  ];
  return (
    <div className="sidebar hidden md:block">
      <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 8px',paddingBottom:16,marginBottom:16,borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#00F2FE,#9B51E0)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <i className="bi bi-speedometer2" style={{ color:'#000',fontSize:12 }}/>
        </div>
        <div>
          <div className="font-grotesk grad2" style={{ fontWeight:900,fontSize:13,lineHeight:1 }}>EventSphere</div>
          <div style={{ color:'var(--muted)',fontSize:10,marginTop:2 }}>Organizer Panel</div>
        </div>
      </div>
      <p style={{ fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:2,padding:'0 12px',marginBottom:8 }}>Menu</p>
      {items.map(item=>(
        <div key={item.id} className={`sbl ${active===item.id?'active':''}`} onClick={()=>navigate(item.path)}>
          <i className={`bi ${item.icon}`}/>{item.label}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
/* ── Broadcast Message Modal ───────────────────────────────────
   Lets an organizer send one email + in-app notification to every
   confirmed attendee of a specific event (venue change, schedule
   update, cancellation notice, etc.) ──────────────────────────── */
function BroadcastModal({ event, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { count } | { error }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true); setResult(null);
    try {
      const { data } = await broadcastToAttendees(event._id, { subject, message });
      setResult({ count: data.count });
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Failed to send message.' });
    } finally { setSending(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:480, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,var(--amber),var(--purple))' }}/>
        <div style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.05rem', color:'var(--heading)', display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-megaphone-fill" style={{ color:'var(--amber)' }}/>Message Attendees
            </h3>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 }}>✕</button>
          </div>
          <p style={{ fontSize:12, color:'var(--muted)', marginBottom:18 }}>Emails everyone with a confirmed ticket for <strong style={{ color:'var(--text)' }}>{event.title}</strong></p>

          {result?.count !== undefined ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize:36, color:'var(--mint)', display:'block', marginBottom:10 }}/>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'var(--mint)', marginBottom:4 }}>Message sent!</div>
              <p style={{ fontSize:12, color:'var(--muted)' }}>Delivering to {result.count} attendee{result.count>1?'s':''} in the background.</p>
              <button onClick={onClose} style={{ marginTop:16, padding:'9px 22px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}>Close</button>
            </div>
          ) : (
            <>
              {result?.error && (
                <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:10, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.25)', color:'var(--pink)', fontSize:12 }}>
                  <i className="bi bi-exclamation-circle-fill me-2"/>{result.error}
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label className="fl">Subject</label>
                <input className="fi" placeholder="e.g. Venue Change Notice" value={subject} onChange={e=>setSubject(e.target.value)} maxLength={100}/>
              </div>
              <div style={{ marginBottom:18 }}>
                <label className="fl">Message</label>
                <textarea className="fta" placeholder="Write your update here — e.g. 'Due to weather, the venue has changed to...'" value={message} onChange={e=>setMessage(e.target.value)} style={{ minHeight:120 }} maxLength={2000}/>
              </div>
              <button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}
                style={{ width:'100%', padding:'12px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background: sending||!subject.trim()||!message.trim() ? 'var(--surface2)' : 'linear-gradient(135deg,var(--amber),var(--purple))', color: sending||!subject.trim()||!message.trim() ? 'var(--muted)' : '#000', border:'none', cursor: sending||!subject.trim()||!message.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {sending
                  ? <><div style={{ width:14,height:14,border:'2px solid rgba(0,0,0,0.3)',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>Sending...</>
                  : <><i className="bi bi-send-fill"/>Send to All Attendees</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrgDashboard() {
  const [events, setEvents]       = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [msgModalEvent, setMsgModalEvent] = useState(null); // event being messaged, or null
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!user || user.role === 'attendee') { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const { data } = await getMyEvents();
      setEvents(data);
      // Fetch bookings for all events
      const bookingArrays = await Promise.all(
        data.map(ev => getEventBookings(ev._id).then(r=>r.data).catch(()=>[]))
      );
      setAllBookings(bookingArrays.flat());
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents(ev => ev.filter(e => e._id !== id));
    } catch (err) { alert(err.response?.data?.message||'Failed'); }
  };

  // Stats
  const totalRevenue  = allBookings.filter(b=>b.status==='confirmed').reduce((s,b)=>s+(b.totalAmount||0),0);
  const confirmedBk   = allBookings.filter(b=>b.status==='confirmed').length;
  const liveEvents    = events.filter(e=>e.status==='approved').length;
  const pendingEvents = events.filter(e=>e.status==='pending').length;

  // Chart data
  // Chart.js draws on a <canvas>, which cannot resolve CSS var() references
  // the way DOM elements can — passing 'var(--muted)' directly causes it to
  // silently fall back to black text. This reads the actual computed value
  // of each CSS variable so chart text always matches the current theme.
  const cssVar = (name, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || fallback;
  };
  const mutedColor = cssVar('--muted', '#94A3B8');
  const gridColor  = 'rgba(148,163,184,0.12)';

  const chartOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ labels:{ color:mutedColor, font:{ family:"'Space Grotesk',sans-serif", size:11 } } },
      tooltip:{
        backgroundColor:'rgba(15,18,28,0.96)',
        titleColor:'#fff',
        bodyColor:'#fff',
        borderColor:'rgba(255,255,255,0.15)',
        borderWidth:1,
        padding:10,
        titleFont:{ family:"'Space Grotesk',sans-serif", weight:'700' },
        bodyFont:{ family:"'Space Grotesk',sans-serif" },
      },
    },
    scales:{
      x:{ ticks:{ color:mutedColor, font:{ size:10 } }, grid:{ color:gridColor } },
      y:{ ticks:{ color:mutedColor, font:{ size:10 } }, grid:{ color:gridColor } },
    }
  };
  const doughnutOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ position:'right', labels:{ color:mutedColor, font:{ family:"'Space Grotesk',sans-serif", size:11 }, padding:12 } },
      tooltip:{
        backgroundColor:'rgba(15,18,28,0.96)',
        titleColor:'#fff',
        bodyColor:'#fff',
        borderColor:'rgba(255,255,255,0.15)',
        borderWidth:1,
        padding:10,
        titleFont:{ family:"'Space Grotesk',sans-serif", weight:'700' },
        bodyFont:{ family:"'Space Grotesk',sans-serif" },
      },
    }
  };

  // Bar chart — bookings per event
  const barData = {
    labels: events.slice(0,8).map(e=>e.title.substring(0,16)+'...'),
    datasets:[{
      label:'Bookings',
      data: events.slice(0,8).map(e=>e.bookedSeats||0),
      backgroundColor: events.slice(0,8).map(e=>`${CC[e.category]||'var(--muted)'}88`),
      borderColor:     events.slice(0,8).map(e=>CC[e.category]||'var(--muted)'),
      borderWidth:2, borderRadius:6,
    }]
  };

  // Doughnut — category breakdown
  const catCounts = events.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+1; return acc; },{});
  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets:[{
      data: Object.values(catCounts),
      backgroundColor: Object.keys(catCounts).map(c=>`${CC[c]||'var(--muted)'}99`),
      borderColor:     Object.keys(catCounts).map(c=>CC[c]||'var(--muted)'),
      borderWidth:2,
    }]
  };

  // Line chart — cumulative revenue (last 6 months)
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth()-5+i);
    return { label:d.toLocaleString('en-IN',{month:'short'}), month:d.getMonth(), year:d.getFullYear() };
  });
  const revenueByMonth = months.map(m =>
    allBookings.filter(b=>{
      const d=new Date(b.createdAt);
      return d.getMonth()===m.month && d.getFullYear()===m.year && b.status==='confirmed';
    }).reduce((s,b)=>s+(b.totalAmount||0),0)
  );
  const lineData = {
    labels: months.map(m=>m.label),
    datasets:[{
      label:'Revenue (₹)',
      data: revenueByMonth,
      borderColor:'#00F2FE', backgroundColor:'rgba(0,242,254,0.08)',
      borderWidth:2, pointBackgroundColor:'#00F2FE', pointRadius:4, fill:true, tension:0.4,
    }]
  };

  const tabs = ['overview','events','analytics'];

  if (loading) return (
    <div style={{textAlign:'center',padding:'80px'}}>
      <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid var(--surface2)',borderTopColor:'var(--cyan)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
    </div>
  );

  return (
    <div className="flex fade-up" style={{ minHeight:'calc(100vh - 60px)', width:'100%', maxWidth:'100vw', overflowX:'hidden' }}>
      {msgModalEvent && <BroadcastModal event={msgModalEvent} onClose={() => setMsgModalEvent(null)} />}
      <Sidebar active="orgdash"/>

      <div style={{ flex:1, padding: isMobile ? '14px 16px' : '24px', minWidth:0, maxWidth:'100%' }}>

        {/* Header */}
        <div className="pgh" style={{ marginBottom:24 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12 }}>
            <div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1.3rem',color:'var(--heading)',marginBottom:4 }}>
                Welcome, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p style={{ color:'var(--muted)',fontSize:13 }}>Manage events · Track bookings · View analytics</p>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>exportCSV(events,allBookings)}
                style={{ padding:'9px 18px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,background:'rgba(5,255,155,0.1)',color:'var(--mint)',border:'1px solid rgba(5,255,155,0.25)',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                <i className="bi bi-download"/>Export CSV
              </button>
              <button onClick={()=>navigate('/create-event')}
                style={{ padding:'9px 18px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,background:'linear-gradient(135deg,#00F2FE,#9B51E0)',color:'#000',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                <i className="bi bi-plus-circle"/>Create Event
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:24,maxWidth:'100%' }}>
          {[
            { n:events.length,           l:'Total Events',    color:'var(--cyan)',   icon:'bi-calendar-event' },
            { n:liveEvents,              l:'Live Events',     color:'var(--mint)',   icon:'bi-lightning-charge' },
            { n:pendingEvents,           l:'Pending',         color:'var(--amber)',  icon:'bi-clock' },
            { n:confirmedBk,             l:'Total Bookings',  color:'var(--purple)', icon:'bi-ticket-perforated' },
            { n:`₹${totalRevenue.toLocaleString()}`, l:'Revenue', color:'var(--pink)', icon:'bi-currency-rupee' },
          ].map((s,i)=>(
            <div key={i} className="stat-card" style={{ textAlign:'center' }}>
              <i className={`bi ${s.icon}`} style={{ color:s.color,fontSize:22,display:'block',marginBottom:8 }}/>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1.3rem',color:s.color,lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:11,color:'var(--muted)',marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:6,marginBottom:20,background:'var(--surface2)',padding:4,borderRadius:14,width:'fit-content' }}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              style={{ padding:'8px 20px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,cursor:'pointer',border:'none',transition:'all 0.2s',
                background:activeTab===t?'var(--surface)':'transparent',
                color:activeTab===t?'var(--cyan)':'var(--muted)',
                boxShadow:activeTab===t?'var(--shadow)':'none' }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab==='overview' && (
          <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:20,maxWidth:'100%' }}>

            {/* Bookings bar chart */}
            <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,minWidth:0,overflow:'hidden' }}>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--cyan)',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                <i className="bi bi-bar-chart"/>Bookings per Event
              </h3>
              <div style={{ height:220, width:'100%', position:'relative' }}>
                {events.length > 0
                  ? <Bar data={barData} options={{...chartOpts, plugins:{...chartOpts.plugins, legend:{display:false}}}}/>
                  : <div style={{textAlign:'center',padding:60,color:'var(--muted)',fontSize:13}}>No events yet</div>}
              </div>
            </div>

            {/* Category doughnut */}
            <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,minWidth:0,overflow:'hidden' }}>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--purple)',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                <i className="bi bi-pie-chart"/>Events by Category
              </h3>
              <div style={{ height:220, width:'100%', position:'relative' }}>
                {events.length > 0
                  ? <Doughnut data={doughnutData} options={doughnutOpts}/>
                  : <div style={{textAlign:'center',padding:60,color:'var(--muted)',fontSize:13}}>No events yet</div>}
              </div>
            </div>

            {/* Revenue line chart */}
            <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,gridColumn: isMobile ? 'auto' : 'span 2',minWidth:0,overflow:'hidden' }}>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--mint)',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                <i className="bi bi-graph-up-arrow"/>Revenue — Last 6 Months
              </h3>
              <div style={{ height:200, width:'100%', position:'relative' }}>
                <Line data={lineData} options={{...chartOpts, plugins:{...chartOpts.plugins, legend:{display:false}}}}/>
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {activeTab==='events' && (
          <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:'var(--cyan)',display:'flex',alignItems:'center',gap:8 }}>
                <i className="bi bi-calendar-event"/>My Events ({events.length})
              </span>
              <button onClick={()=>navigate('/create-event')}
                style={{ padding:'7px 16px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:'linear-gradient(135deg,#00F2FE,#9B51E0)',color:'#000',border:'none',cursor:'pointer' }}>
                + New Event
              </button>
            </div>
            {events.length===0 ? (
              <div style={{ textAlign:'center',padding:60 }}>
                <i className="bi bi-calendar-x" style={{ fontSize:40,color:'var(--muted)',display:'block',marginBottom:12 }}/>
                <p style={{ color:'var(--muted)',marginBottom:16 }}>No events yet</p>
                <button onClick={()=>navigate('/create-event')} style={{ padding:'10px 24px',borderRadius:12,fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,background:'linear-gradient(135deg,#00F2FE,#9B51E0)',color:'#000',border:'none',cursor:'pointer' }}>Create First Event</button>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead><tr><th>Event</th><th>Date</th><th>City</th><th>Bookings</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {events.map(ev=>{
                      const pct=Math.round(((ev.bookedSeats||0)/ev.totalSeats)*100);
                      const rev=allBookings.filter(b=>b.event?._id===ev._id&&b.status==='confirmed').reduce((s,b)=>s+(b.totalAmount||0),0);
                      return (
                        <tr key={ev._id}>
                          <td>
                            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,color:'var(--heading)' }}>{ev.title}</div>
                            <span style={{ padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,background:`${CC[ev.category]||'var(--muted)'}15`,color:CC[ev.category]||'var(--muted)',marginTop:3,display:'inline-block' }}>{ev.category}</span>
                          </td>
                          <td style={{ color:'var(--muted)',fontSize:12 }}>{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ color:'var(--muted)',fontSize:12 }}>{ev.city}</td>
                          <td>
                            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,color:'var(--text)' }}>{ev.bookedSeats||0}/{ev.totalSeats}</div>
                            <div style={{ height:3,background:'var(--surface2)',borderRadius:4,width:80,marginTop:4 }}>
                              <div style={{ height:'100%',width:`${pct}%`,background:'var(--cyan)',borderRadius:4 }}/>
                            </div>
                          </td>
                          <td style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,color:'var(--mint)' }}>₹{rev.toLocaleString()}</td>
                          <td>
                            <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:`${statusColor[ev.status]}15`,color:statusColor[ev.status] }}>{ev.status}</span>
                          </td>
                          <td>
                            <div style={{ display:'flex',gap:6 }}>
                              <button onClick={()=>navigate(`/events/${ev._id}`)}
                                style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:'var(--surface2)',color:'var(--text)',border:'1px solid var(--border)',cursor:'pointer' }}>View</button>
                              <button onClick={()=>navigate(`/edit-event/${ev._id}`)}
                                style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:'rgba(155,81,224,0.08)',color:'var(--purple)',border:'1px solid rgba(155,81,224,0.2)',cursor:'pointer' }}>Edit</button>
                              <button onClick={()=>setMsgModalEvent(ev)}
                                style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:'rgba(251,191,36,0.08)',color:'var(--amber)',border:'1px solid rgba(251,191,36,0.2)',cursor:'pointer' }}>Message</button>
                              <button onClick={()=>navigate('/scan-qr')}
                                style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:'rgba(0,242,254,0.08)',color:'var(--cyan)',border:'1px solid rgba(0,242,254,0.2)',cursor:'pointer' }}>Scan</button>
                              <button onClick={()=>handleDelete(ev._id)}
                                style={{ padding:'4px 10px',borderRadius:8,fontSize:11,fontWeight:700,background:'rgba(255,64,129,0.08)',color:'var(--pink)',border:'1px solid rgba(255,64,129,0.2)',cursor:'pointer' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab==='analytics' && (
          <div style={{ display:'grid',gap:20 }}>

            {/* Top stats cards */}
            <div style={{ display:'grid',gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(200px,1fr))',gap:14,maxWidth:'100%' }}>
              {[
                { label:'Avg Bookings/Event', val: events.length ? Math.round((events.reduce((s,e)=>s+(e.bookedSeats||0),0)/events.length)) : 0, color:'var(--cyan)', icon:'bi-people' },
                { label:'Total Revenue',      val:`₹${totalRevenue.toLocaleString()}`, color:'var(--mint)', icon:'bi-currency-rupee' },
                { label:'Sell-through Rate',  val:`${events.length?Math.round((events.reduce((s,e)=>s+(e.bookedSeats||0),0)/events.reduce((s,e)=>s+e.totalSeats,0)*100)):0}%`, color:'var(--purple)', icon:'bi-percent' },
                { label:'Cancelled Bookings', val:allBookings.filter(b=>b.status==='cancelled').length, color:'var(--pink)', icon:'bi-x-circle' },
              ].map((s,i)=>(
                <div key={i} style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:16,padding:20 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:`${s.color}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <i className={`bi ${s.icon}`} style={{ color:s.color,fontSize:16 }}/>
                    </div>
                    <span style={{ fontSize:12,color:'var(--muted)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:'1.6rem',color:s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Full bar chart */}
            <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,minWidth:0,overflow:'hidden' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--cyan)',display:'flex',alignItems:'center',gap:8 }}>
                  <i className="bi bi-bar-chart"/>Bookings per Event
                </h3>
                <button onClick={()=>exportCSV(events,allBookings)}
                  style={{ padding:'7px 14px',borderRadius:10,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:11,background:'rgba(5,255,155,0.08)',color:'var(--mint)',border:'1px solid rgba(5,255,155,0.2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                  <i className="bi bi-download"/>Export CSV
                </button>
              </div>
              <div style={{ height:280, width:'100%', position:'relative' }}>
                {events.length>0
                  ? <Bar data={barData} options={{...chartOpts,plugins:{...chartOpts.plugins,legend:{display:false}}}}/>
                  : <div style={{textAlign:'center',padding:80,color:'var(--muted)'}}>No data yet</div>}
              </div>
            </div>

            {/* Line + Doughnut side by side */}
            <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',gap:20,maxWidth:'100%' }}>
              <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,minWidth:0,overflow:'hidden' }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--mint)',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                  <i className="bi bi-graph-up"/>Revenue Trend (6 months)
                </h3>
                <div style={{ height:220, width:'100%', position:'relative' }}>
                  <Line data={lineData} options={{...chartOpts,plugins:{...chartOpts.plugins,legend:{display:false}}}}/>
                </div>
              </div>
              <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,padding:24,minWidth:0,overflow:'hidden' }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:'var(--purple)',marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                  <i className="bi bi-pie-chart"/>Categories
                </h3>
                <div style={{ height:220, width:'100%', position:'relative' }}>
                  {events.length>0
                    ? <Doughnut data={doughnutData} options={{...doughnutOpts,plugins:{...doughnutOpts.plugins,legend:{position:'bottom',labels:{...doughnutOpts.plugins.legend.labels,padding:8}}}}}/>
                    : <div style={{textAlign:'center',padding:60,color:'var(--muted)'}}>No data</div>}
                </div>
              </div>
            </div>

            {/* Top events table */}
            <div style={{ background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:20,overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:13,color:'var(--amber)',display:'flex',alignItems:'center',gap:8 }}>
                  <i className="bi bi-trophy"/>Top Performing Events
                </span>
              </div>
              <table>
                <thead><tr><th>Event</th><th>Bookings</th><th>Fill Rate</th><th>Revenue</th></tr></thead>
                <tbody>
                  {[...events].sort((a,b)=>(b.bookedSeats||0)-(a.bookedSeats||0)).slice(0,5).map(ev=>{
                    const pct=Math.round(((ev.bookedSeats||0)/ev.totalSeats)*100);
                    const rev=allBookings.filter(b=>b.event?._id===ev._id&&b.status==='confirmed').reduce((s,b)=>s+(b.totalAmount||0),0);
                    return (
                      <tr key={ev._id}>
                        <td style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,color:'var(--heading)' }}>{ev.title}</td>
                        <td style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'var(--cyan)' }}>{ev.bookedSeats||0}</td>
                        <td>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <div style={{ flex:1,height:4,background:'var(--surface2)',borderRadius:4 }}>
                              <div style={{ height:'100%',width:`${pct}%`,background:pct>=80?'var(--mint)':pct>=50?'var(--amber)':'var(--cyan)',borderRadius:4 }}/>
                            </div>
                            <span style={{ fontSize:11,color:'var(--muted)',minWidth:30 }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'var(--mint)' }}>₹{rev.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}