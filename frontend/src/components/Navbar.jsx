import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

export default function Navbar() {
  const { user, logout, toggleDarkMode, darkMode } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile, isTablet, width } = useResponsive();
  const [scrolled,  setScrolled]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const notifRef = useRef(null);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  // Breakpoints
  const isSmall = width < 480;   // hide Login text label, keep just icon
  const isTiny  = width < 360;   // absolute minimum

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      const bar = document.getElementById('scroll-progress');
      if (bar) bar.style.width = pct + '%';
      const btn = document.getElementById('back-to-top');
      if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { label: 'Home',   path: '/',             icon: 'bi-house' },
    { label: 'Events', path: '/events-browse', icon: 'bi-calendar-event' },
  ];
  if (user?.role === 'organizer') navLinks.push({ label: 'Dashboard', path: '/org-dashboard', icon: 'bi-speedometer2' });
  if (user?.role === 'admin')     navLinks.push({ label: 'Admin',     path: '/admin',          icon: 'bi-shield-check' });

  const iconBtn = {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: 15, flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  };

  const logoTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      navigate('/admin-login');
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <div id="scroll-progress" style={{ width: 0 }} />

      <nav style={{
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.18)' : 'none',
        transition: 'box-shadow 0.25s',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: isMobile ? '0 12px' : '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 6 : 10,
        }}>

          {/* ── LOGO ── */}
          <div
            onClick={logoTap}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', flexShrink: 0, userSelect: 'none',
              marginRight: isMobile ? 0 : 8,
            }}
          >
            {/* Logo — original calendar icon style */}
            <div
              className="glow-cyan"
              style={{
                width: isTiny ? 30 : 36, height: isTiny ? 30 : 36,
                borderRadius: 9,
                background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className="bi bi-calendar-event" style={{ color: '#000', fontSize: isTiny ? 12 : 15 }} />
            </div>
            {/* Hide text label below 360px */}
            {!isTiny && (
              <div>
                <div className="grad2 font-grotesk" style={{ fontWeight: 900, fontSize: isSmall ? 13 : 15, lineHeight: 1 }}>
                  EventSphere
                </div>
                {!isMobile && (
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Smart Ticketing</div>
                )}
              </div>
            )}
          </div>

          {/* ── DESKTOP NAV LINKS (hidden on mobile) ── */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    padding: '7px 14px', borderRadius: 10,
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                    background: isActive(link.path) ? 'rgba(0,242,254,0.1)' : 'transparent',
                    border: isActive(link.path) ? '1px solid rgba(0,242,254,0.25)' : '1px solid transparent',
                    color: isActive(link.path) ? 'var(--cyan)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <i className={`bi ${link.icon}`} style={{ fontSize: 13 }} />
                  {link.label}
                </button>
              ))}
            </div>
          )}

          {/* ── SPACER ── */}
          <div style={{ flex: 1 }} />

          {/* ── RIGHT ACTIONS ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8 }}>

            {/* Theme toggle */}
            <button
              style={{ ...iconBtn, color: darkMode ? 'var(--amber)' : 'var(--muted)' }}
              onClick={toggleDarkMode}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button style={iconBtn} onClick={() => setNotifOpen(v => !v)}>
                <i className="bi bi-bell-fill" />
                <span style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--amber)',
                }} className="pulse-dot" />
              </button>

              {notifOpen && (
                <div
                  className="fade-up"
                  style={{
                    position: 'absolute',
                    // On mobile keep within viewport
                    right: isMobile ? -60 : 0,
                    left: isMobile ? 'auto' : 'auto',
                    top: 44,
                    width: isMobile ? Math.min(280, width - 24) : 290,
                    borderRadius: 16,
                    overflow: 'hidden',
                    zIndex: 200,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--cyan)' }}>
                      Notifications
                    </span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '2px 6px' }}
                    >✕</button>
                  </div>
                  {[
                    { icon: 'bi-check-circle-fill', color: 'var(--mint)',  title: 'Welcome to EventSphere!', msg: 'Explore amazing events.', time: 'Now' },
                    { icon: 'bi-qr-code',           color: 'var(--cyan)',  title: 'QR Tickets Ready',        msg: 'Instant & scannable.',   time: '1h'  },
                  ].map((n, i) => (
                    <div
                      key={i}
                      style={{ padding: '11px 16px', display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <i className={`bi ${n.icon}`} style={{ color: n.color, fontSize: 17, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{n.msg}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{n.time} ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── AUTH SECTION ── */}
            {!user ? (
              <>
                {/* On mobile show only icons; on desktop show text */}
                {isMobile ? (
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      ...iconBtn,
                      background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
                      border: 'none', color: '#000',
                    }}
                    title="Login / Sign Up"
                  >
                    <i className="bi bi-person-fill" style={{ fontSize: 16 }} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        padding: '7px 18px', borderRadius: 10, fontSize: 12,
                        fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="glow-cyan"
                      style={{
                        padding: '7px 18px', borderRadius: 10, fontSize: 12,
                        fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
                        background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
                        color: '#000', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8 }}>
                {/* My Tickets pill — only on desktop */}
                {!isMobile && user.role === 'attendee' && (
                  <button
                    onClick={() => navigate('/my-tickets')}
                    style={{
                      padding: '7px 14px', borderRadius: 10, fontSize: 11,
                      fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
                      background: 'rgba(0,242,254,0.1)', color: 'var(--cyan)',
                      border: '1px solid rgba(0,242,254,0.2)', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="bi bi-ticket-perforated" style={{ marginRight: 4 }} />My Tickets
                  </button>
                )}

                {/* Avatar */}
                <div
                  onClick={() => navigate('/profile')}
                  className="glow-purple"
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg,#9B51E0,#00F2FE)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, color: '#fff',
                    cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif",
                    userSelect: 'none', flexShrink: 0,
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            )}

            {/* ── HAMBURGER (mobile only) ── */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{ ...iconBtn }}
                aria-label="Menu"
              >
                <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: 17 }} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE DROPDOWN MENU ── */}
      {isMobile && menuOpen && (
        <div
          className="fade-up"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 12px 14px',
            position: 'sticky',
            top: 60,
            zIndex: 45,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* Nav links */}
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', marginBottom: 4,
                borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700, fontSize: 14, textAlign: 'left',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: isActive(link.path) ? 'rgba(0,242,254,0.08)' : 'transparent',
                border: isActive(link.path) ? '1px solid rgba(0,242,254,0.2)' : '1px solid transparent',
                color: isActive(link.path) ? 'var(--cyan)' : 'var(--text)',
                transition: 'all 0.15s',
              }}
            >
              <i className={`bi ${link.icon}`} style={{ fontSize: 16, width: 20, textAlign: 'center' }} />
              {link.label}
            </button>
          ))}

          {/* My Tickets (logged-in attendee) */}
          {user?.role === 'attendee' && (
            <button
              onClick={() => { navigate('/my-tickets'); setMenuOpen(false); }}
              style={{
                width: '100%', padding: '12px 14px', marginBottom: 4,
                borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif",
                fontWeight: 700, fontSize: 14, textAlign: 'left',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: isActive('/my-tickets') ? 'rgba(0,242,254,0.08)' : 'transparent',
                border: isActive('/my-tickets') ? '1px solid rgba(0,242,254,0.2)' : '1px solid transparent',
                color: isActive('/my-tickets') ? 'var(--cyan)' : 'var(--text)',
              }}
            >
              <i className="bi bi-ticket-perforated" style={{ fontSize: 16, width: 20, textAlign: 'center' }} />
              My Tickets
            </button>
          )}

          {/* Organizer-only quick links — desktop sidebar (Create Event, QR Check-in)
              is hidden on mobile, so these need a mobile-menu home too. */}
          {user?.role === 'organizer' && (
            <>
              <button
                onClick={() => { navigate('/create-event'); setMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: 4,
                  borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700, fontSize: 14, textAlign: 'left',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive('/create-event') ? 'rgba(0,242,254,0.08)' : 'transparent',
                  border: isActive('/create-event') ? '1px solid rgba(0,242,254,0.2)' : '1px solid transparent',
                  color: isActive('/create-event') ? 'var(--cyan)' : 'var(--text)',
                }}
              >
                <i className="bi bi-plus-circle" style={{ fontSize: 16, width: 20, textAlign: 'center' }} />
                Create Event
              </button>
              <button
                onClick={() => { navigate('/scan-qr'); setMenuOpen(false); }}
                style={{
                  width: '100%', padding: '12px 14px', marginBottom: 4,
                  borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif",
                  fontWeight: 700, fontSize: 14, textAlign: 'left',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: isActive('/scan-qr') ? 'rgba(5,255,155,0.08)' : 'transparent',
                  border: isActive('/scan-qr') ? '1px solid rgba(5,255,155,0.2)' : '1px solid transparent',
                  color: isActive('/scan-qr') ? 'var(--mint)' : 'var(--text)',
                }}
              >
                <i className="bi bi-qr-code-scan" style={{ fontSize: 16, width: 20, textAlign: 'center' }} />
                QR Check-in
              </button>
            </>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

          {/* Auth buttons */}
          {!user ? (
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', cursor: 'pointer',
                }}
              >
                Login
              </button>
              <button
                onClick={() => { navigate('/register'); setMenuOpen(false); }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13,
                  background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
                  color: '#000', border: 'none', cursor: 'pointer',
                }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#9B51E0,#00F2FE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: '#fff',
                  fontFamily: "'Space Grotesk',sans-serif",
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--heading)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 12,
                  background: 'rgba(244,114,182,0.1)', color: 'var(--pink)',
                  border: '1px solid rgba(244,114,182,0.2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className="bi bi-box-arrow-right" />Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Back to top */}
      <button id="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i className="bi bi-chevron-up" style={{ color: '#000', fontWeight: 900 }} />
      </button>
    </>
  );
}