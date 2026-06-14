import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: 'bi-house-fill',              label: 'Events',    href: '/' },
    { icon: 'bi-ticket-perforated-fill',  label: 'Tickets',   href: '/my-tickets' },
    ...(user?.role === 'organizer' || user?.role === 'admin'
      ? [{ icon: 'bi-speedometer2', label: 'Organizer', href: '/org-dashboard' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ icon: 'bi-shield-check', label: 'Admin', href: '/admin' }]
      : []),
    { icon: 'bi-person-fill', label: 'Profile', href: user ? '/profile' : '/login' },
  ];

  return (
    <div
      className="mob-nav md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: 6,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      {items.map((item) => {
        const isActive = path === item.href;
        return (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: isActive ? 'var(--cyan)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              padding: '4px 2px',
              gap: 3,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'color 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <i
              className={`bi ${item.icon}`}
              style={{
                fontSize: '1.2rem',
                color: isActive ? 'var(--cyan)' : 'var(--muted)',
              }}
            />
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}