import { useState, useContext } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/api';

export default function Profile() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', city: user?.city||'' });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await updateProfile(form);
      setUser(res.data);
      localStorage.setItem('eventsphere_user', JSON.stringify(res.data));
      setSaved(true); setTimeout(()=>setSaved(false), 3000);
    } catch (err) { setError(err.response?.data?.message||'Update failed'); }
    finally { setSaving(false); }
  };

  const initials = (user?.name?.split(' ').filter(Boolean).map(w=>w[0].toUpperCase()).slice(0,2) || ['U']).join('');
  const roleColors = { admin:'#F472B6', organizer:'#FBBF24', attendee:'#38BDF8' };
  const roleColor = roleColors[user?.role] || '#38BDF8';
  const roleColorCss = { admin:'var(--pink)', organizer:'var(--amber)', attendee:'var(--cyan)' }[user?.role]||'var(--cyan)';
  const roleLabel = { admin:'Admin', organizer:'Organizer', attendee:'Attendee' }[user?.role]||'Attendee';

  const card = {
    background:'var(--card-bg)', border:'1px solid var(--border)',
    borderRadius:20, padding:28, marginBottom:20, boxShadow:'var(--shadow)',
  };
  const label = {
    display:'block', fontSize:12, fontWeight:600,
    color:'var(--muted)', marginBottom:6,
  };
  const input = {
    width:'100%', background:'var(--input-bg)', border:'1.5px solid var(--border)',
    color:'var(--heading)', padding:'12px 16px', borderRadius:12,
    fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif",
    outline:'none', transition:'all 0.2s',
  };

  const navLinks = [
    user?.role==='attendee' && { to:'/my-tickets', icon:'bi-ticket-perforated', label:'My Tickets', sub:'View bookings', color:'var(--cyan)' },
    user?.role==='organizer' && { to:'/org-dashboard', icon:'bi-speedometer2', label:'Dashboard', sub:'Manage events', color:'var(--purple)' },
    user?.role==='organizer' && { to:'/create-event', icon:'bi-plus-circle', label:'Create Event', sub:'Add new event', color:'var(--cyan)' },
    user?.role==='admin' && { to:'/admin', icon:'bi-shield-fill', label:'Admin Panel', sub:'Control center', color:'var(--pink)' },
    user?.role==='admin' && { to:'/org-dashboard', icon:'bi-people-fill', label:'Manage Events', sub:'Review & approve', color:'var(--purple)' },
    { to:'/', icon:'bi-house', label:'Home', sub:'Browse events', color:'var(--muted)' },
  ].filter(Boolean);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding: isMobile ? '16px 14px calc(80px + env(safe-area-inset-bottom))' : '32px 24px 40px' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>

        {/* Avatar card */}
        <div style={{ ...card, textAlign:'center' }}>
          <div style={{ position:'relative', width:80, height:80, margin:'0 auto 16px' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg, ${roleColor}, ${roleColor}99)`, border:`3px solid ${roleColor}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:26, color:'#fff', boxShadow:`0 4px 20px ${roleColor}40` }}>
              {initials}
            </div>
            <div style={{ position:'absolute', bottom:2, right:2, width:16, height:16, borderRadius:'50%', background:'#22C55E', border:'3px solid var(--card-bg)' }}/>
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:'1.4rem', color:'var(--heading)', marginBottom:4 }}>{user?.name}</h1>
          <p style={{ color:'var(--muted)', fontSize:13, marginBottom:12 }}>{user?.email}</p>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:`${roleColor}22`, color:roleColor, border:`1px solid ${roleColor}55` }}>
            <i className={`bi ${user?.role==='admin'?'bi-shield-fill':user?.role==='organizer'?'bi-person-workspace':'bi-person-fill'}`}/>
            {roleLabel}
          </span>
        </div>

        {/* Edit form */}
        <div style={card}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1rem', color:'var(--heading)', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <i className="bi bi-pencil-square" style={{ color:'var(--cyan)' }}/> Edit Profile
          </h2>

          {error && (
            <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.25)', color:'var(--pink)', fontSize:13 }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.25)', color:'var(--mint)', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
              <i className="bi bi-check-circle-fill"/> Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={label}>Full Name</label>
              <input
                style={input} type="text" name="name"
                value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required
                onFocus={e=>e.target.style.borderColor='var(--cyan)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={label}>Phone Number</label>
              <input
                style={input} type="tel" name="phone" placeholder="+91 XXXXX XXXXX"
                value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                onFocus={e=>e.target.style.borderColor='var(--cyan)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={label}>City</label>
              <input
                style={input} type="text" name="city" placeholder="Bangalore, Mumbai, Delhi..."
                value={form.city} onChange={e=>setForm({...form,city:e.target.value})}
                onFocus={e=>e.target.style.borderColor='var(--cyan)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={label}>Email Address</label>
              <input
                style={{ ...input, opacity:0.6, cursor:'not-allowed' }}
                type="email" value={user?.email} disabled
              />
              <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving}
              style={{ width:'100%', padding:'13px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, color:'#fff', border:'none', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, background:'linear-gradient(135deg,var(--cyan),var(--purple))', transition:'all 0.2s' }}>
              {saving
                ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}><i className="bi bi-arrow-repeat" style={{ animation:'spin 0.7s linear infinite',display:'inline-block' }}/> Saving...</span>
                : <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}><i className="bi bi-check2"/> Save Changes</span>}
            </button>
          </form>
        </div>

        {/* Quick navigation */}
        <div style={card}>
          <h2 style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>Quick Navigation</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {navLinks.map((link,i) => (
              <Link key={i} to={link.to}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, background:'var(--surface2)', border:'1px solid var(--border)', textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=link.color; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}>
                <i className={`bi ${link.icon} text-xl`} style={{ color:link.color, fontSize:20 }}/>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, color:'var(--heading)' }}>{link.label}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{link.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...card, border:'1px solid rgba(244,114,182,0.15)', marginBottom:0 }}>
          <h2 style={{ fontSize:11, fontWeight:700, color:'var(--pink)', textTransform:'uppercase', letterSpacing:2, marginBottom:14 }}>Danger Zone</h2>
          <button onClick={()=>{ logout(); navigate('/'); }}
            style={{ width:'100%', padding:'12px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'rgba(244,114,182,0.06)', color:'var(--pink)', border:'1px solid rgba(244,114,182,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
            <i className="bi bi-box-arrow-right"/> Sign Out of EventSphere
          </button>
        </div>

      </div>
    </div>
  );
}