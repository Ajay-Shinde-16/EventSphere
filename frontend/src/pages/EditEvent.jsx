import { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, updateEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const tierColors = ['#00F2FE','#9B51E0','#05FF9B','#FFB300','#FF4081'];

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [form, setForm] = useState(null); // null until loaded
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadEvent(); }, [id]);

  const loadEvent = async () => {
    try {
      const { data } = await getEvent(id);
      if (data.organizer?._id !== user?._id && user?.role !== 'admin') {
        navigate('/org-dashboard'); return;
      }
      setForm({
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Tech',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
        time: data.time || '10:00 AM',
        venue: data.venue || '',
        city: data.city || '',
        totalSeats: data.totalSeats || 0,
        isFree: data.isFree || false,
        tags: (data.tags || []).join(', '),
      });
      setTiers(data.isFree ? [] : (data.tiers?.length ? data.tiers.map(t => ({ name:t.name, price:t.price, seats:t.seats, bookedSeats:t.bookedSeats||0 })) : [{ name:'General', price:0, seats:0, bookedSeats:0 }]));
    } catch {
      navigate('/org-dashboard');
    } finally { setPageLoading(false); }
  };

  // Auto-update Total Seats whenever any tier's seat count changes
  useEffect(() => {
    if (!form || form.isFree) return;
    const sum = tiers.reduce((acc, t) => acc + (Number(t.seats) || 0), 0);
    setForm(f => (f.totalSeats === sum ? f : { ...f, totalSeats: sum }));
  }, [tiers, form?.isFree]);

  const categories = ['Tech','Music','Sports','Food','Art','Business','Other'];

  const addTier = () => setTiers(t => [...t, { name: `Tier ${t.length+1}`, price: 999, seats: 100, bookedSeats: 0 }]);
  const removeTier = (i) => setTiers(t => t.filter((_,idx) => idx !== i));
  const updateTier = (i, key, val) => setTiers(t => t.map((tier,idx) => idx===i ? {...tier,[key]:val} : tier));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      // Guard: don't let a tier's seat total drop below seats already booked,
      // since that would corrupt existing bookings' validity.
      if (!form.isFree) {
        const violatesBooked = tiers.find(t => Number(t.seats) < Number(t.bookedSeats || 0));
        if (violatesBooked) {
          setMsg(`error:Tier "${violatesBooked.name}" has ${violatesBooked.bookedSeats} seats already booked — you can't reduce it below that.`);
          setLoading(false);
          return;
        }
      }
      const payload = {
        ...form,
        tiers: form.isFree ? [{ name:'Free Entry', price:0, seats:form.totalSeats }] : tiers.map(({bookedSeats, ...t}) => t),
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      };
      await updateEvent(id, payload);
      setMsg('success');
      setTimeout(() => navigate('/org-dashboard'), 1800);
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Failed to update event'));
    } finally { setLoading(false); }
  };

  const isSuccess = msg === 'success';
  const isError = msg.startsWith('error:');

  if (pageLoading || !form) {
    return (
      <div style={{ textAlign:'center', padding:'100px 20px' }}>
        <div style={{ width:40, height:40, border:'3px solid var(--surface2)', borderTopColor:'var(--cyan)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ minHeight:'calc(100vh - 60px)', display:'flex' }}>
      {/* Sidebar */}
      <div className="sidebar hidden md:block">
        <div className="sbl" onClick={() => navigate('/org-dashboard')}><i className="bi bi-arrow-left"/>Back</div>
        <div className="sbl active"><i className="bi bi-pencil-square"/>Edit Event</div>
        <div className="sbl" onClick={() => navigate('/scan-qr')}><i className="bi bi-qr-code-scan"/>Scan QR</div>
      </div>

      <div style={{ flex:1, minWidth:0, padding: isMobile ? '14px 12px' : '32px', overflowX:'hidden' }}>

        {/* Header */}
        <div className="pgh" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="bi bi-pencil-square" style={{ color:'#000', fontSize:20 }}/>
            </div>
            <div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.3rem', color:'var(--heading)', marginBottom:2 }}>Edit Event</h2>
              <p style={{ fontSize:13, color:'var(--muted)' }}>Changes are saved immediately — no re-approval needed</p>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {isSuccess && (
          <div className="fade-up" style={{ marginBottom:20, padding:'16px 20px', borderRadius:14, background:'rgba(5,255,155,0.08)', border:'1px solid rgba(5,255,155,0.25)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28 }}>✅</div>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'var(--mint)' }}>Event updated successfully!</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Redirecting to your dashboard...</div>
            </div>
          </div>
        )}
        {isError && (
          <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:12, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.25)', color:'var(--pink)', fontSize:13 }}>
            <i className="bi bi-exclamation-circle-fill me-2"/>{msg.replace('error:','')}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth:760 }}>

          {/* ── BASIC INFO ── */}
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--cyan)', letterSpacing:2, textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
              <i className="bi bi-info-circle"/>Basic Information
            </div>

            <div style={{ marginBottom:14 }}>
              <label className="fl">Event Title *</label>
              <input className="fi" placeholder="Give your event a compelling title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="fl">Description *</label>
              <textarea className="fta" placeholder="Describe your event — what will attendees experience?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required style={{ minHeight:100 }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
              <div><label className="fl">Date *</label><input type="date" className="fi" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div>
              <div><label className="fl">Time *</label><input className="fi" placeholder="10:00 AM" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
              <div><label className="fl">Venue *</label><input className="fi" placeholder="Venue or hall name" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} required/></div>
              <div><label className="fl">City *</label><input className="fi" placeholder="Bangalore, Mumbai..." value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required/></div>
              <div>
                <label className="fl">Category *</label>
                <select className="fs" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {categories.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="fl">Total Seats * {!form.isFree && <span style={{ color:'var(--cyan)', fontWeight:600, textTransform:'none', letterSpacing:0 }}>(auto from tiers)</span>}</label>
                <input type="number" className="fi" min="1" value={form.totalSeats}
                  readOnly={!form.isFree}
                  onChange={e=>form.isFree && setForm({...form,totalSeats:Number(e.target.value)})}
                  style={!form.isFree ? { cursor:'not-allowed', opacity:0.75 } : undefined}
                  required/>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label className="fl">Tags (comma separated)</label>
                <input className="fi" placeholder="AI, Workshop, Networking, 2026" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
              </div>
            </div>
          </div>

          {/* ── TICKET TIERS ── */}
          {!form.isFree && (
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--purple)', letterSpacing:2, textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
                  <i className="bi bi-ticket-perforated"/>Ticket Tiers
                </div>
                <button type="button" onClick={addTier}
                  style={{ padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--cyan)', cursor:'pointer' }}>
                  + Add Tier
                </button>
              </div>
              <p style={{ fontSize:11, color:'var(--muted)', marginBottom:14 }}>
                <i className="bi bi-info-circle me-1"/>Seats already booked per tier are protected — you can't reduce below that number.
              </p>
              {tiers.map((tier,i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems: isMobile ? 'flex-start' : 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width:3, height: isMobile ? 'auto' : 40, alignSelf: isMobile ? 'stretch' : 'auto', borderRadius:4, background:tierColors[i%5], flexShrink:0 }}/>
                  <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:10, flex:1, minWidth:0 }}>
                    <input className="fi" style={{ flex: isMobile ? 'unset' : 1.5, width: isMobile ? '100%' : undefined }} placeholder="Tier name" value={tier.name} onChange={e=>updateTier(i,'name',e.target.value)}/>
                    <div style={{ display:'flex', gap:10 }}>
                      <input type="number" className="fi" style={{ flex:1 }} placeholder="₹ Price" value={tier.price} onChange={e=>updateTier(i,'price',Number(e.target.value))}/>
                      <input type="number" className="fi" style={{ flex:1 }} placeholder="Seats" value={tier.seats} min={tier.bookedSeats||0} onChange={e=>updateTier(i,'seats',Number(e.target.value))}/>
                    </div>
                  </div>
                  {tier.bookedSeats > 0 && (
                    <span style={{ fontSize:10, color:'var(--amber)', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>{tier.bookedSeats} booked</span>
                  )}
                  {tiers.length > 1 && (
                    <button type="button" onClick={()=>removeTier(i)} aria-label={`Remove ${tier.name || 'tier'}`}
                      style={{ width:36, height:36, borderRadius:10, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.2)', color:'var(--pink)', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="bi bi-trash" style={{ fontSize:13 }}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:12 }}>
            <button type="button" onClick={() => navigate('/org-dashboard')}
              style={{ padding:'14px 24px', borderRadius:14, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || isSuccess}
              style={{ flex:1, padding:'14px', borderRadius:14, fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:14, background: isSuccess ? 'rgba(5,255,155,0.15)' : 'linear-gradient(135deg,#00F2FE,#9B51E0)', color: isSuccess ? 'var(--mint)' : '#000', border: isSuccess ? '1px solid rgba(5,255,155,0.3)' : 'none', cursor: loading||isSuccess ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition:'all 0.3s', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {loading
                ? <><div style={{ width:16,height:16,border:'2px solid rgba(0,0,0,0.3)',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>Saving...</>
                : isSuccess
                ? <><i className="bi bi-check-circle-fill"/>Saved! Redirecting...</>
                : <><i className="bi bi-save"/>Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}