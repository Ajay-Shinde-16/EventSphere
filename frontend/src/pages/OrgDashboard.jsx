import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEvents, deleteEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { approved: '#05FF9B', pending: '#FFB300', rejected: '#FF4081' };
const CC = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'#8892A4' };

function Sidebar({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: 'orgdash', icon: 'bi-speedometer2', label: 'Dashboard', path: '/org-dashboard' },
    { id: 'create', icon: 'bi-plus-circle', label: 'Create Event', path: '/create-event' },
    { id: 'scan', icon: 'bi-qr-code-scan', label: 'QR Check-in', path: '/scan-qr' },
  ];
  return (
    <div className="sidebar hidden md:block">
      <div className="flex items-center gap-2 px-2 pb-4 mb-4" style={{ borderBottom: '1px solid rgba(0,242,254,0.08)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00F2FE,#9B51E0)' }}>
          <i className="bi bi-speedometer2 text-black text-xs" />
        </div>
        <div>
          <div className="font-grotesk font-black text-xs grad2">EventSphere</div>
          <div className="font-jakarta text-xs" style={{ color: '#8892A4', fontSize: '0.6rem' }}>Organizer Panel</div>
        </div>
      </div>
      <p className="text-xs font-grotesk font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#8892A4' }}>Menu</p>
      {items.map(item => (
        <div key={item.id} className={`sbl ${active===item.id?'active':''}`} onClick={() => navigate(item.path)}>
          <i className={`bi ${item.icon}`} />{item.label}
        </div>
      ))}
    </div>
  );
}

export default function OrgDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role === 'attendee') { navigate('/'); return; }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await getMyEvents();
      setEvents(data);
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents(ev => ev.filter(e => e._id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const stats = {
    total: events.length,
    live: events.filter(e => e.status === 'approved').length,
    pending: events.filter(e => e.status === 'pending').length,
    bookings: events.reduce((s, e) => s + (e.bookedSeats || 0), 0),
  };

  return (
    <div className="flex fade-up" style={{ minHeight: 'calc(100vh - 66px)' }}>
      <Sidebar active="orgdash" />
      <div className="flex-1 p-6 md:p-8" style={{ minWidth: 0 }}>
        <div className="pgh mb-6">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="font-grotesk font-black text-xl mb-1">Welcome, {user?.name}! 👋</h2>
              <p className="font-jakarta text-sm" style={{ color: '#8892A4' }}>Manage your events and track performance</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-grotesk font-bold" style={{ background: 'rgba(0,242,254,0.1)', color: '#00F2FE' }}>● LIVE</span>
            </div>
            <button className="px-5 py-2.5 rounded-xl text-black font-grotesk font-black text-sm transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#00F2FE,#9B51E0)' }} onClick={() => navigate('/create-event')}>
              <i className="bi bi-plus-circle me-2" />Create Event
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { n: stats.total, l: 'Total Events', color: '#00F2FE' },
            { n: stats.live, l: 'Live Events', color: '#05FF9B' },
            { n: stats.pending, l: 'Pending', color: '#FFB300' },
            { n: stats.bookings, l: 'Total Bookings', color: '#9B51E0' },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="font-grotesk font-black text-3xl" style={{ color: s.color }}>{s.n}</div>
              <div className="font-jakarta text-xs mt-1 uppercase tracking-wide" style={{ color: '#8892A4' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Events table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#171E2E', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-grotesk font-bold text-sm" style={{ color: '#00F2FE' }}>
              <i className="bi bi-calendar-event me-2" />My Events
            </span>
            <button className="px-4 py-2 rounded-xl text-black font-grotesk font-black text-xs" style={{ background: 'linear-gradient(135deg,#00F2FE,#9B51E0)' }} onClick={() => navigate('/create-event')}>+ New Event</button>
          </div>
          {loading ? (
            <div className="text-center py-12"><div className="w-8 h-8 rounded-full animate-spin mx-auto" style={{ border: '3px solid rgba(0,242,254,0.1)', borderTopColor: '#00F2FE' }} /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-calendar-x text-3xl mb-3 block" style={{ color: '#8892A4' }} />
              <p className="font-grotesk font-bold" style={{ color: '#8892A4' }}>No events yet</p>
              <button className="mt-3 px-5 py-2 rounded-xl text-xs font-grotesk font-black text-black" style={{ background: 'linear-gradient(135deg,#00F2FE,#9B51E0)' }} onClick={() => navigate('/create-event')}>Create your first event</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Event</th><th>Date</th><th>City</th><th>Bookings</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {events.map(ev => {
                    const pct = Math.round((ev.bookedSeats/ev.totalSeats)*100);
                    return (
                      <tr key={ev._id}>
                        <td>
                          <div className="font-grotesk font-bold text-sm">{ev.title}</div>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, background: `${CC[ev.category]}15`, color: CC[ev.category], marginTop: 3 }}>{ev.category}</span>
                        </td>
                        <td style={{ color: '#8892A4', fontSize: 12 }}>{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ color: '#8892A4', fontSize: 12 }}>{ev.city}</td>
                        <td>
                          <div className="font-grotesk font-bold text-xs">{ev.bookedSeats}/{ev.totalSeats}</div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: 80, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#00F2FE', borderRadius: 4 }} />
                          </div>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: `${statusColor[ev.status]}15`, color: statusColor[ev.status] }}>{ev.status}</span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, background: 'linear-gradient(135deg,#00F2FE,#9B51E0)', color: '#000', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/events/${ev._id}`)}>View</button>
                            <button style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,64,129,0.1)', color: '#FF4081', border: '1px solid rgba(255,64,129,0.2)', cursor: 'pointer' }} onClick={() => handleDelete(ev._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
