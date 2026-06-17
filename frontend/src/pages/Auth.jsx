import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { login, register, registerAdmin, forgotPassword, resetPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getErrorMsg(err) {
  if (!err.response) return '⚠️ Cannot reach server. Make sure the backend is running.';
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
    <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.3)', color:'var(--pink)', fontSize:13, display:'flex', alignItems:'flex-start', gap:8 }}>
      <i className="bi bi-exclamation-circle-fill" style={{ flexShrink:0, marginTop:1 }} />
      <span>{msg}</span>
    </div>
  );
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.3)', color:'var(--mint)', fontSize:13, display:'flex', alignItems:'flex-start', gap:8 }}>
      <i className="bi bi-check-circle-fill" style={{ flexShrink:0, marginTop:1 }} />
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
      style={{ width:'100%', background:'var(--input-bg)', border:'1.5px solid var(--border)', color:'var(--heading)', padding:'12px 16px', borderRadius:12, fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', transition:'all 0.2s', WebkitAppearance:'none', ...props.style }}
      onFocus={e => { e.target.style.borderColor='var(--cyan)'; e.target.style.boxShadow='0 0 0 3px rgba(56,189,248,0.1)'; }}
      onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
    />
  );
}

function Card({ children, accentColor }) {
  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${accentColor || 'rgba(56,189,248,0.2)'}`, borderRadius:20, padding:'32px 28px', boxShadow:'var(--shadow)' }}>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, color, children, disabled }) {
  return (
    <button type="submit" disabled={loading || disabled}
      style={{ width:'100%', padding:'13px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:14, background: color || 'linear-gradient(135deg,#38BDF8,#A78BFA)', color:'#000', border:'none', cursor: (loading||disabled) ? 'not-allowed' : 'pointer', opacity: (loading||disabled) ? 0.65 : 1, transition:'all 0.2s', marginTop:4 }}>
      {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><i className="bi bi-arrow-repeat" style={{ animation:'spin 0.7s linear infinite', display:'inline-block' }} />Please wait...</span> : children}
    </button>
  );
}

const pageStyle = { minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 16px 40px' };

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
    <div className="fade-up" style={pageStyle}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <Logo />
        <Card>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.5rem', textAlign:'center', marginBottom:4, color:'var(--heading)' }}>Welcome back</h1>
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginBottom:24 }}>Sign in to your EventSphere account</p>

          <ErrBox msg={error} />

          <form onSubmit={submit}>
            <Field label="Email Address">
              <Input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} required />
            </Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <Input type={showPwd?'text':'password'} placeholder="••••••••" style={{ paddingRight:48 }}
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
                <button type="button" onClick={() => setSP(v=>!v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>
                  <i className={`bi bi-eye${showPwd?'-slash':''}`} />
                </button>
              </div>
            </Field>

            {/* Forgot password link */}
            <div style={{ textAlign:'right', marginTop:-8, marginBottom:18 }}>
              <Link to="/forgot-password" style={{ fontSize:12, color:'var(--cyan)', textDecoration:'none', fontWeight:600 }}>
                Forgot password?
              </Link>
            </div>

            <SubmitBtn loading={loading}>Sign In →</SubmitBtn>
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
    if (form.name.trim().length < 2) { setE('Name must be at least 2 characters.'); setL(false); return; }
    if (form.password.length < 6)    { setE('Password must be at least 6 characters.'); setL(false); return; }
    try {
      const { data } = await register({ name: form.name.trim(), email: form.email.toLowerCase().trim(), password: form.password, role: form.role });
      loginUser(data);
      navigate('/');
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={pageStyle}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <Logo />
        <Card>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.5rem', textAlign:'center', marginBottom:4, color:'var(--heading)' }}>Create Account</h1>
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginBottom:24 }}>Join EventSphere — free forever</p>

          <ErrBox msg={error} />

          <form onSubmit={submit}>
            <Field label="Full Name">
              <Input placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
            </Field>
            <Field label="Email Address">
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
            </Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <Input type={showPwd?'text':'password'} placeholder="Min. 6 characters" style={{ paddingRight:48 }}
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
                      background: form.role===r.value ? 'rgba(56,189,248,0.08)' : 'var(--surface2)',
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
   FORGOT PASSWORD
════════════════════════════════════════ */
export function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setL]       = useState(false);
  const [error, setE]         = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setL(true); setE(''); setSuccess('');
    if (!email) { setE('Please enter your email address.'); setL(false); return; }
    try {
      const { data } = await forgotPassword(email.toLowerCase().trim());
      setSuccess(data.message || 'Reset link sent! Check your inbox (and spam folder).');
      setEmail('');
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={pageStyle}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <Logo />
        <Card>
          {/* Icon */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <i className="bi bi-lock-fill" style={{ color:'var(--purple)', fontSize:26 }} />
            </div>
            <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.4rem', color:'var(--heading)', marginBottom:6 }}>Forgot Password?</h1>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>Enter your registered email address.<br/>We'll send you a secure reset link.</p>
          </div>

          <ErrBox msg={error} />
          <SuccessBox msg={success} />

          {!success && (
            <form onSubmit={submit}>
              <Field label="Email Address">
                <Input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </Field>
              <SubmitBtn loading={loading} color="linear-gradient(135deg,#A78BFA,#38BDF8)">
                <i className="bi bi-send-fill" style={{ marginRight:8 }} />Send Reset Link
              </SubmitBtn>
            </form>
          )}

          {success && (
            <div style={{ textAlign:'center', marginTop:8 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📧</div>
              <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20, lineHeight:1.7 }}>
                Check your email inbox. The link expires in <strong style={{ color:'var(--heading)' }}>30 minutes</strong>.
              </p>
              <button onClick={() => { setSuccess(''); setE(''); }}
                style={{ padding:'9px 24px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:13, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', cursor:'pointer' }}>
                Send another link
              </button>
            </div>
          )}

          <p style={{ marginTop:22, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
            <Link to="/login" style={{ color:'var(--cyan)', fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
              <i className="bi bi-arrow-left" />Back to Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   RESET PASSWORD
════════════════════════════════════════ */
export function ResetPassword() {
  const { token }              = useParams();
  const navigate               = useNavigate();
  const [form, setForm]        = useState({ password:'', confirm:'' });
  const [loading, setL]        = useState(false);
  const [error, setE]          = useState('');
  const [success, setSuccess]  = useState(false);
  const [showPwd, setSP]       = useState(false);
  const [showCfm, setSC]       = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setL(true); setE('');
    if (form.password.length < 6)         { setE('Password must be at least 6 characters.'); setL(false); return; }
    if (form.password !== form.confirm)   { setE('Passwords do not match.'); setL(false); return; }
    try {
      await resetPassword(token, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) { setE(getErrorMsg(err)); }
    finally { setL(false); }
  };

  return (
    <div className="fade-up" style={pageStyle}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <Logo />
        <Card>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background: success ? 'rgba(52,211,153,0.1)' : 'rgba(56,189,248,0.1)', border:`1px solid ${success ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', transition:'all 0.3s' }}>
              <i className={`bi ${success ? 'bi-check-circle-fill' : 'bi-shield-lock-fill'}`} style={{ color: success ? 'var(--mint)' : 'var(--cyan)', fontSize:26 }} />
            </div>
            <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.4rem', color:'var(--heading)', marginBottom:6 }}>
              {success ? 'Password Reset!' : 'Set New Password'}
            </h1>
            <p style={{ fontSize:13, color:'var(--muted)' }}>
              {success ? 'Redirecting to login in 3 seconds…' : 'Choose a strong new password for your account.'}
            </p>
          </div>

          {success ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>🎉</div>
              <SuccessBox msg="Password updated successfully! Redirecting to login…" />
              <button onClick={() => navigate('/login')}
                style={{ padding:'11px 28px', borderRadius:50, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:13, background:'linear-gradient(135deg,#38BDF8,#A78BFA)', color:'#000', border:'none', cursor:'pointer', marginTop:8 }}>
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <ErrBox msg={error} />
              <form onSubmit={submit}>
                <Field label="New Password">
                  <div style={{ position:'relative' }}>
                    <Input type={showPwd?'text':'password'} placeholder="Min. 6 characters"
                      style={{ paddingRight:48 }}
                      value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
                    <button type="button" onClick={() => setSP(v=>!v)}
                      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>
                      <i className={`bi bi-eye${showPwd?'-slash':''}`} />
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password">
                  <div style={{ position:'relative' }}>
                    <Input type={showCfm?'text':'password'} placeholder="Repeat your password"
                      style={{ paddingRight:48, borderColor: form.confirm && form.confirm !== form.password ? 'var(--pink)' : undefined }}
                      value={form.confirm} onChange={e => setForm({...form, confirm:e.target.value})} required />
                    <button type="button" onClick={() => setSC(v=>!v)}
                      style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>
                      <i className={`bi bi-eye${showCfm?'-slash':''}`} />
                    </button>
                  </div>
                  {form.confirm && form.confirm !== form.password && (
                    <div style={{ fontSize:11, color:'var(--pink)', marginTop:4 }}>Passwords don't match</div>
                  )}
                </Field>

                {/* Password strength indicator */}
                {form.password && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {['Weak','Fair','Good','Strong'].map((label, i) => {
                        const len = form.password.length;
                        const hasUpper = /[A-Z]/.test(form.password);
                        const hasNum   = /\d/.test(form.password);
                        const hasSpec  = /[^a-zA-Z0-9]/.test(form.password);
                        const score    = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                        const colors   = ['var(--pink)','var(--amber)','var(--sky)','var(--mint)'];
                        return (
                          <div key={i} style={{ flex:1, height:3, borderRadius:4, background: i < score ? colors[score-1] : 'var(--surface2)', transition:'background 0.3s' }} />
                        );
                      })}
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>
                      {(() => {
                        const len = form.password.length;
                        const score = (len >= 8?1:0) + (/[A-Z]/.test(form.password)?1:0) + (/\d/.test(form.password)?1:0) + (/[^a-zA-Z0-9]/.test(form.password)?1:0);
                        return ['Weak — add more characters','Fair — add uppercase or numbers','Good — almost there','Strong password!'][score-1] || 'Too short';
                      })()}
                    </div>
                  </div>
                )}

                <SubmitBtn loading={loading} disabled={!!(form.confirm && form.confirm !== form.password)}>
                  <i className="bi bi-shield-check" style={{ marginRight:8 }} />Reset Password
                </SubmitBtn>
              </form>
              <p style={{ marginTop:20, textAlign:'center', fontSize:13, color:'var(--muted)' }}>
                <Link to="/login" style={{ color:'var(--cyan)', fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
                  <i className="bi bi-arrow-left" />Back to Login
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ADMIN LOGIN
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
    <div className="fade-up" style={pageStyle}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 16px', background:'linear-gradient(135deg,#F472B6,#A78BFA)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 32px rgba(244,114,182,0.25)' }}>
            <i className="bi bi-shield-check" style={{ color:'#000', fontSize:24 }} />
          </div>
          <h1 className="font-grotesk" style={{ fontWeight:900, fontSize:'1.4rem', color:'var(--heading)', marginBottom:4 }}>Admin Portal</h1>
          <p style={{ fontSize:12, color:'var(--muted)' }}>Restricted — authorised personnel only</p>
        </div>
        <Card accentColor="rgba(244,114,182,0.2)">
          <div style={{ display:'flex', gap:6, marginBottom:24, padding:4, borderRadius:12, background:'var(--surface2)' }}>
            {['login','register'].map(t => (
              <button key={t} type="button" onClick={() => { setTab(t); setE(''); }}
                style={{ flex:1, padding:'9px', borderRadius:10, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer', border:'none', transition:'all 0.2s',
                  background: tab===t ? 'linear-gradient(135deg,#F472B6,#A78BFA)' : 'transparent',
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
            <SubmitBtn loading={loading} color="linear-gradient(135deg,#F472B6,#A78BFA)">
              {tab==='login' ? 'Sign In as Admin' : 'Register Admin'}
            </SubmitBtn>
          </form>
          <p style={{ marginTop:20, textAlign:'center' }}>
            <Link to="/login" style={{ fontSize:12, color:'var(--muted)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
              <i className="bi bi-arrow-left" />Back to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
