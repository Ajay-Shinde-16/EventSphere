import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEvents } from '../services/api';

const CAT_COLOR = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'#8892A4' };

function Countdown({ date }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(date) - Date.now();
      if (diff <= 0) return setT({ expired:true });
      setT({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) });
    };
    calc(); const id = setInterval(calc,1000); return ()=>clearInterval(id);
  },[date]);
  if (t.expired) return <span style={{fontSize:11,color:'var(--pink)',fontWeight:700}}>Ended</span>;
  return (
    <div style={{display:'flex',gap:4}}>
      {[['d',t.d],['h',t.h],['m',t.m],['s',t.s]].map(([l,v])=>(
        <div key={l} style={{background:'rgba(0,0,0,0.25)',borderRadius:6,padding:'3px 6px',minWidth:32,textAlign:'center'}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:12,color:'var(--cyan)',lineHeight:1}}>{String(v||0).padStart(2,'0')}</div>
          <div style={{fontSize:8,color:'var(--muted)',textTransform:'uppercase'}}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ ev, featured, onClick }) {
  const booked = ev.bookedSeats||0, total = ev.totalSeats||1;
  const pct = Math.round((booked/total)*100);
  const col = CAT_COLOR[ev.category]||'#8892A4';
  const [hovered, setHovered] = useState(false);
  return (
    <div className='card-hover rounded-2xl overflow-hidden'
      style={{ background:'var(--card-bg)', border:`1px solid ${hovered?col+'44':'var(--border)'}`, cursor:'pointer', transition:'all 0.25s', boxShadow: hovered?`var(--shadow),0 0 20px ${col}18`:'var(--shadow)' }}
      onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      <div style={{ height:3, background:`linear-gradient(90deg,${col},transparent)` }}/>
      <div style={{ padding:20 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:`${col}18`, color:col }}>{ev.category}</span>
          {ev.isFree&&<span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(5,255,155,0.12)',color:'var(--mint)' }}>FREE</span>}
          {booked>=total&&<span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:'rgba(255,64,129,0.12)',color:'var(--pink)' }}>SOLD OUT</span>}
        </div>
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'1rem',marginBottom:8,lineHeight:1.3,color:'var(--heading)' }}>{ev.title}</h3>
        
        <div style={{ display:'flex',flexWrap:'wrap',gap:10,marginBottom:10,fontSize:12,color:'var(--muted)' }}>
          <span style={{ display:'flex',alignItems:'center',gap:4 }}><i className="bi bi-calendar3" style={{ color:'var(--cyan)' }}/>{new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
          <span style={{ display:'flex',alignItems:'center',gap:4 }}><i className="bi bi-clock" style={{ color:'var(--purple)' }}/>{ev.time}</span>
          <span style={{ display:'flex',alignItems:'center',gap:4 }}><i className="bi bi-geo-alt" style={{ color:'var(--pink)' }}/>{ev.city}</span>
        </div>
        <div style={{ marginBottom:10 }}><Countdown date={ev.date}/></div>
        <div style={{ height:3,background:'var(--surface2)',borderRadius:4,marginBottom:10 }}>
          <div style={{ height:'100%',width:`${pct}%`,background:pct>=90?'var(--pink)':pct>=70?'var(--amber)':'var(--mint)',borderRadius:4 }}/>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:'0.95rem',color:ev.isFree?'var(--mint)':'var(--cyan)' }}>
            {ev.isFree?'Free':`₹${(ev.tiers?.[0]?.price||0).toLocaleString()}+`}
          </span>
          {ev.rating?.average>0&&<span style={{ fontSize:11,color:'var(--amber)',display:'flex',alignItems:'center',gap:3 }}><i className="bi bi-star-fill"/>{Number(ev.rating.average).toFixed(1)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function EventsBrowse() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [city, setCity]         = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search')||'';
    if (q) setSearch(q);
    fetchEvents(q);
  }, [category, city]);

  const fetchEvents = async (q='') => {
    setLoading(true);
    try {
      const params = {};
      if (category!=='all') params.category=category;
      if (city) params.city=city;
      if (q||search) params.search=q||search;
      const { data } = await getEvents(params);
      setEvents(data.events||[]);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const doSearch = () => fetchEvents(search);

  const cats = [
    {key:'all',label:'All Events'},{key:'Tech',dot:'#00F2FE'},{key:'Music',dot:'#9B51E0'},
    {key:'Sports',dot:'#05FF9B'},{key:'Food',dot:'#FFB300'},{key:'Art',dot:'#FF4081'},{key:'Business',dot:'#4FC3F7'},
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Page header */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'28px 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto' }}>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.8rem', color:'var(--heading)', marginBottom:6 }}>
            Browse Events
          </h1>
          <p style={{ color:'var(--muted)', fontSize:14, marginBottom:20 }}>Discover concerts, conferences, food fests & more across India</p>
          {/* Search */}
          <div style={{ display:'flex', gap:10, maxWidth:600 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 16px' }}>
              <i className="bi bi-search" style={{ color:'var(--muted)', flexShrink:0 }}/>
              <input style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:'var(--text)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                placeholder="Search events, cities, categories..."
                value={search} onChange={e=>setSearch(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doSearch()}
              />
            </div>
            <button onClick={doSearch}
              style={{ padding:'10px 22px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:66, zIndex:40 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:10, overflowX:'auto', scrollbarWidth:'none', paddingTop:10, paddingBottom:10 }}>
          {cats.map(c=>(
            <button key={c.key} className={`cat-pill ${category===c.key?'active':''}`} onClick={()=>setCategory(c.key)}>
              {c.dot&&<span style={{ width:6,height:6,borderRadius:'50%',background:c.dot }}/>}{c.label||c.key}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <select style={{ fontSize:12, background:'transparent', border:'none', outline:'none', cursor:'pointer', color:'var(--muted)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}
              value={city} onChange={e=>setCity(e.target.value)}>
              <option value="">All Cities</option>
              {['Bangalore','Mumbai','Hyderabad','Pune','Delhi','Chennai'].map(c=><option key={c}>{c}</option>)}
            </select>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--muted)', whiteSpace:'nowrap' }}>{events.length} events</span>
          </div>
        </div>
      </div>

      {/* Events grid */}
      <div style={{ background:'var(--surface2)', minHeight:400, paddingBottom:40 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <div style={{ width:44,height:44,borderRadius:'50%',border:'3px solid var(--surface2)',borderTopColor:'var(--cyan)',animation:'spin 0.8s linear infinite',margin:'0 auto 16px' }}/>
            <p style={{ color:'var(--muted)', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>Loading events...</p>
          </div>
        ) : events.length===0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px' }}>
            <i className="bi bi-calendar-x" style={{ fontSize:48,color:'var(--muted)',display:'block',marginBottom:16 }}/>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,color:'var(--heading)',marginBottom:8 }}>No events found</p>
            <p style={{ color:'var(--muted)',fontSize:13 }}>Try different filters or search terms</p>
          </div>
        ) : (
          <div className="fade-up" style={{ maxWidth:1400, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20, padding:'24px 24px 48px' }}>
            {events.map((ev)=><EventCard key={ev._id} ev={ev} featured={false} onClick={()=>navigate(`/events/${ev._id}`)}/>)}
          </div>
        )}
      </div>
    </div>
  );
}