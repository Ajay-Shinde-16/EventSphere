import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateProfile } from '../services/api';

export default function Profile() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await updateProfile(form);
      setUser(res.data);
      localStorage.setItem('eventsphere_user', JSON.stringify(res.data));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (user?.role === 'admin') return { label: 'Admin', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
    if (user?.role === 'organizer') return { label: 'Organizer', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    return { label: 'Attendee', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
  };

  const badge = getRoleBadge();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="glass rounded-2xl p-8 mb-6 text-center border border-white/5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold relative"
            style={{ background: 'linear-gradient(135deg, #00F2FE22, #9B51E022)', border: '2px solid #00F2FE44' }}>
            <span style={{ color: 'var(--cyan)' }}>{initials}</span>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-[#0B0F19]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {user?.name}
          </h1>
          <p className="text-muted text-sm mb-3">{user?.email}</p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
            <i className={`bi ${user?.role === 'admin' ? 'bi-shield-fill' : user?.role === 'organizer' ? 'bi-person-workspace' : 'bi-person-fill'}`} />
            {badge.label}
          </span>
        </div>

        {/* Edit Form */}
        <div className="glass rounded-2xl p-8 mb-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <i className="bi bi-pencil-square" style={{ color: 'var(--cyan)' }} />
            Edit Profile
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <i className="bi bi-check-circle-fill" /> Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-muted mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#00F2FE' }}
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#00F2FE' }}
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Bangalore, Mumbai, Delhi..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', '--tw-ring-color': '#00F2FE' }}
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Email Address</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-3 rounded-xl text-muted text-sm cursor-not-allowed"
                style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)' }}
              />
              <p className="text-xs text-muted mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: saving ? '#333' : 'linear-gradient(135deg, #00F2FE, #0099CC)', color: '#0B0F19' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" /> Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-check2" /> Save Changes
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Quick Navigation */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
          <h2 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Quick Navigation</h2>
          <div className="grid grid-cols-2 gap-3">

            {/* My Tickets — attendees only */}
            {user?.role === 'attendee' && (
              <Link to="/my-tickets"
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(0,242,254,0.15)' }}>
                <i className="bi bi-ticket-perforated text-xl" style={{ color: 'var(--cyan)' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>My Tickets</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>View bookings</div>
                </div>
              </Link>
            )}

            {/* Organizer Dashboard */}
            {user?.role === 'organizer' && (
              <Link to="/org-dashboard"
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(155,81,224,0.2)' }}>
                <i className="bi bi-speedometer2 text-xl" style={{ color: 'var(--purple)' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Dashboard</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Manage events</div>
                </div>
              </Link>
            )}

            {/* Organizer — Create Event */}
            {user?.role === 'organizer' && (
              <Link to="/create-event"
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(0,242,254,0.15)' }}>
                <i className="bi bi-plus-circle text-xl" style={{ color: 'var(--cyan)' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Create Event</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Add new event</div>
                </div>
              </Link>
            )}

            {/* Admin — Admin Panel */}
            {user?.role === 'admin' && (
              <Link to="/admin"
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(255,64,129,0.2)' }}>
                <i className="bi bi-shield-fill text-xl" style={{ color: 'var(--pink)' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Admin Panel</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Control center</div>
                </div>
              </Link>
            )}

            {/* Admin — Manage Users */}
            {user?.role === 'admin' && (
              <Link to="/org-dashboard"
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--surface2)', border: '1px solid rgba(155,81,224,0.2)' }}>
                <i className="bi bi-people-fill text-xl" style={{ color: 'var(--purple)' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Manage Events</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Review & approve</div>
                </div>
              </Link>
            )}

            {/* Home — all roles */}
            <Link to="/"
              className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <i className="bi bi-house text-xl" style={{ color: 'var(--muted)' }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>Home</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Browse events</div>
              </div>
            </Link>

          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 border border-red-500/10">
          <h2 className="text-sm font-semibold text-red-400 mb-4 uppercase tracking-wider">Danger Zone</h2>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,64,129,0.1)', border: '1px solid rgba(255,64,129,0.3)', color: 'var(--pink)' }}>
            <i className="bi bi-box-arrow-right" />
            Sign Out of EventSphere
          </button>
        </div>

      </div>
    </div>
  );
}