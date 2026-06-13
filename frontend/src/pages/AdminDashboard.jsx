import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAdminEvents, updateEventStatus, getAdminUsers, toggleUserStatus, getAdminBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColor = { approved:'#05FF9B', pending:'#FFB300', rejected:'#FF4081' };
const CC = { Tech:'#00F2FE', Music:'#9B51E0', Sports:'#05FF9B', Food:'#FFB300', Art:'#FF4081', Business:'#4FC3F7', Other:'#8892A4' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('events');
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evFilter, setEvFilter] = useState('pending');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
  }, []);

  useEffect(() => { if (tab === 'events') loadEvents(); }, [evFilter, tab]);

  const loadData = async () => {
    try {
      const [s] = await Promise.all([getAdminStats()]);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };

  const loadEvents = async () => {
    try {
      const { data } = await getAdminEvents({ status: evFilter });
      setEvents(data);
    } catch {}
  };

  const loadUsers = async () => {
    try { const { data } = await getAdminUsers(); setUsers(data); } catch {}
  };

  const loadBookings = async () => {
    try { const { data } = await getAdminBookings(); setBookings(data); } catch {}
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'bookings') loadBookings();
  }, [tab]);

  const handleEventStatus = async (id, status) => {
    try {
      await updateEventStatus(id, status);
      setEvents(ev => ev.filter(e => e._id !== id));
    } catch {}
  };

  const handleToggleUser = async (id) => {
    try {
      const { data } = await toggleUserStatus(id);
      setUsers(u => u.map(usr => usr._id===id ? {...usr,isActive:data.isActive} : usr));
    } catch {}
  };

  return (
    <div className="flex fade-up" style={{ minHeight: 'calc(100vh - 66px)' }}>
      {/* Sidebar */}
      <div className="sidebar hidden md:block">
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 6px',marginBottom:16,paddingBottom:14,borderBottom:'1px solid rgba(255,64,129,0.1)' }}>
          <div style={{ width:28,height:28,background:'linear-gradient(135deg,#FF4081,#9B51E0)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <i className="bi bi-shield-check text-black text-xs" />
          </div>
          <div>
            <div className="font-grotesk font-black text-xs" style={{ color:'#FF4081' }}>Admin Portal</div>
            <div className="font-jakarta text-xs" style={{ color:'#8892A4',fontSize:'0.6rem' }}>Full Control</div>
          </div>
        </div>
        {[
          { id:'events',icon:'bi-calendar-event',label:'Events' },
          { id:'users',icon:'bi-people',label:'Users' },
          { id:'bookings',icon:'bi-ticket',label:'Bookings' },
        ].map(item => (
          <div key={item.id} className={`sbl ${tab===item.id?'active':''}`} onClick={() => setTab(item.id)}>
            <i className={`bi ${item.icon}`} />{item.label}
          </div>
        ))}
        <div className="sbl" onClick={() => navigate('/')}><i className="bi bi-house" />Home</div>
      </div>

      <div className="flex-1 p-6 md:p-8" style={{ minWidth: 0 }}>
        <div className="pgh mb-6">
          <h2 className="font-grotesk font-black text-xl mb-1"><i className="bi bi-shield-check me-2" style={{ color:'#FF4081' }} />Admin Dashboard</h2>
          <p className="font-jakarta text-sm" style={{ color:'#8892A4' }}>Platform control center</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { n: stats.users, l:'Users', c:'#00F2FE' },
            { n: stats.events, l:'Live Events', c:'#05FF9B' },
            { n: stats.pending, l:'Pending', c:'#FFB300' },
            { n: stats.bookings, l:'Bookings', c:'#9B51E0' },
            { n: stats.revenue ? '₹'+stats.revenue.toLocaleString() : '₹0', l:'Revenue', c:'#FF4081' },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="font-grotesk font-black text-2xl" style={{ color:s.c }}>{s.n ?? '—'}</div>
              <div className="font-jakarta text-xs mt-1" style={{ color:'#8892A4' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tab buttons (mobile) */}
        <div className="flex gap-2 mb-6 md:hidden">
          {['events','users','bookings'].map(t => (
            <button key={t} className={`cat-pill ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {/* Events tab */}
        {tab === 'events' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {['pending','approved','rejected'].map(f => (
                <button key={f} className={`cat-pill ${evFilter===f?'active':''}`} onClick={() => setEvFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background:'#171E2E',border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>City</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign:'center',padding:32,color:'#8892A4' }}>No {evFilter} events</td></tr>
                    ) : events.map(ev => (
                      <tr key={ev._id}>
                        <td>
                          <div className="font-grotesk font-bold text-sm">{ev.title}</div>
                          <span style={{ display:'inline-block',padding:'2px 8px',borderRadius:20,fontSize:'0.6rem',fontWeight:700,background:`${CC[ev.category]}15`,color:CC[ev.category],marginTop:3 }}>{ev.category}</span>
                        </td>
                        <td style={{ color:'#8892A4',fontSize:12 }}>{ev.organizer?.name}</td>
                        <td style={{ color:'#8892A4',fontSize:12 }}>{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ color:'#8892A4',fontSize:12 }}>{ev.city}</td>
                        <td><span style={{ padding:'3px 10px',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:`${statusColor[ev.status]}15`,color:statusColor[ev.status] }}>{ev.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            {ev.status !== 'approved' && <button style={{ padding:'4px 10px',borderRadius:8,fontSize:'0.7rem',fontWeight:700,background:'rgba(5,255,155,0.1)',color:'#05FF9B',border:'1px solid rgba(5,255,155,0.2)',cursor:'pointer' }} onClick={() => handleEventStatus(ev._id,'approved')}>✓ Approve</button>}
                            {ev.status !== 'rejected' && <button style={{ padding:'4px 10px',borderRadius:8,fontSize:'0.7rem',fontWeight:700,background:'rgba(255,64,129,0.1)',color:'#FF4081',border:'1px solid rgba(255,64,129,0.2)',cursor:'pointer' }} onClick={() => handleEventStatus(ev._id,'rejected')}>✗ Reject</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="rounded-2xl overflow-hidden" style={{ background:'#171E2E',border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><div className="font-grotesk font-bold text-sm">{u.name}</div></td>
                      <td style={{ color:'#8892A4',fontSize:12 }}>{u.email}</td>
                      <td>
                        <span style={{ padding:'3px 10px',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:u.role==='admin'?'rgba(255,64,129,0.1)':u.role==='organizer'?'rgba(155,81,224,0.1)':'rgba(0,242,254,0.1)',color:u.role==='admin'?'#FF4081':u.role==='organizer'?'#9B51E0':'#00F2FE' }}>{u.role}</span>
                      </td>
                      <td style={{ color:'#8892A4',fontSize:12 }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><span style={{ padding:'3px 10px',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:u.isActive?'rgba(5,255,155,0.1)':'rgba(255,64,129,0.1)',color:u.isActive?'#05FF9B':'#FF4081' }}>{u.isActive?'Active':'Deactivated'}</span></td>
                      <td>
                        <button style={{ padding:'4px 10px',borderRadius:8,fontSize:'0.7rem',fontWeight:700,background:u.isActive?'rgba(255,64,129,0.1)':'rgba(5,255,155,0.1)',color:u.isActive?'#FF4081':'#05FF9B',border:`1px solid ${u.isActive?'rgba(255,64,129,0.2)':'rgba(5,255,155,0.2)'}`,cursor:'pointer' }} onClick={() => handleToggleUser(u._id)}>
                          {u.isActive?'Deactivate':'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div className="rounded-2xl overflow-hidden" style={{ background:'#171E2E',border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Code</th><th>User</th><th>Event</th><th>Tier</th><th>Seats</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td><span style={{ fontFamily:'monospace',color:'#00F2FE',fontSize:12,fontWeight:700 }}>{b.bookingCode}</span></td>
                      <td style={{ color:'#8892A4',fontSize:12 }}>{b.user?.name}</td>
                      <td style={{ fontSize:12 }}>{b.event?.title}</td>
                      <td style={{ color:'#9B51E0',fontSize:12 }}>{b.tier}</td>
                      <td style={{ color:'#8892A4',fontSize:12,textAlign:'center' }}>{b.seats}</td>
                      <td style={{ color:'#00F2FE',fontSize:12,fontWeight:700 }}>{b.totalAmount===0?'FREE':'₹'+b.totalAmount?.toLocaleString()}</td>
                      <td><span style={{ padding:'3px 10px',borderRadius:20,fontSize:'0.65rem',fontWeight:700,background:b.status==='confirmed'?'rgba(5,255,155,0.1)':'rgba(255,64,129,0.1)',color:b.status==='confirmed'?'#05FF9B':'#FF4081' }}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
