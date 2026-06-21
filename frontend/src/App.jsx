import { useContext, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';

// Code-split every other page so visiting the homepage (or any single page)
// doesn't download/parse JS for pages you're not even on — e.g. Chart.js
// (used only in OrgDashboard) was previously bundled into every page load.
// This was the main driver behind Lighthouse's "Reduce unused JavaScript"
// and high "Total Blocking Time" flags on mobile.
const { Login, Register, AdminLogin, ForgotPassword, ResetPassword } = (() => {
  // Auth.jsx exports multiple named components from one file — lazy() only
  // supports a single default export, so each needs its own thin wrapper.
  return {
    Login: lazy(() => import('./pages/Auth').then(m => ({ default: m.Login }))),
    Register: lazy(() => import('./pages/Auth').then(m => ({ default: m.Register }))),
    AdminLogin: lazy(() => import('./pages/Auth').then(m => ({ default: m.AdminLogin }))),
    ForgotPassword: lazy(() => import('./pages/Auth').then(m => ({ default: m.ForgotPassword }))),
    ResetPassword: lazy(() => import('./pages/Auth').then(m => ({ default: m.ResetPassword }))),
  };
})();
const EventDetail     = lazy(() => import('./pages/EventDetail'));
const MyTickets       = lazy(() => import('./pages/MyTickets'));
const OrgDashboard    = lazy(() => import('./pages/OrgDashboard'));
const CreateEvent     = lazy(() => import('./pages/CreateEvent'));
const EditEvent       = lazy(() => import('./pages/EditEvent'));
const ScanQR          = lazy(() => import('./pages/ScanQR'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const Profile         = lazy(() => import('./pages/Profile'));
const EventsBrowse    = lazy(() => import('./pages/EventsBrowse'));

// Small, lightweight fallback shown briefly while a lazy page's JS chunk
// downloads — intentionally minimal so it doesn't itself add weight.
function PageLoading() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'100px 20px' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--surface2)', borderTopColor:'var(--cyan)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );
}

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

function GlobalShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); navigate('/admin-login'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return null;
}

function AppShell() {
  return (
    <div style={{ minHeight:'100vh' }}>
      <GlobalShortcuts />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/"                      element={<Home />} />
            <Route path="/login"                 element={<Login />} />
            <Route path="/register"              element={<Register />} />
            <Route path="/forgot-password"       element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/admin-login"           element={<AdminLogin />} />
            <Route path="/events-browse"         element={<EventsBrowse />} />
            <Route path="/events/:id"            element={<EventDetail />} />
            <Route path="/my-tickets"            element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
            <Route path="/org-dashboard"         element={<OrganizerRoute><OrgDashboard /></OrganizerRoute>} />
            <Route path="/create-event"          element={<OrganizerRoute><CreateEvent /></OrganizerRoute>} />
            <Route path="/edit-event/:id"        element={<OrganizerRoute><EditEvent /></OrganizerRoute>} />
            <Route path="/scan-qr"               element={<OrganizerRoute><ScanQR /></OrganizerRoute>} />
            <Route path="/admin"                 element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/profile"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*"                      element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
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