import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const tierColors = ['#00F2FE','#9B51E0','#05FF9B','#FFB300','#FF4081'];

// ── Real Claude AI call ─────────────────────────────────────────
async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [form, setForm] = useState({ title:'', description:'', category:'Tech', date:'', time:'10:00 AM', venue:'', city:'', totalSeats:500, isFree:false, tags:'' });
  const [tiers, setTiers] = useState([{ name:'VIP', price:2999, seats:100 }, { name:'General', price:999, seats:400 }]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPhase, setAiPhase] = useState('');
  const [msg, setMsg] = useState('');

  const categories = ['Tech','Music','Sports','Food','Art','Business','Other'];

  // ── REAL AI SUGGEST ──────────────────────────────────────────
  const aiSuggest = async () => {
    setAiLoading(true);
    setAiPhase('Thinking...');
    try {
      const hints = [
        form.title && `title hint: "${form.title}"`,
        form.city && `city: ${form.city}`,
        form.date && `date: ${form.date}`,
        form.venue && `venue: ${form.venue}`,
      ].filter(Boolean).join(', ');

      setAiPhase('Generating event details...');

      const prompt = `You are an expert event planner for India. Generate creative, realistic event details for a ${form.category} event${hints ? ` with these hints: ${hints}` : ''}.

Return ONLY a JSON object (no markdown, no explanation):
{
  "title": "compelling event title (max 60 chars)",
  "description": "engaging 3-sentence description highlighting what attendees will experience, key speakers/performers, and what makes it unique",
  "time": "realistic start time like '10:00 AM' or '6:30 PM'",
  "totalSeats": <realistic number 100-5000>,
  "tags": "3-5 relevant comma-separated tags",
  "tiers": [
    {"name": "VIP", "price": <premium price in INR>, "seats": <10-20% of total>},
    {"name": "General", "price": <standard price in INR>, "seats": <remaining seats>}
  ]
}`;

      setAiPhase('Claude is writing your event...');
      const result = await callClaude(prompt);

      setForm(f => ({
        ...f,
        title: result.title || f.title,
        description: result.description || f.description,
        time: result.time || f.time,
        totalSeats: result.totalSeats || f.totalSeats,
        tags: result.tags || f.tags,
      }));

      if (result.tiers?.length && !form.isFree) {
        setTiers(result.tiers.map(t => ({ name: t.name, price: t.price, seats: t.seats })));
      }

      setAiPhase('✨ Done!');
      setTimeout(() => setAiPhase(''), 2000);
    } catch (err) {
      console.error('AI error:', err);
      setAiPhase('⚠ AI unavailable — using smart defaults');
      // Fallback to smart defaults if API fails
      const fallback = {
        Tech: { title: 'AI Innovation Summit 2026', description: 'Join 500+ tech leaders for two days of groundbreaking talks on artificial intelligence, cloud computing, and the future of software. Featuring live demos, workshops, and networking with industry pioneers.', time: '9:00 AM', totalSeats: 500, tags: 'AI, Cloud, Innovation, Networking', tiers: [{name:'VIP',price:4999,seats:50},{name:'General',price:1499,seats:450}] },
        Music: { title: 'Neon Nights Music Festival 2026', description: 'Experience 12 hours of electrifying performances from 20+ artists across 3 stages. From indie fusion to electronic beats, this festival promises an unforgettable night under the stars.', time: '5:00 PM', totalSeats: 3000, tags: 'Music, Festival, Live, Entertainment', tiers: [{name:'VIP',price:3999,seats:200},{name:'General',price:999,seats:2800}] },
        Sports: { title: 'City Championship 5K Run 2026', description: 'Lace up for the most exhilarating urban run through the heart of the city. Compete across 5K, 10K, and 21K categories with professional timing, finisher medals, and post-race celebrations.', time: '5:30 AM', totalSeats: 2000, tags: 'Sports, Running, Fitness, Marathon', tiers: [{name:'Elite',price:1999,seats:200},{name:'Standard',price:699,seats:1800}] },
        Food: { title: 'Grand Food Carnival 2026', description: 'Indulge in 150+ culinary delights from across India and the world. Watch celebrity chef showdowns, join cooking masterclasses, and vote for your favourite dish in the People\'s Choice Awards.', time: '11:00 AM', totalSeats: 5000, tags: 'Food, Culinary, Carnival, Culture', tiers: [{name:'Premium',price:999,seats:500},{name:'General',price:299,seats:4500}] },
        Art: { title: 'Digital Art Immersion 2026', description: 'Step into an 8,000 sq ft immersive installation where light, sound, and motion blur the line between art and reality. Interactive digital canvases, live painter sessions, and NFT art workshops await.', time: '10:00 AM', totalSeats: 800, tags: 'Art, Digital, NFT, Creative', tiers: [{name:'Premium',price:1499,seats:100},{name:'General',price:599,seats:700}] },
        Business: { title: 'Startup Pitch Wars 2026', description: 'The region\'s most competitive startup showcase returns. 50 startups, 20 top VCs, one grand prize of ₹50 lakhs. Join founders, investors, and mentors for two days of pitches, panels, and power networking.', time: '9:00 AM', totalSeats: 600, tags: 'Startup, VC, Business, Pitching', tiers: [{name:'VIP',price:5999,seats:50},{name:'General',price:1999,seats:550}] },
      };
      const s = fallback[form.category] || fallback.Tech;
      setForm(f => ({ ...f, title: s.title, description: s.description, time: s.time, totalSeats: s.totalSeats, tags: s.tags }));
      if (!form.isFree) setTiers(s.tiers);
      setTimeout(() => setAiPhase(''), 3000);
    }
    setAiLoading(false);
  };

  const addTier = () => setTiers(t => [...t, { name: `Tier ${t.length+1}`, price: 999, seats: 100 }]);
  const removeTier = (i) => setTiers(t => t.filter((_,idx) => idx !== i));
  const updateTier = (i, key, val) => setTiers(t => t.map((tier,idx) => idx===i ? {...tier,[key]:val} : tier));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role === 'attendee') { setMsg('Organizer account required'); return; }
    setLoading(true); setMsg('');
    try {
      const payload = {
        ...form,
        tiers: form.isFree ? [{ name:'Free Entry', price:0, seats:form.totalSeats }] : tiers,
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : [],
      };
      await createEvent(payload);
      setMsg('success');
      setTimeout(() => navigate('/org-dashboard'), 2200);
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Failed to create event'));
    } finally { setLoading(false); }
  };

  const isSuccess = msg === 'success';
  const isError = msg.startsWith('error:');

  return (
    <div className="fade-up" style={{ minHeight:'calc(100vh - 60px)', display:'flex' }}>
      {/* Sidebar */}
      <div className="sidebar hidden md:block">
        <div className="sbl" onClick={() => navigate('/org-dashboard')}><i className="bi bi-arrow-left"/>Back</div>
        <div className="sbl active"><i className="bi bi-plus-circle"/>Create Event</div>
        <div className="sbl" onClick={() => navigate('/scan-qr')}><i className="bi bi-qr-code-scan"/>Scan QR</div>
      </div>

      <div style={{ flex:1, minWidth:0, padding: isMobile ? '14px 12px' : '32px', overflowX:'hidden' }}>

        {/* Header */}
        <div className="pgh" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="bi bi-calendar-plus" style={{ color:'#000', fontSize:20 }}/>
            </div>
            <div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.3rem', color:'var(--heading)', marginBottom:2 }}>Create New Event</h2>
              <p style={{ fontSize:13, color:'var(--muted)' }}>Submit for admin approval · Goes live within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {isSuccess && (
          <div className="fade-up" style={{ marginBottom:20, padding:'16px 20px', borderRadius:14, background:'rgba(5,255,155,0.08)', border:'1px solid rgba(5,255,155,0.25)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28 }}>🎉</div>
            <div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color:'var(--mint)' }}>Event submitted successfully!</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Redirecting to your dashboard...</div>
            </div>
          </div>
        )}
        {isError && (
          <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:12, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.25)', color:'var(--pink)', fontSize:13 }}>
            <i className="bi bi-exclamation-circle-fill me-2"/>{msg.replace('error:','')}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap:20, alignItems:'start' }}>
          <form onSubmit={handleSubmit}>

            {/* ── AI SUGGEST BOX ── */}
            <div style={{ marginBottom:20, padding:20, borderRadius:16, background:'linear-gradient(135deg,rgba(155,81,224,0.06),rgba(0,242,254,0.06))', border:'1px solid rgba(155,81,224,0.2)', position:'relative', overflow:'hidden' }}>
              {/* Animated gradient border on loading */}
              {aiLoading && (
                <div style={{ position:'absolute', inset:0, borderRadius:16, background:'linear-gradient(90deg,rgba(0,242,254,0.15),rgba(155,81,224,0.15),rgba(5,255,155,0.15),rgba(0,242,254,0.15))', backgroundSize:'300% 100%', animation:'marqueeScroll 2s linear infinite', pointerEvents:'none' }}/>
              )}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, position:'relative' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#9B51E0,#00F2FE)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="bi bi-stars" style={{ color:'#fff', fontSize:14 }}/>
                    </div>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, color:'var(--purple)' }}>Claude AI Event Generator</span>
                    <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(5,255,155,0.1)', color:'var(--mint)', border:'1px solid rgba(5,255,155,0.2)' }}>LIVE</span>
                  </div>
                  <p style={{ fontSize:12, color:'var(--muted)', marginLeft:40 }}>
                    {aiPhase || `Claude writes your title, description, pricing & tags for ${form.category} events`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={aiSuggest}
                  disabled={aiLoading}
                  style={{ padding:'10px 20px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background: aiLoading ? 'var(--surface2)' : 'linear-gradient(135deg,#9B51E0,#00F2FE)', color: aiLoading ? 'var(--muted)' : '#fff', border:'none', cursor: aiLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.2s', flexShrink:0 }}
                >
                  {aiLoading
                    ? <><div style={{ width:14,height:14,border:'2px solid var(--muted)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>{aiPhase||'Generating...'}</>
                    : <><i className="bi bi-magic"/>AI Suggest</>
                  }
                </button>
              </div>
            </div>

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
                <div><label className="fl">Total Seats *</label><input type="number" className="fi" min="1" value={form.totalSeats} onChange={e=>setForm({...form,totalSeats:Number(e.target.value)})} required/></div>
                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <label className="fl">Tags (comma separated)</label>
                  <input className="fi" placeholder="AI, Workshop, Networking, 2026" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, padding:'12px 14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)' }}>
                <input type="checkbox" id="free" checked={form.isFree} onChange={e=>setForm({...form,isFree:e.target.checked})} style={{ accentColor:'var(--cyan)', width:16, height:16 }}/>
                <label htmlFor="free" style={{ fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
                  <strong style={{ color:'var(--mint)' }}>FREE event</strong> — no ticket pricing needed
                </label>
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
                {tiers.map((tier,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
                    <div style={{ width:3, height:40, borderRadius:4, background:tierColors[i%5], flexShrink:0 }}/>
                    <input className="fi" style={{ flex:1.5 }} placeholder="Tier name" value={tier.name} onChange={e=>updateTier(i,'name',e.target.value)}/>
                    <input type="number" className="fi" style={{ flex:1 }} placeholder="₹ Price" value={tier.price} onChange={e=>updateTier(i,'price',Number(e.target.value))}/>
                    <input type="number" className="fi" style={{ flex:1 }} placeholder="Seats" value={tier.seats} onChange={e=>updateTier(i,'seats',Number(e.target.value))}/>
                    {tiers.length > 1 && (
                      <button type="button" onClick={()=>removeTier(i)}
                        style={{ width:36, height:36, borderRadius:10, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.2)', color:'var(--pink)', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="bi bi-trash" style={{ fontSize:13 }}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading || isSuccess}
              style={{ width:'100%', padding:'14px', borderRadius:14, fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:14, background: isSuccess ? 'rgba(5,255,155,0.15)' : 'linear-gradient(135deg,#00F2FE,#9B51E0)', color: isSuccess ? 'var(--mint)' : '#000', border: isSuccess ? '1px solid rgba(5,255,155,0.3)' : 'none', cursor: loading||isSuccess ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition:'all 0.3s', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {loading
                ? <><div style={{ width:16,height:16,border:'2px solid rgba(0,0,0,0.3)',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>Submitting...</>
                : isSuccess
                ? <><i className="bi bi-check-circle-fill"/>Submitted! Redirecting...</>
                : <><i className="bi bi-send-check"/>Submit for Admin Approval</>
              }
            </button>
          </form>

          {/* ── LIVE PREVIEW ── */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top:80 }}>
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#00F2FE,#9B51E0,#05FF9B)' }}/>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Live Preview</div>

                <div style={{ background:'var(--surface2)', borderRadius:12, padding:14, marginBottom:14 }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:15, color:'var(--heading)', marginBottom:6, lineHeight:1.3 }}>{form.title||'Your Event Title'}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(0,242,254,0.1)', color:'#00F2FE' }}>{form.category}</span>
                    {form.isFree && <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(5,255,155,0.1)', color:'var(--mint)' }}>FREE</span>}
                  </div>
                </div>

                {form.date && <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:8 }}><i className="bi bi-calendar3" style={{ color:'#00F2FE' }}/>{new Date(form.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}
                {form.time && <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:8 }}><i className="bi bi-clock" style={{ color:'#9B51E0' }}/>{form.time}</div>}
                {form.venue && <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:14 }}><i className="bi bi-geo-alt" style={{ color:'#FF4081' }}/>{form.venue}{form.city && `, ${form.city}`}</div>}

                {(form.isFree ? [{name:'Free Entry',price:0}] : tiers).map((t,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, background:'var(--bg)', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}>{t.name}</span>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, color:'#00F2FE' }}>{t.price===0?'FREE':'₹'+t.price.toLocaleString()}</span>
                  </div>
                ))}

                <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'rgba(255,179,0,0.06)', border:'1px solid rgba(255,179,0,0.15)', fontSize:11, color:'var(--amber)', display:'flex', alignItems:'center', gap:6 }}>
                  <i className="bi bi-shield-check"/>Requires admin approval before going live
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
