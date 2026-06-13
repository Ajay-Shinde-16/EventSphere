import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: 'bi-house-fill', label: 'Events', href: '/' },
    { icon: 'bi-ticket-perforated-fill', label: 'Tickets', href: '/my-tickets' },
    ...(user?.role === 'organizer' || user?.role === 'admin' ? [{ icon: 'bi-speedometer2', label: 'Organizer', href: '/org-dashboard' }] : []),
    ...(user?.role === 'admin' ? [{ icon: 'bi-shield-check', label: 'Admin', href: '/admin' }] : []),
    { icon: 'bi-person-fill', label: 'Profile', href: user ? '/profile' : '/login' },
  ];

  return (
    <div className="mob-nav md:hidden">
      {items.map((item) => (
        <a key={item.href} onClick={() => navigate(item.href)} className={path === item.href ? 'active' : ''} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: path === item.href ? '#00F2FE' : '#8892A4', textDecoration: 'none', padding: '4px 2px', gap: '2px', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}>
          <i className={`bi ${item.icon}`} style={{ fontSize: '1.15rem' }} />
          {item.label}
        </a>
      ))}
    </div>
  );
}
