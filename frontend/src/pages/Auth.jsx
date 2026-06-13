import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register, registerAdmin } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ── helpers ── */
function getErrorMsg(err) {
  if (!err.response) return '⚠️ Cannot reach server. Make sure the backend is running on port 5000.';
  return err.response?.data?.message || 'Something went wrong. Please try again.';
}

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginBottom:28 }}>
      <div className="glow-cyan" style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#00F2FE,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className="bi bi-calendar-event" style={{ color:'#000', fontSize:18 }} />
      </div>
      <div>
        <div className="grad2 font-grotesk" style={{ fontWeight:900, fontSize:17, lineHeight:1 }}>EventSphere</div>
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>Elite Event Platform</div>
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:12, background:'rgba(255,64,129,0.08)', border:'1px solid rgba(255,64,129,0.3)', color:'var(--pink)', fontSize:13, display:'flex', alignItems:'flex-start', gap:8 }}>
      <i className="bi bi-exclamation-circle-fill" style={{ flexShrink:0, marginTop:1 }} />
      <span>{msg}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px', fontFamily:"'Space Grotesk',sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ type='text', ...props }) {
  return (
    <input type={type} {...props}
      style={{ width:'100%', background:'var(--input-bg)', border:'1px solid var(--border)', color:'var(--text)', padding:'12px 16px', borderRadius:12, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', transition:'border-color 0.2s', ...props.style }}
      onFocus={e => e.target.style.borderColor='var(--cyan)'}
      onBlur={e => e.target.style.borderColor='var(--border)'}
    />
  );
}

function Card({ children, accentColor }) {
  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${accentColor || 'var(--border-strong)'}`, borderRadius:20, padding:36, boxShadow:'var(--shadow)' }}>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, color, children }) {
  return (
    <button type="submit" disabled={loading}
      style={{ width:'100%', padding:'13px', borderRadius:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, background: color || 'linear-gradient(135deg,#00F2FE,#9B51E0)', color:'#000', border:'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1, transition:'all 0.2s', boxShadow:'0 4px 20px rgba(0,242,254,0.2)' }}>
      {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><i className="bi bi-arrow-repeat" style={{ animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Please wait...</span> : children}
    </button>
  );
}

/* ════════════════════════════════════════
   LOGIN
════════════════════════════════════════ */
export function Login() {
  const [form, setForm]  = useState({ email:'', password:'' });
  const [loading, setL]  = useState(false);
  const [error, setE]    = useState('');
  const [showPwd, setSP] = useState(false);
  const { loginUser }    = useAuth();
  const navigate         = useNavigate();


  const submit = async (e) => {
    e.preventDefault(); setL(true); setE('');
    try {
      const { data } = await login(form);
      loginUser(data);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'organizer') navigate('/org-dashboard');
      else navigate('/');
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 16px 40px' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <Logo />
        <Card>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.5rem', textAlign:'center', marginBottom:4, color:'var(--heading)' }}>Welcome back</h1>
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginBottom:28 }}>Sign in to your account</p>

          <ErrBox msg={error} />

          <form onSubmit={submit}>
            <Field label="Email Address">
              <Input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} required />
            </Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <Input type={showPwd?'text':'password'} placeholder="••••••••" style={{ paddingRight:44 }}
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
                <button type="button" onClick={() => setSP(v=>!v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>
                  <i className={`bi bi-eye${showPwd?'-slash':''}`} />
                </button>
              </div>
            </Field>
            <div style={{ marginTop:8 }}>
              <SubmitBtn loading={loading}>Sign In →</SubmitBtn>
            </div>
          </form>

          <p style={{ marginTop:20, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--cyan)', fontWeight:700, textDecoration:'none' }}>Create one free</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   REGISTER
════════════════════════════════════════ */
export function Register() {
  const [form, setForm]  = useState({ name:'', email:'', password:'', role:'attendee' });
  const [loading, setL]  = useState(false);
  const [error, setE]    = useState('');
  const [showPwd, setSP] = useState(false);
  const { loginUser }    = useAuth();
  const navigate         = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setL(true); setE('');

    // Client-side validation first
    if (form.name.trim().length < 2) { setE('Name must be at least 2 characters.'); setL(false); return; }
    if (form.password.length < 6)    { setE('Password must be at least 6 characters.'); setL(false); return; }

    try {
      const { data } = await register({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        role: form.role,
      });
      loginUser(data);
      navigate('/');
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 16px 40px' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <Logo />
        <Card>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.5rem', textAlign:'center', marginBottom:4, color:'var(--heading)' }}>Create Account</h1>
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginBottom:28 }}>Join EventSphere — free forever</p>

          <ErrBox msg={error} />

          <form onSubmit={submit}>
            <Field label="Full Name">
              <Input placeholder="Your full name" value={form.name}
                onChange={e => setForm({...form, name:e.target.value})} required />
            </Field>
            <Field label="Email Address">
              <Input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} required />
            </Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <Input type={showPwd?'text':'password'} placeholder="Min. 6 characters" style={{ paddingRight:44 }}
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} required minLength={6} />
                <button type="button" onClick={() => setSP(v=>!v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>
                  <i className={`bi bi-eye${showPwd?'-slash':''}`} />
                </button>
              </div>
            </Field>
            <Field label="I want to…">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { value:'attendee',  label:'Attend Events', icon:'bi-ticket-perforated-fill', desc:'Book & enjoy' },
                  { value:'organizer', label:'Host Events',   icon:'bi-megaphone-fill',          desc:'Create & manage' },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => setForm({...form, role:r.value})}
                    style={{ padding:'14px 12px', borderRadius:12, textAlign:'left', cursor:'pointer', transition:'all 0.2s',
                      background: form.role===r.value ? 'rgba(0,242,254,0.08)' : 'var(--surface2)',
                      border: form.role===r.value ? '2px solid var(--cyan)' : '1px solid var(--border)' }}>
                    <i className={`bi ${r.icon}`} style={{ color: form.role===r.value ? 'var(--cyan)' : 'var(--muted)', fontSize:20, display:'block', marginBottom:6 }} />
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, color: form.role===r.value ? 'var(--cyan)' : 'var(--text)' }}>{r.label}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </Field>
            <SubmitBtn loading={loading}>Create Account →</SubmitBtn>
          </form>

          <p style={{ marginTop:20, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--cyan)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ADMIN LOGIN  (Ctrl+Shift+A only)
════════════════════════════════════════ */
export function AdminLogin() {
  const [tab, setTab]   = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', adminKey:'' });
  const [loading, setL] = useState(false);
  const [error, setE]   = useState('');
  const { loginUser }   = useAuth();
  const navigate        = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setL(true); setE('');
    try {
      let data;
      if (tab === 'login') ({ data } = await login({ email:form.email, password:form.password }));
      else ({ data } = await registerAdmin(form));
      if (data.role !== 'admin') { setE('Access denied — not an admin account.'); setL(false); return; }
      loginUser(data); navigate('/admin');
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 16px 40px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 16px', background:'linear-gradient(135deg,#FF4081,#9B51E0)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 32px rgba(255,64,129,0.28)' }}>
            <i className="bi bi-shield-check" style={{ color:'#000', fontSize:24 }} />
          </div>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.4rem', color:'var(--heading)', marginBottom:4 }}>Admin Portal</h1>
          <p style={{ fontSize:12, color:'var(--muted)' }}>Restricted — authorised personnel only</p>
        </div>
        <Card accentColor="rgba(255,64,129,0.25)">
          <div style={{ display:'flex', gap:6, marginBottom:24, padding:4, borderRadius:12, background:'var(--surface2)' }}>
            {['login','register'].map(t => (
              <button key={t} type="button" onClick={() => { setTab(t); setE(''); }}
                style={{ flex:1, padding:'9px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer', border:'none', transition:'all 0.2s',
                  background: tab===t ? 'linear-gradient(135deg,#FF4081,#9B51E0)' : 'transparent',
                  color: tab===t ? '#000' : 'var(--muted)' }}>
                {t==='login' ? 'Admin Login' : 'Register Admin'}
              </button>
            ))}
          </div>
          <ErrBox msg={error} />
          <form onSubmit={submit}>
            {tab==='register' && (
              <Field label="Full Name"><Input placeholder="Admin name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></Field>
            )}
            <Field label="Email"><Input type="email" placeholder="admin@eventsphere.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></Field>
            <Field label="Password"><Input type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></Field>
            {tab==='register' && (
              <Field label="Admin Secret Key"><Input type="password" placeholder="Enter secret key" value={form.adminKey} onChange={e=>setForm({...form,adminKey:e.target.value})} required /></Field>
            )}
            <SubmitBtn loading={loading} color="linear-gradient(135deg,#FF4081,#9B51E0)">
              {tab==='login' ? 'Sign In as Admin' : 'Register Admin'}
            </SubmitBtn>
          </form>
          <p style={{ marginTop:20, textAlign:'center' }}>
            <Link to="/login" style={{ fontSize:12, color:'var(--muted)', textDecoration:'none' }}>
              <i className="bi bi-arrow-left me-1" />Back to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}