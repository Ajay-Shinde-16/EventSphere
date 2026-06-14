import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px 16px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'linear-gradient(135deg,#00F2FE,#9B51E0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 0 40px rgba(0,242,254,0.2)',
      }}>
        <i className="bi bi-calendar-x" style={{ color: '#000', fontSize: 32 }} />
      </div>
      <h1 style={{
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900,
        fontSize: 'clamp(2rem,8vw,4rem)', lineHeight: 1,
        background: 'linear-gradient(135deg,#38BDF8,#A78BFA)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', marginBottom: 8,
      }}>404</h1>
      <h2 style={{
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
        fontSize: '1.3rem', color: 'var(--heading)', marginBottom: 12,
      }}>Page Not Found</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/')}
          style={{
            padding: '12px 28px', borderRadius: 50,
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 14,
            background: 'linear-gradient(135deg,#00F2FE,#9B51E0)', color: '#000',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,242,254,0.25)',
          }}>
          <i className="bi bi-house" style={{ marginRight: 6 }} />Go Home
        </button>
        <button onClick={() => navigate('/events-browse')}
          style={{
            padding: '12px 28px', borderRadius: 50,
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 14,
            background: 'transparent', color: 'var(--text)',
            border: '2px solid var(--border)', cursor: 'pointer',
          }}>
          <i className="bi bi-calendar-event" style={{ marginRight: 6 }} />Browse Events
        </button>
      </div>
    </div>
  );
}