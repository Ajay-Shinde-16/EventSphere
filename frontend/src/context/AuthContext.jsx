import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Dark mode = no data-theme attribute (CSS :root is already dark)
// Light mode = data-theme="light"
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  // Default is ALWAYS dark
  const [darkMode, setDarkMode] = useState(true);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('eventsphere_user');
    if (stored) try { setUser(JSON.parse(stored)); } catch {}

    const saved = localStorage.getItem('eventsphere_dark');
    // If never saved, default dark = true
    const isDark = saved !== null ? saved === 'true' : true;
    setDarkMode(isDark);
    applyTheme(isDark);
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('eventsphere_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventsphere_user');
  };

  // ── Inactivity auto-logout (5 minutes) ──────────────────────────
  // Protects shared/public computers — if a logged-in user walks away
  // and someone else sits down, the account logs out automatically
  // instead of staying signed in indefinitely. Any mouse movement,
  // keypress, click, scroll, or touch resets the timer.
  useEffect(() => {
    if (!user) return; // nothing to protect if no one's logged in

    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    let timer;

    const handleInactivityLogout = () => {
      setUser(null);
      localStorage.removeItem('eventsphere_user');
      setAutoLoggedOut(true);
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleInactivityLogout, TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // start the timer immediately on login

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user?._id]); // restart fresh whenever a different user logs in

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('eventsphere_dark', String(next));
    applyTheme(next);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loginUser, logout, loading,
      darkMode, toggleDarkMode,
      isAdmin: user?.role === 'admin',
      isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
      autoLoggedOut, clearAutoLoggedOut: () => setAutoLoggedOut(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);