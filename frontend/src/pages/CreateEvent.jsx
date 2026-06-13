import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const tierColors = ['#00F2FE','#9B51E0','#05FF9B','#FFB300','#FF4081'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title:'', description:'', category:'Tech', date:'', time:'10:00 AM', venue:'', city:'', totalSeats:500, isFree:false, tags:'' });
  const [tiers, setTiers] = useState([{ name:'VIP', price:2999, seats:100 }, { name:'General', price:999, seats:400 }]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const categories = ['Tech','Music','Sports','Food','Art','Business','Other'];

  const aiSuggest = async () => {
    setAiLoading(true);
    // Simulate AI suggestions with category-based fallbacks
    await new Promise(r => setTimeout(r, 1500));
    const suggestions = {
      Tech: { title: 'AI & Blockchain Summit 2026', desc: 'An immersive two-day conference exploring the convergence of artificial intelligence, blockchain technology, and the future of decentralized applications. Featuring keynotes from industry leaders and hands-on workshops.', time: '9:00 AM', seats: 500 },
      Music: { title: 'Neon Nights Music Festival', desc: 'Experience 12 hours of non-stop music from 25+ artists across 3 stages. From indie to electronic, jazz to hip-hop — this festival has something for every music lover.', time: '5:00 PM', seats: 3000 },
      Sports: { title: 'Ultimate City Marathon 2026', desc: 'Push your limits in the most scenic urban marathon. Categories for all levels: 5K fun run, 10K challenge, and 21K half-marathon. Professional timing, medals, and hydration stations.', time: '5:30 AM', seats: 2000 },
      Food: { title: 'Street Food Carnival 2026', desc: 'Discover 150+ food stalls from across India and around the world. Live cooking demos, chef competitions, and the most diverse culinary experience in the city.', time: '11:00 AM', seats: 5000 },
      Art: { title: 'Digital Art Immersion 2026', desc: 'Step into a world of light, color, and creativity. Interactive digital art installations, live performances by visual artists, and workshops on NFT art and digital creativity.', time: '10:00 AM', seats: 800 },
      Business: { title: 'Startup Pitch Wars 2026', desc: 'The region\'s most exciting startup competition. 50 startups, 20 VCs, one grand prize. Network with founders, investors, and industry mentors over two power-packed days.', time: '9:00 AM', seats: 600 },
    };
    const s = suggestions[form.category] || suggestions.Tech;
    setForm(f => ({ ...f, title: s.title, description: s.desc, time: s.time, totalSeats: s.seats }));
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
      const payload = { ...form, tiers: form.isFree ? [{ name:'Free Entry', price:0, seats:form.totalSeats }] : tiers, tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : [] };
      await createEvent(payload);
      setMsg('✅ Event submitted for admin approval!');
      setTimeout(() => navigate('/org-dashboard'), 2000);
    } catch (err) {
      setMsg('❌ '+( err.response?.data?.message || 'Failed to create event'));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex fade-up" style={{ minHeight: 'calc(100vh - 66px)' }}>
      {/* Sidebar */}
      <div className="sidebar hidden md:block">
        <div className="sbl" onClick={() => navigate('/org-dashboard')}><i className="bi bi-arrow-left" />Back</div>
        <div className="sbl active"><i className="bi bi-plus-circle" />Create Event</div>
      </div>

      <div className="flex-1 p-6 md:p-8" style={{ minWidth: 0 }}>
        <div className="pgh mb-6">
          <h2 className="font-grotesk font-black text-xl mb-1"><i className="bi bi-calendar-plus me-2" style={{ color: '#00F2FE' }} />Create New Event</h2>
          <p className="font-jakarta text-sm" style={{ color: '#8892A4' }}>Submit for admin approval to go live</p>
        </div>

        {msg && (
          <div className="mb-4 px-4 py-3 rounded-xl font-jakarta text-sm" style={{ background: msg.startsWith('✅') ? 'rgba(5,255,155,0.1)' : 'rgba(255,64,129,0.1)', border: `1px solid ${msg.startsWith('✅')?'rgba(5,255,155,0.2)':'rgba(255,64,129,0.2)'}`, color: msg.startsWith('✅')?'#05FF9B':'#FF4081' }}>{msg}</div>
        )}

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
          <form onSubmit={handleSubmit}>
            {/* AI Suggest */}
            <div className="rounded-2xl p-6 mb-5" style={{ background: 'linear-gradient(135deg,rgba(155,81,224,0.08),rgba(0,242,254,0.08))', border: '1px solid rgba(155,81,224,0.2)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-grotesk font-black text-sm" style={{ color: '#9B51E0' }}>
                    <i className="bi bi-stars me-2" />AI Event Suggestions
                  </div>
                  <p className="font-jakarta text-xs mt-1" style={{ color: '#8892A4' }}>Let Claude AI auto-fill event details based on category</p>
                </div>
                <button type="button" className="px-5 py-2.5 rounded-xl font-grotesk font-black text-sm text-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#9B51E0,#00F2FE)', opacity: aiLoading?0.7:1 }} onClick={aiSuggest} disabled={aiLoading}>
                  {aiLoading ? <><i className="bi bi-arrow-repeat animate-spin me-2" />Generating...</> : <><i className="bi bi-magic me-2" />AI Suggest</>}
                </button>
              </div>
            </div>

            {/* Basic info */}
            <div className="rounded-2xl p-6 mb-5" style={{ background: '#171E2E', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="font-grotesk font-bold text-xs uppercase tracking-widest mb-5" style={{ color: '#00F2FE' }}>
                <i className="bi bi-info-circle me-2" />Basic Information
              </div>
              <div className="mb-4"><label className="fl">Event Title *</label><input className="fi" placeholder="Give your event a great title" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required /></div>
              <div className="mb-4"><label className="fl">Description *</label><textarea className="fta" placeholder="Describe your event in detail..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="fl">Date *</label><input type="date" className="fi" value={form.date} onChange={e => setForm({...form,date:e.target.value})} required /></div>
                <div><label className="fl">Time *</label><input className="fi" placeholder="10:00 AM" value={form.time} onChange={e => setForm({...form,time:e.target.value})} /></div>
                <div><label className="fl">Venue *</label><input className="fi" placeholder="Venue name" value={form.venue} onChange={e => setForm({...form,venue:e.target.value})} required /></div>
                <div><label className="fl">City *</label><input className="fi" placeholder="City" value={form.city} onChange={e => setForm({...form,city:e.target.value})} required /></div>
                <div>
                  <label className="fl">Category *</label>
                  <select className="fs" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="fl">Total Seats *</label><input type="number" className="fi" placeholder="500" min="1" value={form.totalSeats} onChange={e => setForm({...form,totalSeats:Number(e.target.value)})} required /></div>
                <div className="col-span-2"><label className="fl">Tags (comma separated)</label><input className="fi" placeholder="AI, Workshop, Networking" value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} /></div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <input type="checkbox" id="free" checked={form.isFree} onChange={e => setForm({...form,isFree:e.target.checked})} style={{ accentColor: '#00F2FE', width: 16, height: 16 }} />
                <label htmlFor="free" className="font-jakarta text-sm" style={{ color: '#8892A4' }}>This is a free event</label>
              </div>
            </div>

            {/* Ticket tiers */}
            {!form.isFree && (
              <div className="rounded-2xl p-6 mb-5" style={{ background: '#171E2E', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-center mb-5">
                  <div className="font-grotesk font-bold text-xs uppercase tracking-widest" style={{ color: '#9B51E0' }}>
                    <i className="bi bi-ticket-perforated me-2" />Ticket Tiers
                  </div>
                  <button type="button" className="px-4 py-2 rounded-xl text-xs font-grotesk font-bold transition-all" style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#8892A4' }} onClick={addTier}>+ Add Tier</button>
                </div>
                {tiers.map((tier,i) => (
                  <div key={i} className="flex gap-3 mb-3 items-start">
                    <div className="w-1 h-10 rounded-full mt-1 flex-shrink-0" style={{ background: tierColors[i%5] }} />
                    <input className="fi flex-1" placeholder="Tier name" value={tier.name} onChange={e => updateTier(i,'name',e.target.value)} />
                    <input type="number" className="fi w-28" placeholder="Price" value={tier.price} onChange={e => updateTier(i,'price',Number(e.target.value))} />
                    <input type="number" className="fi w-28" placeholder="Seats" value={tier.seats} onChange={e => updateTier(i,'seats',Number(e.target.value))} />
                    {tiers.length > 1 && <button type="button" className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-all" style={{ color: '#FF4081', background: 'rgba(255,64,129,0.1)', border: '1px solid rgba(255,64,129,0.15)' }} onClick={() => removeTier(i)}><i className="bi bi-trash" /></button>}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="w-full py-3 rounded-xl text-black font-grotesk font-black text-sm transition-all hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg,#00F2FE,#9B51E0)', opacity: loading?0.7:1 }} disabled={loading}>
              {loading ? 'Submitting...' : <><i className="bi bi-send-check me-2" />Submit for Approval</>}
            </button>
          </form>

          {/* Preview panel */}
          <div>
            <div className="rounded-2xl p-5 sticky" style={{ background: '#171E2E', border: '1px solid rgba(255,255,255,0.06)', top: '90px' }}>
              <div className="font-grotesk font-bold text-xs uppercase tracking-widest mb-4" style={{ color: '#8892A4' }}>Preview</div>
              <div className="rounded-xl p-4 mb-3" style={{ background: '#1E2840' }}>
                <div className="font-grotesk font-black text-sm mb-1">{form.title || 'Event Title'}</div>
                {form.category && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, background: 'rgba(0,242,254,0.1)', color: '#00F2FE' }}>{form.category}</span>}
              </div>
              {form.date && <div className="flex items-center gap-2 text-xs font-jakarta mb-2" style={{ color: '#8892A4' }}><i className="bi bi-calendar3" style={{ color: '#00F2FE' }} />{new Date(form.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}
              {form.venue && <div className="flex items-center gap-2 text-xs font-jakarta mb-2" style={{ color: '#8892A4' }}><i className="bi bi-geo-alt" style={{ color: '#FF4081' }} />{form.venue}{form.city&&`, ${form.city}`}</div>}
              <div className="mt-4">
                {(form.isFree ? [{ name:'Free Entry', price:0 }] : tiers).map((t,i) => (
                  <div key={i} className="flex justify-between py-2 text-xs font-jakarta" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#8892A4' }}>
                    <span>{t.name}</span>
                    <span style={{ color: '#00F2FE', fontWeight: 700 }}>{t.price===0?'FREE':'₹'+t.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 px-3 py-2 rounded-lg text-xs font-jakarta" style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', color: '#FFB300' }}>
                <i className="bi bi-clock me-1" />Requires admin approval before going live
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
