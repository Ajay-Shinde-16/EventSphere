import { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import { Login, Register, AdminLogin } from './pages/Auth';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import OrgDashboard from './pages/OrgDashboard';
import CreateEvent from './pages/CreateEvent';
import ScanQR from './pages/ScanQR';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import EventsBrowse from './pages/EventsBrowse';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function OrganizerRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'organizer' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/admin-login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Global keyboard shortcut — works on every page
function GlobalShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+Shift+A → Admin login (anywhere in the app)
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        navigate('/admin-login');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return null; // renders nothing, just listens
}

function AppShell() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <GlobalShortcuts />
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/admin-login"   element={<AdminLogin />} />
        <Route path="/events-browse" element={<EventsBrowse />} />
        <Route path="/events/:id"    element={<EventDetail />} />
        <Route path="/my-tickets"    element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/org-dashboard" element={<OrganizerRoute><OrgDashboard /></OrganizerRoute>} />
        <Route path="/create-event"  element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
        <Route path="/scan-qr"       element={<OrganizerRoute><ScanQR /></OrganizerRoute>} />
        <Route path="/admin"         element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*"              element={<NotFound />} />
      </Routes>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}