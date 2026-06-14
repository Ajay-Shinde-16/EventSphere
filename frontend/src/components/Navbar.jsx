import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, toggleDarkMode, darkMode } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled, setScrolled]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      const bar = document.getElementById('scroll-progress');
      if (bar) bar.style.width = pct + '%';
      const btn = document.getElementById('back-to-top');
      if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { label: 'Home',   path: '/',       icon: 'bi-house' },
    { label: 'Events', path: '/events-browse', icon: 'bi-calendar-event' },
  ];

  if (user?.role === 'organizer') navLinks.push({ label: 'Dashboard', path: '/org-dashboard', icon: 'bi-speedometer2' });
  if (user?.role === 'admin')     navLinks.push({ label: 'Admin',     path: '/admin',          icon: 'bi-shield-check' });

  const iconBtn = {
    width:36, height:36, borderRadius:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'1px solid var(--border)', background:'var(--surface2)',
    color:'var(--muted)', cursor:'pointer', transition:'all 0.2s', fontSize:15, flexShrink:0,
  };

  return (
    <>
      <div id="scroll-progress" style={{ width:0 }}/>
      <nav style={{
        background:'var(--nav-bg)', borderBottom:'1px solid var(--border)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        height:66, position:'sticky', top:0, zIndex:50,
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.15)' : 'none',
        transition:'box-shadow 0.25s',
      }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px', height:'100%', display:'flex', alignItems:'center', gap:12 }}>

          {/* Logo — tap 5x quickly on mobile to open admin */}
          <div
            onClick={() => {
              tapCount.current += 1;
              clearTimeout(tapTimer.current);
              tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
              if (tapCount.current >= 5) {
                tapCount.current = 0;
                navigate('/admin-login');
              } else {
                navigate('/');
              }
            }}
            style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0, userSelect:'none', marginRight:8 }}>
            <div className="glow-cyan" style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="bi bi-calendar-event" style={{ color:'#000', fontSize:16 }}/>
            </div>
            <div>
              <div className="grad2 font-grotesk" style={{ fontWeight:900, fontSize:15, lineHeight:1 }}>EventSphere</div>
              <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>Smart Ticketing</div>
            </div>
          </div>

          {/* Nav links - hidden on mobile */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }} className="hidden md:flex">
            {navLinks.map(link => (
              <button key={link.path} onClick={() => navigate(link.path)}
                style={{
                  padding:'7px 16px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif",
                  fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                  background: isActive(link.path) ? 'rgba(0,242,254,0.1)' : 'transparent',
                  border: isActive(link.path) ? '1px solid rgba(0,242,254,0.25)' : '1px solid transparent',
                  color: isActive(link.path) ? 'var(--cyan)' : 'var(--muted)',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                <i className={`bi ${link.icon}`} style={{ fontSize:13 }}/>
                {link.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }}/>

          {/* Right actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>

            {/* Dark/light */}
            <button style={{ ...iconBtn, color: darkMode ? 'var(--amber)' : 'var(--muted)' }} onClick={toggleDarkMode} title={darkMode?'Light mode':'Dark mode'}>
              <i className={`bi ${darkMode?'bi-sun-fill':'bi-moon-fill'}`}/>
            </button>

            {/* Notifications */}
            <div style={{ position:'relative' }}>
              <button style={iconBtn} onClick={() => setNotifOpen(v=>!v)}>
                <i className="bi bi-bell-fill"/>
                <span style={{ position:'absolute', top:7, right:7, width:7, height:7, borderRadius:'50%', background:'var(--amber)' }} className="pulse-dot"/>
              </button>
              {notifOpen && (
                <div className="fade-up" style={{ position:'absolute', right:0, top:46, width:290, borderRadius:16, overflow:'hidden', zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
                  <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, color:'var(--cyan)' }}>Notifications</span>
                    <button onClick={()=>setNotifOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>✕</button>
                  </div>
                  {[
                    { icon:'bi-check-circle-fill', color:'var(--mint)',  title:'Welcome to EventSphere!', msg:'Explore amazing events.', time:'Now' },
                    { icon:'bi-qr-code',           color:'var(--cyan)',  title:'QR Tickets Ready',        msg:'Instant & scannable.',   time:'1h' },
                  ].map((n,i) => (
                    <div key={i} style={{ padding:'12px 18px', display:'flex', gap:12, borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <i className={`bi ${n.icon}`} style={{ color:n.color, fontSize:18, marginTop:2 }}/>
                      <div>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, color:'var(--text)' }}>{n.title}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{n.msg}</div>
                        <div style={{ fontSize:10, color:'var(--muted)', marginTop:3 }}>{n.time} ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            {!user ? (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => navigate('/login')}
                  style={{ padding:'7px 18px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer', whiteSpace:'nowrap' }}>
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="glow-cyan"
                  style={{ padding:'7px 18px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                  Sign Up
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {user.role === 'attendee' && (
                  <button onClick={() => navigate('/my-tickets')}
                    style={{ padding:'7px 14px', borderRadius:10, fontSize:11, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", background:'rgba(0,242,254,0.1)', color:'var(--cyan)', border:'1px solid rgba(0,242,254,0.2)', cursor:'pointer', whiteSpace:'nowrap' }}
                    className="hidden sm:block">
                    <i className="bi bi-ticket-perforated me-1"/>My Tickets
                  </button>
                )}
                <div onClick={() => navigate('/profile')} className="glow-purple"
                  style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#9B51E0,#00F2FE)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:'#fff', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", userSelect:'none' }}>
                  {user.name?.[0]?.toUpperCase()||'U'}
                </div>
              </div>
            )}

            {/* Mobile hamburger — only visible on small screens */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(v => !v)}
              style={{ ...iconBtn }}>
              <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}/>
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden fade-up" style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'12px 16px', position:'sticky', top:66, zIndex:45 }}>
          {navLinks.map(link => (
            <button key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              style={{
                width:'100%', padding:'12px 16px', marginBottom:4, borderRadius:10,
                fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14,
                textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                background: isActive(link.path) ? 'rgba(0,136,204,0.08)' : 'transparent',
                border: isActive(link.path) ? '1px solid rgba(0,136,204,0.2)' : '1px solid transparent',
                color: isActive(link.path) ? 'var(--cyan)' : 'var(--text)',
              }}>
              <i className={`bi ${link.icon}`}/>{link.label}
            </button>
          ))}
          {!user && (
            <div style={{ display:'flex', gap:8, marginTop:8, paddingTop:12, borderTop:'1px solid var(--border)' }}>
              <button onClick={() => { navigate('/login'); setMenuOpen(false); }}
                style={{ flex:1, padding:'10px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}>
                Login
              </button>
              <button onClick={() => { navigate('/register'); setMenuOpen(false); }}
                style={{ flex:1, padding:'10px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor:'pointer' }}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}


      {/* Back to top */}
      <button id="back-to-top" onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
        <i className="bi bi-chevron-up" style={{ color:'#000', fontWeight:900 }}/>
      </button>
    </>
  );
}