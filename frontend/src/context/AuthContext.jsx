import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const applyTheme = (isDark) => {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('eventsphere_user');
    if (stored) try { setUser(JSON.parse(stored)); } catch {}

    const saved = localStorage.getItem('eventsphere_dark');
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);